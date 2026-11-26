import { CITY_BUILDINGS, ROAD_CENTERS, WORLD_HALF_SIZE } from './gameConfig';
import type { BuildingCollider } from '../types/game';

export interface CircleCollisionResult {
  x: number;
  z: number;
  hit: boolean;
  impactStrength: number;
}

export function getGroundHeightAt(x: number, z: number): number {
  // Solaris Main Ocean Pier deck
  if (Math.abs(x) <= 7 && z >= 186 && z <= 264) {
    return 1.35;
  }
  // Solaris Marina Finger Pier (x: 118 +/- 6, z: 186..238)
  if (Math.abs(x - 118) <= 5.5 && z >= 186 && z <= 238) {
    return 1.05;
  }
  // Sandy beach sloping gently down toward ocean
  if (z > 186) {
    const t = Math.min(1, (z - 186) / 38);
    return -t * 0.65;
  }
  // Northern Solaris Hills & Redwood Trail
  if (z < -188) {
    const t = Math.min(1, (-188 - z) / 65);
    return Math.sin(x * 0.04) * 1.4 * t + t * 2.4;
  }
  // Far-East Badlands Desert gentle dunes
  if (x > 195 && z > -188 && z <= 186) {
    const t = Math.min(1, (x - 195) / 60);
    return (Math.sin(z * 0.06) * 0.9 + 0.8) * t;
  }
  return 0;
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
  const maxZ = opts.isBoat || opts.isAircraft ? 310 : onPier ? 261 : opts.allowWater ? 265 : 216;
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
