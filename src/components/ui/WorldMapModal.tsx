import { useEffect, useRef, useState } from 'react';
import { Compass, MapPin, Navigation, Trash2, X } from 'lucide-react';
import {
  CITY_BUILDINGS,
  INTERACTIVE_ZONES,
  MAP_LOCATIONS,
  MISSIONS,
  ROAD_CENTERS,
  ROAD_WIDTH,
  WORLD_HALF_SIZE,
  getDistrictName,
} from '../../lib/gameConfig';
import { useGameStore } from '../../store/gameStore';

type LocationFilter = 'all' | 'landmark' | 'service' | 'biome';

export function WorldMapModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const telemetry = useGameStore((s) => s.telemetry);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const activeMissionStepIndex = useGameStore((s) => s.activeMissionStepIndex);
  const gpsWaypoint = useGameStore((s) => s.gpsWaypoint);
  const setGpsWaypoint = useGameStore((s) => s.setGpsWaypoint);
  const teleportPlayer = useGameStore((s) => s.teleportPlayer);
  const wantedLevel = useGameStore((s) => s.wantedLevel);

  const [filter, setFilter] = useState<LocationFilter>('all');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeMission = activeMissionId ? MISSIONS.find((m) => m.id === activeMissionId) : null;
  const activeStep = activeMission?.steps[activeMissionStepIndex] ?? null;

  useEffect(() => {
    if (activeModal !== 'map') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 560;
    const span = WORLD_HALF_SIZE * 2; // 540m (-270..270)
    const toPx = (val: number) => ((val + WORLD_HALF_SIZE) / span) * size;
    const scale = size / span;

    ctx.clearRect(0, 0, size, size);

    // Base Urban Land
    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, size, size);

    // Redwood Forest (NW: x < -150, z < -90)
    ctx.fillStyle = '#143322';
    ctx.fillRect(0, 0, toPx(-150), toPx(-90));

    // Solaris Airport Apron & Runway (West: x < -176, z: -90..110)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, toPx(-90), toPx(-176), 200 * scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(toPx(-246), toPx(-86), 22 * scale, 180 * scale);

    // Solaris Badlands Desert (East: x > 180)
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(toPx(180), 0, size - toPx(180), toPx(186));

    // Beach & Ocean
    ctx.fillStyle = '#9c865b';
    ctx.fillRect(0, toPx(186), size, 22 * scale);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, toPx(206), size, size - toPx(206));

    // Emerald Park
    ctx.fillStyle = '#14532d';
    ctx.fillRect(toPx(92), toPx(12), 56 * scale, 56 * scale);

    // Road Grid
    ctx.fillStyle = '#27272a';
    const rw = ROAD_WIDTH * scale;
    for (const c of ROAD_CENTERS) {
      const p = toPx(c);
      ctx.fillRect(p - rw / 2, toPx(-186), rw, 372 * scale);
      ctx.fillRect(toPx(-186), p - rw / 2, 372 * scale, rw);
    }

    // Pier & Marina Finger
    ctx.fillStyle = '#785a3c';
    ctx.fillRect(toPx(-6), toPx(186), 12 * scale, 78 * scale);
    ctx.fillRect(toPx(113), toPx(186), 10 * scale, 52 * scale);

    // Buildings
    ctx.fillStyle = '#52525b';
    for (const b of CITY_BUILDINGS) {
      const bx = toPx(b.x);
      const bz = toPx(b.z);
      const bw = b.width * scale;
      const bd = b.depth * scale;
      ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd);
    }

    // Interactive Zones
    for (const z of INTERACTIVE_ZONES) {
      const zx = toPx(z.x);
      const zz = toPx(z.z);
      ctx.fillStyle =
        z.type === 'garage'
          ? '#f59e0b'
          : z.type === 'gas_station' || z.type === 'atm'
            ? '#06b6d4'
            : z.type === 'shop' || z.type === 'property' || z.type === 'safehouse'
              ? '#10b981'
              : z.type === 'hospital'
                ? '#f43f5e'
                : '#fbbf24';
      ctx.beginPath();
      ctx.arc(zx, zz, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Named District & Landmark Labels
    const mapLabels: Array<{ text: string; x: number; z: number; color?: string }> = [
      { text: 'REDWOODS', x: -205, z: -155, color: '#86efac' },
      { text: 'AIRPORT', x: -214, z: 4, color: '#cbd5e1' },
      { text: 'BADLANDS', x: 222, z: -110, color: '#fcd34d' },
      { text: 'DOWNTOWN', x: 0, z: -6, color: '#f4f4f5' },
      { text: 'MALL', x: -116, z: -40, color: '#e4e4e7' },
      { text: 'DINER', x: -124, z: 24, color: '#fca5a5' },
      { text: 'HARBOR', x: -114, z: 120, color: '#fdba74' },
      { text: 'SBPD', x: 118, z: -118, color: '#93c5fd' },
      { text: 'PARK', x: 120, z: 40, color: '#86efac' },
      { text: 'PIER', x: 0, z: 215, color: '#fde68a' },
      { text: 'MARINA', x: 124, z: 196, color: '#67e8f9' },
    ];
    ctx.font = '700 10px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const lbl of mapLabels) {
      const lx = toPx(lbl.x);
      const lz = toPx(lbl.z);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeText(lbl.text, lx, lz);
      ctx.fillStyle = lbl.color ?? '#e4e4e7';
      ctx.fillText(lbl.text, lx, lz);
    }

    // Police Blips
    if (wantedLevel > 0) {
      ctx.fillStyle = '#3b82f6';
      for (const p of telemetry.policePositions) {
        ctx.beginPath();
        ctx.arc(toPx(p.x), toPx(p.z), 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Active Mission Waypoint
    if (activeStep) {
      const mx = toPx(activeStep.targetX);
      const mz = toPx(activeStep.targetZ);
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, mz, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Taxi or Custom GPS Waypoint
    const cyanWp = telemetry.taxiFareTarget ?? gpsWaypoint;
    if (cyanWp) {
      const gx = toPx(cyanWp.x);
      const gz = toPx(cyanWp.z);
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gz, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Player Arrow
    ctx.save();
    ctx.translate(toPx(telemetry.x), toPx(telemetry.z));
    ctx.rotate(-telemetry.rotationY);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-5.5, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(5.5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [activeModal, telemetry, activeStep, gpsWaypoint, wantedLevel]);

  if (activeModal !== 'map') return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const nz = (e.clientY - rect.top) / rect.height;
    const wx = Math.round(nx * WORLD_HALF_SIZE * 2 - WORLD_HALF_SIZE);
    const wz = Math.round(nz * WORLD_HALF_SIZE * 2 - WORLD_HALF_SIZE);
    setGpsWaypoint({ x: wx, z: wz, label: getDistrictName(wx, wz) });
  };

  const filteredLocations = MAP_LOCATIONS.filter((loc) => {
    if (filter === 'all') return true;
    if (filter === 'landmark') return loc.category === 'landmark' || loc.category === 'transport';
    return loc.category === filter;
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/85 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-white/15 bg-zinc-900 p-5 shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Navigation className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-100">Solaris Bay World Map</h2>
              <p className="text-xs text-zinc-400">
                Click the map to place a GPS beacon, or choose a location to Set GPS / Fast Travel · Current: {telemetry.district}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gpsWaypoint && (
              <>
                <button
                  type="button"
                  onClick={() => teleportPlayer(gpsWaypoint.x, gpsWaypoint.z, gpsWaypoint.label)}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400 whitespace-nowrap shrink-0"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Travel to Pin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGpsWaypoint(null)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Clear GPS</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close map"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 min-h-0 flex-1">
          {/* Left: Interactive 2D World Map */}
          <div className="flex flex-col items-center justify-center">
            <canvas
              ref={canvasRef}
              width={560}
              height={560}
              onClick={handleCanvasClick}
              className="w-full max-w-[490px] aspect-square cursor-crosshair rounded-lg border border-white/15 bg-zinc-950"
            />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Mission / Garage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" /> GPS / ATM / Fuel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Armory & Properties
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Hospital
              </span>
              {gpsWaypoint && (
                <span className="flex items-center gap-1 font-mono-num text-cyan-300">
                  <MapPin className="h-3.5 w-3.5" /> GPS: {gpsWaypoint.label} ({gpsWaypoint.x}, {gpsWaypoint.z})
                </span>
              )}
            </div>
          </div>

          {/* Right: Named Locations & Fast Travel Directory */}
          <div className="flex flex-col rounded-lg border border-white/10 bg-zinc-950/75 p-3 min-h-[260px] max-h-[520px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="font-display text-sm font-bold text-zinc-100">City Locations</h3>
              <span className="font-mono-num text-[11px] text-zinc-400">{filteredLocations.length} sites</span>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'landmark', label: 'Landmarks' },
                  { id: 'service', label: 'Services' },
                  { id: 'biome', label: 'Biomes' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                    filter === tab.id
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredLocations.map((loc) => {
                const distM = Math.round(Math.hypot(loc.x - telemetry.x, loc.z - telemetry.z));
                return (
                  <div
                    key={loc.id}
                    className="rounded-lg border border-white/10 bg-zinc-900/90 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100 truncate">{loc.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-400 font-mono-num">
                        <span className="truncate">{loc.district}</span>
                        <span>· {distM}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGpsWaypoint({ x: loc.x, z: loc.z, label: loc.name })}
                        className="rounded-md border border-white/15 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-zinc-700 whitespace-nowrap shrink-0"
                      >
                        GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => teleportPlayer(loc.x, loc.z, loc.name)}
                        className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
                      >
                        Travel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
