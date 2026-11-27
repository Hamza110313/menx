import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  CarFront,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Wind,
  Zap,
} from 'lucide-react';
import { audioEngine } from '../../lib/audio';
import { gameInput } from '../../lib/inputState';
import { useGameStore } from '../../store/gameStore';

export function MobileControls() {
  const screen = useGameStore((s) => s.screen);
  const activeModal = useGameStore((s) => s.activeModal);
  const showMobileControls = useGameStore((s) => s.settings.showMobileControls);
  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const outfitId = useGameStore((s) => s.outfitId);
  const inVehicle = useGameStore((s) => s.telemetry.inVehicle);
  const isFlying = useGameStore((s) => s.telemetry.isFlying);
  const vehicleClass = useGameStore((s) => s.telemetry.vehicleClass);
  const nearbyPrompt = useGameStore((s) => s.telemetry.nearbyPrompt);
  const cycleCameraMode = useGameStore((s) => s.cycleCameraMode);

  const isSuperHero =
    activeCharacterId === 'sunburst' ||
    outfitId === 'sunburst_nika' ||
    activeCharacterId === 'paragon' ||
    outfitId === 'paragon_suit' ||
    activeCharacterId === 'batman' ||
    outfitId === 'dark_knight' ||
    activeCharacterId === 'naruto' ||
    outfitId === 'naruto_sage_cloak' ||
    outfitId === 'naruto_tracksuit' ||
    activeCharacterId === 'goku' ||
    outfitId === 'goku_damaged_gi';

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyTouchId = useRef<number | null>(null);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 860;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (screen !== 'playing' || activeModal !== 'none') return null;
  if (!isTouchDevice && !showMobileControls) return null;

  const isHeli = vehicleClass === 'helicopter';

  const handleJoyStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    joyTouchId.current = t.identifier;
    updateJoystick(t.clientX, t.clientY);
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joyTouchId.current) {
        updateJoystick(t.clientX, t.clientY);
        break;
      }
    }
  };

  const handleJoyEnd = () => {
    joyTouchId.current = null;
    gameInput.joyX = 0;
    gameInput.joyY = 0;
    setKnobOffset({ x: 0, y: 0 });
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    gameInput.joyX = dx / maxR;
    gameInput.joyY = -dy / maxR;
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 sm:px-6">
      {/* Left Side: Steering Buttons (Vehicle) or Virtual Joystick (On Foot) */}
      <div className="pointer-events-auto">
        {inVehicle ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onPointerDown={() => (gameInput.left = true)}
              onPointerUp={() => (gameInput.left = false)}
              onPointerLeave={() => (gameInput.left = false)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-zinc-900/85 text-zinc-100 active:bg-amber-500 active:text-zinc-950"
              aria-label="Steer Left"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onPointerDown={() => (gameInput.right = true)}
              onPointerUp={() => (gameInput.right = false)}
              onPointerLeave={() => (gameInput.right = false)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-zinc-900/85 text-zinc-100 active:bg-amber-500 active:text-zinc-950"
              aria-label="Steer Right"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div
            ref={joyBaseRef}
            onTouchStart={handleJoyStart}
            onTouchMove={handleJoyMove}
            onTouchEnd={handleJoyEnd}
            onTouchCancel={handleJoyEnd}
            className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-zinc-900/75"
          >
            <div
              style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
              className="h-12 w-12 rounded-full border border-amber-400/60 bg-amber-500/80 shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Right Side: Camera, Action & Pedals / Flight / Combat */}
      <div className="pointer-events-auto flex items-end gap-2.5">
        <button
          type="button"
          onClick={() => cycleCameraMode()}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-zinc-900/85 text-zinc-200 active:bg-amber-500 active:text-zinc-950"
          aria-label="Switch Camera"
        >
          <Camera className="h-5 w-5" />
        </button>

        {(inVehicle || nearbyPrompt) && (
          <button
            type="button"
            onClick={() => (gameInput.interactPressed = true)}
            className="flex h-12 items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500 px-3.5 text-xs font-bold text-zinc-950 shadow-lg"
          >
            <CarFront className="h-4 w-4" />
            <span>{inVehicle ? 'Exit' : 'Interact'}</span>
          </button>
        )}

        {inVehicle ? (
          <div className="flex items-end gap-2">
            {isHeli ? (
              <>
                <button
                  type="button"
                  onPointerDown={() => (gameInput.descend = true)}
                  onPointerUp={() => (gameInput.descend = false)}
                  onPointerLeave={() => (gameInput.descend = false)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-400/40 bg-zinc-900/85 text-rose-300 active:bg-rose-500 active:text-white"
                  aria-label="Descend"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onPointerDown={() => (gameInput.jumpOrBrake = true)}
                  onPointerUp={() => (gameInput.jumpOrBrake = false)}
                  onPointerLeave={() => (gameInput.jumpOrBrake = false)}
                  className="flex h-14 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-zinc-900/85 text-cyan-300 active:bg-cyan-500 active:text-zinc-950"
                  aria-label="Climb"
                >
                  <ChevronUp className="h-6 w-6" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onPointerDown={() => (gameInput.nitro = true)}
                onPointerUp={() => (gameInput.nitro = false)}
                onPointerLeave={() => (gameInput.nitro = false)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-zinc-900/85 text-cyan-400 active:bg-cyan-500 active:text-zinc-950"
                aria-label="Nitro"
              >
                <Zap className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onPointerDown={() => (gameInput.backward = true)}
              onPointerUp={() => (gameInput.backward = false)}
              onPointerLeave={() => (gameInput.backward = false)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/40 bg-zinc-900/85 text-rose-400 active:bg-rose-500 active:text-white"
              aria-label="Brake or Reverse"
            >
              <ArrowDown className="h-6 w-6" />
            </button>
            <button
              type="button"
              onPointerDown={() => (gameInput.forward = true)}
              onPointerUp={() => (gameInput.forward = false)}
              onPointerLeave={() => (gameInput.forward = false)}
              className="flex h-16 w-14 items-center justify-center rounded-xl border border-emerald-500/40 bg-zinc-900/85 text-emerald-400 active:bg-emerald-500 active:text-zinc-950"
              aria-label="Accelerate"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audioEngine.init();
                gameInput.flyTogglePressed = true;
              }}
              className={`flex h-12 items-center gap-1 rounded-xl border px-3 text-xs font-semibold ${
                isFlying
                  ? 'border-cyan-400/60 bg-cyan-500 text-zinc-950'
                  : 'border-white/15 bg-zinc-900/85 text-cyan-300 active:bg-cyan-500 active:text-zinc-950'
              }`}
              aria-label={isFlying ? 'Land' : 'Fly'}
            >
              <Wind className="h-4 w-4" />
              <span>{isFlying ? 'Land' : 'Fly'}</span>
            </button>
            {isFlying && (
              <button
                type="button"
                onPointerDown={() => (gameInput.descend = true)}
                onPointerUp={() => (gameInput.descend = false)}
                onPointerLeave={() => (gameInput.descend = false)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-400/40 bg-zinc-900/85 text-rose-300 active:bg-rose-500 active:text-white"
                aria-label="Descend"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
            {isSuperHero && (
              <button
                type="button"
                onClick={() => {
                  audioEngine.init();
                  gameInput.shockwavePressed = true;
                }}
                className="flex h-12 items-center gap-1 rounded-xl border border-rose-400/55 bg-rose-600/90 px-3 text-xs font-bold text-white shadow-lg active:bg-rose-500"
                aria-label="Shockwave Slam"
              >
                <Zap className="h-4 w-4" />
                <span>Slam</span>
              </button>
            )}
            <button
              type="button"
              onPointerDown={() => {
                audioEngine.init();
                gameInput.firePressed = true;
                gameInput.fireHeld = true;
              }}
              onPointerUp={() => (gameInput.fireHeld = false)}
              onPointerLeave={() => (gameInput.fireHeld = false)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/90 text-zinc-950 shadow-lg active:bg-amber-400"
              aria-label="Fire Weapon"
            >
              <Crosshair className="h-6 w-6" />
            </button>
            <button
              type="button"
              onPointerDown={() => (gameInput.sprint = true)}
              onPointerUp={() => (gameInput.sprint = false)}
              onPointerLeave={() => (gameInput.sprint = false)}
              className="flex h-12 px-3 items-center justify-center rounded-xl border border-white/15 bg-zinc-900/85 text-xs font-semibold text-zinc-100 active:bg-amber-500 active:text-zinc-950"
            >
              {isFlying ? 'Boost' : 'Sprint'}
            </button>
            <button
              type="button"
              onPointerDown={() => (gameInput.jumpOrBrake = true)}
              onPointerUp={() => (gameInput.jumpOrBrake = false)}
              onPointerLeave={() => (gameInput.jumpOrBrake = false)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-zinc-900/85 text-xs font-semibold text-zinc-100 active:bg-amber-500 active:text-zinc-950"
            >
              {isFlying ? <ChevronUp className="h-6 w-6 text-cyan-300" /> : 'Jump'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
