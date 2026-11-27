import { CITY_BUILDINGS, ROAD_CENTERS, WORLD_HALF_SIZE } from './gameConfig';
import type { BuildingCollider } from '../types/game';

export interface CircleCollisionResult {
  x: number;
  z: number;
  hit: boolean;
  impactStrength: number;
}

export function getNorthernHillsElevation(x: number, z: number): number {
  const tNorth = z < -220 ? Math.min(1, (-220 - z) / 36) : 0;
  const tNW =
    x < -172 && z < -108
      ? Math.min(1, (-172 - x) / 28) * Math.min(1, (-108 - z) / 24)
      : 0;
  const blend = Math.max(tNorth, tNW);
  if (blend <= 0.001) return 0;

  const wave =
    Math.sin(x * 0.042) * Math.cos(z * 0.038) * 5.2 +
    Math.sin(x * 0.09 - z * 0.07) * 2.4 +
    Math.cos(x * 0.022 + z * 0.025) * 3.8 +
    6.5;
  return Math.max(0, wave * blend);
}

function getBuildingRoofSurfaceAt(b: BuildingCollider, x: number, z: number): number | null {
  const dx = Math.abs(x - b.x);
  const dz = Math.abs(z - b.z);
  const hw = b.width * 0.5;
  const hd = b.depth * 0.5;
  if (dx > hw + 0.15 || dz > hd + 0.15) return null;

  if (b.kind === 'skyscraper') {
    const podiumH = Math.min(8.5, b.height * 0.22);
    const isRounded = b.id === 'dt_ne_2' || b.id === 'dt_sw_3';
    if (isRounded) {
      return dx <= hw * 0.92 && dz <= hd * 0.92 ? b.height : podiumH;
    }
    const tier1Top = podiumH + (b.height - podiumH) * 0.62;
    if (dx <= b.width * 0.37 && dz <= b.depth * 0.37) return b.height;
    if (dx <= b.width * 0.46 && dz <= b.depth * 0.46) return tier1Top;
    return podiumH;
  }

  if (b.kind === 'residential') return b.height + 0.85;
  if (b.kind === 'mall' || b.kind === 'warehouse') return b.height + 0.6;
  if (b.kind === 'diner') return b.height + 0.35;
  if (b.kind === 'gas_station') return x < b.x ? b.height : 4.98;
  if (b.kind === 'sage_colonial') {
    const eaveH = 7.25;
    const peakH = 11.1;
    const slope = Math.max(0, 1 - dz / Math.max(0.5, hd));
    return eaveH + slope * (peakH - eaveH);
  }
  if (b.kind === 'colonial_house') {
    const slope = Math.max(0, 1 - dx / Math.max(0.5, hw));
    return 6.6 + slope * 3.9;
  }
  if (b.kind === 'barn') {
    const slope = Math.max(0, 1 - dx / Math.max(0.5, hw));
    return 6.75 + slope * 4.8;
  }
  if (b.kind === 'gothic_church') {
    const slope = Math.max(0, 1 - dz / Math.max(0.5, hd));
    return 9.2 + slope * 5.2;
  }
  return b.height;
}

