import * as THREE from 'three';
import {
  CITY_BUILDINGS,
  INTERACTIVE_ZONES,
  ROAD_CENTERS,
  ROAD_WIDTH,
} from './gameConfig';
import {
  createArmyWallTexture,
  createAsphaltTextures,
  createBarnTextures,
  createBrickApartmentTextures,
  createColonialSidingTextures,
  createCorrugatedMetalTextures,
  createDesertSandTexture,
  createGlowSpriteTexture,
  createGothicStoneTextures,
  createGrassTexture,
  createInteriorFloorTexture,
  createIntersectionTexture,
  createLeafCanopyTexture,
  createResidentialTexture,
  createRollingHillGrassTexture,
  createRoofShingleTextures,
  createRunwayTexture,
  createSageClapboardTextures,
  createSandTexture,
  createSidewalkTextures,
  createSkyscraperFacadeTextures,
  createTankerHullTextures,
  createWaterNormalMap,
} from './textures';
import { getNorthernHillsElevation } from './physics';

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
  const brickTex = createBrickApartmentTextures(maxAnisotropy);
  const colonialSiding = createColonialSidingTextures(maxAnisotropy);
  const roofShingle = createRoofShingleTextures(maxAnisotropy);
  const barnSiding = createBarnTextures(maxAnisotropy);
  const waterNormalMap = createWaterNormalMap(maxAnisotropy);
  const glowSpriteTex = createGlowSpriteTexture();
  const runwayTex = createRunwayTexture(maxAnisotropy);
  const interiorFloorTex = createInteriorFloorTexture(maxAnisotropy);
  const desertSandTex = createDesertSandTexture(maxAnisotropy);
  const corrugatedMetal = createCorrugatedMetalTextures(maxAnisotropy);
  const tankerTex = createTankerHullTextures(maxAnisotropy);
  const sageClapboard = createSageClapboardTextures(maxAnisotropy);
  const leafCanopyTex = createLeafCanopyTexture(maxAnisotropy);
  const gothicStone = createGothicStoneTextures(maxAnisotropy);
  const rollingHillGrassTex = createRollingHillGrassTexture(maxAnisotropy);
  const armyWallTex = createArmyWallTexture(maxAnisotropy);

  disposables.push(
    asphaltPair.map,
    asphaltPair.normalMap,
    asphaltPair.roughnessMap,
    intersectionTex,
    sidewalkPair.map,
    sidewalkPair.normalMap,
    grassTex,
    sandTex,
    ...skyPacks.flatMap((p) => [p.dayMap, p.nightMap, p.normalMap]),
    resTex,
    brickTex.map,
    brickTex.normalMap,
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
    desertSandTex,
    corrugatedMetal.map,
    corrugatedMetal.normalMap,
    tankerTex.hullSide,
    tankerTex.helipad,
    tankerTex.funnel,
    sageClapboard.map,
    sageClapboard.normalMap,
    leafCanopyTex,
    gothicStone.map,
    gothicStone.normalMap,
    rollingHillGrassTex,
    armyWallTex
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

  // 4. Normal-Mapped Asphalt Road Grid + Puddle Roughness + Crosswalks (wet-road capable!)
  const asphaltNSMap = asphaltPair.map.clone();
  asphaltNSMap.repeat.set(1, 22);
  asphaltNSMap.needsUpdate = true;
  const asphaltNSNorm = asphaltPair.normalMap.clone();
  asphaltNSNorm.repeat.set(1, 22);
  asphaltNSNorm.needsUpdate = true;
  const asphaltNSRough = asphaltPair.roughnessMap.clone();
  asphaltNSRough.repeat.set(1, 22);
  asphaltNSRough.needsUpdate = true;

  const asphaltEWMap = asphaltPair.map.clone();
  asphaltEWMap.repeat.set(1, 22);
  asphaltEWMap.needsUpdate = true;
  const asphaltEWNorm = asphaltPair.normalMap.clone();
  asphaltEWNorm.repeat.set(1, 22);
  asphaltEWNorm.needsUpdate = true;
  const asphaltEWRough = asphaltPair.roughnessMap.clone();
  asphaltEWRough.repeat.set(1, 22);
  asphaltEWRough.needsUpdate = true;

  const asphaltMatNS = new THREE.MeshStandardMaterial({
    map: asphaltNSMap,
    normalMap: asphaltNSNorm,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: asphaltNSRough,
    roughness: 0.85,
    metalness: 0.1,
    envMapIntensity: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const asphaltMatEW = new THREE.MeshStandardMaterial({
    map: asphaltEWMap,
    normalMap: asphaltEWNorm,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: asphaltEWRough,
    roughness: 0.85,
    metalness: 0.1,
    envMapIntensity: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const junctionMat = new THREE.MeshStandardMaterial({
    map: intersectionTex,
    normalMap: asphaltPair.normalMap,
    normalScale: new THREE.Vector2(0.58, 0.58),
    roughnessMap: asphaltPair.roughnessMap,
    roughness: 0.85,
    metalness: 0.1,
    envMapIntensity: 0.95,
  });

  const asphaltMaterials = [asphaltMatNS, asphaltMatEW, junctionMat];
  disposables.push(
    asphaltNSMap,
    asphaltNSNorm,
    asphaltNSRough,
    asphaltEWMap,
    asphaltEWNorm,
    asphaltEWRough,
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
      roughness: 0.04,
      clearcoat: 1.0,
      envMapIntensity: 1.8,
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
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.05,
    metalness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.85,
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

  // Golden Beach Umbrella, Green-Striped Folding Chair & Beach Ball Sets
  const stripCanvas = document.createElement('canvas');
  stripCanvas.width = 128;
  stripCanvas.height = 128;
  const sCtx = stripCanvas.getContext('2d')!;
  for (let s = 0; s < 8; s++) {
    sCtx.fillStyle = s % 2 === 0 ? '#15803d' : '#ede6d1';
    sCtx.fillRect(s * 16, 0, 16, 128);
  }
  const chairStripeTex = new THREE.CanvasTexture(stripCanvas);
  chairStripeTex.colorSpace = THREE.SRGBColorSpace;

  const ballCanvas = document.createElement('canvas');
  ballCanvas.width = 256;
  ballCanvas.height = 128;
  const bCtx = ballCanvas.getContext('2d')!;
  const ballColors = ['#f8fafc', '#e11d48', '#facc15', '#f8fafc', '#0284c7', '#22c55e'];
  for (let i = 0; i < 6; i++) {
    bCtx.fillStyle = ballColors[i];
    bCtx.fillRect((i * 256) / 6, 0, 256 / 6 + 1, 128);
  }
  bCtx.fillStyle = '#0ea5e9';
  bCtx.fillRect(0, 0, 256, 14);
  bCtx.fillRect(0, 114, 256, 14);
  const beachBallTex = new THREE.CanvasTexture(ballCanvas);
  beachBallTex.colorSpace = THREE.SRGBColorSpace;

  const umbPoleMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', metalness: 0.72, roughness: 0.25 });
  const umbOrangeMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.65, side: THREE.DoubleSide });
  const umbBlueMat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.65, side: THREE.DoubleSide });
  const chairWoodMat = new THREE.MeshStandardMaterial({ color: '#c99b6d', roughness: 0.78 });
  const chairClothMat = new THREE.MeshStandardMaterial({ map: chairStripeTex, roughness: 0.85, side: THREE.DoubleSide });
  const ballMat = new THREE.MeshPhysicalMaterial({ map: beachBallTex, roughness: 0.22, clearcoat: 0.65 });

  const beachSetCoords: Array<[number, number, number]> = [
    [-108, 198, 0.18],
    [-68, 203, -0.14],
    [-32, 197, 0.22],
    [34, 199, -0.18],
    [72, 204, 0.12],
    [102, 196, -0.25],
  ];
  for (const [bx, bz, yaw] of beachSetCoords) {
    const setG = new THREE.Group();
    setG.position.set(bx, -0.34, bz);
    setG.rotation.y = yaw;

    // Aluminum pole + Orange/Sky-Blue 8-panel scalloped beach umbrella
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.045, 2.75, 8), umbPoleMat);
    pole.position.y = 1.38;
    pole.castShadow = true;
    setG.add(pole);

    const panelGeo = new THREE.ConeGeometry(1.55, 0.56, 8, 1, true, 0, Math.PI / 4);
    for (let p = 0; p < 8; p++) {
      const wedge = new THREE.Mesh(panelGeo, p % 2 === 0 ? umbOrangeMat : umbBlueMat);
      wedge.position.y = 2.66;
      wedge.rotation.y = (p * Math.PI) / 4;
      wedge.castShadow = true;
      setG.add(wedge);
    }

    // Beechwood folding deck chair + green & cream striped cloth
    const chairG = new THREE.Group();
    chairG.position.set(1.05, 0.0, 0.35);
    chairG.rotation.y = -0.35;
    for (const side of [-0.42, 0.42]) {
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 1.35), chairWoodMat);
      rail1.position.set(side, 0.48, -0.05);
      rail1.rotation.x = 0.68;
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 1.15), chairWoodMat);
      rail2.position.set(side, 0.24, 0.05);
      rail2.rotation.x = -0.32;
      chairG.add(rail1, rail2);
    }
    const sling = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.028, 1.24), chairClothMat);
    sling.position.set(0, 0.45, -0.05);
    sling.rotation.x = 0.66;
    sling.castShadow = true;
    chairG.add(sling);
    setG.add(chairG);

    // Colorful beach ball on sand
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), ballMat);
    ball.position.set(-0.78, 0.26, 0.42);
    ball.rotation.set(0.4, yaw * 1.5, 0.25);
    ball.castShadow = true;
    setG.add(ball);

    cityGroup.add(setG);
  }
  disposables.push(
    chairStripeTex,
    beachBallTex,
    umbPoleMat,
    umbOrangeMat,
    umbBlueMat,
    chairWoodMat,
    chairClothMat,
    ballMat
  );

  // 7. Rolling Lush Green Grassy Hills Perimeter + Distant Snow-Capped Mountains
  const rollingHillsGeo = new THREE.PlaneGeometry(600, 265, 88, 40);
  rollingHillsGeo.rotateX(-Math.PI / 2);
  const rhPos = rollingHillsGeo.attributes.position as THREE.BufferAttribute;
  const rhCenterZ = -235;
  for (let i = 0; i < rhPos.count; i++) {
    const wx = rhPos.getX(i);
    const wz = rhPos.getZ(i) + rhCenterZ;
    const elev = getNorthernHillsElevation(wx, wz);
    rhPos.setY(i, elev > 0.02 ? elev : -0.14);
  }
  rollingHillsGeo.computeVertexNormals();
  const rollingHillsMat = new THREE.MeshStandardMaterial({
    map: rollingHillGrassTex,
    roughness: 0.9,
    metalness: 0.02,
  });
  const rollingHillsMesh = new THREE.Mesh(rollingHillsGeo, rollingHillsMat);
  rollingHillsMesh.position.set(0, 0, rhCenterZ);
  rollingHillsMesh.receiveShadow = true;
  cityGroup.add(rollingHillsMesh);
  disposables.push(rollingHillsGeo, rollingHillsMat);

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
  mountainRange.position.set(0, -0.5, -415);
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
    if (b.id.startsWith('army_wall_') || b.id.startsWith('army_tower_')) continue;
    const bGroup = new THREE.Group();
    bGroup.position.set(b.x, 0, b.z);

    if (b.kind === 'skyscraper') {
      const pack = skyPacks[skyIdx % skyPacks.length];
      const isLimestone = skyIdx % skyPacks.length === 1;
      const isCreamModern = skyIdx % skyPacks.length === 2;
      const isRounded = b.id === 'dt_ne_2' || b.id === 'dt_sw_3';
      skyIdx++;

      const mat = new THREE.MeshStandardMaterial({
        map: pack.dayMap,
        normalMap: pack.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        emissiveMap: pack.nightMap,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.0,
        roughness: isLimestone || isCreamModern ? 0.52 : 0.22,
        metalness: isLimestone || isCreamModern ? 0.14 : 0.6,
        envMapIntensity: 1.4,
      });
      skyscraperMaterials.push(mat);

      const podiumH = Math.min(6.4, b.height * 0.16);
      const creamTrimMat = new THREE.MeshStandardMaterial({ color: '#f3efe4', roughness: 0.55 });
      if (isCreamModern) disposables.push(creamTrimMat);
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(b.width, podiumH, b.depth),
        isCreamModern ? creamTrimMat : trimMat
      );
      podium.position.y = podiumH * 0.5;
      podium.castShadow = true;
      podium.receiveShadow = true;
      bGroup.add(podium);

      // Warm Ground-Floor Lobby Glazing Band + Cream Overhang Cornice
      const lobbyGlass = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 0.12, 2.8, b.depth + 0.12),
        lobbyMat
      );
      lobbyGlass.position.y = 2.0;
      bGroup.add(lobbyGlass);
      if (isCreamModern) {
        const overhang = new THREE.Mesh(
          new THREE.BoxGeometry(b.width + 1.4, 0.55, b.depth + 1.4),
          creamTrimMat
        );
        overhang.position.y = podiumH + 0.1;
        overhang.castShadow = true;
        bGroup.add(overhang);
      }

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
    } else if (b.kind === 'sage_colonial') {
      const sageSidingMat = new THREE.MeshStandardMaterial({
        map: sageClapboard.map,
        normalMap: sageClapboard.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.76,
      });
      const slateRoofMat = new THREE.MeshStandardMaterial({
        map: roofShingle.map,
        normalMap: roofShingle.normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        color: '#2b303a',
        roughness: 0.84,
      });
      const whiteTrimMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.55 });
      const plinthMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.88 });
      const sashGlassMat = new THREE.MeshPhysicalMaterial({
        color: '#162336',
        roughness: 0.08,
        clearcoat: 1.0,
        metalness: 0.15,
      });
      const doorWoodMat = new THREE.MeshStandardMaterial({ color: '#422c20', roughness: 0.62 });

      const hw = b.width; // 16
      const hd = b.depth; // 12
      const wallH = 6.7;
      const plinthH = 0.55;

      // Foundation plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(hw + 0.45, plinthH, hd + 0.45), plinthMat);
      plinth.position.y = plinthH * 0.5;
      plinth.receiveShadow = true;

      // Main 2-story sage clapboard volume
      const body = new THREE.Mesh(new THREE.BoxGeometry(hw, wallH, hd), sageSidingMat);
      body.position.y = plinthH + wallH * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(plinth, body);

      // Crisp white vertical corner trim boards & downspouts
      for (const cx of [-hw * 0.5, hw * 0.5]) {
        for (const cz of [-hd * 0.5, hd * 0.5]) {
          const cornerTrim = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wallH + 0.1, 0.32),
            whiteTrimMat
          );
          cornerTrim.position.set(cx, plinthH + wallH * 0.5, cz);
          bGroup.add(cornerTrim);
        }
        const downspout = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, wallH + 0.2, 6),
          whiteTrimMat
        );
        downspout.position.set(cx * 0.96, plinthH + wallH * 0.5, hd * 0.5 + 0.16);
        bGroup.add(downspout);
      }

      // Steep dark slate gable roof + gable end clapboard infill
      const gablePeak = 3.85;
      const roofShape = new THREE.Shape();
      roofShape.moveTo(0, gablePeak);
      roofShape.lineTo(-hd * 0.54, -0.35);
      roofShape.lineTo(-hd * 0.54, 0.12);
      roofShape.lineTo(0, gablePeak + 0.48);
      roofShape.lineTo(hd * 0.54, 0.12);
      roofShape.lineTo(hd * 0.54, -0.35);
      roofShape.closePath();
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: hw + 0.9, bevelEnabled: false });
      roofGeo.translate(0, 0, -(hw + 0.9) * 0.5);
      roofGeo.rotateY(Math.PI / 2);
      const roofMesh = new THREE.Mesh(roofGeo, slateRoofMat);
      roofMesh.position.y = plinthH + wallH;
      roofMesh.castShadow = true;

      const gableWallShape = new THREE.Shape();
      gableWallShape.moveTo(-hd * 0.5, 0);
      gableWallShape.lineTo(hd * 0.5, 0);
      gableWallShape.lineTo(0, gablePeak);
      gableWallShape.closePath();
      const gableWallGeo = new THREE.ExtrudeGeometry(gableWallShape, { depth: hw - 0.08, bevelEnabled: false });
      gableWallGeo.translate(0, 0, -(hw - 0.08) * 0.5);
      gableWallGeo.rotateY(Math.PI / 2);
      const gableWall = new THREE.Mesh(gableWallGeo, sageSidingMat);
      gableWall.position.y = plinthH + wallH;
      gableWall.castShadow = true;
      bGroup.add(roofMesh, gableWall);

      // White horizontal eaves gutters on front and back
      for (const gz of [-hd * 0.5 - 0.42, hd * 0.5 + 0.42]) {
        const gutter = new THREE.Mesh(new THREE.BoxGeometry(hw + 1.0, 0.2, 0.22), whiteTrimMat);
        gutter.position.set(0, plinthH + wallH - 0.12, gz);
        bGroup.add(gutter);
      }

      // Helper for framed multi-pane white-trim sash window
      const addSashWin = (wx: number, wy: number, wz: number, rotY = 0, w = 1.25, h = 1.7) => {
        const winG = new THREE.Group();
        winG.position.set(wx, wy, wz);
        winG.rotation.y = rotY;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, h + 0.24, 0.14), whiteTrimMat);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), sashGlassMat);
        const barH = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.08, 0.18), whiteTrimMat);
        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.06, h + 0.04, 0.18), whiteTrimMat);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, 0.12, 0.24), whiteTrimMat);
        sill.position.y = -h * 0.5 - 0.08;
        winG.add(frame, glass, barH, barV, sill);
        bGroup.add(winG);
      };

      // Twin 3rd-story attic gable dormers on front roof slope
      for (const dx of [-3.9, 3.9]) {
        const dormerBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 2.6), sageSidingMat);
        dormerBody.position.set(dx, plinthH + wallH + 1.15, hd * 0.26);
        dormerBody.castShadow = true;
        const dShape = new THREE.Shape();
        dShape.moveTo(-1.45, 0);
        dShape.lineTo(1.45, 0);
        dShape.lineTo(0, 1.05);
        dShape.closePath();
        const dRoofGeo = new THREE.ExtrudeGeometry(dShape, { depth: 3.0, bevelEnabled: false });
        dRoofGeo.translate(0, 0, -1.5);
        const dRoof = new THREE.Mesh(dRoofGeo, slateRoofMat);
        dRoof.position.set(dx, plinthH + wallH + 2.15, hd * 0.26);
        dRoof.castShadow = true;
        bGroup.add(dormerBody, dRoof);
        addSashWin(dx, plinthH + wallH + 1.18, hd * 0.26 + 1.32, 0, 1.1, 1.35);
      }

      // Front & Back 1st/2nd-floor windows + entryway stoop
      for (const wx of [-5.2, -2.5, 2.5, 5.2]) {
        addSashWin(wx, plinthH + 1.9, hd * 0.5 + 0.05);
        addSashWin(wx, plinthH + 4.85, hd * 0.5 + 0.05);
        addSashWin(wx, plinthH + 1.9, -hd * 0.5 - 0.05, Math.PI);
        addSashWin(wx, plinthH + 4.85, -hd * 0.5 - 0.05, Math.PI);
      }
      addSashWin(0, plinthH + 4.85, hd * 0.5 + 0.05);
      addSashWin(0, plinthH + 4.85, -hd * 0.5 - 0.05, Math.PI);

      // Gable side & lower side windows
      for (const sx of [-hw * 0.5 - 0.05, hw * 0.5 + 0.05]) {
        const rot = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        addSashWin(sx, plinthH + 1.9, -2.6, rot);
        addSashWin(sx, plinthH + 1.9, 2.6, rot);
        addSashWin(sx, plinthH + 4.85, -2.6, rot);
        addSashWin(sx, plinthH + 4.85, 2.6, rot);
        addSashWin(sx, plinthH + wallH + 1.5, 0, rot, 1.05, 1.35);
      }

      // Front door surround & stone steps
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.65, 0.2), whiteTrimMat);
      doorFrame.position.set(0, plinthH + 1.35, hd * 0.5 + 0.06);
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.38, 0.24), doorWoodMat);
      doorLeaf.position.set(0, plinthH + 1.22, hd * 0.5 + 0.08);
      const stoop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 1.4), plinthMat);
      stoop.position.set(0, 0.225, hd * 0.5 + 0.72);
      const porchHood = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 1.2), slateRoofMat);
      porchHood.position.set(0, plinthH + 2.85, hd * 0.5 + 0.55);
      porchHood.rotation.x = 0.24;
      bGroup.add(doorFrame, doorLeaf, stoop, porchHood);

      disposables.push(
        sageSidingMat,
        slateRoofMat,
        whiteTrimMat,
        plinthMat,
        sashGlassMat,
        doorWoodMat,
        roofGeo,
        gableWallGeo
      );
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
      // Quonset Corrugated Metal Hangar with Royal Blue Arch Fascia Ribs, Open Bay & Rolled Curtain
      const radius = b.width * 0.5;
      const hd = b.depth * 0.5;
      const hangarShellMat = new THREE.MeshStandardMaterial({
        map: corrugatedMetal.map,
        normalMap: corrugatedMetal.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        color: '#9ca3af',
        roughness: 0.52,
        metalness: 0.48,
      });
      const hangarBlueTrimMat = new THREE.MeshStandardMaterial({
        color: '#1d4ed8',
        roughness: 0.42,
        metalness: 0.35,
      });
      const hangarInteriorMat = new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.85,
        side: THREE.BackSide,
      });
      const curtainMat = new THREE.MeshStandardMaterial({
        color: '#c2b29b',
        roughness: 0.82,
      });
      const louverMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.45,
        metalness: 0.4,
      });

      const outerArch = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, b.depth, 24, 1, true, 0, Math.PI),
        hangarShellMat
      );
      outerArch.rotation.z = Math.PI / 2;
      outerArch.rotation.y = Math.PI / 2;
      outerArch.castShadow = true;
      outerArch.receiveShadow = true;

      const innerArch = new THREE.Mesh(
        new THREE.CylinderGeometry(radius - 0.15, radius - 0.15, b.depth - 0.2, 20, 1, true, 0, Math.PI),
        hangarInteriorMat
      );
      innerArch.rotation.z = Math.PI / 2;
      innerArch.rotation.y = Math.PI / 2;

      const hangarFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(b.width - 0.6, b.depth - 0.6),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.78 })
      );
      hangarFloor.rotation.x = -Math.PI / 2;
      hangarFloor.position.y = 0.06;
      hangarFloor.receiveShadow = true;

      // Semi-circular front/rear gable wall with central open hangar bay
      const doorW = Math.min(9.6, b.width * 0.42);
      const doorH = Math.min(6.4, radius * 0.56);
      const gableShape = new THREE.Shape();
      gableShape.absarc(0, 0, radius - 0.08, 0, Math.PI, false);
      gableShape.lineTo(-doorW * 0.5, 0);
      gableShape.lineTo(-doorW * 0.5, doorH);
      gableShape.lineTo(doorW * 0.5, doorH);
      gableShape.lineTo(doorW * 0.5, 0);
      gableShape.lineTo(radius - 0.08, 0);

      const frontWallGeo = new THREE.ExtrudeGeometry(gableShape, {
        depth: 0.32,
        bevelEnabled: false,
      });
      const frontWall = new THREE.Mesh(frontWallGeo, hangarShellMat);
      frontWall.position.set(0, 0, hd - 0.34);
      frontWall.castShadow = true;
      const backWall = frontWall.clone();
      backWall.position.set(0, 0, -hd + 0.02);

      // Royal blue outer arch fascia ribs (front + rear)
      const frontRim = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.34, 8, 24, Math.PI),
        hangarBlueTrimMat
      );
      frontRim.position.set(0, 0, hd);
      const rearRim = frontRim.clone();
      rearRim.position.set(0, 0, -hd);

      // Blue doorway jamb trim & rolled-up canvas bay curtain header
      const curtainRoll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, doorW + 0.3, 12),
        curtainMat
      );
      curtainRoll.rotation.z = Math.PI / 2;
      curtainRoll.position.set(0, doorH - 0.2, hd + 0.14);

      const headerBar = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.7, 0.32, 0.46),
        hangarBlueTrimMat
      );
      headerBar.position.set(0, doorH + 0.18, hd - 0.14);

      bGroup.add(outerArch, innerArch, hangarFloor, frontWall, backWall, frontRim, rearRim, curtainRoll, headerBar);

      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, doorH, 0.48),
          hangarBlueTrimMat
        );
        post.position.set(side * (doorW * 0.5 + 0.16), doorH * 0.5, hd - 0.14);
        const winFrame = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 1.5, 0.22),
          hangarBlueTrimMat
        );
        winFrame.position.set(side * (doorW * 0.5 + 3.2), 2.8, hd + 0.02);
        const winShutter = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 1.18, 0.25),
          louverMat
        );
        winShutter.position.set(side * (doorW * 0.5 + 3.2), 2.8, hd + 0.03);
        bGroup.add(post, winFrame, winShutter);
      }

      // Interior hangar overhead bay light strip
      const bayLight = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.18, b.depth * 0.55),
        new THREE.MeshBasicMaterial({ color: '#fef3c7' })
      );
      bayLight.position.set(0, radius * 0.78, 0);
      bGroup.add(bayLight);
      disposables.push(
        hangarShellMat,
        hangarBlueTrimMat,
        hangarInteriorMat,
        curtainMat,
        louverMat,
        frontWallGeo
      );
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
    } else if (b.kind === 'residential') {
      // Realistic 3-Story Terracotta Brick Apartment Building with Plinth, Cornice, Front Steps, Chimney & HVAC
      const brickWallMat = new THREE.MeshStandardMaterial({
        map: brickTex.map,
        normalMap: brickTex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.84,
      });
      const stoneMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.82 });
      const tarRoofMat = new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.92 });
      const woodDoorMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.68 });
      const metalHvacMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.42, metalness: 0.45 });
      disposables.push(brickWallMat, stoneMat, tarRoofMat, woodDoorMat, metalHvacMat);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(b.width + 0.5, 0.9, b.depth + 0.5), stoneMat);
      plinth.position.y = 0.45;
      plinth.receiveShadow = true;
      bGroup.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(b.width, b.height, b.depth), brickWallMat);
      body.position.y = b.height * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.width + 1.0, 0.95, b.depth + 1.0), stoneMat);
      parapet.position.y = b.height + 0.35;
      parapet.castShadow = true;
      const tarRoof = new THREE.Mesh(new THREE.BoxGeometry(b.width - 0.6, 0.25, b.depth - 0.6), tarRoofMat);
      tarRoof.position.y = b.height + 0.72;
      bGroup.add(parapet, tarRoof);

      // Rooftop Brick Chimney + Metallic HVAC Unit with Exhaust Elbow
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.8), brickWallMat);
      chimney.position.set(-b.width * 0.22, b.height + 1.65, -b.depth * 0.16);
      const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, 2.1), stoneMat);
      chimneyCap.position.set(-b.width * 0.22, b.height + 2.9, -b.depth * 0.16);
      const roofHvac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 2.0), metalHvacMat);
      roofHvac.position.set(b.width * 0.2, b.height + 1.4, b.depth * 0.14);
      const roofDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 10), metalHvacMat);
      roofDuct.rotation.z = Math.PI / 2;
      roofDuct.position.set(b.width * 0.2 - 1.4, b.height + 1.5, b.depth * 0.14);
      bGroup.add(chimney, chimneyCap, roofHvac, roofDuct);

      // Protruding Stone Steps + Arched Wooden Apartment Entrance on South/Front Facade
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 0.35), stoneMat);
      doorFrame.position.set(0, 2.1, b.depth * 0.5 + 0.12);
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.3, 0.42), woodDoorMat);
      doorLeaf.position.set(0, 1.9, b.depth * 0.5 + 0.16);
      bGroup.add(doorFrame, doorLeaf);
      for (let st = 0; st < 4; st++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.26, 0.65), stoneMat);
        step.position.set(0, 0.13 + (3 - st) * 0.22, b.depth * 0.5 + 0.45 + st * 0.52);
        bGroup.add(step);
      }
    } else if (b.kind === 'gothic_church') {
      const stoneWallMat = new THREE.MeshStandardMaterial({
        map: gothicStone.map,
        normalMap: gothicStone.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.86,
      });
      const gothicSlateMat = new THREE.MeshStandardMaterial({
        map: roofShingle.map,
        normalMap: roofShingle.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        color: '#3f4552',
        roughness: 0.82,
      });
      const stoneTrimMat = new THREE.MeshStandardMaterial({ color: '#c4bfb6', roughness: 0.8 });
      const gothicGlassMat = new THREE.MeshPhysicalMaterial({
        color: '#1b2838',
        roughness: 0.12,
        clearcoat: 0.85,
      });
      const gothicDoorMat = new THREE.MeshStandardMaterial({ color: '#271a14', roughness: 0.72 });

      const hw = b.width; // 24
      const hd = b.depth; // 18

      // Stone plinth foundation
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(hw + 0.8, 0.9, hd + 0.8), stoneTrimMat);
      plinth.position.y = 0.45;
      plinth.receiveShadow = true;
      bGroup.add(plinth);

      // Left Tall Square Bell Tower + Steep Octagonal Spire
      const towerX = -hw * 0.5 + 3.2;
      const towerH = 18.6;
      const towerBody = new THREE.Mesh(new THREE.BoxGeometry(5.6, towerH, 5.8), stoneWallMat);
      towerBody.position.set(towerX, towerH * 0.5, 0.8);
      towerBody.castShadow = true;
      towerBody.receiveShadow = true;
      bGroup.add(towerBody);

      const towerCornice = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.6, 6.2), stoneTrimMat);
      towerCornice.position.set(towerX, towerH + 0.1, 0.8);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(3.55, 14.5, 8), gothicSlateMat);
      spire.position.set(towerX, towerH + 7.5, 0.8);
      spire.castShadow = true;
      bGroup.add(towerCornice, spire);

      // Tower Belfry Louvers & Arched Lancet Windows
      for (const wy of [7.5, 15.2]) {
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.2, 0.28), stoneTrimMat);
        winFrame.position.set(towerX, wy, 3.75);
        const winGlass = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.7, 0.32), gothicGlassMat);
        winGlass.position.set(towerX, wy, 3.77);
        bGroup.add(winFrame, winGlass);
      }

      // Main Nave Body (y up to 9.2m) + Steep Pitched Slate Roof (9.2m -> 14.4m peak)
      const naveWallH = 9.2;
      const naveBody = new THREE.Mesh(new THREE.BoxGeometry(hw - 3.6, naveWallH, hd - 2.0), stoneWallMat);
      naveBody.position.set(1.8, naveWallH * 0.5, -0.5);
      naveBody.castShadow = true;
      naveBody.receiveShadow = true;
      bGroup.add(naveBody);

      const naveRoofShape = new THREE.Shape();
      naveRoofShape.moveTo(-(hd - 1.2) * 0.5, -0.2);
      naveRoofShape.lineTo((hd - 1.2) * 0.5, -0.2);
      naveRoofShape.lineTo(0, 5.2);
      naveRoofShape.closePath();
      const naveRoofGeo = new THREE.ExtrudeGeometry(naveRoofShape, { depth: hw - 3.0, bevelEnabled: false });
      naveRoofGeo.translate(0, 0, -(hw - 3.0) * 0.5);
      naveRoofGeo.rotateY(Math.PI / 2);
      const naveRoof = new THREE.Mesh(naveRoofGeo, gothicSlateMat);
      naveRoof.position.set(1.8, naveWallH, -0.5);
      naveRoof.castShadow = true;
      naveRoof.receiveShadow = true;
      bGroup.add(naveRoof);

      // South Transept Gable (Left-Center) + Ornate Tracery Window + Corner Turret Spire
      const transeptBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 10.6, 5.0), stoneWallMat);
      transeptBody.position.set(-2.4, 5.3, 4.4);
      transeptBody.castShadow = true;
      const transGable = new THREE.Shape();
      transGable.moveTo(-3.6, 0);
      transGable.lineTo(3.6, 0);
      transGable.lineTo(0, 4.4);
      transGable.closePath();
      const transGableGeo = new THREE.ExtrudeGeometry(transGable, { depth: 5.2, bevelEnabled: false });
      transGableGeo.translate(0, 0, -2.6);
      const transRoof = new THREE.Mesh(transGableGeo, gothicSlateMat);
      transRoof.position.set(-2.4, 10.6, 4.4);
      bGroup.add(transeptBody, transRoof);

      const bigWinFrame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.2, 0.28), stoneTrimMat);
      bigWinFrame.position.set(-2.4, 6.2, 6.95);
      const bigWinGlass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.6, 0.34), gothicGlassMat);
      bigWinGlass.position.set(-2.4, 6.2, 6.98);
      const roseOculus = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.34, 12), stoneTrimMat);
      roseOculus.rotation.x = Math.PI / 2;
      roseOculus.position.set(-2.4, 12.1, 6.98);
      bGroup.add(bigWinFrame, bigWinGlass, roseOculus);

      // Corner Turret Pinnacle Spire
      const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 15.2, 8), stoneTrimMat);
      turretBase.position.set(1.1, 7.6, 6.8);
      const turretSpire = new THREE.Mesh(new THREE.ConeGeometry(0.95, 5.4, 8), gothicSlateMat);
      turretSpire.position.set(1.1, 17.9, 6.8);
      bGroup.add(turretBase, turretSpire);

      // Side Nave Arcade with 4 Arched Double Wood Doors & Clerestory Windows
      const arcadeXs = [3.0, 5.8, 8.6, 11.4];
      for (const ax of arcadeXs) {
        const doorRecess = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.6, 0.36), stoneTrimMat);
        doorRecess.position.set(ax, 2.2, 7.65);
        const doorWood = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.2, 0.42), gothicDoorMat);
        doorWood.position.set(ax, 2.0, 7.68);
        const clerestoryFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.25), stoneTrimMat);
        clerestoryFrame.position.set(ax, 6.8, 7.55);
        const clerestoryGlass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 0.3), gothicGlassMat);
        clerestoryGlass.position.set(ax, 6.8, 7.58);
        bGroup.add(doorRecess, doorWood, clerestoryFrame, clerestoryGlass);
      }
      // Buttress Piers with Pinnacles along Arcade
      for (const bx of [1.6, 4.4, 7.2, 10.0, 12.7]) {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.65, 8.6, 1.0), stoneTrimMat);
        buttress.position.set(bx, 4.3, 7.85);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.6, 4), stoneTrimMat);
        cap.rotation.y = Math.PI / 4;
        cap.position.set(bx, 9.4, 7.85);
        bGroup.add(buttress, cap);
      }

      disposables.push(
        stoneWallMat,
        gothicSlateMat,
        stoneTrimMat,
        gothicGlassMat,
        gothicDoorMat,
        naveRoofGeo,
        transGableGeo
      );
    } else {
      const mat = new THREE.MeshStandardMaterial({
        map: b.kind === 'mall' ? undefined : resTex,
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

      if (b.kind === 'mall' || b.kind === 'warehouse') {
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

  // Park, Boulevard & Suburban Realistic Leafy Deciduous Trees
  const oakPositions: Array<[number, number]> = [
    // Emerald Park
    [98, 18], [142, 18], [98, 60], [142, 60], [102, 39], [138, 39],
    // Crestview Sage Manor Lawn (-40, -120)
    [-60, -104], [-20, -104], [-60, -138], [-20, -138],
    // Willow Sage Residence Lawn (-40, -196)
    [-58, -188], [-22, -188],
    // Oakridge Colonial Lawn (40, -120)
    [19, -104], [61, -104], [19, -140], [61, -140],
    // Emerald Sage House Lawn (120, -40)
    [98, -22], [142, -22], [98, -58], [142, -58],
    // Solaris Homestead Barn Lawn (-122, -122)
    [-100, -100], [-142, -140],
  ];
  const oakTrunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.44, 4.0, 8),
    trunkMat,
    oakPositions.length
  );
  oakTrunks.castShadow = true;

  const CLUSTERS_PER_TREE = 7;
  const oakCanopyGeo = new THREE.IcosahedronGeometry(1.65, 1);
  const oakCanopyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82 });
  const oakCanopies = new THREE.InstancedMesh(
    oakCanopyGeo,
    oakCanopyMat,
    oakPositions.length * CLUSTERS_PER_TREE
  );
  oakCanopies.castShadow = true;
  oakCanopies.receiveShadow = true;

  const CARDS_PER_TREE = 8;
  const leafCardGeo = new THREE.PlaneGeometry(3.2, 3.2);
  const leafCardMat = new THREE.MeshStandardMaterial({
    map: leafCanopyTex,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
    roughness: 0.78,
  });
  const oakLeafCards = new THREE.InstancedMesh(
    leafCardGeo,
    leafCardMat,
    oakPositions.length * CARDS_PER_TREE
  );
  oakLeafCards.castShadow = false;

  const clusterOffsets: Array<[number, number, number, number]> = [
    [0, 5.2, 0, 1.15],
    [-1.25, 4.4, 0.65, 0.92],
    [1.28, 4.35, 0.55, 0.9],
    [0.2, 4.5, -1.25, 0.95],
    [-0.95, 5.55, -0.75, 0.84],
    [0.95, 5.45, 0.85, 0.85],
    [0.05, 6.15, 0.1, 0.82],
  ];

  let clusterIdx = 0;
  let cardIdx = 0;
  oakPositions.forEach(([ox, oz], idx) => {
    const tScale = 0.88 + (idx % 4) * 0.1;
    const tYaw = idx * 1.17;
    const cosY = Math.cos(tYaw);
    const sinY = Math.sin(tYaw);

    dummy.position.set(ox, 2.0 * tScale, oz);
    dummy.rotation.set(0, tYaw, 0);
    dummy.scale.setScalar(tScale);
    dummy.updateMatrix();
    oakTrunks.setMatrixAt(idx, dummy.matrix);

    for (let c = 0; c < CLUSTERS_PER_TREE; c++) {
      const [lx, ly, lz, cs] = clusterOffsets[c];
      const wx = ox + (lx * cosY - lz * sinY) * tScale;
      const wz = oz + (lx * sinY + lz * cosY) * tScale;
      dummy.position.set(wx, ly * tScale, wz);
      dummy.rotation.set(c * 0.4, tYaw + c * 0.9, c * 0.25);
      dummy.scale.setScalar(cs * tScale);
      dummy.updateMatrix();
      oakCanopies.setMatrixAt(clusterIdx, dummy.matrix);
      colorVar.setHSL(0.28 + ((idx + c) % 4) * 0.015, 0.52, 0.24 + ((idx * 3 + c) % 4) * 0.035);
      oakCanopies.setColorAt(clusterIdx, colorVar);
      clusterIdx++;
    }

    for (let k = 0; k < CARDS_PER_TREE; k++) {
      const ang = tYaw + (k * Math.PI * 2) / CARDS_PER_TREE;
      const rad = k < 4 ? 1.35 * tScale : 0.75 * tScale;
      const ky = (k < 4 ? 4.6 : 5.65) * tScale;
      dummy.position.set(ox + Math.cos(ang) * rad, ky, oz + Math.sin(ang) * rad);
      dummy.rotation.set(0.35 + (k % 2) * 0.45, ang + 0.6, (k % 3) * 0.35);
      dummy.scale.setScalar(tScale);
      dummy.updateMatrix();
      oakLeafCards.setMatrixAt(cardIdx, dummy.matrix);
      colorVar.setHSL(0.27 + ((idx + k) % 3) * 0.016, 0.48, 0.82 + (k % 3) * 0.06);
      oakLeafCards.setColorAt(cardIdx, colorVar);
      cardIdx++;
    }
  });
  oakTrunks.instanceMatrix.needsUpdate = true;
  oakCanopies.instanceMatrix.needsUpdate = true;
  if (oakCanopies.instanceColor) oakCanopies.instanceColor.needsUpdate = true;
  oakLeafCards.instanceMatrix.needsUpdate = true;
  if (oakLeafCards.instanceColor) oakLeafCards.instanceColor.needsUpdate = true;
  oakTrunks.computeBoundingSphere();
  oakCanopies.computeBoundingSphere();
  oakLeafCards.computeBoundingSphere();
  cityGroup.add(oakTrunks, oakCanopies, oakLeafCards);
  disposables.push(oakCanopyGeo, oakCanopyMat, leafCardGeo, leafCardMat);

  // 10b. Photorealistic Instanced 3D Grass Meadows, Fallen Autumn Leaves & Smooth River Boulders
  const grassZones: Array<{ cx: number; cz: number; half: number; exclX?: number; exclZ?: number; exclR?: number }> = [
    { cx: 120, cz: 40, half: 26, exclX: 120, exclZ: 33, exclR: 13 }, // Emerald Park
    { cx: -120, cz: -120, half: 26, exclX: -122, exclZ: -122, exclR: 15 }, // Homestead Barn Lawn
    { cx: -40, cz: -120, half: 26, exclX: -40, exclZ: -122, exclR: 12 }, // Crestview Sage Lawn
    { cx: -40, cz: -196, half: 18, exclX: -40, exclZ: -196, exclR: 11 }, // Willow Sage Lawn
    { cx: 40, cz: -120, half: 26, exclX: 40, exclZ: -126, exclR: 15 }, // Oakridge Colonial Lawn
    { cx: 120, cz: -40, half: 26, exclX: 120, exclZ: -40, exclR: 12 }, // Emerald Sage Lawn
  ];

  // Multi-blade 3D crossed grass tuft BufferGeometry (3 angled tapered blades per tuft)
  const tuftGeo = new THREE.BufferGeometry();
  const tVerts: number[] = [];
  const tNorms: number[] = [];
  for (let bIdx = 0; bIdx < 3; bIdx++) {
    const a = (bIdx * Math.PI * 2) / 3 + 0.25;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const w = 0.065;
    const h = bIdx === 0 ? 0.44 : 0.36;
    const lean = 0.12;
    const p1x = -sa * w;
    const p1z = ca * w;
    const p2x = sa * w;
    const p2z = -ca * w;
    const tipX = ca * lean;
    const tipZ = sa * lean;
    tVerts.push(p1x, 0, p1z, p2x, 0, p2z, tipX, h, tipZ);
    tNorms.push(ca * 0.5, 0.85, sa * 0.5, ca * 0.5, 0.85, sa * 0.5, ca * 0.5, 0.85, sa * 0.5);
  }
  tuftGeo.setAttribute('position', new THREE.Float32BufferAttribute(tVerts, 3));
  tuftGeo.setAttribute('normal', new THREE.Float32BufferAttribute(tNorms, 3));

  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  const TOTAL_GRASS = 2200;
  const grassInst = new THREE.InstancedMesh(tuftGeo, bladeMat, TOTAL_GRASS);

  const leafGeo = new THREE.PlaneGeometry(0.18, 0.1);
  leafGeo.rotateX(-Math.PI / 2);
  const leafMat = new THREE.MeshStandardMaterial({ color: '#8f5d32', roughness: 0.9, side: THREE.DoubleSide });
  const TOTAL_LEAVES = 280;
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, TOTAL_LEAVES);

  let gCursor = 0;
  let lCursor = 0;
  for (let i = 0; i < TOTAL_GRASS + 700 && gCursor < TOTAL_GRASS; i++) {
    const zInfo = grassZones[i % grassZones.length];
    const rx = zInfo.cx + (Math.sin(i * 19.7) * 0.94) * zInfo.half;
    const rz = zInfo.cz + (Math.cos(i * 31.3) * 0.94) * zInfo.half;
    if (zInfo.exclR && Math.hypot(rx - (zInfo.exclX ?? 0), rz - (zInfo.exclZ ?? 0)) < zInfo.exclR) continue;

    dummy.position.set(rx, 0.04, rz);
    dummy.rotation.set((Math.sin(i * 7.1) * 0.16), (i * 1.1) % (Math.PI * 2), (Math.cos(i * 5.3) * 0.16));
    const gs = 0.82 + ((i * 13) % 10) * 0.068;
    dummy.scale.set(gs, gs * 1.15, gs);
    dummy.updateMatrix();
    grassInst.setMatrixAt(gCursor, dummy.matrix);
    colorVar.setHSL(0.25 + ((i * 7) % 5) * 0.014, 0.56, 0.28 + ((i * 3) % 4) * 0.042);
    grassInst.setColorAt(gCursor, colorVar);
    gCursor++;

    if (lCursor < TOTAL_LEAVES && i % 9 === 0) {
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
  disposables.push(tuftGeo, bladeMat, leafGeo, leafMat);

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

  // Instanced Runway Edge Guidance Lights
  const rwLightGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.28, 8);
  const rwLightMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  const rwLightCount = 24;
  const rwLights = new THREE.InstancedMesh(rwLightGeo, rwLightMat, rwLightCount);
  for (let i = 0; i < 12; i++) {
    const zPos = -60 + i * 15.5;
    for (let s = 0; s < 2; s++) {
      const xPos = -246 + (s === 0 ? -12.3 : 12.3);
      dummy.position.set(xPos, 0.16, zPos);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rwLights.setMatrixAt(i * 2 + s, dummy.matrix);
    }
  }
  rwLights.instanceMatrix.needsUpdate = true;
  rwLights.computeBoundingSphere();
  cityGroup.add(rwLights);
  disposables.push(rwLightGeo, rwLightMat);



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
    const hillY = getNorthernHillsElevation(px, pz);
    dummy.position.set(px, hillY + 3.1 * sc, pz);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    pineTrunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px, hillY + 8.4 * sc, pz);
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
    [286, -148, 17, 19],
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

  // 16b. FORT SOLARIS ARMY CAMP PERIMETER BOUNDARY & CHECKPOINT (x: 192..268, z: -156..-76)
  const armyPadMat = new THREE.MeshStandardMaterial({ color: '#6b6556', roughness: 0.92 });
  const armyCompoundFloor = new THREE.Mesh(new THREE.PlaneGeometry(76, 80), armyPadMat);
  armyCompoundFloor.rotation.x = -Math.PI / 2;
  armyCompoundFloor.position.set(230, 0.06, -116);
  armyCompoundFloor.receiveShadow = true;

  const armyAccessRoad = new THREE.Mesh(new THREE.PlaneGeometry(58, 13), armyPadMat);
  armyAccessRoad.rotation.x = -Math.PI / 2;
  armyAccessRoad.position.set(197, 0.065, -116);
  armyAccessRoad.receiveShadow = true;
  cityGroup.add(armyCompoundFloor, armyAccessRoad);

  const wallPanelMat = new THREE.MeshStandardMaterial({ map: armyWallTex, roughness: 0.84 });
  const wallBaseMat = new THREE.MeshStandardMaterial({ color: '#5c584d', roughness: 0.9 });
  const wireMetalMat = new THREE.MeshStandardMaterial({ color: '#a1a1aa', roughness: 0.45, metalness: 0.65 });
  const oliveArmyMat = new THREE.MeshStandardMaterial({ color: '#4b5332', roughness: 0.78 });
  const sandbagMat = new THREE.MeshStandardMaterial({ color: '#b59e72', roughness: 0.92 });

  // Collect 4m concrete perimeter wall segments along North, South, East, West-North & West-South
  const wallSegs: Array<{ x: number; z: number; rotY: number }> = [];
  // North wall (x: 194..266, z: -156) & South wall (x: 194..266, z: -76)
  for (let wx = 194; wx <= 266; wx += 4) {
    wallSegs.push({ x: wx, z: -156, rotY: 0 });
    wallSegs.push({ x: wx, z: -76, rotY: Math.PI });
  }
  // East wall (x: 268, z: -154..-78)
  for (let wz = -154; wz <= -78; wz += 4) {
    wallSegs.push({ x: 268, z: wz, rotY: Math.PI / 2 });
  }
  // West wall North wing (x: 192, z: -154..-124) & South wing (x: 192, z: -108..-78) leaving 14m open gate
  for (let wz = -154; wz <= -124; wz += 4) {
    wallSegs.push({ x: 192, z: wz, rotY: -Math.PI / 2 });
  }
  for (let wz = -108; wz <= -78; wz += 4) {
    wallSegs.push({ x: 192, z: wz, rotY: -Math.PI / 2 });
  }

  const segGeo = new THREE.BoxGeometry(3.92, 3.6, 1.1);
  const segBaseGeo = new THREE.BoxGeometry(4.0, 0.72, 1.75);
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6);
  const wireCoilGeo = new THREE.TorusGeometry(0.32, 0.032, 5, 12);

  const wallSegInst = new THREE.InstancedMesh(segGeo, wallPanelMat, wallSegs.length);
  wallSegInst.castShadow = true;
  wallSegInst.receiveShadow = true;
  const wallBaseInst = new THREE.InstancedMesh(segBaseGeo, wallBaseMat, wallSegs.length);
  const wirePostInst = new THREE.InstancedMesh(postGeo, wireMetalMat, wallSegs.length);
  const wireCoilInst = new THREE.InstancedMesh(wireCoilGeo, wireMetalMat, wallSegs.length * 2);

  wallSegs.forEach((seg, idx) => {
    dummy.position.set(seg.x, 1.8, seg.z);
    dummy.rotation.set(0, seg.rotY, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    wallSegInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(seg.x, 0.36, seg.z);
    dummy.updateMatrix();
    wallBaseInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(seg.x, 3.98, seg.z);
    dummy.updateMatrix();
    wirePostInst.setMatrixAt(idx, dummy.matrix);

    for (let c = 0; c < 2; c++) {
      const off = c === 0 ? -1.0 : 1.0;
      const cx = seg.x + Math.cos(seg.rotY) * off;
      const cz = seg.z - Math.sin(seg.rotY) * off;
      dummy.position.set(cx, 4.18, cz);
      dummy.rotation.set(0.2, seg.rotY + Math.PI / 2, 0);
      dummy.updateMatrix();
      wireCoilInst.setMatrixAt(idx * 2 + c, dummy.matrix);
    }
  });
  wallSegInst.instanceMatrix.needsUpdate = true;
  wallBaseInst.instanceMatrix.needsUpdate = true;
  wirePostInst.instanceMatrix.needsUpdate = true;
  wireCoilInst.instanceMatrix.needsUpdate = true;
  wallSegInst.computeBoundingSphere();
  wallBaseInst.computeBoundingSphere();
  wirePostInst.computeBoundingSphere();
  wireCoilInst.computeBoundingSphere();
  cityGroup.add(wallSegInst, wallBaseInst, wirePostInst, wireCoilInst);

  // 4 Corner Guard Watchtowers
  const towerCorners: Array<[number, number]> = [
    [192, -156],
    [192, -76],
    [268, -156],
    [268, -76],
  ];
  const legGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.8, 7);
  const deckGeo = new THREE.BoxGeometry(4.2, 0.35, 4.2);
  const parapetGeo = new THREE.BoxGeometry(4.35, 1.1, 4.35);
  const towerRoofGeo = new THREE.ConeGeometry(3.4, 1.35, 4);

  const towerLegInst = new THREE.InstancedMesh(legGeo, trimMat, 16);
  const towerDeckInst = new THREE.InstancedMesh(deckGeo, wallBaseMat, 4);
  const towerParapetInst = new THREE.InstancedMesh(parapetGeo, oliveArmyMat, 4);
  const towerRoofInst = new THREE.InstancedMesh(towerRoofGeo, oliveArmyMat, 4);
  towerDeckInst.castShadow = true;
  towerParapetInst.castShadow = true;

  towerCorners.forEach(([tx, tz], tIdx) => {
    let lIdx = tIdx * 4;
    for (const sx of [-1.45, 1.45]) {
      for (const sz of [-1.45, 1.45]) {
        dummy.position.set(tx + sx, 2.85, tz + sz);
        dummy.rotation.set(sz * 0.04, 0, -sx * 0.04);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        towerLegInst.setMatrixAt(lIdx++, dummy.matrix);
      }
    }
    dummy.position.set(tx, 5.75, tz);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    towerDeckInst.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(tx, 6.48, tz);
    dummy.updateMatrix();
    towerParapetInst.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(tx, 8.9, tz);
    dummy.rotation.set(0, Math.PI / 4, 0);
    dummy.updateMatrix();
    towerRoofInst.setMatrixAt(tIdx, dummy.matrix);

    for (const px of [-1.65, 1.65]) {
      for (const pz of [-1.65, 1.65]) {
        const roofPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.9, 6), trimMat);
        roofPost.position.set(tx + px, 7.6, tz + pz);
        cityGroup.add(roofPost);
      }
    }
  });
  towerLegInst.instanceMatrix.needsUpdate = true;
  towerDeckInst.instanceMatrix.needsUpdate = true;
  towerParapetInst.instanceMatrix.needsUpdate = true;
  towerRoofInst.instanceMatrix.needsUpdate = true;
  towerLegInst.computeBoundingSphere();
  towerDeckInst.computeBoundingSphere();
  towerParapetInst.computeBoundingSphere();
  towerRoofInst.computeBoundingSphere();
  cityGroup.add(towerLegInst, towerDeckInst, towerParapetInst, towerRoofInst);

  // West Entrance Checkpoint Guard Booth, Bollards & Raised Striped Barrier Arm (x = 192, z = -116)
  const gateBooth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 3.0), oliveArmyMat);
  gateBooth.position.set(191.5, 1.4, -124.2);
  gateBooth.castShadow = true;
  const boothGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.9, 2.4),
    new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.08, clearcoat: 1.0 })
  );
  boothGlass.position.set(191.5, 1.85, -124.2);
  const gateBanner = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 15.2), oliveArmyMat);
  gateBanner.position.set(192, 5.2, -116);
  const gateSignGlow = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.65, 9.5),
    new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#f59e0b', emissiveIntensity: 0.45 })
  );
  gateSignGlow.position.set(192, 5.2, -116);
  const gateArmPivot = new THREE.Group();
  gateArmPivot.position.set(190.4, 1.15, -122.0);
  gateArmPivot.rotation.x = 0.85; // Raised cleanly open so cars/horses pass freely
  const armRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 6.2),
    new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 })
  );
  armRed.position.set(0, 0, 3.1);
  const armWhite = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 2.4),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 })
  );
  armWhite.position.set(0, 0, 2.8);
  gateArmPivot.add(armRed, armWhite);
  cityGroup.add(gateBooth, boothGlass, gateBanner, gateSignGlow, gateArmPivot);

  for (const gz of [-122.4, -109.6]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.9, 1.4), wallBaseMat);
    pillar.position.set(192, 2.45, gz);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#f59e0b' })
    );
    beacon.position.set(192, 5.9, gz);
    cityGroup.add(pillar, beacon);
  }

  // Interior Sandbag Bunker & Instanced Military Cargo Crates
  const sandbagWall = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.25, 1.4), sandbagMat);
  sandbagWall.position.set(228, 0.625, -124);
  sandbagWall.receiveShadow = true;
  cityGroup.add(sandbagWall);

  const crateCoords: Array<[number, number, number]> = [
    [232, -128, 0.2],
    [234, -128, -0.1],
    [233, -126, 0.4],
    [232, -102, 0.0],
    [234.2, -102, 0.3],
    [206, -130, 0.15],
  ];
  const crateInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), oliveArmyMat, crateCoords.length);
  crateCoords.forEach(([cx, cz, rot], idx) => {
    dummy.position.set(cx, 0.55, cz);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    crateInst.setMatrixAt(idx, dummy.matrix);
  });
  crateInst.instanceMatrix.needsUpdate = true;
  crateInst.computeBoundingSphere();
  cityGroup.add(crateInst);

  disposables.push(
    armyPadMat,
    wallPanelMat,
    wallBaseMat,
    wireMetalMat,
    oliveArmyMat,
    sandbagMat,
    segGeo,
    segBaseGeo,
    postGeo,
    wireCoilGeo,
    legGeo,
    deckGeo,
    parapetGeo,
    towerRoofGeo
  );

  // 17. SOLARIS MARINA SLIP & MOORED LUXURY YACHT (SE Waterfront)
  const marinaPier = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.35, 52), woodMat);
  marinaPier.position.set(118, 0.92, 212);
  marinaPier.castShadow = true;
  cityGroup.add(marinaPier);

  // Offshore Luxury Motor Yacht at [148, 252]
  const yachtGroup = new THREE.Group();
  yachtGroup.position.set(148, -0.15, 252);
  yachtGroup.rotation.y = -0.35;

  const yWhiteHullMat = new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    roughness: 0.18,
    metalness: 0.06,
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
  });
  const yNavyStripeMat = new THREE.MeshStandardMaterial({
    color: '#0f2942',
    roughness: 0.3,
    metalness: 0.2,
  });
  const yTeakDeckMat = new THREE.MeshStandardMaterial({
    color: '#9a6b42',
    roughness: 0.72,
    metalness: 0.04,
  });
  const yGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#0b1322',
    roughness: 0.06,
    metalness: 0.15,
    clearcoat: 1.0,
  });
  const yChromeMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.2,
    metalness: 0.9,
  });
  const yCreamMat = new THREE.MeshStandardMaterial({
    color: '#f1ede4',
    roughness: 0.55,
  });

  // Tapered V-hull planform (bow at +Z = +12.5, stern at -Z = -10.5)
  const yachtShape = new THREE.Shape();
  yachtShape.moveTo(0, 12.6);
  yachtShape.quadraticCurveTo(2.9, 8.2, 3.2, 2.0);
  yachtShape.lineTo(3.15, -9.8);
  yachtShape.quadraticCurveTo(2.6, -10.6, 0, -10.6);
  yachtShape.quadraticCurveTo(-2.6, -10.6, -3.15, -9.8);
  yachtShape.lineTo(-3.2, 2.0);
  yachtShape.quadraticCurveTo(-2.9, 8.2, 0, 12.6);
  yachtShape.closePath();

  const yBootGeo = new THREE.ExtrudeGeometry(yachtShape, { depth: 0.75, bevelEnabled: false });
  yBootGeo.rotateX(Math.PI / 2);
  const yBoot = new THREE.Mesh(yBootGeo, yNavyStripeMat);
  yBoot.position.y = 0.65;

  const yMainHullGeo = new THREE.ExtrudeGeometry(yachtShape, {
    depth: 1.45,
    bevelEnabled: true,
    bevelSize: 0.16,
    bevelThickness: 0.18,
    bevelSegments: 2,
  });
  yMainHullGeo.rotateX(Math.PI / 2);
  const yMainHull = new THREE.Mesh(yMainHullGeo, yWhiteHullMat);
  yMainHull.position.y = 2.05;
  yMainHull.castShadow = true;
  yMainHull.receiveShadow = true;

  // Stern teak swim platform & aft transom steps
  const ySwimPlat = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 2.1), yTeakDeckMat);
  ySwimPlat.position.set(0, 0.58, -11.1);
  const yForeTeak = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 6.4), yTeakDeckMat);
  yForeTeak.position.set(0, 2.25, 6.2);
  const yAftTeak = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.08, 3.8), yTeakDeckMat);
  yAftTeak.position.set(0, 2.25, -8.3);

  // Sunbed cushions on foredeck
  const yBowPad = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 3.1), yCreamMat);
  yBowPad.position.set(0, 2.38, 6.4);

  // Main saloon superstructure with swept-back profile
  const ySalon = new THREE.Mesh(new THREE.BoxGeometry(4.75, 1.55, 10.6), yWhiteHullMat);
  ySalon.position.set(0, 2.95, -1.3);
  ySalon.castShadow = true;

  const ySalonFront = new THREE.Mesh(new THREE.BoxGeometry(4.65, 1.35, 2.6), yWhiteHullMat);
  ySalonFront.position.set(0, 2.78, 4.1);
  ySalonFront.rotation.x = 0.34;

  // Wrap-around dark glass band + hull portholes
  const ySalonGlass = new THREE.Mesh(new THREE.BoxGeometry(4.88, 0.78, 8.6), yGlassMat);
  ySalonGlass.position.set(0, 3.05, -0.8);
  const yWindshield = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.85, 0.3), yGlassMat);
  yWindshield.position.set(0, 3.15, 4.15);
  yWindshield.rotation.x = -0.52;

  for (const side of [-1, 1]) {
    for (const pz of [2.5, -0.8, -4.1]) {
      const portWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 1.45), yGlassMat);
      portWin.position.set(side * 3.18, 1.48, pz);
      yachtGroup.add(portWin);
    }
    // Stainless bow rail bars
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 8.2, 6), yChromeMat);
    rail.rotation.x = Math.PI / 2;
    rail.rotation.y = side * -0.22;
    rail.position.set(side * 1.95, 2.82, 7.6);
    yachtGroup.add(rail);
  }

  // Upper flybridge deck, helm console & swept radar arch
  const yFlyDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.26, 7.4), yWhiteHullMat);
  yFlyDeck.position.set(0, 3.85, -2.6);
  const yFlyHelm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 1.1), yCreamMat);
  yFlyHelm.position.set(0, 4.3, -0.4);
  const yFlyVisor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.14), yGlassMat);
  yFlyVisor.position.set(0, 4.42, 0.4);
  yFlyVisor.rotation.x = -0.45;
  const yRadarArch = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.16, 8, 18, Math.PI), yWhiteHullMat);
  yRadarArch.position.set(0, 3.92, -3.5);
  const ySatDome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), yWhiteHullMat);
  ySatDome.position.set(0, 6.22, -3.5);
  const yMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.1, 8), yChromeMat);
  yMast.position.set(0, 6.55, -3.8);

  // Twin outboard / stern wake trim + aft sofa
  const yAftSofa = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 1.15), yCreamMat);
  yAftSofa.position.set(0, 2.6, -9.2);

  yachtGroup.add(
    yBoot,
    yMainHull,
    ySwimPlat,
    yForeTeak,
    yAftTeak,
    yBowPad,
    ySalon,
    ySalonFront,
    ySalonGlass,
    yWindshield,
    yFlyDeck,
    yFlyHelm,
    yFlyVisor,
    yRadarArch,
    ySatDome,
    yMast,
    yAftSofa
  );
  cityGroup.add(yachtGroup);

  // 18. TEN CARGO OIL TANKER SHIP (Offshore Harbor Ocean Landmark at x: -78, z: 274)
  const tankerGroup = new THREE.Group();
  tankerGroup.position.set(-78, -0.45, 274);
  tankerGroup.rotation.y = Math.PI / 2;

  const tCrimsonHullMat = new THREE.MeshStandardMaterial({ color: '#8f1d1d', roughness: 0.62, metalness: 0.15 });
  const tBlackHullMat = new THREE.MeshStandardMaterial({ color: '#14171d', roughness: 0.56, metalness: 0.24 });
  const tHullBannerMat = new THREE.MeshStandardMaterial({ map: tankerTex.hullSide, roughness: 0.52, metalness: 0.22 });
  const tDeckMat = new THREE.MeshStandardMaterial({ color: '#5f6873', roughness: 0.78, metalness: 0.2 });
  const tWhiteBridgeMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.45 });
  const tPipeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35, metalness: 0.65 });
  const tDarkGlassMat = new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.08, clearcoat: 1.0 });
  const tBrassMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.28, metalness: 0.85 });
  const tLifeboatMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.38 });
  const tHeliMat = new THREE.MeshStandardMaterial({ map: tankerTex.helipad, roughness: 0.72 });
  const tFunnelMat = new THREE.MeshStandardMaterial({ map: tankerTex.funnel, roughness: 0.46 });

  // Tapered ocean hull planform (bow at +Z = +34, stern at -Z = -34, half-beam X = 7.2)
  const hullPlan = new THREE.Shape();
  hullPlan.moveTo(0, 34.5);
  hullPlan.quadraticCurveTo(6.4, 28, 7.2, 16);
  hullPlan.lineTo(7.2, -26);
  hullPlan.quadraticCurveTo(6.5, -33, 3.2, -34);
  hullPlan.lineTo(-3.2, -34);
  hullPlan.quadraticCurveTo(-6.5, -33, -7.2, -26);
  hullPlan.lineTo(-7.2, 16);
  hullPlan.quadraticCurveTo(-6.4, 28, 0, 34.5);
  hullPlan.closePath();

  const lowerHullGeo = new THREE.ExtrudeGeometry(hullPlan, { depth: 3.1, bevelEnabled: false });
  lowerHullGeo.rotateX(Math.PI / 2);
  const lowerHull = new THREE.Mesh(lowerHullGeo, tCrimsonHullMat);
  lowerHull.position.y = 2.6;

  const upperHullGeo = new THREE.ExtrudeGeometry(hullPlan, { depth: 3.4, bevelEnabled: false });
  upperHullGeo.rotateX(Math.PI / 2);
  const upperHull = new THREE.Mesh(upperHullGeo, tBlackHullMat);
  upperHull.position.y = 6.0;
  upperHull.castShadow = true;
  upperHull.receiveShadow = true;

  // Bulbous bow + rudder & brass 4-blade propeller
  const bowBulb = new THREE.Mesh(new THREE.SphereGeometry(1.45, 14, 12), tCrimsonHullMat);
  bowBulb.scale.set(0.85, 0.9, 2.1);
  bowBulb.position.set(0, 0.9, 34.2);

  const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.0, 2.6), tCrimsonHullMat);
  rudder.position.set(0, 1.2, -33.2);
  const propHub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 10), tBrassMat);
  propHub.rotation.x = Math.PI / 2;
  propHub.position.set(0, 1.2, -31.4);

  // Slate cargo deck & raised forecastle / stern coaming
  const mainDeckGeo = new THREE.ExtrudeGeometry(hullPlan, { depth: 0.25, bevelEnabled: false });
  mainDeckGeo.rotateX(Math.PI / 2);
  const mainDeck = new THREE.Mesh(mainDeckGeo, tDeckMat);
  mainDeck.position.y = 6.26;
  mainDeck.scale.set(0.96, 1, 0.98);
  mainDeck.receiveShadow = true;

  // Bow Yellow "H" Helipad Deck Circle
  const bowHelipad = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), tHeliMat);
  bowHelipad.rotation.x = -Math.PI / 2;
  bowHelipad.rotation.z = Math.PI / 2;
  bowHelipad.position.set(0, 6.29, 24.5);

  // "TEN" Side Hull Lettering Panels (port & starboard)
  for (const side of [-1, 1]) {
    const tenPanel = new THREE.Mesh(new THREE.PlaneGeometry(28, 3.1), tHullBannerMat);
    tenPanel.position.set(side * 7.24, 4.35, 3.5);
    tenPanel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    tankerGroup.add(tenPanel);

    // Gunwale rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 44), tWhiteBridgeMat);
    rail.position.set(side * 6.95, 6.5, -2);
    tankerGroup.add(rail);
  }

  // Central Pipeline Manifold + Cross Piping
  for (const px of [-1.2, -0.4, 0.4, 1.2]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 36, 8), tPipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(px, 6.55, 2.5);
    tankerGroup.add(pipe);
  }
  const crossManifold = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.55, 1.8), tPipeMat);
  crossManifold.position.set(0, 6.65, 4.0);
  tankerGroup.add(crossManifold);

  // Twin Pedestal Cargo Deck Cranes
  for (const side of [-1, 1]) {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 3.4, 10), tWhiteBridgeMat);
    ped.position.set(side * 4.4, 7.9, 6.0);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.8), tWhiteBridgeMat);
    cab.position.set(side * 4.4, 9.8, 6.0);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 8.8), tWhiteBridgeMat);
    boom.position.set(side * 3.6, 11.4, 1.8);
    boom.rotation.x = -0.32;
    tankerGroup.add(ped, cab, boom);
  }

  // Multi-Tier White Aft Bridge Superstructure
  const deckHouse1 = new THREE.Mesh(new THREE.BoxGeometry(11.6, 4.6, 9.2), tWhiteBridgeMat);
  deckHouse1.position.set(0, 8.5, -20.5);
  deckHouse1.castShadow = true;
  const deckHouse2 = new THREE.Mesh(new THREE.BoxGeometry(10.6, 3.6, 7.8), tWhiteBridgeMat);
  deckHouse2.position.set(0, 12.6, -20.2);
  deckHouse2.castShadow = true;
  const bridgeTier = new THREE.Mesh(new THREE.BoxGeometry(14.8, 2.3, 4.2), tWhiteBridgeMat);
  bridgeTier.position.set(0, 15.5, -18.5);
  bridgeTier.castShadow = true;
  const bridgeGlass = new THREE.Mesh(new THREE.BoxGeometry(10.2, 1.05, 4.35), tDarkGlassMat);
  bridgeGlass.position.set(0, 15.7, -18.45);
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 5.2, 8), tWhiteBridgeMat);
  radarMast.position.set(0, 19.2, -18.6);
  const radarBar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 0.35), tWhiteBridgeMat);
  radarBar.position.set(0, 21.4, -18.6);

  // Navy/Yellow Funnel with Crimson "T" Crest
  const funnelBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.4, 4.6), tWhiteBridgeMat);
  funnelBody.position.set(0, 13.8, -25.8);
  funnelBody.castShadow = true;
  for (const side of [-1, 1]) {
    const fPanel = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.8), tFunnelMat);
    fPanel.position.set(side * 1.72, 13.8, -25.8);
    fPanel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    tankerGroup.add(fPanel);
  }
  const funnelCap = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.85, 4.7), tBlackHullMat);
  funnelCap.position.set(0, 16.7, -25.8);

  // Orange Lifeboat + Stern Mooring Winches
  const lifeboat = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 2.2, 6, 10), tLifeboatMat);
  lifeboat.rotation.x = Math.PI / 2;
  lifeboat.position.set(-5.6, 8.8, -14.8);
  const winchL = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.8, 10), tPipeMat);
  winchL.rotation.z = Math.PI / 2;
  winchL.position.set(-2.2, 6.75, -30.5);
  const winchR = winchL.clone();
  winchR.position.x = 2.2;

  tankerGroup.add(
    lowerHull,
    upperHull,
    bowBulb,
    rudder,
    propHub,
    mainDeck,
    bowHelipad,
    deckHouse1,
    deckHouse2,
    bridgeTier,
    bridgeGlass,
    radarMast,
    radarBar,
    funnelBody,
    funnelCap,
    lifeboat,
    winchL,
    winchR
  );
  cityGroup.add(tankerGroup);
  disposables.push(
    tCrimsonHullMat,
    tBlackHullMat,
    tHullBannerMat,
    tDeckMat,
    tWhiteBridgeMat,
    tPipeMat,
    tDarkGlassMat,
    tBrassMat,
    tLifeboatMat,
    tHeliMat,
    tFunnelMat,
    lowerHullGeo,
    upperHullGeo,
    mainDeckGeo
  );

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
