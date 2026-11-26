export type GameScreen = 'menu' | 'playing' | 'paused' | 'wasted' | 'busted';

export type VehicleClass =
  | 'sports'
  | 'supercar'
  | 'muscle'
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'motorcycle'
  | 'bicycle'
  | 'truck'
  | 'bus'
  | 'police'
  | 'ambulance'
  | 'helicopter'
  | 'boat'
  | 'convertible';

export type WeaponId = 'unarmed' | 'pistol' | 'rifle' | 'shotgun';
export type CharacterId = 'specter' | 'kade' | 'vex' | 'dante';
export type CameraMode = 'third_far' | 'third_close' | 'first_person';

export type WeatherType = 'sunny' | 'rain' | 'fog';
export type TimeMode = 'dynamic' | 'noon' | 'sunset' | 'midnight';
export type GraphicsQuality = 'high' | 'medium';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface PlayableCharacter {
  id: CharacterId;
  name: string;
  codename: string;
  role: string;
  perkLabel: string;
  outfitId: string;
  personalVehicleId: string;
  homeLabel: string;
  homeX: number;
  homeZ: number;
  bio: string;
}

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  slot: number;
  damage: number;
  range: number;
  cooldown: number;
  magSize: number;
  pellets: number;
  spread: number;
  price: number;
  ammoPrice: number;
  description: string;
}

export interface PropertyDefinition {
  id: string;
  name: string;
  district: string;
  price: number;
  incomePerMinute: number;
  x: number;
  z: number;
  description: string;
}

export interface MapLocation {
  id: string;
  name: string;
  district: string;
  category: 'landmark' | 'service' | 'biome' | 'transport';
  x: number;
  z: number;
}

export interface VehicleSpec {
  id: string;
  name: string;
  vehicleClass: VehicleClass;
  price: number;
  maxSpeed: number; // m/s (1 m/s = 3.6 km/h)
  acceleration: number;
  braking: number;
  handling: number;
  mass: number;
  length: number;
  width: number;
  height: number;
  defaultColor: string;
  description: string;
}

export interface VehicleInstanceData {
  uid: string;
  specId: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speed: number;
  steering: number;
  health: number; // 0-100
  nitro: number; // 0-100
  fuel: number; // 0-100
  isOwned: boolean;
  isPolice?: boolean;
}

export interface BuildingCollider {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  district: string;
  label?: string;
  kind:
    | 'skyscraper'
    | 'residential'
    | 'colonial_house'
    | 'barn'
    | 'mall'
    | 'garage'
    | 'gas_station'
    | 'police'
    | 'hospital'
    | 'diner'
    | 'warehouse'
    | 'airport_tower'
    | 'hangar'
    | 'safehouse'
    | 'prop';
  color?: string;
  enterable?: boolean;
}

export interface InteractiveZone {
  id: string;
  type:
    | 'garage'
    | 'gas_station'
    | 'mission_start'
    | 'shop'
    | 'pier'
    | 'atm'
    | 'property'
    | 'hospital'
    | 'safehouse';
  label: string;
  sublabel: string;
  x: number;
  z: number;
  radius: number;
  missionId?: string;
  propertyId?: string;
}

export interface MissionStep {
  id: string;
  description: string;
  targetX: number;
  targetZ: number;
  radius: number;
  requiresVehicle?: boolean;
  requiresWantedClear?: boolean;
  timerSeconds?: number;
  grantWanted?: number;
}

export interface MissionDefinition {
  id: string;
  title: string;
  category: 'story' | 'side' | 'race' | 'heist';
  giver: string;
  summary: string;
  rewardCash: number;
  unlockVehicleId?: string;
  steps: MissionStep[];
  startX: number;
  startZ: number;
}

export interface InventoryItem {
  id: 'medkit' | 'repair_kit' | 'armor_vest' | 'nitro_can';
  name: string;
  description: string;
  price: number;
  count: number;
}

export interface PlayerOutfit {
  id: string;
  name: string;
  jacketColor: string;
  pantsColor: string;
  hairColor: string;
  skinTone: string;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  timeMode: TimeMode;
  weatherMode: WeatherType | 'dynamic';
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  ambientVolume: number; // 0..1
  cameraSensitivity: number; // 0.5..2.0
  showMobileControls: boolean;
}

export interface LiveTelemetry {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speedKmh: number;
  altitude: number;
  gear: string;
  inVehicle: boolean;
  vehicleClass: VehicleClass | 'foot';
  vehicleName: string;
  vehicleHealth: number;
  vehicleNitro: number;
  vehicleFuel: number;
  headlightsOn: boolean;
  turnSignal: -1 | 0 | 1;
  isCrouching: boolean;
  isFlying: boolean;
  inWater: boolean;
  district: string;
  taxiFareActive: boolean;
  taxiFareTarget: { x: number; z: number; label: string } | null;
  nearbyPrompt: {
    key: string;
    label: string;
    actionType:
      | 'vehicle'
      | 'garage'
      | 'gas_station'
      | 'mission'
      | 'shop'
      | 'atm'
      | 'property'
      | 'hospital'
      | 'safehouse';
    targetId: string;
  } | null;
  policePositions: Array<{ x: number; z: number }>;
  trafficPositions: Array<{ x: number; z: number }>;
}

export interface SaveDataV1 {
  version: 1;
  savedAt: string;
  activeCharacterId: CharacterId;
  playerPos: Vec3Tuple;
  playerRotY: number;
  health: number;
  armor: number;
  stamina: number;
  money: number;
  bankBalance: number;
  outfitId: string;
  ownedVehicleIds: string[];
  vehicleColors: Record<string, string>;
  activeVehicleSpecId: string;
  ownedProperties: string[];
  unlockedWeapons: WeaponId[];
  weaponAmmo: Record<WeaponId, number>;
  completedMissionIds: string[];
  activeMissionId: string | null;
  activeMissionStepIndex: number;
  inventory: Record<string, number>;
  timeOfDay: number; // 0..24
  weather: WeatherType;
  settings: GameSettings;
}
