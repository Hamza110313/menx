import { useEffect, useRef } from 'react';
import {
  CITY_BUILDINGS,
  INTERACTIVE_ZONES,
  MISSIONS,
  ROAD_CENTERS,
  ROAD_WIDTH,
} from '../../lib/gameConfig';
import { useGameStore } from '../../store/gameStore';

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const telemetry = useGameStore((s) => s.telemetry);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const activeMissionStepIndex = useGameStore((s) => s.activeMissionStepIndex);
  const gpsWaypoint = useGameStore((s) => s.gpsWaypoint);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  const activeMission = activeMissionId ? MISSIONS.find((m) => m.id === activeMissionId) : null;
  const activeStep = activeMission?.steps[activeMissionStepIndex] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 152;
    const half = size / 2;
    const scale = 0.56;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(half, half);

    // Forest Biome (NW)
    ctx.fillStyle = '#143322';
    ctx.fillRect((-270 - telemetry.x) * scale, (-270 - telemetry.z) * scale, 120 * scale, 180 * scale);

    // Airport Apron (West)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect((-270 - telemetry.x) * scale, (-90 - telemetry.z) * scale, 94 * scale, 200 * scale);

    // Badlands Desert (East)
    ctx.fillStyle = '#4a3520';
    ctx.fillRect((180 - telemetry.x) * scale, (-270 - telemetry.z) * scale, 120 * scale, 456 * scale);

    // Ocean & Beach bands
    const oceanY = (205 - telemetry.z) * scale;
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-half * 2, oceanY, size * 2, 220);

    const beachY = (186 - telemetry.z) * scale;
    ctx.fillStyle = '#a18c62';
    ctx.fillRect(-half * 2, beachY, size * 2, 19 * scale);

    // Roads
    ctx.fillStyle = '#27272a';
    for (const c of ROAD_CENTERS) {
      const rx = (c - telemetry.x) * scale;
      const rz = (c - telemetry.z) * scale;
      const rw = ROAD_WIDTH * scale;
      ctx.fillRect(rx - rw / 2, -260, rw, 520);
      ctx.fillRect(-260, rz - rw / 2, 520, rw);
    }

    // Buildings
    ctx.fillStyle = '#3f3f46';
    for (const b of CITY_BUILDINGS) {
      const bx = (b.x - telemetry.x) * scale;
      const bz = (b.z - telemetry.z) * scale;
      const bw = b.width * scale;
      const bd = b.depth * scale;
      ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd);
    }

    // Interactive Zones
    for (const z of INTERACTIVE_ZONES) {
      const zx = (z.x - telemetry.x) * scale;
      const zz = (z.z - telemetry.z) * scale;
      ctx.fillStyle =
        z.type === 'garage'
          ? '#f59e0b'
          : z.type === 'gas_station' || z.type === 'atm'
            ? '#06b6d4'
            : z.type === 'shop' || z.type === 'property' || z.type === 'safehouse'
              ? '#10b981'
              : '#f43f5e';
      ctx.beginPath();
      ctx.arc(zx, zz, 3.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Traffic blips
    ctx.fillStyle = 'rgba(228, 228, 231, 0.45)';
    for (const t of telemetry.trafficPositions) {
      ctx.fillRect((t.x - telemetry.x) * scale - 1.5, (t.z - telemetry.z) * scale - 1.5, 3, 3);
    }

    // Police blips
    if (wantedLevel > 0) {
      ctx.fillStyle = '#3b82f6';
      for (const p of telemetry.policePositions) {
        const px = (p.x - telemetry.x) * scale;
        const pz = (p.z - telemetry.z) * scale;
        ctx.beginPath();
        ctx.arc(px, pz, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cyan GPS / Taxi Target
    const cyanWp = telemetry.taxiFareTarget ?? gpsWaypoint;
    if (cyanWp) {
      let gx = (cyanWp.x - telemetry.x) * scale;
      let gz = (cyanWp.z - telemetry.z) * scale;
      const dist = Math.hypot(gx, gz);
      const maxEdge = half - 10;
      if (dist > maxEdge) {
        gx = (gx / dist) * maxEdge;
        gz = (gz / dist) * maxEdge;
      }
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gz, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Active Mission Waypoint
    if (activeStep) {
      let mx = (activeStep.targetX - telemetry.x) * scale;
      let mz = (activeStep.targetZ - telemetry.z) * scale;
      const dist = Math.hypot(mx, mz);
      const maxEdge = half - 10;
      if (dist > maxEdge) {
        mx = (mx / dist) * maxEdge;
        mz = (mz / dist) * maxEdge;
      }
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, mz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Player Directional Arrow at Center
    ctx.save();
    ctx.rotate(-telemetry.rotationY);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 6.5);
    ctx.lineTo(-4.5, -5);
    ctx.lineTo(0, -2.5);
    ctx.lineTo(4.5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [telemetry, activeStep, gpsWaypoint, wantedLevel]);

  const navTarget = activeStep
    ? { x: activeStep.targetX, z: activeStep.targetZ, isMission: true }
    : telemetry.taxiFareTarget
      ? { x: telemetry.taxiFareTarget.x, z: telemetry.taxiFareTarget.z, isMission: false }
      : gpsWaypoint
        ? { x: gpsWaypoint.x, z: gpsWaypoint.z, isMission: false }
        : null;

  const distMeters = navTarget
    ? Math.round(Math.hypot(navTarget.x - telemetry.x, navTarget.z - telemetry.z))
    : null;

  return (
    <button
      type="button"
      onClick={() => setActiveModal('map')}
      title="Open World Map (G)"
      className="block overflow-hidden rounded-lg border border-white/15 bg-zinc-950/90 shadow-xl text-left hover:border-amber-400/50 transition-colors"
    >
      <div className="relative h-[152px] w-[152px]">
        <canvas ref={canvasRef} width={152} height={152} className="block h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-zinc-950/85 px-2 py-1 text-[11px] font-medium text-zinc-300">
          <span className="truncate max-w-[102px]">{telemetry.district}</span>
          {distMeters !== null && (
            <span className={`font-mono-num ${navTarget?.isMission ? 'text-amber-400' : 'text-cyan-400'}`}>
              {distMeters}m
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
