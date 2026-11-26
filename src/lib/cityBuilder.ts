import * as THREE from 'three';
import {
  CITY_BUILDINGS,
  INTERACTIVE_ZONES,
  ROAD_CENTERS,
  ROAD_WIDTH,
} from './gameConfig';
import {
  createAsphaltTextures,
  createBarnTextures,
  createColonialSidingTextures,
  createDesertSandTexture,
  createGlowSpriteTexture,
  createGrassTexture,
  createInteriorFloorTexture,
  createIntersectionTexture,
  createResidentialTexture,
  createRoofShingleTextures,
  createRunwayTexture,
  createSandTexture,
  createSidewalkTextures,
  createSkyscraperFacadeTextures,
  createWaterNormalMap,
} from './textures';

export interface TrafficLightNode {
  x: number;
  z: number;
  nsRed: THREE.MeshBasicMaterial;
  nsGreen: THREE.MeshBasicMaterial;
  ewRed: THREE.MeshBasicMaterial;
  ewGreen: THREE.MeshBasicMaterial;
}

export interface CityBuildResult {
  cityGroup: THREE.Group;
  oceanMesh: THREE.Mesh;
  waterNormalMap: THREE.CanvasTexture;
  asphaltMaterials: THREE.MeshStandardMaterial[];
  skyscraperMaterials: THREE.MeshStandardMaterial[];
  streetlampBulbMat: THREE.MeshStandardMaterial;
  streetlampSprites: THREE.Sprite[];
  trafficLights: TrafficLightNode[];
  zoneMarkers: Map<string, THREE.Mesh>;
  glowSpriteTex: THREE.CanvasTexture;
  dispose: () => void;
}

