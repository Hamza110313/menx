import { DEFAULT_SETTINGS, PLAYABLE_CHARACTERS, VEHICLE_SPECS } from './gameConfig';
import type { CharacterId, GameSettings, SaveDataV1, WeatherType, WeaponId } from '../types/game';

const SAVE_KEY = 'solaris_bay_city_crime_save_v1';

export function createInitialSaveData(existingSettings?: GameSettings): SaveDataV1 {
  return {
    version: 1,
    characterRev: 3,
    savedAt: new Date().toISOString(),
    activeCharacterId: 'sunburst',
    playerPos: { x: 8, y: 0, z: 12 }, // Downtown Plaza near starter roadster
    playerRotY: Math.PI,
    health: 100,
    armor: 50,
    stamina: 100,
    money: 2200,
    bankBalance: 5000,
    outfitId: PLAYABLE_CHARACTERS.sunburst.outfitId,
    ownedVehicleIds: [
      'solaris_spyder',
      'veloce_gt',
      'mustang_gt',
      ...Object.values(VEHICLE_SPECS)
        .filter((v) => v.unlockedByDefault)
        .map((v) => v.id),
    ].filter((id, i, arr) => arr.indexOf(id) === i),
    vehicleColors: {
      solaris_spyder: VEHICLE_SPECS.solaris_spyder.defaultColor,
      veloce_gt: VEHICLE_SPECS.veloce_gt.defaultColor,
      mustang_gt: VEHICLE_SPECS.mustang_gt.defaultColor,
      skyline_r34: VEHICLE_SPECS.skyline_r34.defaultColor,
      chestnut_stallion: VEHICLE_SPECS.chestnut_stallion.defaultColor,
    },
    activeVehicleSpecId: 'solaris_spyder',
    ownedProperties: [],
    unlockedWeapons: ['unarmed', 'pistol', 'sword'],
    weaponAmmo: {
      unarmed: 0,
      sword: 0,
      pistol: 60,
      smg: 0,
      rifle: 0,
      shotgun: 0,
      rpg: 0,
    },
    completedMissionIds: [],
    activeMissionId: null,
    activeMissionStepIndex: 0,
    inventory: {
      medkit: 1,
      armor_vest: 0,
      repair_kit: 1,
      nitro_can: 1,
      energy_drink: 1,
      adrenaline_shot: 1,
      emp_jammer: 0,
      ammo_crate: 1,
    },
    timeOfDay: 14.5, // Sunny afternoon
    weather: 'sunny',
    settings: existingSettings ? { ...existingSettings } : { ...DEFAULT_SETTINGS },
  };
}