export function getGroundHeightAt(x: number, z: number, currentY?: number): number {
  let h = 0;

  // Solaris Main Ocean Pier deck
  if (Math.abs(x) <= 7 && z >= 186 && z <= 264) {
    h = 1.35;
  } else if (Math.abs(x - 118) <= 5.5 && z >= 186 && z <= 238) {
    // Solaris Marina Finger Pier
    h = 1.05;
  } else if (z > 186) {
    // Sandy beach sloping gently down toward ocean
    const t = Math.min(1, (z - 186) / 38);
    h = -t * 0.65;
  } else if (z < -218 || (x < -172 && z < -108)) {
    // Lush Rolling Northern Green Hills & NW Highlands
    h = getNorthernHillsElevation(x, z);
  } else if (x > 195 && z > -188 && z <= 186) {
    // Graded flat compound inside Fort Solaris Army Camp; gentle dunes elsewhere
    if (x >= 188 && x <= 272 && z >= -160 && z <= -72) {
      h = 0;
    } else {
      const t = Math.min(1, (x - 195) / 60);
      h = (Math.sin(z * 0.06) * 0.9 + 0.8) * t;
    }
  }

  // Standable Building Rooftops & Terraces + Offshore TEN Oil Tanker Deck
  if (currentY !== undefined) {
    for (let i = 0; i < CITY_BUILDINGS.length; i++) {
      const surfaceY = getBuildingRoofSurfaceAt(CITY_BUILDINGS[i], x, z);
      if (surfaceY !== null && currentY >= surfaceY - 1.55) {
        if (surfaceY > h) h = surfaceY;
      }
    }

    // Offshore TEN Cargo Oil Tanker main deck (centered at x: -78, z: 274, 68m x 14.4m)
    if (Math.abs(x + 78) <= 32 && Math.abs(z - 274) <= 6.8 && currentY >= 4.4) {
      const tankerDeckY = Math.abs(x + 78 - -20) <= 6 ? 11.8 : 5.85;
      if (currentY >= tankerDeckY - 1.55 && tankerDeckY > h) {
        h = tankerDeckY;
      }
    }
  }

  return h;
}

function resolveBoxVsCircle(
  x: number,
  z: number,
  radius: number,
  bx: number,
  bz: number,
  halfW: number,
  halfD: number
): { x: number; z: number; hit: boolean; pen: number } {
  const closestX = Math.max(bx - halfW, Math.min(x, bx + halfW));
  const closestZ = Math.max(bz - halfD, Math.min(z, bz + halfD));
  const dx = x - closestX;
  const dz = z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) {
    return { x, z, hit: false, pen: 0 };
  }

  const dist = Math.sqrt(distSq);
  if (dist > 0.0001) {
    const pen = radius - dist;
    return {
      x: x + (dx / dist) * pen,
      z: z + (dz / dist) * pen,
      hit: true,
      pen,
    };
  }

  const penLeft = Math.abs(x - (bx - halfW));
  const penRight = Math.abs(bx + halfW - x);
  const penTop = Math.abs(z - (bz - halfD));
  const penBot = Math.abs(bz + halfD - z);
  const minPen = Math.min(penLeft, penRight, penTop, penBot);
  if (minPen === penLeft) return { x: bx - halfW - radius, z, hit: true, pen: radius };
  if (minPen === penRight) return { x: bx + halfW + radius, z, hit: true, pen: radius };
  if (minPen === penTop) return { x, z: bz - halfD - radius, hit: true, pen: radius };
  return { x, z: bz + halfD + radius, hit: true, pen: radius };
}

export interface CollisionOptions {
  allowWater?: boolean;
  isBoat?: boolean;
  isAircraft?: boolean;
  currentY?: number;
  extraBoxes?: Array<{ x: number; z: number; halfW: number; halfD: number }>;
}

