import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  MISSIONS,
  PLAYABLE_CHARACTERS,
  PROPERTIES,
  SHOP_ITEMS,
  VEHICLE_SPECS,
  WEAPONS,
  getDistrictName,
} from '../lib/gameConfig';
import { audioEngine } from '../lib/audio';
import {
  clearSavedGame,
  createInitialSaveData,
  loadSavedGame,
  persistSaveGame,
} from '../lib/storage';
import type {
  CameraMode,
  CharacterId,
  GameScreen,
  GameSettings,
  LiveTelemetry,
  MissionDefinition,
  SaveDataV1,
  WeaponId,
  WeatherType,
} from '../types/game';

export interface ToastMessage {
  id: number;
  title: string;
  subtitle?: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

export type ActiveWorldModalType =
  | 'none'
  | 'garage'
  | 'shop'
  | 'settings'
  | 'missions'
  | 'inventory'
  | 'atm'
  | 'properties'
  | 'map'
  | 'characters';

interface GameStoreState {
  screen: GameScreen;
  hasSaveFile: boolean;
  savedPreview: SaveDataV1 | null;
  gameSessionId: number;

  // Persistent Player State
  activeCharacterId: CharacterId;
  playerPos: { x: number; y: number; z: number };
  playerRotY: number;
  health: number;
  armor: number;
  stamina: number;
  money: number;
  bankBalance: number;
  outfitId: string;

  // Vehicles & Garage
  ownedVehicleIds: string[];
  vehicleColors: Record<string, string>;
  activeVehicleSpecId: string;
  spawnRequestedSpecId: string | null;

  // Properties & Arsenal
  ownedProperties: string[];
  unlockedWeapons: WeaponId[];
  activeWeaponId: WeaponId;
  weaponAmmo: Record<WeaponId, number>;

  // Camera & Navigation
  cameraMode: CameraMode;
  gpsWaypoint: { x: number; z: number; label: string } | null;

  // Missions & Wanted
  completedMissionIds: string[];
  activeMissionId: string | null;
  activeMissionStepIndex: number;
  missionTimer: number | null;
  wantedLevel: number;
  wantedHeat: number;

  // World Environment
  timeOfDay: number;
  weather: WeatherType;

  // Inventory & Settings
  inventory: Record<string, number>;
  settings: GameSettings;

  // UI Modals inside game
  activeModal: ActiveWorldModalType;
  toasts: ToastMessage[];

  // High-frequency telemetry
  telemetry: LiveTelemetry;

  // Actions
  refreshSavePreview: () => void;
  startNewGame: () => void;
  continueSavedGame: () => void;
  saveProgress: (silent?: boolean) => boolean;
  setScreen: (screen: GameScreen) => void;
  setActiveModal: (modal: ActiveWorldModalType) => void;
  pushToast: (title: string, subtitle?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: number) => void;

  updateTelemetry: (partial: Partial<LiveTelemetry>) => void;
  syncPlayerVitals: (
    health: number,
    armor: number,
    stamina: number,
    pos: { x: number; y: number; z: number },
    rotY: number
  ) => void;
  damagePlayer: (amount: number) => void;
  healPlayerFull: (cost: number) => boolean;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;

  depositBank: (amount: number) => boolean;
  withdrawBank: (amount: number) => boolean;
  buyProperty: (propId: string) => boolean;
  collectPassiveIncome: (amount: number) => void;

  switchCharacter: (charId: CharacterId) => void;
  selectWeapon: (weaponId: WeaponId) => void;
  buyWeapon: (weaponId: WeaponId) => boolean;
  buyAmmo: (weaponId: WeaponId) => boolean;
  consumeAmmo: (weaponId: WeaponId) => boolean;
  cycleCameraMode: () => void;
  setGpsWaypoint: (wp: { x: number; z: number; label: string } | null) => void;
  teleportPlayer: (x: number, z: number, label: string) => void;

  setWantedLevel: (stars: number) => void;
  setWantedHeat: (heat: number) => void;
  triggerCrimeHeat: (stars?: number) => void;

  startMission: (missionId: string) => void;
  advanceMissionStep: () => void;
  failMission: (reason: string) => void;
  abandonMission: () => void;
  tickMissionTimer: (delta: number) => void;