function isFiniteNum(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function isValidWeather(val: unknown): val is WeatherType {
  return val === 'sunny' || val === 'rain' || val === 'fog';
}

function isValidCharacter(val: unknown): val is CharacterId {
  return (
    val === 'sunburst' ||
    val === 'naruto' ||
    val === 'goku' ||
    val === 'paragon' ||
    val === 'batman' ||
    val === 'nomad' ||
    val === 'specter' ||
    val === 'kade' ||
    val === 'vex' ||
    val === 'dante'
  );
}

export function validateSaveData(raw: unknown): SaveDataV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) return null;

  const pos = obj.playerPos as Record<string, unknown> | undefined;
  if (!pos || !isFiniteNum(pos.x) || !isFiniteNum(pos.y) || !isFiniteNum(pos.z)) {
    return null;
  }

  const clampX = Math.max(-265, Math.min(265, pos.x));
  const clampZ = Math.max(-265, Math.min(265, pos.z));
  const clampY = Math.max(-1, Math.min(80, pos.y));

  const owned = Array.isArray(obj.ownedVehicleIds)
    ? obj.ownedVehicleIds.filter((id): id is string => typeof id === 'string' && id in VEHICLE_SPECS)
    : ['veloce_gt'];
  if (!owned.includes('veloce_gt')) owned.unshift('veloce_gt');
  for (const spec of Object.values(VEHICLE_SPECS)) {
    if (spec.unlockedByDefault && !owned.includes(spec.id)) {
      owned.push(spec.id);
    }
  }

  const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<
    string,
    unknown
  >;

  const settings: GameSettings = {
    graphicsQuality: rawSettings.graphicsQuality === 'medium' ? 'medium' : 'high',
    timeMode:
      rawSettings.timeMode === 'noon' ||
      rawSettings.timeMode === 'sunset' ||
      rawSettings.timeMode === 'midnight'
        ? rawSettings.timeMode
        : 'dynamic',
    weatherMode:
      rawSettings.weatherMode === 'sunny' ||
      rawSettings.weatherMode === 'rain' ||
      rawSettings.weatherMode === 'fog'
        ? rawSettings.weatherMode
        : 'dynamic',
    musicVolume: isFiniteNum(rawSettings.musicVolume)
      ? Math.max(0, Math.min(1, rawSettings.musicVolume))
      : DEFAULT_SETTINGS.musicVolume,
    sfxVolume: isFiniteNum(rawSettings.sfxVolume)
      ? Math.max(0, Math.min(1, rawSettings.sfxVolume))
      : DEFAULT_SETTINGS.sfxVolume,
    ambientVolume: isFiniteNum(rawSettings.ambientVolume)
      ? Math.max(0, Math.min(1, rawSettings.ambientVolume))
      : DEFAULT_SETTINGS.ambientVolume,
    cameraSensitivity: isFiniteNum(rawSettings.cameraSensitivity)
      ? Math.max(0.4, Math.min(2.5, rawSettings.cameraSensitivity))
      : DEFAULT_SETTINGS.cameraSensitivity,
    showMobileControls: Boolean(rawSettings.showMobileControls),
  };

  const rawColors =
    obj.vehicleColors && typeof obj.vehicleColors === 'object'
      ? (obj.vehicleColors as Record<string, unknown>)
      : {};
  const vehicleColors: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawColors)) {
    if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) {
      vehicleColors[k] = v;
    }
  }

  const rawInv =
    obj.inventory && typeof obj.inventory === 'object'
      ? (obj.inventory as Record<string, unknown>)
      : {};
  const inventory: Record<string, number> = {
    medkit: isFiniteNum(rawInv.medkit) ? Math.max(0, Math.floor(rawInv.medkit)) : 1,
    armor_vest: isFiniteNum(rawInv.armor_vest) ? Math.max(0, Math.floor(rawInv.armor_vest)) : 0,
    repair_kit: isFiniteNum(rawInv.repair_kit) ? Math.max(0, Math.floor(rawInv.repair_kit)) : 1,
    nitro_can: isFiniteNum(rawInv.nitro_can) ? Math.max(0, Math.floor(rawInv.nitro_can)) : 1,
    energy_drink: isFiniteNum(rawInv.energy_drink) ? Math.max(0, Math.floor(rawInv.energy_drink)) : 1,
    adrenaline_shot: isFiniteNum(rawInv.adrenaline_shot)
      ? Math.max(0, Math.floor(rawInv.adrenaline_shot))
      : 1,
    emp_jammer: isFiniteNum(rawInv.emp_jammer) ? Math.max(0, Math.floor(rawInv.emp_jammer)) : 0,
    ammo_crate: isFiniteNum(rawInv.ammo_crate) ? Math.max(0, Math.floor(rawInv.ammo_crate)) : 1,
  };

  const rawWeapons = Array.isArray(obj.unlockedWeapons)
    ? obj.unlockedWeapons.filter(
        (w): w is WeaponId =>
          w === 'unarmed' ||
          w === 'sword' ||
          w === 'pistol' ||
          w === 'smg' ||
          w === 'rifle' ||
          w === 'shotgun' ||
          w === 'rpg'
      )
    : (['unarmed', 'pistol', 'sword'] as WeaponId[]);
  if (!rawWeapons.includes('unarmed')) rawWeapons.unshift('unarmed');
  if (!rawWeapons.includes('pistol')) rawWeapons.push('pistol');
  if (!rawWeapons.includes('sword')) rawWeapons.push('sword');

  const rawAmmo =
    obj.weaponAmmo && typeof obj.weaponAmmo === 'object'
      ? (obj.weaponAmmo as Record<string, unknown>)
      : {};
  const weaponAmmo: Record<WeaponId, number> = {
    unarmed: 0,
    sword: 0,
    pistol: isFiniteNum(rawAmmo.pistol) ? Math.max(0, Math.floor(rawAmmo.pistol)) : 60,
    smg: isFiniteNum(rawAmmo.smg) ? Math.max(0, Math.floor(rawAmmo.smg)) : 0,
    rifle: isFiniteNum(rawAmmo.rifle) ? Math.max(0, Math.floor(rawAmmo.rifle)) : 0,
    shotgun: isFiniteNum(rawAmmo.shotgun) ? Math.max(0, Math.floor(rawAmmo.shotgun)) : 0,
    rpg: isFiniteNum(rawAmmo.rpg) ? Math.max(0, Math.floor(rawAmmo.rpg)) : 0,
  };

  const needsHeroRev = obj.characterRev !== 3;
  const resolvedChar: CharacterId = needsHeroRev
    ? 'sunburst'
    : isValidCharacter(obj.activeCharacterId)
      ? obj.activeCharacterId
      : 'sunburst';
  const resolvedOutfit = needsHeroRev
    ? 'sunburst_nika'
    : typeof obj.outfitId === 'string'
      ? obj.outfitId
      : 'sunburst_nika';

  return {
    version: 1,
    characterRev: 3,
    savedAt: typeof obj.savedAt === 'string' ? obj.savedAt : new Date().toISOString(),
    activeCharacterId: resolvedChar,
    playerPos: { x: clampX, y: clampY, z: clampZ },
    playerRotY: isFiniteNum(obj.playerRotY) ? obj.playerRotY : 0,
    health: isFiniteNum(obj.health) ? Math.max(10, Math.min(100, obj.health)) : 100,
    armor: isFiniteNum(obj.armor) ? Math.max(0, Math.min(100, obj.armor)) : 50,
    stamina: isFiniteNum(obj.stamina) ? Math.max(0, Math.min(100, obj.stamina)) : 100,
    money: isFiniteNum(obj.money) ? Math.max(0, Math.floor(obj.money)) : 1500,
    bankBalance: isFiniteNum(obj.bankBalance) ? Math.max(0, Math.floor(obj.bankBalance)) : 5000,
    outfitId: resolvedOutfit,
    ownedVehicleIds: owned,
    vehicleColors,
    activeVehicleSpecId:
      typeof obj.activeVehicleSpecId === 'string' && obj.activeVehicleSpecId in VEHICLE_SPECS
        ? obj.activeVehicleSpecId
        : 'veloce_gt',
    ownedProperties: Array.isArray(obj.ownedProperties)
      ? obj.ownedProperties.filter((id): id is string => typeof id === 'string')
      : [],
    unlockedWeapons: rawWeapons,
    weaponAmmo,
    completedMissionIds: Array.isArray(obj.completedMissionIds)
      ? obj.completedMissionIds.filter((id): id is string => typeof id === 'string')
      : [],
    activeMissionId: typeof obj.activeMissionId === 'string' ? obj.activeMissionId : null,
    activeMissionStepIndex: isFiniteNum(obj.activeMissionStepIndex)
      ? Math.max(0, Math.floor(obj.activeMissionStepIndex))
      : 0,
    inventory,
    timeOfDay: isFiniteNum(obj.timeOfDay) ? ((obj.timeOfDay % 24) + 24) % 24 : 14.5,
    weather: isValidWeather(obj.weather) ? obj.weather : 'sunny',
    settings,
  };
}

export function loadSavedGame(): SaveDataV1 | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = validateSaveData(parsed);
    if (!validated) {
      window.localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return validated;
  } catch {
    return null;
  }
}

export function persistSaveGame(data: SaveDataV1): boolean {
  try {
    const payload: SaveDataV1 = {
      ...data,
      version: 1,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedGame(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore storage errors
  }
}