export function resolveCircleWorldCollision(
  nextX: number,
  nextZ: number,
  radius: number,
  opts: CollisionOptions = {}
): CircleCollisionResult {
  let x = nextX;
  let z = nextZ;
  let hit = false;
  let maxPenetration = 0;

  const onPier =
    (Math.abs(x) <= 6.2 && z >= 184 && z <= 262) ||
    (Math.abs(x - 118) <= 5.0 && z >= 184 && z <= 236);

  const minZ = -WORLD_HALF_SIZE + radius;
  const airborneHigh = opts.isAircraft || (opts.currentY !== undefined && opts.currentY > 2.2);
  const maxZ = opts.isBoat || airborneHigh ? 310 : onPier ? 261 : opts.allowWater ? 265 : 216;
  const boatMinZ = opts.isBoat ? 210 : minZ;

  if (x < -WORLD_HALF_SIZE + radius) {
    x = -WORLD_HALF_SIZE + radius;
    hit = true;
  } else if (x > WORLD_HALF_SIZE - radius) {
    x = WORLD_HALF_SIZE - radius;
    hit = true;
  }
  if (z < boatMinZ) {
    z = boatMinZ;
    hit = true;
  } else if (z > maxZ - radius) {
    z = maxZ - radius;
    hit = true;
  }

  // Aircraft flying high skip ground building AABB collisions
  if (!opts.isAircraft) {
    for (let i = 0; i < CITY_BUILDINGS.length; i++) {
      const b: BuildingCollider = CITY_BUILDINGS[i];
      // Allow character to stand, walk, and land on building rooftops when at/above roof elevation
      const roofAtPos = getBuildingRoofSurfaceAt(b, x, z);
      const effectiveRoofTop = roofAtPos ?? b.height;
      if (opts.currentY !== undefined && opts.currentY >= effectiveRoofTop - 1.35) {
        continue;
      }

      if (b.enterable) {
        // Enterable building (e.g. Sunset Diner): 3 walls + front wall with wide central open doorway (+X side faces road!)
        const hw = b.width * 0.5;
        const hd = b.depth * 0.5;
        const wallT = 0.45;
        const walls: Array<[number, number, number, number]> = [
          [b.x - hw + wallT, b.z, wallT, hd], // back wall (-X)
          [b.x, b.z - hd + wallT, hw, wallT], // north wall (-Z)
          [b.x, b.z + hd - wallT, hw, wallT], // south wall (+Z)
          [b.x + hw - wallT, b.z - hd * 0.62, wallT, hd * 0.38], // front-north (+X)
          [b.x + hw - wallT, b.z + hd * 0.62, wallT, hd * 0.38], // front-south (+X), leaving central 3.8m doorway open!
        ];
        for (const [wx, wz, whw, whd] of walls) {
          const res = resolveBoxVsCircle(x, z, radius, wx, wz, whw, whd);
          if (res.hit) {
            x = res.x;
            z = res.z;
            hit = true;
            maxPenetration = Math.max(maxPenetration, res.pen);
          }
        }
        continue;
      }

      const res = resolveBoxVsCircle(x, z, radius, b.x, b.z, b.width * 0.5, b.depth * 0.5);
      if (res.hit) {
        x = res.x;
        z = res.z;
        hit = true;
        maxPenetration = Math.max(maxPenetration, res.pen);
      }
    }
  }

  if (opts.extraBoxes) {
    for (let i = 0; i < opts.extraBoxes.length; i++) {
      const box = opts.extraBoxes[i];
      const res = resolveBoxVsCircle(x, z, radius, box.x, box.z, box.halfW, box.halfD);
      if (res.hit) {
        x = res.x;
        z = res.z;
        hit = true;
        maxPenetration = Math.max(maxPenetration, res.pen);
      }
    }
  }

  return { x, z, hit, impactStrength: Math.min(1, maxPenetration / Math.max(0.2, radius)) };
}

export function isOnRoad(x: number, z: number): boolean {
  for (let i = 0; i < ROAD_CENTERS.length; i++) {
    const c = ROAD_CENTERS[i];
    if (Math.abs(x - c) <= 8.2 || Math.abs(z - c) <= 8.2) {
      return true;
    }
  }
  return false;
}

export function nearestRoadSnap(x: number, z: number): { x: number; z: number; rotY: number } {
  let bestRoad = ROAD_CENTERS[2];
  let bestDist = Infinity;
  let axis: 'x' | 'z' = 'z';

  for (const c of ROAD_CENTERS) {
    const dx = Math.abs(x - c);
    if (dx < bestDist) {
      bestDist = dx;
      bestRoad = c;
      axis = 'x';
    }
    const dz = Math.abs(z - c);
    if (dz < bestDist) {
      bestDist = dz;
      bestRoad = c;
      axis = 'z';
    }
  }

  if (axis === 'x') {
    return { x: bestRoad + 3.5, z: Math.max(-180, Math.min(180, z)), rotY: 0 };
  }
  return { x: Math.max(-180, Math.min(180, x)), z: bestRoad + 3.5, rotY: Math.PI / 2 };
}