  buyVehicle: (specId: string) => boolean;
  selectGarageVehicle: (specId: string) => void;
  clearSpawnRequest: () => void;
  setVehiclePaint: (specId: string, hex: string) => void;
  setOutfit: (outfitId: string) => void;

  buyShopItem: (itemId: string) => boolean;
  useInventoryItem: (itemId: string) => boolean;

  setTimeOfDay: (hour: number) => void;
  setWeather: (weather: WeatherType) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  respawnAfterFailure: () => void;
}

const initialSaved = typeof window !== 'undefined' ? loadSavedGame() : null;
let toastSeq = 1;

export const useGameStore = create<GameStoreState>((set, get) => ({
  screen: 'menu',
  hasSaveFile: Boolean(initialSaved),
  savedPreview: initialSaved,
  gameSessionId: 0,

  activeCharacterId: initialSaved ? initialSaved.activeCharacterId : 'specter',
  playerPos: initialSaved ? initialSaved.playerPos : { x: 8, y: 0, z: 12 },
  playerRotY: initialSaved ? initialSaved.playerRotY : Math.PI,
  health: initialSaved ? initialSaved.health : 100,
  armor: initialSaved ? initialSaved.armor : 35,
  stamina: initialSaved ? initialSaved.stamina : 100,
  money: initialSaved ? initialSaved.money : 2200,
  bankBalance: initialSaved ? initialSaved.bankBalance : 5000,
  outfitId: initialSaved ? initialSaved.outfitId : PLAYABLE_CHARACTERS.specter.outfitId,

  ownedVehicleIds: initialSaved ? initialSaved.ownedVehicleIds : ['solaris_spyder', 'veloce_gt', 'mustang_gt'],
  vehicleColors: initialSaved
    ? initialSaved.vehicleColors
    : {
        solaris_spyder: VEHICLE_SPECS.solaris_spyder.defaultColor,
        veloce_gt: VEHICLE_SPECS.veloce_gt.defaultColor,
        mustang_gt: VEHICLE_SPECS.mustang_gt.defaultColor,
      },
  activeVehicleSpecId: initialSaved ? initialSaved.activeVehicleSpecId : 'solaris_spyder',
  spawnRequestedSpecId: null,

  ownedProperties: initialSaved ? initialSaved.ownedProperties : [],
  unlockedWeapons: initialSaved ? initialSaved.unlockedWeapons : ['unarmed', 'pistol'],
  activeWeaponId: 'pistol',
  weaponAmmo: initialSaved
    ? initialSaved.weaponAmmo
    : { unarmed: 0, pistol: 60, rifle: 0, shotgun: 0 },

  cameraMode: 'third_far',
  gpsWaypoint: null,

  completedMissionIds: initialSaved ? initialSaved.completedMissionIds : [],
  activeMissionId: initialSaved ? initialSaved.activeMissionId : null,
  activeMissionStepIndex: initialSaved ? initialSaved.activeMissionStepIndex : 0,
  missionTimer: null,
  wantedLevel: 0,
  wantedHeat: 0,

  timeOfDay: initialSaved ? initialSaved.timeOfDay : 14.5,
  weather: initialSaved ? initialSaved.weather : 'sunny',

  inventory: initialSaved
    ? initialSaved.inventory
    : { medkit: 1, armor_vest: 0, repair_kit: 1, nitro_can: 1 },
  settings: initialSaved ? initialSaved.settings : { ...DEFAULT_SETTINGS },

  activeModal: 'none',
  toasts: [],

  telemetry: {
    x: initialSaved ? initialSaved.playerPos.x : 8,
    y: 0,
    z: initialSaved ? initialSaved.playerPos.z : 12,
    rotationY: 0,
    speedKmh: 0,
    altitude: 0,
    gear: 'N',
    inVehicle: false,
    vehicleClass: 'foot',
    vehicleName: 'Solaris Spyder Roadster',
    vehicleHealth: 100,
    vehicleNitro: 100,
    vehicleFuel: 100,
    headlightsOn: false,
    turnSignal: 0,
    isCrouching: false,
    isFlying: false,
    inWater: false,
    district: getDistrictName(
      initialSaved ? initialSaved.playerPos.x : 8,
      initialSaved ? initialSaved.playerPos.z : 12
    ),
    taxiFareActive: false,
    taxiFareTarget: null,
    nearbyPrompt: null,
    policePositions: [],
    trafficPositions: [],
  },

  refreshSavePreview: () => {
    const loaded = loadSavedGame();
    set({ hasSaveFile: Boolean(loaded), savedPreview: loaded });
  },

  startNewGame: () => {
    const currentSettings = get().settings;
    clearSavedGame();
    const fresh = createInitialSaveData(currentSettings);
    persistSaveGame(fresh);
    set((s) => ({
      screen: 'playing',
      activeModal: 'none',
      hasSaveFile: true,
      savedPreview: fresh,
      gameSessionId: s.gameSessionId + 1,
      activeCharacterId: fresh.activeCharacterId,
      playerPos: fresh.playerPos,
      playerRotY: fresh.playerRotY,
      health: fresh.health,
      armor: fresh.armor,
      stamina: fresh.stamina,
      money: fresh.money,
      bankBalance: fresh.bankBalance,
      outfitId: fresh.outfitId,
      ownedVehicleIds: fresh.ownedVehicleIds,
      vehicleColors: fresh.vehicleColors,
      activeVehicleSpecId: fresh.activeVehicleSpecId,
      spawnRequestedSpecId: null,
      ownedProperties: fresh.ownedProperties,
      unlockedWeapons: fresh.unlockedWeapons,
      activeWeaponId: 'pistol',
      weaponAmmo: fresh.weaponAmmo,
      completedMissionIds: [],
      activeMissionId: null,
      activeMissionStepIndex: 0,
      missionTimer: null,
      wantedLevel: 0,
      wantedHeat: 0,
      gpsWaypoint: null,
      timeOfDay: fresh.timeOfDay,
      weather: fresh.weather,
      inventory: fresh.inventory,
      settings: fresh.settings,
      telemetry: {
        ...s.telemetry,
        x: fresh.playerPos.x,
        y: fresh.playerPos.y,
        z: fresh.playerPos.z,
        inVehicle: false,
        vehicleClass: 'foot',
        speedKmh: 0,
        altitude: 0,
        district: getDistrictName(fresh.playerPos.x, fresh.playerPos.z),
      },
    }));
    audioEngine.init();
    audioEngine.applySettings(fresh.settings);
    get().pushToast(
      'Welcome to Solaris Bay',
      'Playing as Specter · Press H or Double-Space to Fly, Tab for Heroes, G for Map.',
      'info'
    );
  },

  continueSavedGame: () => {
    const loaded = loadSavedGame();
    if (!loaded) {
      get().startNewGame();
      return;
    }
    const activeMission = loaded.activeMissionId
      ? MISSIONS.find((m) => m.id === loaded.activeMissionId)
      : null;
    const step = activeMission?.steps[loaded.activeMissionStepIndex];
    set((s) => ({
      screen: 'playing',
      activeModal: 'none',
      hasSaveFile: true,
      savedPreview: loaded,
      gameSessionId: s.gameSessionId + 1,
      activeCharacterId: loaded.activeCharacterId,
      playerPos: loaded.playerPos,
      playerRotY: loaded.playerRotY,
      health: loaded.health,
      armor: loaded.armor,
      stamina: loaded.stamina,
      money: loaded.money,
      bankBalance: loaded.bankBalance,
      outfitId: loaded.outfitId,
      ownedVehicleIds: loaded.ownedVehicleIds,
      vehicleColors: loaded.vehicleColors,
      activeVehicleSpecId: loaded.activeVehicleSpecId,
      spawnRequestedSpecId: null,
      ownedProperties: loaded.ownedProperties,
      unlockedWeapons: loaded.unlockedWeapons,
      activeWeaponId: loaded.unlockedWeapons.includes('pistol') ? 'pistol' : 'unarmed',
      weaponAmmo: loaded.weaponAmmo,
      completedMissionIds: loaded.completedMissionIds,
      activeMissionId: loaded.activeMissionId,
      activeMissionStepIndex: loaded.activeMissionStepIndex,
      missionTimer: step?.timerSeconds ?? null,
      wantedLevel: 0,
      wantedHeat: 0,
      timeOfDay: loaded.timeOfDay,
      weather: loaded.weather,
      inventory: loaded.inventory,
      settings: loaded.settings,
      telemetry: {
        ...s.telemetry,
        x: loaded.playerPos.x,
        y: loaded.playerPos.y,
        z: loaded.playerPos.z,
        inVehicle: false,
        vehicleClass: 'foot',
        speedKmh: 0,
        district: getDistrictName(loaded.playerPos.x, loaded.playerPos.z),
      },
    }));
    audioEngine.init();
    audioEngine.applySettings(loaded.settings);
    get().pushToast(
      'Progress Restored',
      `Resumed as ${PLAYABLE_CHARACTERS[loaded.activeCharacterId].codename} in ${getDistrictName(
        loaded.playerPos.x,
        loaded.playerPos.z
      )}`,
      'success'
    );
  },

  saveProgress: (silent = false) => {
    const s = get();
    const saveObj: SaveDataV1 = {
      version: 1,
      savedAt: new Date().toISOString(),
      activeCharacterId: s.activeCharacterId,
      playerPos: { ...s.playerPos },
      playerRotY: s.playerRotY,
      health: s.health,
      armor: s.armor,
      stamina: s.stamina,
      money: s.money,
      bankBalance: s.bankBalance,
      outfitId: s.outfitId,
      ownedVehicleIds: [...s.ownedVehicleIds],
      vehicleColors: { ...s.vehicleColors },
      activeVehicleSpecId: s.activeVehicleSpecId,
      ownedProperties: [...s.ownedProperties],
      unlockedWeapons: [...s.unlockedWeapons],
      weaponAmmo: { ...s.weaponAmmo },
      completedMissionIds: [...s.completedMissionIds],
      activeMissionId: s.activeMissionId,
      activeMissionStepIndex: s.activeMissionStepIndex,
      inventory: { ...s.inventory },
      timeOfDay: s.timeOfDay,
      weather: s.weather,
      settings: { ...s.settings },
    };
    const ok = persistSaveGame(saveObj);
    if (ok) {
      set({ hasSaveFile: true, savedPreview: saveObj });
      if (!silent) {
        get().pushToast('Game Saved', 'Progress stored safely in browser storage.', 'success');
      }
    }
    return ok;
  },

  setScreen: (screen) => {
    if (screen !== 'playing') {
      audioEngine.silenceLooping();
    }
    set({ screen, activeModal: 'none' });
  },

  setActiveModal: (activeModal) => {
    if (activeModal !== 'none') {
      audioEngine.silenceLooping();
    }
    set({ activeModal });
  },

  pushToast: (title, subtitle, tone = 'info') => {
    const id = toastSeq++;
    set((s) => ({
      toasts: [...s.toasts.slice(-3), { id, title, subtitle, tone }],
    }));
    window.setTimeout(() => {
      get().dismissToast(id);
    }, 4200);
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  updateTelemetry: (partial) => {
    set((s) => ({
      telemetry: { ...s.telemetry, ...partial },
    }));
  },

  syncPlayerVitals: (health, armor, stamina, pos, rotY) => {
    set({ health, armor, stamina, playerPos: pos, playerRotY: rotY });
  },

  damagePlayer: (amount) => {
    const s = get();
    if (s.screen !== 'playing') return;
    // Kade tactical perk: +25% ballistic armor mitigation
    const isKade = s.activeCharacterId === 'kade';
    let remaining = isKade ? amount * 0.85 : amount;
    let newArmor = s.armor;
    if (newArmor > 0) {
      const absorbRatio = isKade ? 0.8 : 0.65;
      const absorbed = Math.min(newArmor, remaining * absorbRatio);
      newArmor -= absorbed;
      remaining -= absorbed;
    }
    const newHealth = Math.max(0, s.health - remaining);
    if (newHealth <= 0) {
      audioEngine.silenceLooping();
      set({
        health: 0,
        armor: Math.round(newArmor),
        screen: 'wasted',
        wantedLevel: 0,
        wantedHeat: 0,
      });
    } else {
      set({ health: Math.round(newHealth), armor: Math.round(newArmor) });
    }
  },

  healPlayerFull: (cost) => {
    const s = get();
    if (s.health >= 100 && s.armor >= 50) {
      get().pushToast('Full Health', 'You are already in peak condition.', 'info');
      return false;
    }
    if (!get().spendMoney(cost)) return false;
    set({ health: 100, armor: Math.max(s.armor, 50), stamina: 100 });
    audioEngine.playCheckpoint();
    get().pushToast('Bay Medical Trauma Care', 'Health restored to 100% and armor patched.', 'success');
    get().saveProgress(true);
    return true;
  },

  addMoney: (amount) => {
    const s = get();
    const mult = s.activeCharacterId === 'dante' ? 1.2 : 1.0;
    set({ money: s.money + Math.max(0, Math.round(amount * mult)) });
  },

  spendMoney: (amount) => {
    const s = get();
    if (s.money < amount) {
      get().pushToast('Insufficient Cash', `Need $${amount.toLocaleString()} on hand (check ATM for Bank funds).`, 'warning');
      return false;
    }
    set({ money: s.money - amount });
    return true;
  },

  depositBank: (amount) => {
    const s = get();
    const clean = Math.max(0, Math.floor(amount));
    if (clean <= 0 || s.money < clean) {
      get().pushToast('Cannot Deposit', 'Not enough cash on hand.', 'warning');
      return false;
    }
    set({ money: s.money - clean, bankBalance: s.bankBalance + clean });
    audioEngine.playUiClick();
    get().pushToast('Deposited to Meridian Bank', `$${clean.toLocaleString()} secured in account.`, 'success');
    get().saveProgress(true);
    return true;
  },

  withdrawBank: (amount) => {
    const s = get();
    const clean = Math.max(0, Math.floor(amount));
    if (clean <= 0 || s.bankBalance < clean) {
      get().pushToast('Cannot Withdraw', 'Insufficient Meridian Bank balance.', 'warning');
      return false;
    }
    set({ bankBalance: s.bankBalance - clean, money: s.money + clean });
    audioEngine.playUiClick();
    get().pushToast('Withdrew Cash', `$${clean.toLocaleString()} added to wallet.`, 'info');
    get().saveProgress(true);
    return true;
  },

  buyProperty: (propId) => {
    const prop = PROPERTIES.find((p) => p.id === propId);
    if (!prop) return false;
    const s = get();
    if (s.ownedProperties.includes(propId)) {
      get().pushToast('Already Owned', `${prop.name} is already generating passive income.`, 'info');
      return false;
    }
    if (!get().spendMoney(prop.price)) return false;
    set((prev) => ({
      ownedProperties: [...prev.ownedProperties, propId],
    }));
    audioEngine.playMissionComplete();
    get().pushToast(
      `Acquired ${prop.name}`,
      `Generates +$${prop.incomePerMinute}/min direct to your Bank.`,
      'success'
    );
    get().saveProgress(true);
    return true;
  },

  collectPassiveIncome: (amount) => {
    if (amount <= 0) return;
    set((s) => ({ bankBalance: s.bankBalance + Math.round(amount) }));
  },

  switchCharacter: (charId) => {
    const hero = PLAYABLE_CHARACTERS[charId];
    if (!hero) return;
    const s = get();
    const nextVehicles = s.ownedVehicleIds.includes(hero.personalVehicleId)
      ? s.ownedVehicleIds
      : [...s.ownedVehicleIds, hero.personalVehicleId];
    const nextColors = {
      ...s.vehicleColors,
      [hero.personalVehicleId]:
        s.vehicleColors[hero.personalVehicleId] ??
        VEHICLE_SPECS[hero.personalVehicleId]?.defaultColor ??
        '#e11d48',
    };
    set({
      activeCharacterId: charId,
      outfitId: hero.outfitId,
      ownedVehicleIds: nextVehicles,
      vehicleColors: nextColors,
      activeVehicleSpecId: hero.personalVehicleId,
      spawnRequestedSpecId: hero.personalVehicleId,
      activeModal: 'none',
    });
    audioEngine.playDoorToggle();
    get().pushToast(`Switched to ${hero.name}`, `${hero.perkLabel} · Personal ride delivered.`, 'info');
    get().saveProgress(true);
  },

  selectWeapon: (weaponId) => {
    const s = get();
    if (!s.unlockedWeapons.includes(weaponId)) {
      get().pushToast('Weapon Locked', `Purchase ${WEAPONS[weaponId].name} at Solaris Tactical & Armory.`, 'warning');
      return;
    }
    set({ activeWeaponId: weaponId });
    audioEngine.playUiClick();
  },

  buyWeapon: (weaponId) => {
    const spec = WEAPONS[weaponId];
    if (!spec) return false;
    const s = get();
    if (s.unlockedWeapons.includes(weaponId)) {
      set({ activeWeaponId: weaponId });
      return true;
    }
    if (!get().spendMoney(spec.price)) return false;
    set((prev) => ({
      unlockedWeapons: [...prev.unlockedWeapons, weaponId],
      activeWeaponId: weaponId,
      weaponAmmo: {
        ...prev.weaponAmmo,
        [weaponId]: (prev.weaponAmmo[weaponId] ?? 0) + spec.magSize * 2,
      },
    }));
    audioEngine.playMissionComplete();
    get().pushToast(`Purchased ${spec.name}`, `Equipped in slot ${spec.slot}.`, 'success');
    get().saveProgress(true);
    return true;
  },

  buyAmmo: (weaponId) => {
    const spec = WEAPONS[weaponId];
    if (!spec || spec.ammoPrice <= 0) return false;
    if (!get().unlockedWeapons.includes(weaponId)) {
      get().pushToast('Unlock Weapon First', `Buy ${spec.name} before buying ammunition.`, 'warning');
      return false;
    }
    if (!get().spendMoney(spec.ammoPrice)) return false;
    const added = spec.magSize * 2;
    set((prev) => ({
      weaponAmmo: {
        ...prev.weaponAmmo,
        [weaponId]: (prev.weaponAmmo[weaponId] ?? 0) + added,
      },
    }));
    audioEngine.playUiClick();
    get().pushToast(`+${added} Rounds`, `${spec.name} ammunition restocked.`, 'success');
    get().saveProgress(true);
    return true;
  },

  consumeAmmo: (weaponId) => {
    if (weaponId === 'unarmed') return true;
    const s = get();
    const cur = s.weaponAmmo[weaponId] ?? 0;
    if (cur <= 0) return false;
    set({
      weaponAmmo: {
        ...s.weaponAmmo,
        [weaponId]: cur - 1,
      },
    });
    return true;
  },

  cycleCameraMode: () => {
    const order: CameraMode[] = ['third_far', 'third_close', 'first_person'];
    const cur = get().cameraMode;
    const next = order[(order.indexOf(cur) + 1) % order.length];
    set({ cameraMode: next });
    audioEngine.playUiClick();
    const label =
      next === 'third_far' ? 'Wide Chase' : next === 'third_close' ? 'Action Close' : 'First-Person Cockpit';
    get().pushToast(`Camera: ${label}`, undefined, 'info');
  },

  setGpsWaypoint: (gpsWaypoint) => {
    set({ gpsWaypoint });
    if (gpsWaypoint) {
      get().pushToast('GPS Waypoint Set', gpsWaypoint.label, 'info');
    }
  },

  teleportPlayer: (x, z, label) => {
    set({
      activeModal: 'none',
      gpsWaypoint: null,
      playerPos: { x, y: 0, z },
    });
    window.dispatchEvent(new CustomEvent('citycrime:teleport', { detail: { x, z, label } }));
    audioEngine.playCheckpoint();
    get().pushToast(`Fast Traveled to ${label}`, getDistrictName(x, z), 'success');
  },

  setWantedLevel: (stars) => {
    const clamped = Math.max(0, Math.min(5, Math.floor(stars)));
    set({ wantedLevel: clamped, wantedHeat: clamped > 0 ? 100 : 0 });
  },

  setWantedHeat: (heat) => {
    set({ wantedHeat: Math.max(0, Math.min(100, heat)) });
  },

  triggerCrimeHeat: (stars = 1) => {
    const s = get();
    const nextStars = Math.min(5, Math.max(s.wantedLevel, stars));
    if (nextStars > s.wantedLevel) {
      const msg =
        nextStars >= 5
          ? 'Wanted Level 5 — Air Support & Armed SBPD Deployed!'
          : nextStars >= 3
            ? 'Wanted Level ' + nextStars + ' — Armed SBPD Response!'
            : `Wanted Level ${nextStars} — Evade patrol units!`;
      get().pushToast('SBPD Alerted', msg, 'danger');
    }
    set({ wantedLevel: nextStars, wantedHeat: 100 });
  },

  startMission: (missionId) => {
    const mission: MissionDefinition | undefined = MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const firstStep = mission.steps[0];
    set({
      activeMissionId: mission.id,
      activeMissionStepIndex: 0,
      missionTimer: firstStep?.timerSeconds ?? null,
    });
    if (firstStep?.grantWanted) {
      get().triggerCrimeHeat(firstStep.grantWanted);
    }
    audioEngine.playCheckpoint();
    get().pushToast(`Mission Started: ${mission.title}`, firstStep?.description, 'info');
    get().saveProgress(true);
  },

  advanceMissionStep: () => {
    const s = get();
    if (!s.activeMissionId) return;
    const mission = MISSIONS.find((m) => m.id === s.activeMissionId);
    if (!mission) return;

    const nextIdx = s.activeMissionStepIndex + 1;
    if (nextIdx >= mission.steps.length) {
      const alreadyDone = s.completedMissionIds.includes(mission.id);
      const completed = alreadyDone
        ? s.completedMissionIds
        : [...s.completedMissionIds, mission.id];
      const unlocked = [...s.ownedVehicleIds];
      if (mission.unlockVehicleId && !unlocked.includes(mission.unlockVehicleId)) {
        unlocked.push(mission.unlockVehicleId);
      }
      const mult = s.activeCharacterId === 'dante' ? 1.2 : 1.0;
      const payout = Math.round(mission.rewardCash * mult);
      const unlockSpec = mission.unlockVehicleId ? VEHICLE_SPECS[mission.unlockVehicleId] : null;
      set({
        activeMissionId: null,
        activeMissionStepIndex: 0,
        missionTimer: null,
        completedMissionIds: completed,
        ownedVehicleIds: unlocked,
        money: s.money + payout,
      });
      audioEngine.playMissionComplete();
      get().pushToast(
        `Mission Passed! +$${payout.toLocaleString()}`,
        unlockSpec && !alreadyDone
          ? `Unlocked ${unlockSpec.name} in Harbor Garage!`
          : mission.title,
        'success'
      );
      get().saveProgress(true);
    } else {
      const nextStep = mission.steps[nextIdx];
      set({
        activeMissionStepIndex: nextIdx,
        missionTimer: nextStep.timerSeconds ?? s.missionTimer,
      });
      if (nextStep.grantWanted) {
        get().triggerCrimeHeat(nextStep.grantWanted);
      }
      audioEngine.playCheckpoint();
      get().pushToast('Objective Updated', nextStep.description, 'info');
      get().saveProgress(true);
    }
  },

  failMission: (reason) => {
    const s = get();
    if (!s.activeMissionId) return;
    set({
      activeMissionId: null,
      activeMissionStepIndex: 0,
      missionTimer: null,
    });
    get().pushToast('Mission Failed', reason, 'danger');
  },

  abandonMission: () => {
    set({
      activeMissionId: null,
      activeMissionStepIndex: 0,
      missionTimer: null,
    });
    get().pushToast('Mission Cancelled', 'Free roam mode active.', 'info');
  },

  tickMissionTimer: (delta) => {
    const s = get();
    if (s.missionTimer === null || !s.activeMissionId) return;
    const next = s.missionTimer - delta;
    if (next <= 0) {
      get().failMission('Time expired before reaching the objective.');
    } else {
      set({ missionTimer: next });
    }
  },

  buyVehicle: (specId) => {
    const spec = VEHICLE_SPECS[specId];
    if (!spec) return false;
    const s = get();
    if (s.ownedVehicleIds.includes(specId)) {
      get().selectGarageVehicle(specId);
      return true;
    }
    if (!get().spendMoney(spec.price)) return false;
    set((prev) => ({
      ownedVehicleIds: [...prev.ownedVehicleIds, specId],
      activeVehicleSpecId: specId,
      spawnRequestedSpecId: specId,
      vehicleColors: {
        ...prev.vehicleColors,
        [specId]: prev.vehicleColors[specId] ?? spec.defaultColor,
      },
    }));
    audioEngine.playMissionComplete();
    get().pushToast(`Purchased ${spec.name}`, 'Delivered to your active bay.', 'success');
    get().saveProgress(true);
    return true;
  },

  selectGarageVehicle: (specId) => {
    const s = get();
    if (!s.ownedVehicleIds.includes(specId)) return;
    set({
      activeVehicleSpecId: specId,
      spawnRequestedSpecId: specId,
      activeModal: 'none',
    });
    audioEngine.playDoorToggle();
    get().pushToast('Vehicle Delivered', `${VEHICLE_SPECS[specId].name} is parked outside.`, 'info');
    get().saveProgress(true);
  },

  clearSpawnRequest: () => {
    set({ spawnRequestedSpecId: null });
  },

  setVehiclePaint: (specId, hex) => {
    set((s) => ({
      vehicleColors: { ...s.vehicleColors, [specId]: hex },
    }));
    get().saveProgress(true);
  },

  setOutfit: (outfitId) => {
    set({ outfitId });
    get().saveProgress(true);
  },

  buyShopItem: (itemId) => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;
    if (!get().spendMoney(item.price)) return false;
    set((s) => ({
      inventory: {
        ...s.inventory,
        [itemId]: (s.inventory[itemId] ?? 0) + 1,
      },
    }));
    audioEngine.playUiClick();
    get().pushToast(`Bought ${item.name}`, 'Added to your inventory.', 'success');
    get().saveProgress(true);
    return true;
  },

  useInventoryItem: (itemId) => {
    const s = get();
    const count = s.inventory[itemId] ?? 0;
    if (count <= 0) {
      get().pushToast('Empty Slot', 'Visit Solaris Tactical & Supply to restock.', 'warning');
      return false;
    }
    if (itemId === 'medkit') {
      set({
        health: Math.min(100, s.health + 60),
        inventory: { ...s.inventory, medkit: count - 1 },
      });
      get().pushToast('Trauma Medkit Used', 'Health restored (+60 HP).', 'success');
      return true;
    }
    if (itemId === 'armor_vest') {
      set({
        armor: 100,
        inventory: { ...s.inventory, armor_vest: count - 1 },
      });
      get().pushToast('Kevlar Vest Equipped', 'Armor restored to 100%.', 'success');
      return true;
    }
    set({
      inventory: { ...s.inventory, [itemId]: count - 1 },
    });
    window.dispatchEvent(new CustomEvent('citycrime:use_item', { detail: { itemId } }));
    return true;
  },

  setTimeOfDay: (timeOfDay) => set({ timeOfDay: ((timeOfDay % 24) + 24) % 24 }),
  setWeather: (weather) => set({ weather }),

  updateSettings: (partial) => {
    set((s) => {
      const next = { ...s.settings, ...partial };
      audioEngine.applySettings(next);
      return { settings: next };
    });
    get().saveProgress(true);
  },

  respawnAfterFailure: () => {
    const s = get();
    const medicalFee = Math.min(s.money, 250);
    set((prev) => ({
      screen: 'playing',
      health: 100,
      armor: 35,
      stamina: 100,
      money: prev.money - medicalFee,
      wantedLevel: 0,
      wantedHeat: 0,
      activeMissionId: null,
      activeMissionStepIndex: 0,
      missionTimer: null,
      playerPos: { x: 24, y: 0, z: -42 }, // Discharge outside Bay Medical Center!
      playerRotY: 0,
      gameSessionId: prev.gameSessionId + 1,
    }));
    get().pushToast(
      'Discharged from Bay Medical Center',
      medicalFee > 0 ? `Medical & bail fee: -$${medicalFee}` : 'Back on the streets.',
      'info'
    );
    get().saveProgress(true);
  },
}));
