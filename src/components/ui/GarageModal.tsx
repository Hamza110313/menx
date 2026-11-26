import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Check,
  Crosshair,
  Landmark,
  Palette,
  ShoppingBag,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  MISSIONS,
  PAINT_SWATCHES,
  PLAYABLE_CHARACTERS,
  PLAYER_OUTFITS,
  PROPERTIES,
  SHOP_ITEMS,
  VEHICLE_SPECS,
  WEAPONS,
} from '../../lib/gameConfig';
import { useGameStore } from '../../store/gameStore';
import type { CharacterId, WeaponId } from '../../types/game';

export function ActiveWorldModals() {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const money = useGameStore((s) => s.money);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const switchCharacter = useGameStore((s) => s.switchCharacter);

  const ownedVehicleIds = useGameStore((s) => s.ownedVehicleIds);
  const activeVehicleSpecId = useGameStore((s) => s.activeVehicleSpecId);
  const vehicleColors = useGameStore((s) => s.vehicleColors);
  const buyVehicle = useGameStore((s) => s.buyVehicle);
  const selectGarageVehicle = useGameStore((s) => s.selectGarageVehicle);
  const setVehiclePaint = useGameStore((s) => s.setVehiclePaint);

  const outfitId = useGameStore((s) => s.outfitId);
  const setOutfit = useGameStore((s) => s.setOutfit);
  const inventory = useGameStore((s) => s.inventory);
  const buyShopItem = useGameStore((s) => s.buyShopItem);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);

  const unlockedWeapons = useGameStore((s) => s.unlockedWeapons);
  const weaponAmmo = useGameStore((s) => s.weaponAmmo);
  const buyWeapon = useGameStore((s) => s.buyWeapon);
  const buyAmmo = useGameStore((s) => s.buyAmmo);

  const ownedProperties = useGameStore((s) => s.ownedProperties);
  const buyProperty = useGameStore((s) => s.buyProperty);
  const depositBank = useGameStore((s) => s.depositBank);
  const withdrawBank = useGameStore((s) => s.withdrawBank);

  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const completedMissionIds = useGameStore((s) => s.completedMissionIds);
  const startMission = useGameStore((s) => s.startMission);
  const abandonMission = useGameStore((s) => s.abandonMission);

  if (activeModal === 'none' || activeModal === 'settings' || activeModal === 'map') return null;

  const modalTitle =
    activeModal === 'garage'
      ? 'Harbor Customs Garage'
      : activeModal === 'shop'
        ? 'Solaris Tactical & Armory'
        : activeModal === 'missions'
          ? 'Story Missions & Contracts'
          : activeModal === 'atm'
            ? 'Meridian Bank ATM'
            : activeModal === 'properties'
              ? 'Solaris Bay Real Estate'
              : activeModal === 'characters'
                ? 'Select Playable Character'
                : 'Gear, Outfits & Inventory';

  const totalPassiveIncome = ownedProperties.reduce((acc, pid) => {
    const p = PROPERTIES.find((pr) => pr.id === pid);
    return acc + (p?.incomePerMinute ?? 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-zinc-100">{modalTitle}</h2>
            <p className="mt-0.5 text-xs text-zinc-400 font-mono-num">
              Wallet: <span className="text-emerald-400 font-semibold">${money.toLocaleString()}</span>
              {' · '}
              Bank: <span className="text-cyan-400 font-semibold">${bankBalance.toLocaleString()}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveModal('none')}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* GARAGE & VEHICLE CUSTOMIZATION */}
        {activeModal === 'garage' && (
          <div className="mt-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                <Palette className="h-4 w-4 text-amber-400" />
                <span>Active Vehicle Paint ({VEHICLE_SPECS[activeVehicleSpecId]?.name})</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {PAINT_SWATCHES.map((sw) => {
                  const selected =
                    (vehicleColors[activeVehicleSpecId] ??
                      VEHICLE_SPECS[activeVehicleSpecId]?.defaultColor) === sw.hex;
                  return (
                    <button
                      key={sw.hex}
                      type="button"
                      onClick={() => setVehiclePaint(activeVehicleSpecId, sw.hex)}
                      title={sw.name}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-amber-400 bg-zinc-800 text-zinc-100'
                          : 'border-white/10 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/25"
                        style={{ backgroundColor: sw.hex }}
                      />
                      <span>{sw.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/10 pt-5">
              {Object.values(VEHICLE_SPECS).map((spec) => {
                const isOwned = ownedVehicleIds.includes(spec.id);
                const isActive = activeVehicleSpecId === spec.id;
                const topKmh = Math.round(spec.maxSpeed * 3.6);
                return (
                  <div
                    key={spec.id}
                    className={`rounded-lg border p-4 ${
                      isActive
                        ? 'border-amber-500/60 bg-zinc-800/75'
                        : 'border-white/10 bg-zinc-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-zinc-100">{spec.name}</span>
                      <span className="text-[11px] font-medium capitalize text-zinc-400">
                        {spec.vehicleClass} · {topKmh} km/h
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{spec.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => selectGarageVehicle(spec.id)}
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                          }`}
                        >
                          {isActive ? 'Deliver Outside' : 'Select & Deliver'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => buyVehicle(spec.id)}
                          className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-white font-mono-num"
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

        {/* TACTICAL SHOP & ARMORY */}
        {activeModal === 'shop' && (
          <div className="mt-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                <Crosshair className="h-4 w-4 text-amber-400" />
                <span>Firearms & Ammunition</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['pistol', 'rifle', 'shotgun'] as WeaponId[]).map((wid) => {
                  const w = WEAPONS[wid];
                  const owned = unlockedWeapons.includes(wid);
                  const ammo = weaponAmmo[wid] ?? 0;
                  return (
                    <div
                      key={wid}
                      className="rounded-lg border border-white/10 bg-zinc-950/60 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-100">{w.name}</span>
                          <span className="font-mono-num text-xs text-amber-400">
                            {owned ? `${ammo} rds` : `Slot ${w.slot}`}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{w.description}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {!owned ? (
                          <button
                            type="button"
                            onClick={() => buyWeapon(wid)}
                            className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 font-mono-num"
                          >
                            Buy Gun ${w.price.toLocaleString()}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => buyAmmo(wid)}
                            className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 font-mono-num"
                          >
                            +{w.magSize * 2} Ammo (${w.ammoPrice})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <span>Field Supplies & Kits</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHOP_ITEMS.map((item) => {
                  const ownedQty = inventory[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-zinc-950/60 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-100">{item.name}</span>
                          <span className="font-mono-num text-xs text-zinc-400">Owned: {ownedQty}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => buyShopItem(item.id)}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 font-mono-num"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Buy ${item.price}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MERIDIAN BANK ATM */}
        {activeModal === 'atm' && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-4">
                <div className="text-xs text-zinc-400">Cash on Hand</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-emerald-400">
                  ${money.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-zinc-950/60 p-4">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                  <Landmark className="h-3.5 w-3.5" />
                  <span>Meridian Bank Account</span>
                </div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-zinc-100">
                  ${bankBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <ArrowUpRight className="h-4 w-4 text-cyan-400" />
                  <span>Deposit Cash to Bank</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[500, 2000, money].map((amt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={amt <= 0 || money < amt}
                      onClick={() => depositBank(amt)}
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400 disabled:opacity-40 font-mono-num"
                    >
                      {i === 2 ? 'All Cash' : `$${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                  <span>Withdraw Cash from Bank</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[500, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={bankBalance < amt}
                      onClick={() => withdrawBank(amt)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 font-mono-num"
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROPERTIES & REAL ESTATE */}
        {activeModal === 'properties' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-zinc-950/60 px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-200">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span>Owned Properties: {ownedProperties.length} / {PROPERTIES.length}</span>
              </div>
              <span className="font-mono-num font-bold text-emerald-400">
                +${totalPassiveIncome.toLocaleString()} / min to Bank
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROPERTIES.map((prop) => {
                const isOwned = ownedProperties.includes(prop.id);
                return (
                  <div
                    key={prop.id}
                    className={`rounded-lg border p-4 flex flex-col justify-between ${
                      isOwned ? 'border-emerald-500/40 bg-zinc-800/60' : 'border-white/10 bg-zinc-950/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-zinc-100">{prop.name}</span>
                        {isOwned && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="mt-0.5 text-[11px] text-cyan-400 font-mono-num">
                        {prop.district} · +${prop.incomePerMinute}/min
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">{prop.description}</p>
                    </div>
                    <div className="mt-4">
                      {isOwned ? (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-center text-xs font-semibold text-emerald-300">
                          Generating Revenue
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => buyProperty(prop.id)}
                          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 font-mono-num"
                        >
                          Buy Property ${prop.price.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PLAYABLE CHARACTER SWITCHER */}
        {activeModal === 'characters' && (
          <div className="mt-5 space-y-3">
            {(Object.keys(PLAYABLE_CHARACTERS) as CharacterId[]).map((cid) => {
              const char = PLAYABLE_CHARACTERS[cid];
              const isActive = activeCharacterId === cid;
              return (
                <div
                  key={cid}
                  className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive ? 'border-amber-400/70 bg-zinc-800/80' : 'border-white/10 bg-zinc-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <span className="font-display text-base font-bold text-zinc-100">{char.name}</span>
                      <span className="text-[11px] font-medium text-zinc-400">· {char.role}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-emerald-400">{char.perkLabel}</div>
                    <p className="mt-1 text-xs text-zinc-300">{char.bio}</p>
                    <div className="mt-1.5 text-[11px] text-zinc-400">
                      Safehouse: {char.homeLabel} · Ride: {VEHICLE_SPECS[char.personalVehicleId]?.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => switchCharacter(cid)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold ${
                      isActive
                        ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                    }`}
                  >
                    {isActive ? 'Active Hero' : `Play as ${char.codename}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* INVENTORY & CHARACTER OUTFITS */}
        {activeModal === 'inventory' && (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 mb-3">Consumable Supplies</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHOP_ITEMS.map((item) => {
                  const qty = inventory[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/60 p-3.5"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">
                          {item.name} <span className="font-mono-num text-amber-400">×{qty}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{item.description}</div>
                      </div>
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => useInventoryItem(item.id)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
                      >
                        Use
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                <User className="h-4 w-4 text-cyan-400" />
                <span>Character Wardrobe</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PLAYER_OUTFITS.map((o) => {
                  const active = outfitId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOutfit(o.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? 'border-amber-400 bg-zinc-800'
                          : 'border-white/10 bg-zinc-950/60 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-sm border border-white/20"
                          style={{ backgroundColor: o.jacketColor }}
                        />
                        <span className="text-xs font-semibold text-zinc-100">{o.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MISSIONS & STORYLINE */}
        {activeModal === 'missions' && (
          <div className="mt-5 space-y-3">
            {MISSIONS.map((m) => {
              const isDone = completedMissionIds.includes(m.id);
              const isRunning = activeMissionId === m.id;
              return (
                <div
                  key={m.id}
                  className={`rounded-lg border p-4 ${
                    isRunning
                      ? 'border-amber-500/60 bg-zinc-800/80'
                      : 'border-white/10 bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-zinc-100">{m.title}</span>
                        {isDone && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        Contact: {m.giver} · Reward:{' '}
                        <span className="font-mono-num text-emerald-400">
                          ${m.rewardCash.toLocaleString()}
                        </span>
                        {m.unlockVehicleId && (
                          <span> · Unlocks {VEHICLE_SPECS[m.unlockVehicleId]?.name}</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-zinc-300 leading-relaxed">{m.summary}</p>
                    </div>
                    <div className="shrink-0">
                      {isRunning ? (
                        <button
                          type="button"
                          onClick={() => abandonMission()}
                          className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/15"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            startMission(m.id);
                            setActiveModal('none');
                          }}
                          className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400"
                        >
                          {isDone ? 'Replay' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
