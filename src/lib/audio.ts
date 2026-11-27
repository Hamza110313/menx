import type { GameSettings, VehicleClass, WeaponId } from '../types/game';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private tireNoiseGain: GainNode | null = null;
  private ambientNoiseGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  private musicTimer: number | null = null;
  private musicStep = 0;
  private initialized = false;
  private muted = false;

  private volumes = {
    music: 0.35,
    sfx: 0.7,
    ambient: 0.45,
  };

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(ctx.destination);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = this.volumes.music;
    this.musicGain.connect(this.masterGain);

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = this.volumes.ambient;
    this.ambientGain.connect(this.masterGain);

    // 1. Continuous Vehicle Engine / Rotor Synth
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 220;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 55;

    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.value = 110;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();

    // 2. Noise Buffer for Tire Screech & City/Rain Ambience
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Tire screech chain
    const tireSrc = ctx.createBufferSource();
    tireSrc.buffer = noiseBuffer;
    tireSrc.loop = true;
    const tireFilter = ctx.createBiquadFilter();
    tireFilter.type = 'bandpass';
    tireFilter.frequency.value = 1400;
    tireFilter.Q.value = 4.5;
    this.tireNoiseGain = ctx.createGain();
    this.tireNoiseGain.gain.value = 0;
    tireSrc.connect(tireFilter);
    tireFilter.connect(this.tireNoiseGain);
    this.tireNoiseGain.connect(this.sfxGain);
    tireSrc.start();

    // City & Rain ambient chain
    const ambSrc = ctx.createBufferSource();
    ambSrc.buffer = noiseBuffer;
    ambSrc.loop = true;
    const ambFilter = ctx.createBiquadFilter();
    ambFilter.type = 'lowpass';
    ambFilter.frequency.value = 420;
    this.ambientNoiseGain = ctx.createGain();
    this.ambientNoiseGain.gain.value = 0.05;
    ambSrc.connect(ambFilter);
    ambFilter.connect(this.ambientNoiseGain);
    this.ambientNoiseGain.connect(this.ambientGain);
    ambSrc.start();

    // 3. Police Siren Synth
    this.sirenOsc = ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 660;
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxGain);
    this.sirenOsc.start();

    // 4. Procedural West-Coast Synth Groove
    const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.volumes.music <= 0.01) {
        return;
      }
      const now = this.ctx.currentTime;
      const freq = bassNotes[this.musicStep % bassNotes.length];
      const osc = this.ctx.createOscillator();
      const filt = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(340, now);
      filt.frequency.exponentialRampToValueAtTime(110, now + 0.35);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.4);
      this.musicStep++;
    }, 420);

    this.initialized = true;
  }

  public applySettings(settings: GameSettings): void {
    this.volumes.music = settings.musicVolume;
    this.volumes.sfx = settings.sfxVolume;
    this.volumes.ambient = settings.ambientVolume;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.muted ? 0 : settings.musicVolume, now, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : settings.sfxVolume, now, 0.05);
    if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(this.muted ? 0 : settings.ambientVolume, now, 0.05);
  }

  public updateVehicleAudio(
    active: boolean,
    speedRatio: number,
    isDrifting: boolean,
    isRaining: boolean,
    wantedLevel: number,
    elapsedTime: number,
    vehicleClass: VehicleClass | 'foot' = 'sports'
  ): void {
    if (!this.ctx || !this.initialized) return;
    const now = this.ctx.currentTime;

    if (this.engineGain && this.engineOsc1 && this.engineOsc2 && this.engineFilter) {
      if (active) {
        const clamped = Math.max(0, Math.min(1.2, speedRatio));
        if (vehicleClass === 'helicopter') {
          const chop = 0.68 + Math.sin(elapsedTime * 42) * 0.32;
          const baseFreq = 32 + clamped * 38;
          this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
          this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.5, now, 0.03);
          this.engineFilter.frequency.setTargetAtTime(160 + clamped * 440, now, 0.04);
          this.engineGain.gain.setTargetAtTime((0.08 + clamped * 0.07) * chop, now, 0.02);
        } else if (vehicleClass === 'bicycle') {
          this.engineOsc1.frequency.setTargetAtTime(95 + clamped * 80, now, 0.06);
          this.engineOsc2.frequency.setTargetAtTime(190 + clamped * 120, now, 0.06);
          this.engineFilter.frequency.setTargetAtTime(160 + clamped * 180, now, 0.06);
          this.engineGain.gain.setTargetAtTime(clamped > 0.05 ? 0.015 : 0, now, 0.06);
        } else if (vehicleClass === 'horse') {
          const gallopPulse = clamped > 0.05 ? 0.45 + Math.abs(Math.sin(elapsedTime * (7 + clamped * 11))) * 0.55 : 0;
          this.engineOsc1.frequency.setTargetAtTime(52 + clamped * 28, now, 0.04);
          this.engineOsc2.frequency.setTargetAtTime(76 + clamped * 34, now, 0.04);
          this.engineFilter.frequency.setTargetAtTime(140 + clamped * 160, now, 0.05);
          this.engineGain.gain.setTargetAtTime(gallopPulse * 0.028, now, 0.03);
        } else if (vehicleClass === 'boat') {
          const baseFreq = 38 + clamped * 92;
          this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
          this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.65, now, 0.04);
          this.engineFilter.frequency.setTargetAtTime(180 + clamped * 680, now, 0.05);
          this.engineGain.gain.setTargetAtTime(0.08 + clamped * 0.09, now, 0.06);
        } else {
          const baseFreq = 46 + clamped * 125;
          this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
          this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.98, now, 0.04);
          this.engineFilter.frequency.setTargetAtTime(220 + clamped * 900, now, 0.05);
          this.engineGain.gain.setTargetAtTime(0.09 + clamped * 0.08, now, 0.06);
        }
      } else {
        this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    if (this.tireNoiseGain) {
      this.tireNoiseGain.gain.setTargetAtTime(
        active &&
          isDrifting &&
          vehicleClass !== 'helicopter' &&
          vehicleClass !== 'boat' &&
          vehicleClass !== 'horse' &&
          vehicleClass !== 'bicycle'
          ? 0.14
          : 0,
        now,
        0.04
      );
    }

    if (this.ambientNoiseGain) {
      this.ambientNoiseGain.gain.setTargetAtTime(isRaining ? 0.18 : 0.045, now, 0.25);
    }

    if (this.sirenGain && this.sirenOsc) {
      if (wantedLevel > 0) {
        const wail = 640 + Math.sin(elapsedTime * 5.2) * 210;
        this.sirenOsc.frequency.setTargetAtTime(wail, now, 0.03);
        this.sirenGain.gain.setTargetAtTime(0.035 + wantedLevel * 0.008, now, 0.1);
      } else {
        this.sirenGain.gain.setTargetAtTime(0, now, 0.1);
      }
    }
  }

  public playUiClick(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playImpact(strength = 0.5): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
    gain.gain.setValueAtTime(Math.min(0.45, 0.15 + strength * 0.3), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playDoorToggle(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.11);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playMelee(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.09);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playMissionComplete(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playCheckpoint(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.07);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playExplosion(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.62);
    subGain.gain.setValueAtTime(0.65, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.68);

    const dur = 0.58;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + dur);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.58, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
  }

  public playSwordSlash(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Air whoosh
    const dur = 0.16;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.frequency.exponentialRampToValueAtTime(420, now + dur);
    bp.Q.value = 1.6;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.28, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);

    // Subtle steel ring harmonic
    const ring = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(2150, now);
    ring.frequency.exponentialRampToValueAtTime(1480, now + 0.18);
    rGain.gain.setValueAtTime(0.08, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    ring.connect(rGain);
    rGain.connect(this.sfxGain);
    ring.start(now);
    ring.stop(now + 0.21);
  }

  public playGunshot(weaponId: WeaponId = 'pistol'): void {
    if (weaponId === 'unarmed') {
      this.playMelee();
      return;
    }
    if (weaponId === 'sword') {
      this.playSwordSlash();
      return;
    }
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (weaponId === 'rpg') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.28);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
      this.playExplosion();
      return;
    }

    const isShotgun = weaponId === 'shotgun';
    const isRifle = weaponId === 'rifle';
    const isSmg = weaponId === 'smg';

    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = isShotgun ? 'sawtooth' : 'triangle';
    bodyOsc.frequency.setValueAtTime(
      isShotgun ? 140 : isRifle ? 245 : isSmg ? 310 : 195,
      now
    );
    bodyOsc.frequency.exponentialRampToValueAtTime(
      isShotgun ? 28 : isSmg ? 75 : 42,
      now + (isShotgun ? 0.16 : isSmg ? 0.065 : 0.09)
    );
    bodyGain.gain.setValueAtTime(
      isShotgun ? 0.44 : isRifle ? 0.28 : isSmg ? 0.22 : 0.32,
      now
    );
    bodyGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isShotgun ? 0.18 : isSmg ? 0.075 : 0.11)
    );
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.sfxGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + (isShotgun ? 0.19 : isSmg ? 0.08 : 0.12));

    const dur = isShotgun ? 0.24 : isSmg ? 0.085 : isRifle ? 0.12 : 0.16;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * (isShotgun ? 0.32 : 0.22)));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isShotgun ? 960 : isSmg ? 2800 : isRifle ? 2350 : 1650, now);
    filter.Q.value = isRifle || isSmg ? 1.2 : 0.8;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(isShotgun ? 0.58 : isSmg ? 0.3 : isRifle ? 0.38 : 0.45, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
  }

  public playHeatVision(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(780, now);
    osc1.frequency.exponentialRampToValueAtTime(340, now + 0.14);
    osc2.frequency.setValueAtTime(1180, now);
    osc2.frequency.exponentialRampToValueAtTime(520, now + 0.14);
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1400, now);
    filt.Q.value = 1.6;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(filt);
    osc2.connect(filt);
    filt.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }

  public playShockwave(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(26, now + 0.48);
    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.52);

    const dur = 0.36;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + dur);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.38, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
  }

  public silenceLooping(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, now, 0.04);
    if (this.tireNoiseGain) this.tireNoiseGain.gain.setTargetAtTime(0, now, 0.04);
    if (this.sirenGain) this.sirenGain.gain.setTargetAtTime(0, now, 0.04);
  }

  public dispose(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const audioEngine = new ProceduralAudioEngine();