export function buildSolarisCity(maxAnisotropy: number): CityBuildResult {
  const cityGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const asphaltPair = createAsphaltTextures(maxAnisotropy);
  const intersectionTex = createIntersectionTexture(maxAnisotropy);
  const sidewalkPair = createSidewalkTextures(maxAnisotropy);
  const grassTex = createGrassTexture(maxAnisotropy);
  const sandTex = createSandTexture(maxAnisotropy);
  const skyDark = createSkyscraperFacadeTextures(maxAnisotropy, '#1e293b', 'dark_glass');
  const skyTerra = createSkyscraperFacadeTextures(maxAnisotropy, '#7c3f34', 'terracotta');
  const skyStripe = createSkyscraperFacadeTextures(maxAnisotropy, '#e2e5ea', 'modern_stripe');
  const skyLime = createSkyscraperFacadeTextures(maxAnisotropy, '#cbc6bc', 'limestone_classic');
  const skyPacks = [skyDark, skyLime, skyStripe, skyTerra];
  const resTex = createResidentialTexture(maxAnisotropy, '#78716c');
  const colonialSiding = createColonialSidingTextures(maxAnisotropy);
  const roofShingle = createRoofShingleTextures(maxAnisotropy);
  const barnSiding = createBarnTextures(maxAnisotropy);
  const waterNormalMap = createWaterNormalMap(maxAnisotropy);
  const glowSpriteTex = createGlowSpriteTexture();
  const runwayTex = createRunwayTexture(maxAnisotropy);
  const interiorFloorTex = createInteriorFloorTexture(maxAnisotropy);
  const desertSandTex = createDesertSandTexture(maxAnisotropy);

  disposables.push(
    asphaltPair.map,
    asphaltPair.normalMap,
    intersectionTex,
    sidewalkPair.map,
    sidewalkPair.normalMap,
    grassTex,
    sandTex,
    ...skyPacks.flatMap((p) => [p.dayMap, p.nightMap, p.normalMap]),
    resTex,
    colonialSiding.map,
    colonialSiding.normalMap,
    roofShingle.map,
    roofShingle.normalMap,
    barnSiding.map,
    barnSiding.normalMap,
    waterNormalMap,
    glowSpriteTex,
    runwayTex,
    interiorFloorTex,
    desertSandTex
  );

  // 1. Extended Base Terrain
  const baseTerrainMat = new THREE.MeshStandardMaterial({
    color: '#2b3b2e',
    roughness: 0.95,
    metalness: 0.0,
  });
  const baseTerrainGeo = new THREE.PlaneGeometry(1150, 1150);
  const baseTerrain = new THREE.Mesh(baseTerrainGeo, baseTerrainMat);
  baseTerrain.rotation.x = -Math.PI / 2;
  baseTerrain.position.y = -0.06;
  baseTerrain.receiveShadow = true;
  cityGroup.add(baseTerrain);
  disposables.push(baseTerrainGeo, baseTerrainMat);

  // 2. Normal-Mapped Urban Sidewalk Slab
  const urbanSlabGeo = new THREE.PlaneGeometry(420, 380);
  const urbanSlabMat = new THREE.MeshStandardMaterial({
    map: sidewalkPair.map,
    normalMap: sidewalkPair.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.88,
    metalness: 0.04,
  });
  const urbanSlab = new THREE.Mesh(urbanSlabGeo, urbanSlabMat);
  urbanSlab.rotation.x = -Math.PI / 2;
  urbanSlab.position.set(0, 0.0, -2);
  urbanSlab.receiveShadow = true;
  cityGroup.add(urbanSlab);
  disposables.push(urbanSlabGeo, urbanSlabMat);

  // 3. Raised Sidewalk Block Curbs (creates tangible height separation from roads)
  const blockCenters = [-120, -40, 40, 120];
  const blockCurbGeo = new THREE.BoxGeometry(58, 0.14, 58);
  const blockCurbMat = new THREE.MeshStandardMaterial({
    map: sidewalkPair.map,
    normalMap: sidewalkPair.normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    color: '#d4d4d8',
    roughness: 0.85,
  });
  disposables.push(blockCurbGeo, blockCurbMat);
  const suburbanGrassGeo = new THREE.PlaneGeometry(58, 58);
  const suburbanGrassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92 });
  disposables.push(suburbanGrassGeo, suburbanGrassMat);

  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      // Skip Emerald Park block [120, 40] which gets lush grass turf
      if (bx === 120 && bz === 40) continue;
      // Suburban & Homestead blocks get manicured green lawns instead of concrete
      if ((bz === -120 && bx <= 40) || (bx === 120 && bz === -40)) {
        const lawn = new THREE.Mesh(suburbanGrassGeo, suburbanGrassMat);
        lawn.rotation.x = -Math.PI / 2;
        lawn.position.set(bx, 0.05, bz);
        lawn.receiveShadow = true;
        cityGroup.add(lawn);
        continue;
      }
      const slab = new THREE.Mesh(blockCurbGeo, blockCurbMat);
      slab.position.set(bx, 0.04, bz);
      slab.receiveShadow = true;
      cityGroup.add(slab);
    }
  }

  // 4. Normal-Mapped Asphalt Road Grid + Crosswalk Intersections (wet-road capable!)
  const asphaltNSMap = asphaltPair.map.clone();
  asphaltNSMap.repeat.set(1, 22);
  asphaltNSMap.needsUpdate = true;
  const asphaltNSNorm = asphaltPair.normalMap.clone();
  asphaltNSNorm.repeat.set(1, 22);
  asphaltNSNorm.needsUpdate = true;

  const asphaltEWMap = asphaltPair.map.clone();
  asphaltEWMap.repeat.set(1, 22);
  asphaltEWMap.needsUpdate = true;
  const asphaltEWNorm = asphaltPair.normalMap.clone();
  asphaltEWNorm.repeat.set(1, 22);
  asphaltEWNorm.needsUpdate = true;

  const asphaltMatNS = new THREE.MeshStandardMaterial({
    map: asphaltNSMap,
    normalMap: asphaltNSNorm,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.82,
    metalness: 0.08,
    envMapIntensity: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const asphaltMatEW = new THREE.MeshStandardMaterial({
    map: asphaltEWMap,
    normalMap: asphaltEWNorm,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.82,
    metalness: 0.08,
    envMapIntensity: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const junctionMat = new THREE.MeshStandardMaterial({
    map: intersectionTex,
    normalMap: asphaltPair.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.82,
    metalness: 0.08,
    envMapIntensity: 0.85,
  });

  const asphaltMaterials = [asphaltMatNS, asphaltMatEW, junctionMat];
  disposables.push(
    asphaltNSMap,
    asphaltNSNorm,
    asphaltEWMap,
    asphaltEWNorm,
    asphaltMatNS,
    asphaltMatEW,
    junctionMat
  );

  const roadNSGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 390);
  const roadEWGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 420);
  const junctionGeo = new THREE.PlaneGeometry(ROAD_WIDTH + 0.4, ROAD_WIDTH + 0.4);
  disposables.push(roadNSGeo, roadEWGeo, junctionGeo);

  for (const cx of ROAD_CENTERS) {
    const roadNS = new THREE.Mesh(roadNSGeo, asphaltMatNS);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.set(cx, 0.02, -6);
    roadNS.receiveShadow = true;
    cityGroup.add(roadNS);
  }

  for (const cz of ROAD_CENTERS) {
    const roadEW = new THREE.Mesh(roadEWGeo, asphaltMatEW);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.rotation.z = Math.PI / 2;
    roadEW.position.set(0, 0.028, cz);
    roadEW.receiveShadow = true;
    cityGroup.add(roadEW);
  }

  for (const cx of ROAD_CENTERS) {
    for (const cz of ROAD_CENTERS) {
      const j = new THREE.Mesh(junctionGeo, junctionMat);
      j.rotation.x = -Math.PI / 2;
      j.position.set(cx, 0.038, cz);
      j.receiveShadow = true;
      cityGroup.add(j);
    }
  }

  // 5. Emerald Park Turf, Paths & Fountain
  const parkGeo = new THREE.PlaneGeometry(58, 58);
  const parkMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92 });
  const parkMesh = new THREE.Mesh(parkGeo, parkMat);
  parkMesh.rotation.x = -Math.PI / 2;
  parkMesh.position.set(120, 0.05, 40);
  parkMesh.receiveShadow = true;
  cityGroup.add(parkMesh);
  disposables.push(parkGeo, parkMat);

  const fountainRim = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 6.2, 0.6, 28),
    new THREE.MeshStandardMaterial({ color: '#e4e4e7', roughness: 0.45 })
  );
  fountainRim.position.set(120, 0.3, 26);
  const fountainWater = new THREE.Mesh(
    new THREE.CylinderGeometry(4.9, 4.9, 0.45, 28),
    new THREE.MeshPhysicalMaterial({
      color: '#0284c7',
      normalMap: waterNormalMap,
      roughness: 0.08,
      clearcoat: 1.0,
    })
  );
  fountainWater.position.set(120, 0.38, 26);
  const fountainSpire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.85, 2.4, 16),
    new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.4 })
  );
  fountainSpire.position.set(120, 1.2, 26);
  cityGroup.add(fountainRim, fountainWater, fountainSpire);

  // 6. Golden Beach, Shoreline Foam & Normal-Mapped Pacific Ocean
  const beachGeo = new THREE.PlaneGeometry(780, 75);
  const beachMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.94 });
  const beach = new THREE.Mesh(beachGeo, beachMat);
  beach.rotation.x = -Math.PI / 2 + 0.017;
  beach.position.set(0, -0.32, 222);
  beach.receiveShadow = true;
  cityGroup.add(beach);
  disposables.push(beachGeo, beachMat);

  const foamStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(780, 3.2),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.42 })
  );
  foamStrip.rotation.x = -Math.PI / 2;
  foamStrip.position.set(0, -0.42, 217.5);
  cityGroup.add(foamStrip);

  const oceanGeo = new THREE.PlaneGeometry(1150, 440, 24, 12);
  const oceanMat = new THREE.MeshPhysicalMaterial({
    color: '#0369a1',
    normalMap: waterNormalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.08,
    metalness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(0, -0.45, 435);
  cityGroup.add(oceanMesh);
  disposables.push(oceanGeo, oceanMat);

  // Solaris Ocean Pier + Wooden Guardrails
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78553a', roughness: 0.85 });
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 78), woodMat);
  pierDeck.position.set(0, 1.18, 225);
  pierDeck.castShadow = true;
  pierDeck.receiveShadow = true;
  cityGroup.add(pierDeck);

  const pierRamp = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 10), woodMat);
  pierRamp.position.set(0, 0.62, 182);
  pierRamp.rotation.x = -0.13;
  cityGroup.add(pierRamp);

  // Guardrails along pier
  for (const rx of [-5.7, 5.7]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 76), woodMat);
    rail.position.set(rx, 2.15, 225);
    cityGroup.add(rail);
  }
  const pilingGeo = new THREE.CylinderGeometry(0.28, 0.32, 3.6, 8);
  for (let pz = 192; pz <= 262; pz += 14) {
    for (const px of [-5.4, 5.4]) {
      const p = new THREE.Mesh(pilingGeo, woodMat);
      p.position.set(px, 0.55, pz);
      cityGroup.add(p);
    }
  }

  const archMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#f59e0b',
    emissiveIntensity: 0.9,
  });
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.7, 0.6), archMat);
  archBeam.position.set(0, 5.2, 188);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), woodMat);
  archL.position.set(-5.8, 3.1, 188);
  const archR = archL.clone();
  archR.position.x = 5.8;
  cityGroup.add(archBeam, archL, archR);

  // 7. Rugged Snow-Capped Mountain Range Backdrop & Coastal Seawall + Overpass
  const seawallL = new THREE.Mesh(
    new THREE.BoxGeometry(195, 0.7, 1.4),
    new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.75 })
  );
  seawallL.position.set(-106, 0.25, 186);
  const seawallR = seawallL.clone();
  seawallR.position.x = 106;
  cityGroup.add(seawallL, seawallR);

  const mtnGeo = new THREE.PlaneGeometry(920, 260, 76, 26);
  mtnGeo.rotateX(-Math.PI / 2);
  const mtnPos = mtnGeo.attributes.position as THREE.BufferAttribute;
  const mtnColors = new Float32Array(mtnPos.count * 3);
  const cValley = new THREE.Color('#2d4a34');
  const cRock = new THREE.Color('#575b66');
  const cSnow = new THREE.Color('#f1f5f9');
  const cTmp = new THREE.Color();

  for (let i = 0; i < mtnPos.count; i++) {
    const mx = mtnPos.getX(i);
    const mz = mtnPos.getZ(i);
    const distEdge = Math.min(1, Math.max(0, (130 - Math.abs(mz)) / 95));
    const ridge1 = Math.abs(Math.sin(mx * 0.015 + mz * 0.01));
    const ridge2 = Math.abs(Math.cos(mx * 0.032 - mz * 0.025));
    const ridge3 = Math.sin(mx * 0.068 + mz * 0.05) * 0.5 + 0.5;
    const elev = Math.max(0, (ridge1 * 48 + ridge2 * 26 + ridge3 * 12) * distEdge - 3);
    mtnPos.setY(i, elev);

    if (elev > 44) {
      cTmp.copy(cRock).lerp(cSnow, Math.min(1, (elev - 44) / 14));
    } else if (elev > 14) {
      cTmp.copy(cValley).lerp(cRock, Math.min(1, (elev - 14) / 22));
    } else {
      cTmp.copy(cValley);
    }
    mtnColors[i * 3] = cTmp.r;
    mtnColors[i * 3 + 1] = cTmp.g;
    mtnColors[i * 3 + 2] = cTmp.b;
  }
  mtnGeo.setAttribute('color', new THREE.BufferAttribute(mtnColors, 3));
  mtnGeo.computeVertexNormals();
  const mtnMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.04,
  });
  const mountainRange = new THREE.Mesh(mtnGeo, mtnMat);
  mountainRange.position.set(0, -0.5, -355);
  cityGroup.add(mountainRange);
  disposables.push(mtnGeo, mtnMat);

  const bridgeDeck = new THREE.Mesh(
    new THREE.BoxGeometry(440, 1.2, 14),
    new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.78 })
  );
  bridgeDeck.position.set(0, 8.5, -205);
  bridgeDeck.castShadow = true;
  cityGroup.add(bridgeDeck);
  for (let bx = -180; bx <= 180; bx += 60) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 8.5, 2.4),
      new THREE.MeshStandardMaterial({ color: '#52525b', roughness: 0.85 })
    );
    pillar.position.set(bx, 4.25, -205);
    cityGroup.add(pillar);
  }

  // 8. Harbor Shipping Containers & Gantry Detail
  const containerColors = ['#b91c1c', '#1d4ed8', '#d97706', '#047857'];
  const containerCoords: Array<[number, number, number]> = [
    [-142, 150, 0],
    [-130, 150, 0],
    [-136, 150, 2.7],
    [-72, 150, 0],
  ];
  containerCoords.forEach(([cx, cz, cy], idx) => {
    const cont = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 2.6, 2.6),
      new THREE.MeshStandardMaterial({
        color: containerColors[idx % containerColors.length],
        roughness: 0.62,
        metalness: 0.35,
      })
    );
    cont.position.set(cx, 1.3 + cy, cz);
    cont.castShadow = true;
    cityGroup.add(cont);
  });

  // 9. Composite Architecture with Curtain-Wall Normal Maps & Rooftop Detail
  const skyscraperMaterials: THREE.MeshStandardMaterial[] = [];
  const trimMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.45, metalness: 0.45 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.82 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: '#fbbf24',
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.3,
  });

  let skyIdx = 0;
  for (const b of CITY_BUILDINGS) {
    const bGroup = new THREE.Group();
    bGroup.position.set(b.x, 0, b.z);

    if (b.kind === 'skyscraper') {
      const pack = skyPacks[skyIdx % skyPacks.length];
      const isLimestone = skyIdx % skyPacks.length === 1;
      const isRounded = b.id === 'dt_ne_2' || b.id === 'dt_sw_3';
      skyIdx++;

      const mat = new THREE.MeshStandardMaterial({
        map: pack.dayMap,
        normalMap: pack.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        emissiveMap: pack.nightMap,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.0,
        roughness: isLimestone ? 0.62 : 0.22,
        metalness: isLimestone ? 0.12 : 0.6,
        envMapIntensity: 1.4,
      });
      skyscraperMaterials.push(mat);

      const podiumH = Math.min(6.4, b.height * 0.16);
      const podium = new THREE.Mesh(new THREE.BoxGeometry(b.width, podiumH, b.depth), trimMat);
      podium.position.y = podiumH * 0.5;
      podium.castShadow = true;
      podium.receiveShadow = true;
      bGroup.add(podium);

      // Warm Ground-Floor Lobby Glazing Band
      const lobbyGlass = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 0.12, 2.8, b.depth + 0.12),
        lobbyMat
      );
      lobbyGlass.position.y = 2.0;
      bGroup.add(lobbyGlass);

      // Multi-Tiered Stepped Architectural Massing (or Sculpted Cylindrical Mid-Rise)
      const remainingH = b.height - podiumH;
      if (isRounded) {
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(b.width * 0.46, b.width * 0.48, remainingH, 24),
          mat
        );
        cyl.position.y = podiumH + remainingH * 0.5;
        cyl.castShadow = true;
        cyl.receiveShadow = true;
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(b.width * 0.34, b.width * 0.36, 2.6, 20),
          roofMat
        );
        cap.position.y = b.height + 1.3;
        bGroup.add(cyl, cap);
      } else {
        const tier1H = remainingH * 0.62;
        const tier2H = remainingH * 0.38;

        const tier1 = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.92, tier1H, b.depth * 0.92),
          mat
        );
        tier1.position.y = podiumH + tier1H * 0.5;
        tier1.castShadow = true;
        tier1.receiveShadow = true;
        bGroup.add(tier1);

        // Setback Ledge Trim between Tiers
        const ledge1 = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.95, 0.55, b.depth * 0.95),
          roofMat
        );
        ledge1.position.y = podiumH + tier1H;
        bGroup.add(ledge1);

        const tier2 = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.74, tier2H, b.depth * 0.74),
          mat
        );
        tier2.position.y = podiumH + tier1H + tier2H * 0.5;
        tier2.castShadow = true;
        tier2.receiveShadow = true;
        bGroup.add(tier2);

        // Crown Mechanical Penthouse + Rooftop HVAC Units
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.48, 3.8, b.depth * 0.48),
          roofMat
        );
        crown.position.y = b.height + 1.9;
        const hvac = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.22, 1.5, b.depth * 0.22),
          trimMat
        );
        hvac.position.set(b.width * 0.22, b.height + 0.75, -b.depth * 0.2);
        const ventBox = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.1, 1.8, 10),
          trimMat
        );
        ventBox.position.set(-b.width * 0.24, b.height + 0.9, b.depth * 0.22);
        bGroup.add(crown, hvac, ventBox);
      }

      if (b.height > 58) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.48, 12, 8), trimMat);
        spire.position.y = b.height + 9.2;
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 8, 8),
          new THREE.MeshBasicMaterial({ color: '#ef4444' })
        );
        beacon.position.y = b.height + 15.4;
        bGroup.add(spire, beacon);
      }
    } else if (b.kind === 'gas_station') {
      const shop = new THREE.Mesh(
        new THREE.BoxGeometry(b.width * 0.5, b.height, b.depth * 0.7),
        new THREE.MeshStandardMaterial({ color: '#e4e4e7', roughness: 0.55 })
      );
      shop.position.set(-b.width * 0.22, b.height * 0.5, 0);
      shop.castShadow = true;
      bGroup.add(shop);

      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(b.width * 0.58, 0.75, b.depth),
        new THREE.MeshStandardMaterial({
          color: '#0284c7',
          emissive: '#0284c7',
          emissiveIntensity: 0.3,
          roughness: 0.3,
        })
      );
      canopy.position.set(b.width * 0.26, 4.6, 0);
      canopy.castShadow = true;
      bGroup.add(canopy);

      const pumpMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.38 });
      for (const pz of [-2.8, 2.8]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 0.4), trimMat);
        pillar.position.set(b.width * 0.26, 2.2, pz);
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.6), pumpMat);
        pump.position.set(b.width * 0.26 + 0.9, 0.75, pz);
        bGroup.add(pillar, pump);
      }
    } else if (b.kind === 'garage') {
      const shell = new THREE.Mesh(
        new THREE.BoxGeometry(b.width, b.height, b.depth),
        new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.68, metalness: 0.25 })
      );
      shell.position.y = b.height * 0.5;
      shell.castShadow = true;
      bGroup.add(shell);

      const bayDoor = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 4.8, 8.5),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.38, metalness: 0.5 })
      );
      bayDoor.position.set(b.width * 0.5 + 0.05, 2.4, 0);
      const neonStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.52, 11),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 1.0 })
      );
      neonStrip.position.set(b.width * 0.5 + 0.1, 6.2, 0);
      bGroup.add(bayDoor, neonStrip);
    } else if (b.kind === 'police') {
      const hq = new THREE.Mesh(
        new THREE.BoxGeometry(b.width, b.height, b.depth),
        new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.5 })
      );
      hq.position.y = b.height * 0.5;
      hq.castShadow = true;
      const blueBand = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 0.22, 1.4, b.depth + 0.22),
        new THREE.MeshStandardMaterial({ color: '#1d4ed8', emissive: '#2563eb', emissiveIntensity: 0.55 })
      );
      blueBand.position.y = b.height - 1.5;
      bGroup.add(hq, blueBand);
    } else if (b.kind === 'colonial_house') {
      const sidingMat = new THREE.MeshStandardMaterial({
        map: colonialSiding.map,
        normalMap: colonialSiding.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        color: b.color ?? '#c8c0b4',
        roughness: 0.78,
      });
      const shingleMat = new THREE.MeshStandardMaterial({
        map: roofShingle.map,
        normalMap: roofShingle.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.85,
      });
      const whiteWoodMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.6 });
      const shutterMat = new THREE.MeshStandardMaterial({ color: '#172554', roughness: 0.55 });
      const windowGlassMat = new THREE.MeshPhysicalMaterial({
        color: '#0f172a',
        roughness: 0.08,
        clearcoat: 1.0,
      });

      // Main Two-Story Body + Pitched Gable Roof
      const mainW = 14.5;
      const mainH = 6.6;
      const mainD = 10.5;
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), sidingMat);
      mainBody.position.set(-2.5, mainH * 0.5, -1.2);
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      bGroup.add(mainBody);

      const gableShape = new THREE.Shape();
      gableShape.moveTo(-mainW * 0.54, 0);
      gableShape.lineTo(mainW * 0.54, 0);
      gableShape.lineTo(0, 4.2);
      gableShape.closePath();
      const mainRoofGeo = new THREE.ExtrudeGeometry(gableShape, { depth: mainD + 0.9, bevelEnabled: false });
      mainRoofGeo.translate(0, 0, -(mainD + 0.9) * 0.5);
      const mainRoof = new THREE.Mesh(mainRoofGeo, shingleMat);
      mainRoof.position.set(-2.5, mainH, -1.2);
      mainRoof.castShadow = true;
      bGroup.add(mainRoof);

      // Attached Side Two-Car Garage Wing + Navy Paneled Door
      const garW = 7.8;
      const garH = 5.4;
      const garD = 8.4;
      const garBody = new THREE.Mesh(new THREE.BoxGeometry(garW, garH, garD), sidingMat);
      garBody.position.set(6.8, garH * 0.5, 0.2);
      garBody.castShadow = true;
      bGroup.add(garBody);

      const garGable = new THREE.Shape();
      garGable.moveTo(-garW * 0.55, 0);
      garGable.lineTo(garW * 0.55, 0);
      garGable.lineTo(0, 2.8);
      garGable.closePath();
      const garRoofGeo = new THREE.ExtrudeGeometry(garGable, { depth: garD + 0.8, bevelEnabled: false });
      garRoofGeo.translate(0, 0, -(garD + 0.8) * 0.5);
      const garRoof = new THREE.Mesh(garRoofGeo, shingleMat);
      garRoof.position.set(6.8, garH, 0.2);
      garRoof.castShadow = true;
      bGroup.add(garRoof);

      const garDoor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.6, 0.16), shutterMat);
      garDoor.position.set(6.8, 1.35, 4.44);
      const garFrame = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 0.1), whiteWoodMat);
      garFrame.position.set(6.8, 1.4, 4.4);
      bGroup.add(garFrame, garDoor);

      // Wrap-Around Front Porch Deck, Sloped Porch Roof, Columns & Balustrades
      const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(mainW + 2.4, 0.42, 3.4), whiteWoodMat);
      porchDeck.position.set(-2.6, 0.21, 5.6);
      const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(mainW + 2.8, 0.35, 3.8), shingleMat);
      porchRoof.position.set(-2.6, 3.45, 5.7);
      porchRoof.rotation.x = 0.22;
      porchRoof.castShadow = true;
      bGroup.add(porchDeck, porchRoof);

      for (let px = -9.4; px <= 4.2; px += 3.4) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.1, 0.22), whiteWoodMat);
        post.position.set(px, 1.75, 7.15);
        bGroup.add(post);
      }
      for (const railX of [-6.0, 0.8]) {
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.1, 0.14), whiteWoodMat);
        topRail.position.set(railX, 1.12, 7.15);
        const botRail = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.08, 0.12), whiteWoodMat);
        botRail.position.set(railX, 0.48, 7.15);
        bGroup.add(topRail, botRail);
      }

      // Shuttered Windows + Front Door + Octagonal Attic Window
      const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 0.14), shutterMat);
      frontDoor.position.set(-2.5, 1.45, 4.08);
      bGroup.add(frontDoor);

      const atticWin = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 8), windowGlassMat);
      atticWin.rotation.x = Math.PI / 2;
      atticWin.position.set(-2.5, mainH + 1.85, 4.15);
      bGroup.add(atticWin);

      const winCoords: Array<[number, number, number]> = [
        [-6.6, 2.0, 4.08], [-4.4, 2.0, 4.08], [0.4, 2.0, 4.08],
        [-6.6, 4.8, 4.08], [-2.5, 4.8, 4.08], [1.4, 4.8, 4.08],
        [5.6, 4.1, 4.42], [8.0, 4.1, 4.42],
      ];
      for (const [wx, wy, wz] of winCoords) {
        const pane = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.12), windowGlassMat);
        pane.position.set(wx, wy, wz);
        const sL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.45, 0.14), shutterMat);
        sL.position.set(wx - 0.78, wy, wz);
        const sR = sL.clone();
        sR.position.x = wx + 0.78;
        bGroup.add(pane, sL, sR);
      }
    } else if (b.kind === 'barn') {
      const barnWallMat = new THREE.MeshStandardMaterial({
        map: barnSiding.map,
        normalMap: barnSiding.normalMap,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.78,
      });
      const metalRoofMat = new THREE.MeshStandardMaterial({
        color: '#9ca3af',
        roughness: 0.42,
        metalness: 0.45,
      });
      const whiteTrimMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.62 });
      const plinthMat = new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.85 });

      const bw = 15.5;
      const bh = 6.2;
      const bd = 18.5;

      // Concrete Foundation Plinth + Main Barn Volume
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.4, 0.55, bd + 0.4), plinthMat);
      plinth.position.set(2.0, 0.275, 0);
      const barnBody = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), barnWallMat);
      barnBody.position.set(2.0, 0.55 + bh * 0.5, 0);
      barnBody.castShadow = true;
      barnBody.receiveShadow = true;
      bGroup.add(plinth, barnBody);

      // Authentic Gambrel Roof (6-point barn profile)
      const gambrel = new THREE.Shape();
      gambrel.moveTo(-bw * 0.55, -0.3);
      gambrel.lineTo(bw * 0.55, -0.3);
      gambrel.lineTo(bw * 0.36, 3.1);
      gambrel.lineTo(0, 4.9);
      gambrel.lineTo(-bw * 0.36, 3.1);
      gambrel.closePath();
      const barnRoofGeo = new THREE.ExtrudeGeometry(gambrel, { depth: bd + 1.2, bevelEnabled: false });
      barnRoofGeo.translate(0, 0, -(bd + 1.2) * 0.5);
      const barnRoof = new THREE.Mesh(barnRoofGeo, metalRoofMat);
      barnRoof.position.set(2.0, 0.55 + bh, 0);
      barnRoof.castShadow = true;
      bGroup.add(barnRoof);

      // Side Lean-To Shed Wing + Sloped Metal Roof
      const shedW = 6.2;
      const shedH = 4.2;
      const shedBody = new THREE.Mesh(new THREE.BoxGeometry(shedW, shedH, bd - 2.0), barnWallMat);
      shedBody.position.set(-bw * 0.5 + 2.0 - shedW * 0.5, 0.55 + shedH * 0.5, 0);
      shedBody.castShadow = true;
      const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(shedW + 0.8, 0.28, bd - 1.2), metalRoofMat);
      shedRoof.position.set(-bw * 0.5 + 2.0 - shedW * 0.5, 0.55 + shedH + 0.55, 0);
      shedRoof.rotation.z = 0.24;
      bGroup.add(shedBody, shedRoof);

      // Signature Rooftop Vented Cupola
      const cupolaBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), barnWallMat);
      cupolaBody.position.set(2.0, 0.55 + bh + 5.4, 0);
      const cupolaRoof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.4, 4), metalRoofMat);
      cupolaRoof.rotation.y = Math.PI / 4;
      cupolaRoof.position.set(2.0, 0.55 + bh + 7.1, 0);
      bGroup.add(cupolaBody, cupolaRoof);

      // White X-Braced Double Barn Doors (Front & Back)
      for (const zDir of [-1, 1]) {
        const doorZ = zDir * (bd * 0.5 + 0.08);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.4, 0.16), whiteTrimMat);
        frame.position.set(2.0, 2.75, doorZ);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(4.3, 4.0, 0.18), barnWallMat);
        inner.position.set(2.0, 2.75, doorZ);
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.0, 0.22), whiteTrimMat);
        divider.position.set(2.0, 2.75, doorZ);
        const loftWin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.18), whiteTrimMat);
        loftWin.position.set(2.0, 0.55 + bh + 2.1, doorZ);
        bGroup.add(frame, inner, divider, loftWin);
        for (const side of [-1, 1]) {
          for (const ang of [0.64, -0.64]) {
            const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.9, 0.22), whiteTrimMat);
            brace.position.set(2.0 + side * 1.05, 2.75, doorZ);
            brace.rotation.z = ang;
            bGroup.add(brace);
          }
        }
      }

      // White Multi-Pane Side Windows
      for (const wz of [-5.2, 0, 5.2]) {
        const winR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 1.3), whiteTrimMat);
        winR.position.set(2.0 + bw * 0.5 + 0.06, 3.2, wz);
        const winL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 1.2), whiteTrimMat);
        winL.position.set(-bw * 0.5 + 2.0 - shedW - 0.06, 2.6, wz);
        bGroup.add(winR, winL);
      }
    } else if (b.kind === 'hospital') {
      const hospMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.45 });
      const hospBody = new THREE.Mesh(new THREE.BoxGeometry(b.width, b.height, b.depth), hospMat);
      hospBody.position.y = b.height * 0.5;
      hospBody.castShadow = true;
      hospBody.receiveShadow = true;

      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(7, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 })
      );
      canopy.position.set(-b.width * 0.5 - 3.2, 4.4, 0);

      // Crimson Medical Cross on Facade
      const crossMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.6 });
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 1.2), crossMat);
      crossV.position.set(-b.width * 0.5 - 0.12, b.height - 4.2, 0);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 4.2), crossMat);
      crossH.position.set(-b.width * 0.5 - 0.12, b.height - 4.2, 0);
      bGroup.add(hospBody, canopy, crossV, crossH);
    } else if (b.kind === 'airport_tower') {
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 3.8, b.height - 5, 10),
        new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.55 })
      );
      shaft.position.y = (b.height - 5) * 0.5;
      shaft.castShadow = true;
      const cab = new THREE.Mesh(
        new THREE.CylinderGeometry(5.8, 4.2, 4.2, 10),
        new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.08, clearcoat: 1.0 })
      );
      cab.position.y = b.height - 2.6;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.8, 10), roofMat);
      cap.position.y = b.height - 0.2;
      const radar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.5), trimMat);
      radar.position.y = b.height + 1.0;
      bGroup.add(shaft, cab, cap, radar);
    } else if (b.kind === 'hangar') {
      const hMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.62, metalness: 0.35 });
      const arch = new THREE.Mesh(
        new THREE.CylinderGeometry(b.width * 0.5, b.width * 0.5, b.depth, 16, 1, false, 0, Math.PI),
        hMat
      );
      arch.rotation.z = Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.y = 0;
      arch.castShadow = true;
      bGroup.add(arch);
    } else if (b.kind === 'diner' && b.enterable) {
      // Enterable Sunset Diner with Checkered Interior Floor, Booths & Service Counter!
      const wallMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.65 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', roughness: 0.2, metalness: 0.85 });
      const boothMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.45 });
      const floorMat = new THREE.MeshStandardMaterial({ map: interiorFloorTex, roughness: 0.45 });

      const hw = b.width * 0.5;
      const hd = b.depth * 0.5;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(b.width - 0.6, b.depth - 0.6), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.08;
      floor.receiveShadow = true;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(b.width + 0.8, 0.7, b.depth + 0.8), roofMat);
      roof.position.y = b.height;
      roof.castShadow = true;

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, b.height, b.depth), wallMat);
      backWall.position.set(-hw + 0.35, b.height * 0.5, 0);
      const northWall = new THREE.Mesh(new THREE.BoxGeometry(b.width, b.height, 0.7), wallMat);
      northWall.position.set(0, b.height * 0.5, -hd + 0.35);
      const southWall = northWall.clone();
      southWall.position.z = hd - 0.35;

      // Front wall split around wide center doorway (+X faces road)
      const frontL = new THREE.Mesh(new THREE.BoxGeometry(0.7, b.height, b.depth * 0.36), wallMat);
      frontL.position.set(hw - 0.35, b.height * 0.5, -hd * 0.64);
      const frontR = frontL.clone();
      frontR.position.z = hd * 0.64;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, b.depth * 0.32), wallMat);
      lintel.position.set(hw - 0.35, b.height - 0.9, 0);

      // Interior Diner Counter + Stools + Booth Tables
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, b.depth * 0.65), chromeMat);
      counter.position.set(-hw + 3.4, 0.55, 0);
      bGroup.add(floor, roof, backWall, northWall, southWall, frontL, frontR, lintel, counter);

      for (const bz of [-4.2, 4.2]) {
        const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.4), chromeMat);
        table.position.set(2.2, 0.45, bz);
        const seat1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.65), boothMat);
        seat1.position.set(2.2, 0.45, bz - 1.15);
        const seat2 = seat1.clone();
        seat2.position.z = bz + 1.15;
        bGroup.add(table, seat1, seat2);
      }

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.15, b.width * 0.55),
        new THREE.MeshStandardMaterial({
          color: '#ef4444',
          emissive: '#ef4444',
          emissiveIntensity: 1.0,
        })
      );
      sign.position.set(hw + 0.2, b.height + 0.95, 0);
      bGroup.add(sign);
    } else {
      const mat = new THREE.MeshStandardMaterial({
        map: b.kind === 'residential' ? resTex : undefined,
        color: b.color ?? '#64748b',
        roughness: b.kind === 'mall' ? 0.4 : 0.76,
        metalness: b.kind === 'mall' ? 0.28 : 0.08,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(b.width, b.height, b.depth), mat);
      body.position.y = b.height * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(b.width + 0.5, 0.7, b.depth + 0.5), roofMat);
      roofTrim.position.y = b.height + 0.25;
      bGroup.add(roofTrim);

      if (b.kind === 'residential' || b.kind === 'mall' || b.kind === 'warehouse') {
        const roofHvac = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 2.2), trimMat);
        roofHvac.position.set(b.width * 0.22, b.height + 1.2, -b.depth * 0.18);
        const roofTank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 10), roofMat);
        roofTank.position.set(-b.width * 0.22, b.height + 1.65, b.depth * 0.18);
        bGroup.add(roofHvac, roofTank);
      }

      if (b.kind === 'diner' || b.kind === 'mall') {
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 0.65, 1.2, 0.4),
          new THREE.MeshStandardMaterial({
            color: b.kind === 'diner' ? '#ef4444' : '#06b6d4',
            emissive: b.kind === 'diner' ? '#ef4444' : '#06b6d4',
            emissiveIntensity: 0.9,
          })
        );
        sign.position.set(0, b.height * 0.75, b.depth * 0.5 + 0.25);
        bGroup.add(sign);
      }
    }

    cityGroup.add(bGroup);
  }

  // 10. Sculpted Curved Palm Trees (TubeGeometry Trunks + Multi-Frond Crowns)
  const palmPositions: Array<[number, number]> = [];
  for (let x = -200; x <= 200; x += 22) {
    if (Math.abs(x) > 10) palmPositions.push([x, 174]);
  }
  for (let x = -180; x <= 180; x += 34) {
    if (Math.abs(x) > 14) palmPositions.push([x, 195]);
  }

  const palmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.25, 2.8, 0.1),
    new THREE.Vector3(0.6, 5.6, 0.25),
    new THREE.Vector3(0.75, 7.6, 0.3),
  ]);
  const palmTrunkGeo = new THREE.TubeGeometry(palmCurve, 10, 0.24, 7, false);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#78553a', roughness: 0.92 });
  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, trunkMat, palmPositions.length);

  const frondGeo = new THREE.ConeGeometry(0.55, 3.2, 5);
  frondGeo.rotateX(Math.PI * 0.58);
  frondGeo.translate(0, 0, 1.5);
  const frondMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.72 });
  const palmFronds = new THREE.InstancedMesh(frondGeo, frondMat, palmPositions.length * 6);

  const dummy = new THREE.Object3D();
  const colorVar = new THREE.Color();
  let frondIdx = 0;

  palmPositions.forEach(([px, pz], idx) => {
    const scale = 0.88 + ((idx * 17) % 10) * 0.024;
    const rotY = idx * 1.35;
    dummy.position.set(px, 0, pz);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(idx, dummy.matrix);

    // Compute world crown tip offset
    const tipX = px + Math.cos(rotY) * 0.75 * scale + Math.sin(rotY) * 0.3 * scale;
    const tipZ = pz - Math.sin(rotY) * 0.75 * scale + Math.cos(rotY) * 0.3 * scale;
    const tipY = 7.6 * scale;

    for (let f = 0; f < 6; f++) {
      dummy.position.set(tipX, tipY, tipZ);
      dummy.rotation.set(0.12, rotY + (f * Math.PI) / 3, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      palmFronds.setMatrixAt(frondIdx, dummy.matrix);
      colorVar.setHSL(0.31 + ((f + idx) % 4) * 0.015, 0.54, 0.34);
      palmFronds.setColorAt(frondIdx, colorVar);
      frondIdx++;
    }
  });
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmFronds.instanceMatrix.needsUpdate = true;
  if (palmFronds.instanceColor) palmFronds.instanceColor.needsUpdate = true;
  palmTrunks.computeBoundingSphere();
  palmFronds.computeBoundingSphere();
  cityGroup.add(palmTrunks, palmFronds);

  // Park Oak Trees
  const oakPositions: Array<[number, number]> = [
    [98, 18], [142, 18], [98, 58], [142, 58], [105, 38], [135, 38],
  ];
  const oakTrunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.3, 0.45, 3.6, 8),
    trunkMat,
    oakPositions.length
  );
  const oakCanopies = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(2.5, 1),
    new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.82 }),
    oakPositions.length
  );
  oakPositions.forEach(([ox, oz], idx) => {
    dummy.position.set(ox, 1.8, oz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    oakTrunks.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(ox, 4.4, oz);
    dummy.scale.setScalar(0.92 + (idx % 3) * 0.12);
    dummy.updateMatrix();
    oakCanopies.setMatrixAt(idx, dummy.matrix);
  });
  oakTrunks.instanceMatrix.needsUpdate = true;
  oakCanopies.instanceMatrix.needsUpdate = true;
  oakTrunks.computeBoundingSphere();
  oakCanopies.computeBoundingSphere();
  cityGroup.add(oakTrunks, oakCanopies);

  // 10b. Photorealistic Instanced 3D Grass Tufts, Fallen Autumn Leaves & Smooth River Boulders
  const grassZones: Array<{ cx: number; cz: number; half: number; exclX?: number; exclZ?: number; exclR?: number }> = [
    { cx: 120, cz: 40, half: 26, exclX: 120, exclZ: 33, exclR: 13 }, // Emerald Park
    { cx: -120, cz: -120, half: 26, exclX: -122, exclZ: -122, exclR: 15 }, // Homestead Barn Lawn
    { cx: -40, cz: -120, half: 26, exclX: -40, exclZ: -122, exclR: 13 }, // Colonial Lawn W
    { cx: 40, cz: -120, half: 26, exclX: 40, exclZ: -122, exclR: 13 }, // Colonial Lawn E
    { cx: 120, cz: -40, half: 26, exclX: 120, exclZ: -40, exclR: 13 }, // Emerald Estate Lawn
  ];

  const bladeGeo = new THREE.ConeGeometry(0.09, 0.36, 3);
  bladeGeo.translate(0, 0.18, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#4d7c2b', roughness: 0.85 });
  const TOTAL_GRASS = 1350;
  const grassInst = new THREE.InstancedMesh(bladeGeo, bladeMat, TOTAL_GRASS);

  const leafGeo = new THREE.PlaneGeometry(0.18, 0.1);
  leafGeo.rotateX(-Math.PI / 2);
  const leafMat = new THREE.MeshStandardMaterial({ color: '#8f5d32', roughness: 0.9, side: THREE.DoubleSide });
  const TOTAL_LEAVES = 220;
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, TOTAL_LEAVES);

  let gCursor = 0;
  let lCursor = 0;
  for (let i = 0; i < TOTAL_GRASS + 400 && gCursor < TOTAL_GRASS; i++) {
    const zInfo = grassZones[i % grassZones.length];
    const rx = zInfo.cx + (Math.sin(i * 19.7) * 0.92) * zInfo.half;
    const rz = zInfo.cz + (Math.cos(i * 31.3) * 0.92) * zInfo.half;
    if (zInfo.exclR && Math.hypot(rx - (zInfo.exclX ?? 0), rz - (zInfo.exclZ ?? 0)) < zInfo.exclR) continue;

    dummy.position.set(rx, 0.05, rz);
    dummy.rotation.set((Math.sin(i * 7.1) * 0.22), (i * 1.1) % (Math.PI * 2), (Math.cos(i * 5.3) * 0.22));
    const gs = 0.75 + ((i * 13) % 10) * 0.06;
    dummy.scale.set(gs, gs * 1.15, gs);
    dummy.updateMatrix();
    grassInst.setMatrixAt(gCursor, dummy.matrix);
    colorVar.setHSL(0.24 + ((i * 7) % 5) * 0.014, 0.48, 0.26 + ((i * 3) % 4) * 0.04);
    grassInst.setColorAt(gCursor, colorVar);
    gCursor++;

    if (lCursor < TOTAL_LEAVES && i % 6 === 0) {
      dummy.position.set(rx + 0.15, 0.06, rz - 0.1);
      dummy.rotation.set(0, (i * 2.3) % (Math.PI * 2), 0);
      dummy.scale.setScalar(0.8 + (i % 3) * 0.25);
      dummy.updateMatrix();
      leafInst.setMatrixAt(lCursor, dummy.matrix);
      lCursor++;
    }
  }
  grassInst.count = gCursor;
  leafInst.count = lCursor;
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  leafInst.instanceMatrix.needsUpdate = true;
  grassInst.computeBoundingSphere();
  leafInst.computeBoundingSphere();
  cityGroup.add(grassInst, leafInst);
  disposables.push(bladeGeo, bladeMat, leafGeo, leafMat);

  // Smooth Pale River Boulders in Emerald Park & Suburban Gardens
  const boulderCoords: Array<[number, number, number]> = [
    [108, 20, 1.05], [132, 22, 0.85], [112, 56, 0.95], [136, 52, 1.15],
    [-136, -98, 1.1], [-104, -138, 0.9], [-24, -104, 0.85], [56, -104, 0.92],
  ];
  const boulderGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const boulderMat = new THREE.MeshStandardMaterial({ color: '#dcd9d2', roughness: 0.68, metalness: 0.05 });
  const boulderInst = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCoords.length);
  boulderCoords.forEach(([bx, bz, bs], idx) => {
    dummy.position.set(bx, 0.22 * bs, bz);
    dummy.rotation.set(0.1 * idx, idx * 1.2, 0.08);
    dummy.scale.set(1.25 * bs, 0.58 * bs, 0.9 * bs);
    dummy.updateMatrix();
    boulderInst.setMatrixAt(idx, dummy.matrix);
  });
  boulderInst.instanceMatrix.needsUpdate = true;
  boulderInst.computeBoundingSphere();
  cityGroup.add(boulderInst);
  disposables.push(boulderGeo, boulderMat);

  // 11. Streetlamps + Glow Sprites
  const lampPositions: Array<[number, number]> = [];
  for (const roadX of [-80, 0, 80]) {
    for (let z = -140; z <= 140; z += 40) {
      if (Math.abs(z % 80) < 12) continue;
      lampPositions.push([roadX + 9.2, z]);
      lampPositions.push([roadX - 9.2, z]);
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.11, 0.16, 6.2, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.72, roughness: 0.35 });
  const streetlampBulbMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: '#fbbf24',
    emissiveIntensity: 0.2,
  });

  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lampPositions.length);
  const bulbInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.7, 0.22, 0.4),
    streetlampBulbMat,
    lampPositions.length
  );
  const streetlampSprites: THREE.Sprite[] = [];
  const spriteMatShared = new THREE.SpriteMaterial({
    map: glowSpriteTex,
    color: '#fde68a',
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  lampPositions.forEach(([lx, lz], idx) => {
    dummy.position.set(lx, 3.1, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(lx, 6.2, lz);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(idx, dummy.matrix);

    if (idx % 2 === 0) {
      const sp = new THREE.Sprite(spriteMatShared);
      sp.position.set(lx, 6.1, lz);
      sp.scale.set(5.5, 5.5, 1);
      cityGroup.add(sp);
      streetlampSprites.push(sp);
    }
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  cityGroup.add(poleInst, bulbInst);

  // 12. Animated Traffic Lights with Cantilever Arms
  const trafficLights: TrafficLightNode[] = [];
  const signalCoords: Array<[number, number]> = [
    [0, 0],
    [-80, 0],
    [80, 0],
    [0, -80],
    [0, 80],
  ];
  for (const [ix, iz] of signalCoords) {
    const nsRed = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const nsGreen = new THREE.MeshBasicMaterial({ color: '#22c55e' });
    const ewRed = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const ewGreen = new THREE.MeshBasicMaterial({ color: '#22c55e' });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 5.6, 8), poleMat);
    post.position.set(ix + 9.5, 2.8, iz + 9.5);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 0.16), poleMat);
    arm.position.set(ix + 6.8, 5.5, iz + 9.5);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.65), trimMat);
    box.position.set(ix + 9.5, 5.1, iz + 9.5);

    const lensR1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsRed);
    lensR1.position.set(ix + 9.5, 5.45, iz + 9.15);
    const lensG1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), nsGreen);
    lensG1.position.set(ix + 9.5, 4.85, iz + 9.15);

    const lensR2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewRed);
    lensR2.position.set(ix + 9.15, 5.45, iz + 9.5);
    const lensG2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ewGreen);
    lensG2.position.set(ix + 9.15, 4.85, iz + 9.5);

    cityGroup.add(post, arm, box, lensR1, lensG1, lensR2, lensG2);
    trafficLights.push({ x: ix, z: iz, nsRed, nsGreen, ewRed, ewGreen });
  }

  // 13. Interactive Zone Ground Rings + Physical ATM Kiosks
  const atmBodyMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.55 });
  const atmScreenMat = new THREE.MeshStandardMaterial({
    color: '#06b6d4',
    emissive: '#06b6d4',
    emissiveIntensity: 0.95,
  });
  const zoneMarkers = new Map<string, THREE.Mesh>();
  for (const zone of INTERACTIVE_ZONES) {
    const color =
      zone.type === 'garage'
        ? '#f59e0b'
        : zone.type === 'gas_station' || zone.type === 'atm'
          ? '#06b6d4'
          : zone.type === 'shop' || zone.type === 'property' || zone.type === 'safehouse'
            ? '#10b981'
            : zone.type === 'hospital'
              ? '#ef4444'
              : '#e11d48';
    const ringGeo = new THREE.RingGeometry(1.6, 2.2, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(zone.x, 0.12, zone.z);
    cityGroup.add(ring);
    zoneMarkers.set(zone.id, ring);

    if (zone.type === 'atm') {
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.85, 0.7), atmBodyMat);
      kiosk.position.set(zone.x - 1.4, 0.92, zone.z);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.48), atmScreenMat);
      screen.position.set(zone.x - 0.92, 1.25, zone.z);
      cityGroup.add(kiosk, screen);
    }
  }

  // 14. SOLARIS INTERNATIONAL AIRPORT (West x < -176)
  const airportApron = new THREE.Mesh(
    new THREE.PlaneGeometry(78, 200),
    new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.86 })
  );
  airportApron.rotation.x = -Math.PI / 2;
  airportApron.position.set(-224, 0.03, 25);
  airportApron.receiveShadow = true;

  const runwayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 185),
    new THREE.MeshStandardMaterial({ map: runwayTex, roughness: 0.78 })
  );
  runwayMesh.rotation.x = -Math.PI / 2;
  runwayMesh.position.set(-246, 0.045, 25);
  runwayMesh.receiveShadow = true;

  const helipadBase = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.8, 0.14, 28),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 })
  );
  helipadBase.position.set(-198, 0.08, 4);
  const heliH1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.04, 6.2),
    new THREE.MeshBasicMaterial({ color: '#facc15' })
  );
  heliH1.position.set(-200.2, 0.16, 4);
  const heliH2 = heliH1.clone();
  heliH2.position.x = -195.8;
  const heliHBar = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.04, 1.1),
    new THREE.MeshBasicMaterial({ color: '#facc15' })
  );
  heliHBar.position.set(-198, 0.16, 4);
  cityGroup.add(airportApron, runwayMesh, helipadBase, heliH1, heliH2, heliHBar);

  // Static Parked Airliner beside Hangar
  const planeMat = new THREE.MeshPhysicalMaterial({ color: '#f8fafc', roughness: 0.25, clearcoat: 0.8 });
  const planeFuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 11, 8, 14), planeMat);
  planeFuselage.rotation.x = Math.PI / 2;
  planeFuselage.position.set(-222, 2.3, 62);
  const planeWing = new THREE.Mesh(new THREE.BoxGeometry(14, 0.22, 2.6), planeMat);
  planeWing.position.set(-222, 2.0, 62);
  const planeTail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 2.2), trimMat);
  planeTail.position.set(-222, 4.1, 56.5);
  cityGroup.add(planeFuselage, planeWing, planeTail);

  // 15. REDWOOD HIGHLANDS FOREST (NW Quadrant x < -150, z < -95)
  const redwoodCoords: Array<[number, number]> = [];
  for (let i = 0; i < 42; i++) {
    const rx = -252 + ((i * 37) % 92);
    const rz = -238 + ((i * 53) % 135);
    redwoodCoords.push([rx, rz]);
  }
  const pineTrunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.32, 0.52, 6.2, 7),
    trunkMat,
    redwoodCoords.length
  );
  const pineCanopyInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.6, 8.8, 7),
    new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.85 }),
    redwoodCoords.length
  );
  redwoodCoords.forEach(([px, pz], idx) => {
    const sc = 0.85 + (idx % 5) * 0.16;
    dummy.position.set(px, 3.1 * sc, pz);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    pineTrunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, 8.4 * sc, pz);
    dummy.updateMatrix();
    pineCanopyInst.setMatrixAt(idx, dummy.matrix);
  });
  pineTrunkInst.instanceMatrix.needsUpdate = true;
  pineCanopyInst.instanceMatrix.needsUpdate = true;
  pineTrunkInst.computeBoundingSphere();
  pineCanopyInst.computeBoundingSphere();
  cityGroup.add(pineTrunkInst, pineCanopyInst);

  // 16. SOLARIS BADLANDS DESERT & SANDSTONE MESAS (East x > 188)
  const desertGround = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 390),
    new THREE.MeshStandardMaterial({ map: desertSandTex, roughness: 0.94 })
  );
  desertGround.rotation.x = -Math.PI / 2;
  desertGround.position.set(260, 0.04, 0);
  desertGround.receiveShadow = true;
  cityGroup.add(desertGround);

  const mesaMat = new THREE.MeshStandardMaterial({ color: '#9a4f34', roughness: 0.88 });
  const mesaCoords: Array<[number, number, number, number]> = [
    [248, -140, 20, 18],
    [258, -32, 24, 24],
    [244, 72, 18, 14],
    [262, 140, 22, 20],
  ];
  for (const [mx, mz, mr, mh] of mesaCoords) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(mr * 0.65, mr, mh, 9), mesaMat);
    mesa.position.set(mx, mh * 0.5, mz);
    mesa.castShadow = true;
    cityGroup.add(mesa);
  }

  // Desert Airstrip Marker
  const desertPad = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: '#78513a', roughness: 0.9 })
  );
  desertPad.rotation.x = -Math.PI / 2;
  desertPad.position.set(215, 0.09, -115);
  cityGroup.add(desertPad);

  // 17. SOLARIS MARINA SLIP & MOORED LUXURY YACHT (SE Waterfront)
  const marinaPier = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.35, 52), woodMat);
  marinaPier.position.set(118, 0.92, 212);
  marinaPier.castShadow = true;
  cityGroup.add(marinaPier);

  // Offshore Luxury Yacht at [148, 252]
  const yachtGroup = new THREE.Group();
  yachtGroup.position.set(148, -0.1, 252);
  yachtGroup.rotation.y = -0.35;
  const yHull = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 2.2, 22),
    new THREE.MeshPhysicalMaterial({ color: '#f8fafc', roughness: 0.2, clearcoat: 0.9 })
  );
  yHull.position.y = 1.0;
  const yCabin = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 2.0, 11.5),
    new THREE.MeshPhysicalMaterial({ color: '#f1f5f9', roughness: 0.22, clearcoat: 0.85 })
  );
  yCabin.position.set(0, 3.0, -1.5);
  const yGlass = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.85, 8.2),
    new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.08, clearcoat: 1.0 })
  );
  yGlass.position.set(0, 3.1, -0.5);
  const yFlybridge = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.1, 5.5),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35 })
  );
  yFlybridge.position.set(0, 4.4, -2.5);
  yachtGroup.add(yHull, yCabin, yGlass, yFlybridge);
  cityGroup.add(yachtGroup);

  return {
    cityGroup,
    oceanMesh,
    waterNormalMap,
    asphaltMaterials,
    skyscraperMaterials,
    streetlampBulbMat,
    streetlampSprites,
    trafficLights,
    zoneMarkers,
    glowSpriteTex,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
