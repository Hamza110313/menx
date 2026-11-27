import {
  Backpack,
  Building2,
  Camera,
  CloudFog,
  CloudRain,
  Landmark,
  Lightbulb,
  Map,
  MapPin,
  Menu,
  Save,
  Shield,
  Star,
  Sun,
  Target,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import { MISSIONS, PLAYABLE_CHARACTERS, WEAPONS } from '../../lib/gameConfig';
import { gameInput } from '../../lib/inputState';
import { useGameStore } from '../../store/gameStore';
import type { WeaponId } from '../../types/game';
import { MiniMap } from './MiniMap';

function formatGameClock(hourFloat: number): string {
  const h = Math.floor(hourFloat) % 24;
  const m = Math.floor((hourFloat - Math.floor(hourFloat)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function HUD() {
  const screen = useGameStore((s) => s.screen);
  const activeModal = useGameStore((s) => s.activeModal);
  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const outfitId = useGameStore((s) => s.outfitId);
  const health = useGameStore((s) => s.health);
  const armor = useGameStore((s) => s.armor);
  const stamina = useGameStore((s) => s.stamina);
  const money = useGameStore((s) => s.money);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const wantedHeat = useGameStore((s) => s.wantedHeat);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const weather = useGameStore((s) => s.weather);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const activeMissionStepIndex = useGameStore((s) => s.activeMissionStepIndex);
  const missionTimer = useGameStore((s) => s.missionTimer);
  const unlockedWeapons = useGameStore((s) => s.unlockedWeapons);
  const activeWeaponId = useGameStore((s) => s.activeWeaponId);
  const weaponAmmo = useGameStore((s) => s.weaponAmmo);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const telemetry = useGameStore((s) => s.telemetry);
  const toasts = useGameStore((s) => s.toasts);
  const setScreen = useGameStore((s) => s.setScreen);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const selectWeapon = useGameStore((s) => s.selectWeapon);
  const cycleCameraMode = useGameStore((s) => s.cycleCameraMode);
  const saveProgress = useGameStore((s) => s.saveProgress);

  if (screen !== 'playing' || activeModal !== 'none') return null;

  const activeMission = activeMissionId ? MISSIONS.find((m) => m.id === activeMissionId) : null;
  const activeStep = activeMission?.steps[activeMissionStepIndex] ?? null;
  const activeHero = PLAYABLE_CHARACTERS[activeCharacterId];
  const isParagon = activeCharacterId === 'paragon' || outfitId === 'paragon_suit';
  const isSunburst = activeCharacterId === 'sunburst' || outfitId === 'sunburst_nika';
  const isNaruto =
    activeCharacterId === 'naruto' ||
    outfitId === 'naruto_sage_cloak' ||
    outfitId === 'naruto_tracksuit';
  const isBatman = activeCharacterId === 'batman' || outfitId === 'dark_knight';
  const isGoku = activeCharacterId === 'goku' || outfitId === 'goku_damaged_gi';
  const isSuperHero = isSunburst || isParagon || isBatman || isNaruto || isGoku;
  const weaponOrder: WeaponId[] = ['unarmed', 'pistol', 'smg', 'rifle', 'shotgun', 'rpg', 'sword'];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Center Aim Reticle (On Foot) */}
      {!telemetry.inVehicle && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="relative h-6 w-6 opacity-80">
            <span className="absolute left-1/2 top-0 h-1.5 w-0.5 -translate-x-1/2 bg-amber-300/90" />
            <span className="absolute bottom-0 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-amber-300/90" />
            <span className="absolute left-0 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-amber-300/90" />
            <span className="absolute right-0 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-amber-300/90" />
            <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400" />
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Mini-Map + Quick Action Buttons */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <MiniMap />
          <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
            <button
              type="button"
              onClick={() => setScreen('paused')}
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-zinc-950/88 px-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Menu className="h-3.5 w-3.5" />
              <span>Menu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('map')}
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-zinc-950/88 px-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Map className="h-3.5 w-3.5 text-cyan-400" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('missions')}
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-zinc-950/88 px-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span>Missions</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('characters')}
              title="Switch Character (Tab)"
              className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-zinc-950/88 px-2.5 text-xs font-medium text-amber-300 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{activeHero.codename}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('properties')}
              title="Properties & Real Estate"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-zinc-950/88 text-zinc-200 hover:bg-zinc-800"
              aria-label="Real Estate"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('inventory')}
              title="Open Inventory, Character, Weapons & Rides (I)"
              className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-400/40 bg-zinc-950/88 px-2.5 text-xs font-medium text-emerald-300 hover:bg-zinc-800 whitespace-nowrap shrink-0"
              aria-label="Open Inventory"
            >
              <Backpack className="h-3.5 w-3.5 text-emerald-400" />
              <span>Inventory</span>
            </button>
            <button
              type="button"
              onClick={() => cycleCameraMode()}
              title={`Camera: ${cameraMode} (V)`}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-zinc-950/88 text-zinc-200 hover:bg-zinc-800"
              aria-label="Switch Camera"
            >
              <Camera className="h-3.5 w-3.5 text-zinc-300" />
            </button>
            <button
              type="button"
              onClick={() => saveProgress(false)}
              title="Quick Save Progress"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-zinc-950/88 text-zinc-200 hover:bg-zinc-800"
              aria-label="Save Progress"
            >
              <Save className="h-3.5 w-3.5 text-cyan-400" />
            </button>
            {!telemetry.inVehicle && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    gameInput.flyTogglePressed = true;
                  }}
                  title="Toggle Flight (H or double-tap Space)"
                  className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    telemetry.isFlying
                      ? 'border-cyan-400/60 bg-cyan-500 text-zinc-950 font-bold'
                      : 'border-white/15 bg-zinc-950/88 text-cyan-300 hover:bg-zinc-800'
                  }`}
                >
                  <Wind className="h-3.5 w-3.5" />
                  <span>{telemetry.isFlying ? 'Land (H)' : 'Fly (H)'}</span>
                </button>
                {isSuperHero && (
                  <button
                    type="button"
                    onClick={() => {
                      gameInput.shockwavePressed = true;
                    }}
                    title="Kinetic Shockwave Slam (F)"
                    className={`flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      isSunburst
                        ? 'border-cyan-400/50 bg-zinc-950/88 text-cyan-200 hover:bg-cyan-950/60'
                        : 'border-rose-500/45 bg-zinc-950/88 text-rose-300 hover:bg-rose-950/70'
                    }`}
                  >
                    <Zap className={`h-3.5 w-3.5 ${isSunburst ? 'text-cyan-300' : 'text-rose-400'}`} />
                    <span>Slam (F)</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Top-Center: Active Mission Objective, Taxi Fare & Toast Stack */}
        <div className="hidden md:flex flex-col items-center gap-2 max-w-md w-full">
          {activeMission && activeStep && (
            <div className="w-full rounded-lg border border-amber-500/35 bg-zinc-950/90 px-4 py-2.5 shadow-lg">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-amber-400 truncate">{activeMission.title}</span>
                {missionTimer !== null && (
                  <span className="font-mono-num font-bold text-rose-400">
                    {Math.ceil(missionTimer)}s
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-200 leading-snug">{activeStep.description}</p>
            </div>
          )}

          {telemetry.taxiFareActive && telemetry.taxiFareTarget && (
            <div className="w-full rounded-lg border border-cyan-500/40 bg-zinc-950/90 px-4 py-2 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">Active Taxi Fare</span>
                <span className="font-mono-num text-zinc-300">
                  {Math.round(
                    Math.hypot(telemetry.taxiFareTarget.x - telemetry.x, telemetry.taxiFareTarget.z - telemetry.z)
                  )}
                  m
                </span>
              </div>
              <p className="text-[11px] text-zinc-200 mt-0.5">Dropoff: {telemetry.taxiFareTarget.label}</p>
            </div>
          )}

          {toasts.map((t) => (
            <div
              key={t.id}
              className={`w-full rounded-lg border px-4 py-2 shadow-lg ${
                t.tone === 'danger'
                  ? 'border-rose-500/40 bg-zinc-950/92 text-rose-100'
                  : t.tone === 'success'
                    ? 'border-emerald-500/40 bg-zinc-950/92 text-emerald-100'
                    : t.tone === 'warning'
                      ? 'border-amber-500/40 bg-zinc-950/92 text-amber-100'
                      : 'border-white/15 bg-zinc-950/90 text-zinc-100'
              }`}
            >
              <div className="text-xs font-semibold">{t.title}</div>
              {t.subtitle && <div className="text-[11px] text-zinc-300 mt-0.5">{t.subtitle}</div>}
            </div>
          ))}
        </div>

        {/* Top-Right: Money, Bank, Vitals, Weapons, Wanted Stars & Clock */}
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-lg border border-white/15 bg-zinc-950/90 px-3.5 py-2.5 shadow-xl min-w-[205px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono-num text-lg font-bold text-emerald-400 leading-tight">
                  ${money.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 font-mono-num text-[10px] text-cyan-400/90">
                  <Landmark className="h-2.5 w-2.5" />
                  <span>Bank ${bankBalance.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono-num">
                {weather === 'rain' ? (
                  <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                ) : weather === 'fog' ? (
                  <CloudFog className="h-3.5 w-3.5 text-zinc-400" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span>{formatGameClock(timeOfDay)}</span>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-semibold text-zinc-400">HP</span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-zinc-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
                  />
                </div>
              </div>

              {/* Armor & Stamina */}
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-cyan-400 shrink-0" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-zinc-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, armor))}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-amber-400 ml-1">STM</span>
                <div className="h-1.5 w-14 overflow-hidden rounded-sm bg-zinc-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weapon Slot Bar (On Foot) */}
            {!telemetry.inVehicle && (
              <div className="pointer-events-auto mt-2.5 flex items-center justify-between gap-1 border-t border-white/10 pt-2">
                {weaponOrder.map((wid) => {
                  const unlocked = unlockedWeapons.includes(wid);
                  const active = activeWeaponId === wid;
                  const spec = WEAPONS[wid];
                  const ammo = weaponAmmo[wid] ?? 0;
                  return (
                    <button
                      key={wid}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => selectWeapon(wid)}
                      className={`flex-1 rounded px-1.5 py-1 text-center transition-colors ${
                        active
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : unlocked
                            ? 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700'
                            : 'bg-zinc-900/50 text-zinc-600'
                      }`}
                    >
                      <div className="text-[10px] leading-none">
                        {spec.slot}·
                        {wid === 'unarmed'
                          ? isSunburst
                            ? 'Punch'
                            : isParagon
                              ? 'Heat'
                              : 'Fist'
                          : wid === 'pistol'
                            ? '9mm'
                            : wid === 'smg'
                              ? 'MP5'
                              : wid === 'rifle'
                                ? 'M4'
                                : wid === 'shotgun'
                                  ? '12g'
                                  : wid === 'sword'
                                    ? 'Blade'
                                    : 'RPG'}
                      </div>
                      <div className="mt-0.5 font-mono-num text-[9px] opacity-85">
                        {wid === 'unarmed' || wid === 'sword' ? '∞' : ammo}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wanted Level Stars */}
          {wantedLevel > 0 && (
            <div className="flex flex-col items-end gap-1 rounded-lg border border-rose-500/40 bg-zinc-950/92 px-3 py-2 shadow-xl">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`h-4 w-4 ${
                      starIdx <= wantedLevel ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-300">
                <span>
                  {wantedHeat < 95
                    ? 'Evading SBPD'
                    : wantedLevel >= 5
                      ? 'Air Support Active'
                      : wantedLevel >= 3
                        ? 'Armed SBPD Pursuit'
                        : 'SBPD Pursuit'}
                </span>
                <div className="h-1 w-16 overflow-hidden rounded-sm bg-zinc-800">
                  <div className="h-full bg-blue-500" style={{ width: `${wantedHeat}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Mission Strip */}
      {activeMission && activeStep && (
        <div className="md:hidden mx-auto mt-2 w-full max-w-sm rounded-lg border border-amber-500/35 bg-zinc-950/90 px-3 py-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-amber-400">
            <span>{activeMission.title}</span>
            {missionTimer !== null && <span className="font-mono-num text-rose-400">{Math.ceil(missionTimer)}s</span>}
          </div>
          <p className="mt-0.5 text-zinc-200">{activeStep.description}</p>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Subtle Controls Hint on Desktop */}
        <div className="hidden lg:flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950/85 px-3 py-1.5 text-[11px] text-zinc-400">
          <span>WASD Move</span>
          <span aria-hidden="true">·</span>
          <span>V Cam</span>
          <span aria-hidden="true">·</span>
          <span>G Map</span>
          <span aria-hidden="true">·</span>
          <span>I Inventory</span>
          <span aria-hidden="true">·</span>
          <span>Tab Hero</span>
          {!telemetry.inVehicle ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {isSunburst
                  ? 'H / 2×Space Fly · Click/Q Sonic Punch · F Slam · 1-6 Weapons'
                  : isParagon
                    ? 'H / 2×Space Fly · Click/Q Heat Vision · F Slam · 1-6 Weapons'
                    : 'H / 2×Space Fly · 1-6 Weapon · C Crouch · Click/Q Fire'}
              </span>
            </>
          ) : telemetry.vehicleClass === 'helicopter' ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Space Climb · Ctrl Descend</span>
            </>
          ) : telemetry.vehicleClass === 'horse' ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Shift Gallop · Space Halt · E Dismount</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span>L Lights · T Taxi · E Exit</span>
            </>
          )}
        </div>

        {/* Bottom-Center: Contextual Interaction Prompt & On-Foot State */}
        <div className="mx-auto mb-20 sm:mb-0 flex flex-col items-center gap-2">
          {!telemetry.inVehicle && telemetry.isFlying && (
            <div className="rounded border border-cyan-400/45 bg-zinc-950/92 px-3 py-1 font-mono-num text-[11px] font-medium text-cyan-300">
              Flight Active · ALT {telemetry.altitude}m · {telemetry.speedKmh} km/h · Space Up · Ctrl Down · Shift Boost
            </div>
          )}
          {!telemetry.inVehicle && !telemetry.isFlying && (telemetry.isCrouching || telemetry.inWater) && (
            <div className="rounded border border-white/15 bg-zinc-950/90 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
              {telemetry.inWater ? 'Swimming in Solaris Bay' : 'Crouch Stealth Active'}
            </div>
          )}

          {telemetry.nearbyPrompt && (
            <button
              type="button"
              onClick={() => {
                if (telemetry.nearbyPrompt?.key === 'F') gameInput.repairOrActionPressed = true;
                else gameInput.interactPressed = true;
              }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-amber-400/50 bg-zinc-950/92 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-xl hover:bg-zinc-900"
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded bg-amber-500 px-1.5 font-mono-num text-[11px] font-bold text-zinc-950">
                {telemetry.nearbyPrompt.key}
              </span>
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="whitespace-nowrap">{telemetry.nearbyPrompt.label}</span>
            </button>
          )}
        </div>

        {/* Bottom-Right: Vehicle Speedometer, Altitude, Fuel & Signals */}
        {telemetry.inVehicle ? (
          <div className="hidden sm:flex flex-col rounded-lg border border-white/15 bg-zinc-950/90 px-4 py-2.5 shadow-xl min-w-[205px]">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-1">
                <span className="font-display font-mono-num text-3xl font-bold text-zinc-50 leading-none">
                  {telemetry.speedKmh}
                </span>
                <span className="text-[11px] font-medium text-zinc-400">km/h</span>
              </div>
              <div className="flex items-center gap-2">
                {telemetry.vehicleClass === 'helicopter' && (
                  <span className="font-mono-num text-xs font-semibold text-cyan-400">
                    ALT {telemetry.altitude}m
                  </span>
                )}
                <span className="font-mono-num text-sm font-bold text-amber-400">
                  {telemetry.gear}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-300 gap-2">
              <span className="font-medium truncate">{telemetry.vehicleName}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Lightbulb
                  className={`h-3 w-3 ${telemetry.headlightsOn ? 'text-amber-300' : 'text-zinc-600'}`}
                />
                <span className="font-mono-num text-zinc-400">{telemetry.vehicleHealth}%</span>
              </div>
            </div>
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-semibold text-cyan-400">NOS</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-zinc-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${telemetry.vehicleNitro}%` }}
                  />
                </div>
              </div>
              {telemetry.vehicleClass !== 'bicycle' && telemetry.vehicleClass !== 'horse' && (
                <div className="flex items-center gap-2">
                  <span className="w-7 text-[10px] font-semibold text-amber-400">FUEL</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-zinc-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        telemetry.vehicleFuel < 20 ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${telemetry.vehicleFuel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden sm:block w-[205px]" />
        )}
      </div>
    </div>
  );
}
