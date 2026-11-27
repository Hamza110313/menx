import { useEffect, useState } from 'react';
import {
  Backpack,
  Camera,
  CarFront,
  CloudFog,
  CloudRain,
  Crosshair,
  Heart,
  Palette,
  Shield,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  PAINT_SWATCHES,
  PLAYABLE_CHARACTERS,
  PLAYER_OUTFITS,
  SHOP_ITEMS,
  VEHICLE_SPECS,
  WEAPONS,
} from '../../lib/gameConfig';
import { audioEngine } from '../../lib/audio';
import { useGameStore } from '../../store/gameStore';
import type { CharacterId, WeaponId, WeatherType } from '../../types/game';

type InventoryTab = 'character' | 'outfits' | 'weapons' | 'supplies' | 'vehicles';

export function InventoryModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);

  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const switchCharacter = useGameStore((s) => s.switchCharacter);
  const outfitId = useGameStore((s) => s.outfitId);
  const setOutfit = useGameStore((s) => s.setOutfit);

  const health = useGameStore((s) => s.health);
  const armor = useGameStore((s) => s.armor);
  const stamina = useGameStore((s) => s.stamina);
  const money = useGameStore((s) => s.money);
  const bankBalance = useGameStore((s) => s.bankBalance);

  const unlockedWeapons = useGameStore((s) => s.unlockedWeapons);
  const activeWeaponId = useGameStore((s) => s.activeWeaponId);
  const weaponAmmo = useGameStore((s) => s.weaponAmmo);
  const selectWeapon = useGameStore((s) => s.selectWeapon);
  const buyWeapon = useGameStore((s) => s.buyWeapon);
  const buyAmmo = useGameStore((s) => s.buyAmmo);

  const inventory = useGameStore((s) => s.inventory);
  const buyShopItem = useGameStore((s) => s.buyShopItem);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);

  const ownedVehicleIds = useGameStore((s) => s.ownedVehicleIds);
  const activeVehicleSpecId = useGameStore((s) => s.activeVehicleSpecId);
  const vehicleColors = useGameStore((s) => s.vehicleColors);
  const selectGarageVehicle = useGameStore((s) => s.selectGarageVehicle);
  const buyVehicle = useGameStore((s) => s.buyVehicle);
  const setVehiclePaint = useGameStore((s) => s.setVehiclePaint);

  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const weather = useGameStore((s) => s.weather);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);
  const setWeather = useGameStore((s) => s.setWeather);
  const cycleCameraMode = useGameStore((s) => s.cycleCameraMode);

  const [tab, setTab] = useState<InventoryTab>('character');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'owned' | 'land' | 'air_sea'>('all');

  useEffect(() => {
    if (activeModal === 'characters') {
      setTab('character');
    } else if (activeModal === 'inventory') {
      setTab((prev) => prev || 'character');
    }
  }, [activeModal]);

  if (activeModal !== 'inventory' && activeModal !== 'characters') return null;

  const activeHero = PLAYABLE_CHARACTERS[activeCharacterId];
  const activeOutfit = PLAYER_OUTFITS.find((o) => o.id === outfitId);
  const activeVehicle = VEHICLE_SPECS[activeVehicleSpecId];

  const tabs: Array<{ id: InventoryTab; label: string; icon: typeof Users }> = [
    { id: 'character', label: 'Character', icon: Users },
    { id: 'outfits', label: 'Outfits', icon: User },
    { id: 'weapons', label: 'Weapons', icon: Crosshair },
    { id: 'supplies', label: 'Supplies', icon: Backpack },
    { id: 'vehicles', label: 'Vehicles & Horse', icon: CarFront },
  ];

  const allVehicles = Object.values(VEHICLE_SPECS).filter((v) => {
    if (vehicleFilter === 'owned') return ownedVehicleIds.includes(v.id);
    if (vehicleFilter === 'air_sea') return v.vehicleClass === 'helicopter' || v.vehicleClass === 'boat';
    if (vehicleFilter === 'land') return v.vehicleClass !== 'helicopter' && v.vehicleClass !== 'boat';
    return true;
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/85 p-3 sm:p-5">
      <div className="flex w-full max-w-5xl max-h-[90vh] flex-col rounded-xl border border-white/15 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-zinc-950/70 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-zinc-100">
              Player Inventory &amp; Loadout
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400">
              <span className="font-semibold text-amber-400">{activeHero.name}</span>
              <span aria-hidden="true">·</span>
              <span>{activeOutfit?.name ?? 'Custom Suit'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-emerald-400">Cash ${money.toLocaleString()}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-cyan-400">Bank ${bankBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono-num text-zinc-300 border-r border-white/10 pr-4">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-emerald-400" />
                <span>{Math.round(health)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                <span>{Math.round(armor)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{Math.round(stamina)}%</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setActiveModal('none');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <span>Return to City</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setActiveModal('none');
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close inventory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-zinc-950/40 px-5 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playUiClick();
                    setTab(item.id);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick World & Camera Controls */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-950 p-1">
              {[
                { label: 'Noon', hour: 13.5 },
                { label: 'Sunset', hour: 18.2 },
                { label: 'Night', hour: 23.0 },
              ].map((preset) => {
                const isNear = Math.abs(timeOfDay - preset.hour) < 2.2;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      audioEngine.playUiClick();
                      setTimeOfDay(preset.hour);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                      isNear ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-950 p-1">
              {(['sunny', 'rain', 'fog'] as WeatherType[]).map((w) => {
                const active = weather === w;
                const Icon = w === 'sunny' ? Sun : w === 'rain' ? CloudRain : CloudFog;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      audioEngine.playUiClick();
                      setWeather(w);
                    }}
                    title={`Weather: ${w}`}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                      active ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{w}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => cycleCameraMode()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 whitespace-nowrap"
            >
              <Camera className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {cameraMode === 'third_far'
                  ? 'Wide Cam'
                  : cameraMode === 'third_close'
                    ? 'Close Cam'
                    : 'First Person'}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* CHARACTER SWITCHER */}
          {tab === 'character' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950/60 p-4">
                <div>
                  <div className="text-xs font-medium text-zinc-400">Active Character</div>
                  <div className="mt-0.5 font-display text-lg font-bold text-zinc-100">
                    {activeHero.name}
                  </div>
                  <div className="mt-0.5 text-xs text-emerald-400">{activeHero.perkLabel}</div>
                </div>
                <div className="text-xs text-zinc-400 text-right">
                  <div>Home: {activeHero.homeLabel}</div>
                  <div className="mt-0.5">
                    Signature Ride: {VEHICLE_SPECS[activeHero.personalVehicleId]?.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(PLAYABLE_CHARACTERS) as CharacterId[]).map((cid) => {
                  const char = PLAYABLE_CHARACTERS[cid];
                  const isActive = activeCharacterId === cid;
                  const outfit = PLAYER_OUTFITS.find((o) => o.id === char.outfitId);
                  return (
                    <div
                      key={cid}
                      className={`flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors ${
                        isActive
                          ? 'border-amber-400/70 bg-zinc-800/80'
                          : 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-8 w-8 rounded-lg border border-white/20 shrink-0"
                              style={{
                                background: outfit
                                  ? `linear-gradient(135deg, ${outfit.jacketColor} 55%, ${outfit.pantsColor} 55%)`
                                  : '#f59e0b',
                              }}
                            />
                            <div>
                              <h3 className="font-display text-sm font-bold text-zinc-100">
                                {char.name}
                              </h3>
                              <div className="text-xs text-zinc-400">
                                {char.codename} · {char.role}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 text-xs font-medium text-emerald-400">
                          {char.perkLabel}
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{char.bio}</p>
                        <div className="mt-2 text-[11px] text-zinc-400">
                          Safehouse: {char.homeLabel} · Ride: {VEHICLE_SPECS[char.personalVehicleId]?.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isActive}
                          onClick={() => switchCharacter(cid, true)}
                          className={`flex-1 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                            isActive
                              ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                          }`}
                        >
                          {isActive ? 'Currently Active' : `Select ${char.codename}`}
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => switchCharacter(cid, false)}
                            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 whitespace-nowrap"
                          >
                            Select &amp; Play
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OUTFITS & APPEARANCE */}
          {tab === 'outfits' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Change your active suit or street style at any time without switching character abilities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLAYER_OUTFITS.map((o) => {
                  const active = outfitId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        audioEngine.playUiClick();
                        setOutfit(o.id);
                      }}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                        active
                          ? 'border-amber-400 bg-zinc-800'
                          : 'border-white/10 bg-zinc-950/60 hover:bg-zinc-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="h-5 w-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: o.jacketColor }}
                            title="Top"
                          />
                          <span
                            className="h-5 w-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: o.pantsColor }}
                            title="Bottom"
                          />
                          <span
                            className="h-5 w-2.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: o.hairColor }}
                            title="Hair"
                          />
                        </div>
                        <span className="text-xs font-semibold text-zinc-100 truncate">{o.name}</span>
                      </div>
                      {active && (
                        <span className="text-[11px] font-semibold text-emerald-400 shrink-0">
                          Equipped
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEAPONS & AMMO */}
          {tab === 'weapons' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Equip unlocked weapons (hotkeys 1–7) or purchase new firearms and ammunition directly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['unarmed', 'sword', 'pistol', 'smg', 'rifle', 'shotgun', 'rpg'] as WeaponId[]).map(
                  (wid) => {
                    const spec = WEAPONS[wid];
                    const unlocked = unlockedWeapons.includes(wid);
                    const equipped = activeWeaponId === wid;
                    const ammo = weaponAmmo[wid] ?? 0;

                    return (
                      <div
                        key={wid}
                        className={`flex flex-col justify-between gap-3 rounded-lg border p-4 ${
                          equipped
                            ? 'border-amber-400/70 bg-zinc-800/80'
                            : 'border-white/10 bg-zinc-950/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm font-bold text-zinc-100">
                              Slot {spec.slot} · {spec.name}
                            </span>
                            <span className="font-mono-num text-xs font-semibold text-amber-400 whitespace-nowrap">
                              {wid === 'unarmed' || wid === 'sword'
                                ? 'Unlimited'
                                : unlocked
                                  ? `${ammo} rds`
                                  : `$${spec.price.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-400 font-mono-num">
                            DMG {spec.damage} · Range {spec.range}m
                            {spec.magSize > 0 ? ` · Mag ${spec.magSize}` : ''}
                          </div>
                          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                            {spec.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {unlocked ? (
                            <>
                              <button
                                type="button"
                                disabled={equipped}
                                onClick={() => selectWeapon(wid)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                                  equipped
                                    ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                    : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                                }`}
                              >
                                {equipped ? 'Equipped' : 'Equip'}
                              </button>
                              {spec.ammoPrice > 0 && (
                                <button
                                  type="button"
                                  onClick={() => buyAmmo(wid)}
                                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 font-mono-num whitespace-nowrap"
                                >
                                  +{spec.magSize * 2} Ammo (${spec.ammoPrice})
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => buyWeapon(wid)}
                              className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 font-mono-num"
                            >
                              Buy &amp; Equip ${spec.price.toLocaleString()}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* SUPPLIES & CONSUMABLES */}
          {tab === 'supplies' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Use carried trauma kits, armor vests, repair kits, and tactical gear, or restock directly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SHOP_ITEMS.map((item) => {
                  const qty = inventory[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950/60 p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-zinc-100">
                            {item.name}
                          </span>
                          <span className="font-mono-num text-xs font-bold text-amber-400">
                            Owned: {qty}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={qty <= 0}
                          onClick={() => useInventoryItem(item.id)}
                          className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-35"
                        >
                          Use Item
                        </button>
                        <button
                          type="button"
                          onClick={() => buyShopItem(item.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 font-mono-num whitespace-nowrap"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Buy ${item.price}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VEHICLES, MOUNTS & PAINT */}
          {tab === 'vehicles' && (
            <div className="space-y-5">
              {/* Active Vehicle Paint */}
              <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Palette className="h-4 w-4 text-amber-400" />
                    <span>Active Paint Finish ({activeVehicle?.name ?? activeVehicleSpecId})</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'owned', label: 'Owned' },
                        { id: 'land', label: 'Land & Horse' },
                        { id: 'air_sea', label: 'Air & Sea' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setVehicleFilter(f.id)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                          vehicleFilter === f.id
                            ? 'bg-amber-500 text-zinc-950 font-bold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PAINT_SWATCHES.map((sw) => {
                    const selected =
                      (vehicleColors[activeVehicleSpecId] ?? activeVehicle?.defaultColor) === sw.hex;
                    return (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() => setVehiclePaint(activeVehicleSpecId, sw.hex)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-amber-400 bg-zinc-800 text-zinc-100'
                            : 'border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/25"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span>{sw.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allVehicles.map((spec) => {
                  const isOwned = ownedVehicleIds.includes(spec.id);
                  const isActive = activeVehicleSpecId === spec.id;
                  const topKmh = Math.round(spec.maxSpeed * 3.6);
                  return (
                    <div
                      key={spec.id}
                      className={`flex flex-col justify-between gap-3 rounded-lg border p-4 ${
                        isActive
                          ? 'border-amber-500/60 bg-zinc-800/80'
                          : 'border-white/10 bg-zinc-950/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-zinc-100">
                            {spec.name}
                          </span>
                          <span className="text-xs font-medium capitalize text-zinc-400 font-mono-num whitespace-nowrap">
                            {spec.vehicleClass} · {topKmh} km/h
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {isOwned ? (
                          <button
                            type="button"
                            onClick={() => selectGarageVehicle(spec.id)}
                            className={`flex-1 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/30'
                                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                            }`}
                          >
                            {spec.vehicleClass === 'horse'
                              ? 'Whistle & Summon Mount'
                              : isActive
                                ? 'Deliver Outside'
                                : 'Deliver to Player'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => buyVehicle(spec.id)}
                            className="flex-1 rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-white font-mono-num"
                          >
                            Buy ${spec.price.toLocaleString()}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
