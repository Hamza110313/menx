import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildSolarisCity } from '../../lib/cityBuilder';
import { audioEngine } from '../../lib/audio';
import {
  INTERACTIVE_ZONES,
  MISSIONS,
  PLAYER_OUTFITS,
  PROPERTIES,
  ROAD_CENTERS,
  VEHICLE_SPECS,
  WEAPONS,
  getDistrictName,
} from '../../lib/gameConfig';
import { gameInput, resetContinuousInputs } from '../../lib/inputState';
import {
  createBlackCatModel,
  createCharacterModel,
  createVehicleModel,
  type CatRig,
  type CharacterRig,
  type CharacterTextureBundle,
  type VehicleDecalBundle,
  type VehicleRig,
} from '../../lib/models';
import { getGroundHeightAt, resolveCircleWorldCollision } from '../../lib/physics';
import { createAtmosphericSkyDome } from '../../lib/sky';
import {
  createCamoTextures,
  createContactShadowTexture,
  createDarkKnightEmblemTexture,
  createDenimTextures,
  createDesertCamoTextures,
  createExpressHoodLiveryTexture,
  createExpressSideLiveryTexture,
  createHoodieTextures,
  createMuscle01DecalTexture,
  createNarutoBackCrestTexture,
  createParagonChestEmblemTexture,
  createPoliceDoorDecalTexture,
  createSkylineR34Textures,
} from '../../lib/textures';
import { useGameStore } from '../../store/gameStore';
import type { LiveTelemetry, WeaponId } from '../../types/game';

interface WorldVehicle {
  uid: string;
  specId: string;
  rig: VehicleRig;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speed: number;
  vy: number;
  steerAngle: number;
  health: number;
  nitro: number;
  fuel: number;
  headlightsManual: boolean | null;
  isPlayerOwned: boolean;
}

interface TrafficAgent {
  rig: VehicleRig;
  x: number;
  z: number;
  axis: 'ns' | 'ew';
  dir: 1 | -1;
  laneCoord: number;
  speed: number;
  maxSpeed: number;
}

interface PoliceAgent {
  rig: VehicleRig;
  x: number;
  z: number;
  rotationY: number;
  speed: number;
  active: boolean;
}

interface PoliceOfficerAgent {
  rig: CharacterRig;
  x: number;
  z: number;
  rotY: number;
  walkPhase: number;
  fireTimer: number;
  stunTimer: number;
  active: boolean;
}

interface PedestrianAgent {
  rig: CharacterRig;
  x: number;
  z: number;
  rotY: number;
  walkPhase: number;
  speed: number;
  turnTimer: number;
  hp: number;
  active: boolean;
  looted: boolean;
}

interface BlackCatAgent {
  rig: CatRig;
  x: number;
  z: number;
  rotY: number;
  walkPhase: number;
  speed: number;
  turnTimer: number;
}

interface SparkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface BulletTracer {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  life: number;
}

const TAXI_DESTINATIONS = [
  { label: 'Sunset Diner, Westside', x: -116, z: 24 },
  { label: 'Solaris Ocean Pier', x: 0, z: 178 },
  { label: 'Grand Solaris Mall', x: -94, z: -32 },
  { label: 'Harbor Customs Garage', x: -108, z: 108 },
  { label: 'SBPD Precinct Plaza', x: 96, z: -118 },
  { label: 'Solaris International Airport', x: -192, z: -18 },
  { label: 'Solaris Marina & Yacht Club', x: 118, z: 186 },
  { label: 'Oakridge Colonial, Midtown', x: 40, z: -106 },
];

// Pre-allocated math helpers (Zero GC in render loop)
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _sunDir = new THREE.Vector3();
const _horizonCol = new THREE.Color();
const _sunColorDay = new THREE.Color('#fff7ed');
const _sunColorSunset = new THREE.Color('#fb923c');
const _sunColorNight = new THREE.Color('#60a5fa');
const _hemiSkyDay = new THREE.Color('#93c5fd');
const _hemiSkyNight = new THREE.Color('#1e293b');
const _rimDayCol = new THREE.Color('#38bdf8');
const _rimSunsetCol = new THREE.Color('#fb7185');
const _rimNightCol = new THREE.Color('#3b82f6');
const _skidDummy = new THREE.Object3D();
const _splashDummy = new THREE.Object3D();
const _hvEyePos = new THREE.Vector3();
const _hvTargetPos = new THREE.Vector3();
const _hvDir = new THREE.Vector3();
const _hvMid = new THREE.Vector3();
const _hvUp = new THREE.Vector3(0, 1, 0);

export function GameCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection
    let isSoftwareGl = false;
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) {
        isSoftwareGl = true;
      } else {
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      }
    } catch {
      isSoftwareGl = true;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL rendering is unavailable in this browser context.');
      return;
    }

    const initW = container.clientWidth || window.innerWidth;
    const initH = container.clientHeight || window.innerHeight;
    let lastGraphicsQuality = useGameStore.getState().settings.graphicsQuality;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.setPixelRatio(
      isSoftwareGl
        ? 1
        : lastGraphicsQuality === 'medium'
          ? 1.0
          : Math.min(window.devicePixelRatio, 1.35)
    );
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D graphics context was paused. Restore tab or reload to continue.');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 2. Scene, SkyDome, Camera & RoomEnvironment IBL
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#bae6fd', 0.0024);

    const skyDome = createAtmosphericSkyDome();
    scene.add(skyDome.mesh);

    const camera = new THREE.PerspectiveCamera(62, initW / initH, 0.2, 760);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.62;
    pmrem.dispose();

    let composer: EffectComposer | null = null;
    let bloomTarget: THREE.WebGLRenderTarget | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      bloomTarget = new THREE.WebGLRenderTarget(initW, initH, {
        type: THREE.HalfFloatType,
        samples: 0,
      });
      composer = new EffectComposer(renderer, bloomTarget);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.14, 0.35, 0.96);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    // 3. Balanced Warm/Cool 3-Point Outdoor Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#93c5fd', '#3f3f46', 0.48);
    hemiLight.position.set(0, 120, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fff7ed', 1.22);
    sunLight.position.set(85, 130, 65);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const shadowBound = 82;
    sunLight.shadow.camera.left = -shadowBound;
    sunLight.shadow.camera.right = shadowBound;
    sunLight.shadow.camera.top = shadowBound;
    sunLight.shadow.camera.bottom = -shadowBound;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 340;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.025;
    sunLight.shadow.radius = 2;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.28);
    rimLight.position.set(-70, 55, -80);
    scene.add(rimLight);

    // 4. Build Solaris City
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const city = buildSolarisCity(maxAniso);
    scene.add(city.cityGroup);

    const shadowTex = createContactShadowTexture();
    const camoTextures = createCamoTextures(maxAniso);
    const desertCamoTextures = createDesertCamoTextures(maxAniso);
    const hoodieTextures = createHoodieTextures(maxAniso);
    const denimTextures = createDenimTextures(maxAniso);
    const paragonEmblemTex = createParagonChestEmblemTexture(maxAniso);
    const darkKnightEmblemTex = createDarkKnightEmblemTexture(maxAniso);
    const uzumakiCrestTex = createNarutoBackCrestTexture(maxAniso);
    const charTextures: CharacterTextureBundle = {
      camo: camoTextures,
      desertCamo: desertCamoTextures,
      hoodie: hoodieTextures,
      denim: denimTextures,
      paragonEmblem: paragonEmblemTex,
      darkKnightEmblem: darkKnightEmblemTex,
      uzumakiCrest: uzumakiCrestTex,
    };
    const skylineR34Tex = createSkylineR34Textures(maxAniso);
    const vehicleTextures: VehicleDecalBundle = {
      policeDoor: createPoliceDoorDecalTexture(maxAniso),
      muscle01: createMuscle01DecalTexture(maxAniso),
      expressSide: createExpressSideLiveryTexture(maxAniso),
      expressHood: createExpressHoodLiveryTexture(maxAniso),
      skylineHood: skylineR34Tex.hoodMap,
      skylineSide: skylineR34Tex.sideLiveryMap,
    };

    // 5. Tire Skid Marks, Sparks & Pre-allocated Bullet Tracers
    const MAX_SKIDS = 240;
    const skidGeo = new THREE.PlaneGeometry(0.32, 0.95);
    skidGeo.rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({
      color: '#09090b',
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const skidInst = new THREE.InstancedMesh(skidGeo, skidMat, MAX_SKIDS);
    skidInst.frustumCulled = false;
    _skidDummy.position.set(0, -10, 0);
    _skidDummy.scale.setScalar(0.001);
    _skidDummy.updateMatrix();
    for (let i = 0; i < MAX_SKIDS; i++) skidInst.setMatrixAt(i, _skidDummy.matrix);
    skidInst.instanceMatrix.needsUpdate = true;
    scene.add(skidInst);
    let skidCursor = 0;

    const addSkidPair = (cx: number, cz: number, rotY: number, halfTrack: number) => {
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      const rearX = cx - sinR * 1.1;
      const rearZ = cz - cosR * 1.1;
      for (const side of [-1, 1]) {
        _skidDummy.position.set(rearX + cosR * side * halfTrack, 0.055, rearZ - sinR * side * halfTrack);
        _skidDummy.rotation.set(0, rotY, 0);
        _skidDummy.scale.set(1, 1, 1);
        _skidDummy.updateMatrix();
        skidInst.setMatrixAt(skidCursor, _skidDummy.matrix);
        skidCursor = (skidCursor + 1) % MAX_SKIDS;
      }
      skidInst.instanceMatrix.needsUpdate = true;
    };

    const MAX_SPARKS = 90;
    const sparkPool: SparkParticle[] = [];
    const sparkPositions = new Float32Array(MAX_SPARKS * 3);
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: '#fbbf24',
      size: 0.34,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    sparkPoints.frustumCulled = false;
    scene.add(sparkPoints);

    const spawnImpactSparks = (x: number, y: number, z: number, count = 12) => {
      for (let i = 0; i < count; i++) {
        if (sparkPool.length >= MAX_SPARKS) sparkPool.shift();
        sparkPool.push({
          x,
          y: y + 0.5,
          z,
          vx: (Math.random() - 0.5) * 13,
          vy: 2.2 + Math.random() * 5.5,
          vz: (Math.random() - 0.5) * 13,
          life: 0.4 + Math.random() * 0.25,
        });
      }
    };

    // Bullet Tracers Pool (Zero per-frame allocation)
    const MAX_TRACERS = 14;
    const tracerPool: BulletTracer[] = [];
    const tracerVerts = new Float32Array(MAX_TRACERS * 6);
    const tracerGeo = new THREE.BufferGeometry();
    tracerGeo.setAttribute('position', new THREE.BufferAttribute(tracerVerts, 3));
    const tracerMat = new THREE.LineBasicMaterial({
      color: '#fde047',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tracerLines = new THREE.LineSegments(tracerGeo, tracerMat);
    tracerLines.frustumCulled = false;
    scene.add(tracerLines);

    const addTracer = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      if (tracerPool.length >= MAX_TRACERS) tracerPool.shift();
      tracerPool.push({ x1, y1, z1, x2, y2, z2, life: 0.085 });
    };

    // Pre-allocated Paragon Twin Heat Vision Laser Beams & Kinetic Shockwave Ring
    const heatBeamGeo = new THREE.CylinderGeometry(0.032, 0.048, 1, 8, 1, true);
    const heatBeamMat = new THREE.MeshBasicMaterial({
      color: '#ff2d20',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const heatBeamLeft = new THREE.Mesh(heatBeamGeo, heatBeamMat);
    const heatBeamRight = new THREE.Mesh(heatBeamGeo, heatBeamMat);
    heatBeamLeft.frustumCulled = false;
    heatBeamRight.frustumCulled = false;
    heatBeamLeft.visible = false;
    heatBeamRight.visible = false;
    const heatImpactSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: city.glowSpriteTex,
        color: '#ff4d2e',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    heatImpactSprite.scale.set(2.2, 2.2, 1);
    heatImpactSprite.visible = false;
    scene.add(heatBeamLeft, heatBeamRight, heatImpactSprite);

    const shockRingGeo = new THREE.RingGeometry(0.7, 1.15, 36);
    shockRingGeo.rotateX(-Math.PI / 2);
    const shockRingMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockRingMesh = new THREE.Mesh(shockRingGeo, shockRingMat);
    shockRingMesh.visible = false;
    scene.add(shockRingMesh);

    // 6. Mission Checkpoint Beacon & GPS / Taxi Cyan Beacon
    const missionBeaconGroup = new THREE.Group();
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.4, 32),
      new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.14;
    const beaconBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.4, 48, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#fbbf24',
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beaconBeam.position.y = 24;
    missionBeaconGroup.add(beaconRing, beaconBeam);
    missionBeaconGroup.visible = false;
    scene.add(missionBeaconGroup);

    const gpsBeaconGroup = new THREE.Group();
    const gpsRing = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.9, 28),
      new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      })
    );
    gpsRing.rotation.x = -Math.PI / 2;
    gpsRing.position.y = 0.16;
    const gpsBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.1, 56, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#22d3ee',
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    gpsBeam.position.y = 28;
    gpsBeaconGroup.add(gpsRing, gpsBeam);
    gpsBeaconGroup.visible = false;
    scene.add(gpsBeaconGroup);

    // 7. Slanted Rain Streaks & Ground Puddle Splashes
    const rainCount = 700;
    const rainSeeds = new Float32Array(rainCount * 3);
    const rainVerts = new Float32Array(rainCount * 6);
    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 90;
      const ry = Math.random() * 36;
      const rz = (Math.random() - 0.5) * 90;
      rainSeeds[i * 3] = rx;
      rainSeeds[i * 3 + 1] = ry;
      rainSeeds[i * 3 + 2] = rz;
      rainVerts[i * 6] = rx;
      rainVerts[i * 6 + 1] = ry;
      rainVerts[i * 6 + 2] = rz;
      rainVerts[i * 6 + 3] = rx + 0.16;
      rainVerts[i * 6 + 4] = ry + 1.05;
      rainVerts[i * 6 + 5] = rz + 0.08;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainVerts, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: '#cbd5e1',
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const rainLines = new THREE.LineSegments(rainGeo, rainMat);
    rainLines.visible = false;
    rainLines.frustumCulled = false;
    scene.add(rainLines);

    const SPLASH_COUNT = 72;
    const splashGeo = new THREE.RingGeometry(0.14, 0.22, 12);
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = new THREE.MeshBasicMaterial({
      color: '#e2e8f0',
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const splashInst = new THREE.InstancedMesh(splashGeo, splashMat, SPLASH_COUNT);
    splashInst.frustumCulled = false;
    splashInst.visible = false;
    const splashOffsets = Array.from({ length: SPLASH_COUNT }, (_, idx) => ({
      dx: (Math.random() - 0.5) * 60,
      dz: (Math.random() - 0.5) * 60,
      phase: idx / SPLASH_COUNT,
    }));
    scene.add(splashInst);

    // 8. Player Character Rig
    const initStore = useGameStore.getState();
    const playerRig = createCharacterModel(initStore.outfitId, shadowTex, false, charTextures, city.glowSpriteTex);
    playerRig.group.position.set(initStore.playerPos.x, initStore.playerPos.y, initStore.playerPos.z);
    playerRig.setWeapon(initStore.activeWeaponId);
    scene.add(playerRig.group);

    // 9. World Vehicles (Player Active Car + Full Fleet Parked Across City)
    const worldVehicles: WorldVehicle[] = [];
    const spawnVehicle = (
      uid: string,
      specId: string,
      color: string,
      x: number,
      z: number,
      rotY: number,
      isPlayerOwned: boolean
    ) => {
      const rig = createVehicleModel(specId, color, shadowTex, isSoftwareGl, isPlayerOwned, city.glowSpriteTex, vehicleTextures);
      const spec = VEHICLE_SPECS[specId];
      const gy = spec.vehicleClass === 'boat' ? -0.35 : getGroundHeightAt(x, z);
      rig.group.position.set(x, gy, z);
      rig.group.rotation.y = rotY;
      scene.add(rig.group);
      const v: WorldVehicle = {
        uid,
        specId,
        rig,
        x,
        y: gy,
        z,
        rotationY: rotY,
        speed: 0,
        vy: 0,
        steerAngle: 0,
        health: 100,
        nitro: 100,
        fuel: 100,
        headlightsManual: null,
        isPlayerOwned,
      };
      worldVehicles.push(v);
      return v;
    };

    const playerCarColor =
      initStore.vehicleColors[initStore.activeVehicleSpecId] ??
      VEHICLE_SPECS[initStore.activeVehicleSpecId]?.defaultColor ??
      '#e11d48';
    const playerPersonalCar = spawnVehicle(
      'player_car',
      initStore.activeVehicleSpecId,
      playerCarColor,
      2,
      19,
      Math.PI / 2,
      true
    );

    spawnVehicle('parked_suv', 'titan_4x4', '#18181b', -72, 92, 0, false);
    spawnVehicle('parked_bike', 'viper_r1', '#f59e0b', 92, 14, -Math.PI / 2, false);
    spawnVehicle('parked_bmx', 'street_bmx', '#22c55e', 112, 12, -Math.PI * 0.4, false);
    spawnVehicle('parked_sedan', 'metro_lx', '#eab308', -92, 18, Math.PI, false);
    spawnVehicle('parked_luxury', 'sovereign_gt', '#3f3f46', 42, 16, -Math.PI / 2, false);
    spawnVehicle('parked_truck', 'hauler_rig', '#f8fafc', -74, 142, Math.PI / 2, false);
    spawnVehicle('parked_bus', 'metro_bus', '#0284c7', -83.8, -55, 0, false);
    spawnVehicle('parked_ems', 'ems_medic', '#f8fafc', 20, -52, 0, false);
    spawnVehicle('parked_super', 'apex_v12', '#06b6d4', -72, -48, 0, false);
    spawnVehicle('parked_pickup', 'sierra_dually', '#d6ceb8', -100, -96, Math.PI * 0.5, false);
    spawnVehicle('parked_muscle', 'mustang_gt', '#f97316', 28, -14, Math.PI, false);
    spawnVehicle('parked_polizei', 'interceptor', '#f8fafc', 96, -104, -Math.PI / 2, false);
    spawnVehicle('parked_heli', 'valkyrie_heli', '#f1f5f9', -198, 4, Math.PI / 2, false);
    spawnVehicle('parked_boat', 'marina_craft', '#f8fafc', 127, 222, Math.PI, false);
    spawnVehicle('parked_sailboat', 'classic_sailboat', '#f8fafc', 136, 224, Math.PI, false);
    spawnVehicle('parked_retro_80s', 'retro_sedan_80s', '#d4d4d8', -56, 18, Math.PI, false);
    spawnVehicle('parked_shuttle_van', 'shuttle_van', '#8d9db6', 62, -16, 0, false);
    spawnVehicle('parked_beetle', 'vintage_beetle', '#f43f5e', -118, 38, Math.PI / 3, false);
    spawnVehicle('parked_biplane', 'red_baron_biplane', '#dc2626', -214, -22, Math.PI / 4, false);
    spawnVehicle('parked_skyline_r34', 'skyline_r34', '#cfd4dc', -14, 18, Math.PI / 2, false);
    spawnVehicle('parked_stallion_plaza', 'chestnut_stallion', '#8c441c', 14, 14, -Math.PI * 0.35, false);
    spawnVehicle('parked_stallion_barn', 'chestnut_stallion', '#8c441c', -106, -118, Math.PI * 0.25, false);
    spawnVehicle('parked_army_truck', 'sierra_dually', '#4b5332', 228, -104, -Math.PI * 0.5, false);
    spawnVehicle('parked_tiger', 'tiger_tank', '#c2b280', 218, -118, Math.PI * 0.25, false);

    // 10. AI Traffic Vehicles (including Buses & Ambulances)
    const trafficSpecs = [
      'metro_lx',
      'retro_sedan_80s',
      'titan_4x4',
      'shuttle_van',
      'veloce_gt',
      'hauler_rig',
      'sierra_dually',
      'mustang_gt',
      'metro_bus',
      'ems_medic',
      'sovereign_gt',
    ];
    const trafficColors = ['#e4e4e7', '#d4d4d8', '#334155', '#8d9db6', '#1d4ed8', '#059669', '#f8fafc', '#f97316', '#0284c7', '#f8fafc', '#3f3f46'];
    const trafficAgents: TrafficAgent[] = [];
    for (let i = 0; i < 11; i++) {
      const axis: 'ns' | 'ew' = i % 2 === 0 ? 'ns' : 'ew';
      const dir: 1 | -1 = i % 4 < 2 ? 1 : -1;
      const roadIdx = (i * 2) % ROAD_CENTERS.length;
      const laneOffset = dir === 1 ? 3.8 : -3.8;
      const laneCoord = ROAD_CENTERS[roadIdx] + laneOffset;
      const along = -150 + ((i * 53) % 300);
      const specId = trafficSpecs[i % trafficSpecs.length];
      const color = trafficColors[i % trafficColors.length];
      const rig = createVehicleModel(specId, color, shadowTex, isSoftwareGl, false, city.glowSpriteTex, vehicleTextures);
      const x = axis === 'ns' ? laneCoord : along;
      const z = axis === 'ns' ? along : laneCoord;
      rig.group.position.set(x, 0, z);
      rig.group.rotation.y =
        axis === 'ns' ? (dir === 1 ? 0 : Math.PI) : dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(rig.group);
      trafficAgents.push({
        rig,
        x,
        z,
        axis,
        dir,
        laneCoord,
        speed: 10,
        maxSpeed: 11 + (i % 4) * 2.2,
      });
    }

    // 11. Police Pursuit Pool (4 Cruisers + 2 Armed Foot Officers + 1 Wanted-5 Police Helicopter)
    const policeAgents: PoliceAgent[] = [];
    for (let i = 0; i < 4; i++) {
      const rig = createVehicleModel('interceptor', '#f8fafc', shadowTex, isSoftwareGl, false, city.glowSpriteTex, vehicleTextures);
      rig.group.visible = false;
      scene.add(rig.group);
      policeAgents.push({
        rig,
        x: 120,
        z: -160,
        rotationY: 0,
        speed: 0,
        active: false,
      });
    }

    const policeOfficers: PoliceOfficerAgent[] = [];
    for (let i = 0; i < 2; i++) {
      const rig = createCharacterModel('tactical_operator', shadowTex, true, charTextures, city.glowSpriteTex);
      rig.jacketMat.color.set('#1e3a8a');
      rig.pantsMat.color.set('#0f172a');
      rig.setWeapon('pistol');
      rig.group.visible = false;
      scene.add(rig.group);
      policeOfficers.push({
        rig,
        x: 120,
        z: -160,
        rotY: 0,
        walkPhase: 0,
        fireTimer: 1.5 + i * 0.9,
        stunTimer: 0,
        active: false,
      });
    }

    const policeHeliRig = createVehicleModel('valkyrie_heli', '#0f172a', shadowTex, isSoftwareGl, false, city.glowSpriteTex);
    policeHeliRig.group.visible = false;
    scene.add(policeHeliRig.group);
    const policeHeli = {
      rig: policeHeliRig,
      x: 0,
      y: 28,
      z: -140,
      orbitAngle: 0,
      active: false,
    };

    // 12. Pedestrians on Sidewalks & Story Mission Contacts
    const pedestrians: PedestrianAgent[] = [];
    const pedOutfits = PLAYER_OUTFITS.map((o) => o.id);
    for (let i = 0; i < 20; i++) {
      const rig = createCharacterModel(pedOutfits[i % pedOutfits.length], shadowTex, true, charTextures);
      const roadC = ROAD_CENTERS[i % ROAD_CENTERS.length];
      const side = i % 2 === 0 ? 9.4 : -9.4;
      const x = i < 12 ? roadC + side : -145 + (i - 12) * 26;
      const z = i < 12 ? -145 + i * 26 : roadC + side;
      rig.group.position.set(x, getGroundHeightAt(x, z), z);
      scene.add(rig.group);
      pedestrians.push({
        rig,
        x,
        z,
        rotY: Math.random() * Math.PI * 2,
        walkPhase: Math.random() * 6,
        speed: 1.55 + (i % 4) * 0.25,
        turnTimer: 4 + Math.random() * 6,
        hp: 100,
        active: true,
        looted: false,
      });
    }

    const storyContacts: Array<{ x: number; z: number; rotY: number; outfit: string }> = [
      { x: 17.8, z: 19.6, rotY: -Math.PI * 0.75, outfit: 'academy_sailor' },
      { x: -103.5, z: 127.6, rotY: Math.PI * 0.25, outfit: 'street_hoodie' },
      { x: 19.6, z: -40.4, rotY: -Math.PI * 0.6, outfit: 'midnight_exec' },
      { x: -194.5, z: -22.5, rotY: Math.PI * 0.4, outfit: 'tactical_operator' },
    ];
    for (const sc of storyContacts) {
      const cRig = createCharacterModel(sc.outfit, shadowTex, true, charTextures);
      cRig.group.position.set(sc.x, getGroundHeightAt(sc.x, sc.z), sc.z);
      cRig.group.rotation.y = sc.rotY;
      scene.add(cRig.group);
    }

    // Roaming Black Cats across Emerald Park, Sunset Diner, Downtown Plaza & Oakridge
    const blackCatSpawns: Array<[number, number]> = [
      [118, 34],
      [-115, 22],
      [6, 14],
      [38, -106],
    ];
    const blackCats: BlackCatAgent[] = blackCatSpawns.map(([cx, cz], idx) => {
      const rig = createBlackCatModel(shadowTex);
      rig.group.position.set(cx, getGroundHeightAt(cx, cz), cz);
      scene.add(rig.group);
      return {
        rig,
        x: cx,
        z: cz,
        rotY: idx * 1.4,
        walkPhase: idx * 1.2,
        speed: 1.4 + (idx % 2) * 0.35,
        turnTimer: 3 + idx * 1.5,
      };
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 13. Mutable Gameplay Simulation State
    const sim = {
      px: initStore.playerPos.x,
      py: initStore.playerPos.y,
      pz: initStore.playerPos.z,
      pvy: 0,
      protY: initStore.playerRotY,
      onGround: true,
      isFlying: false,
      walkCycle: 0,
      stamina: initStore.stamina,
      activeVehicle: null as WorldVehicle | null,
      camYaw: Math.PI,
      camPitch: 0.34,
      camCurrentPos: new THREE.Vector3(initStore.playerPos.x, 4.5, initStore.playerPos.z + 7),
      camCurrentLook: new THREE.Vector3(initStore.playerPos.x, 1.5, initStore.playerPos.z),
      camShake: 0,
      bustedProgress: 0,
      evadeTimer: 0,
      lastSessionId: initStore.gameSessionId,
      lastOutfitId: initStore.outfitId,
      lastWeaponId: initStore.activeWeaponId as WeaponId,
      lastTelemetrySync: 0,
      lastAutosave: 0,
      passiveIncomeTimer: 0,
      weatherCycleTimer: 0,
      skidAccum: 0,
      wakeAccum: 0,
      aimHoldTimer: 0,
      fireCooldown: 0,
      muzzleTimer: 0,
      heatVisionTimer: 0,
      shockwaveTimer: 0,
      shockwaveCooldown: 0,
      divingSlam: false,
      regenAccum: 0,
      speedBoostTimer: 0,
      lightningTimer: 7.5,
      lightningFlash: 0,
      taxiTarget: null as { x: number; z: number; label: string } | null,
      taxiPayout: 0,
    };

    const handleUseItem = (ev: Event) => {
      const detail = (ev as CustomEvent<{ itemId: string }>).detail;
      if (detail.itemId === 'energy_drink') {
        sim.stamina = 100;
        sim.speedBoostTimer = 20;
        useGameStore.getState().pushToast('Solaris Surge Active', '+32% Sprint & Flight speed for 20s.', 'success');
        return;
      }
      if (!sim.activeVehicle) {
        if (detail.itemId === 'repair_kit' || detail.itemId === 'nitro_can') {
          useGameStore.getState().pushToast('Enter a Vehicle First', 'Item effect applies to your active vehicle.', 'warning');
        }
        return;
      }
      if (detail.itemId === 'repair_kit') {
        sim.activeVehicle.health = 100;
        sim.activeVehicle.fuel = 100;
        useGameStore.getState().pushToast('Vehicle Repaired', 'Hull & fuel restored to 100%.', 'success');
      } else if (detail.itemId === 'nitro_can') {
        sim.activeVehicle.nitro = 100;
        useGameStore.getState().pushToast('Nitro Refilled', 'Hold Shift / Nitro button to boost.', 'success');
      }
    };
    window.addEventListener('citycrime:use_item', handleUseItem);

    const handleTeleport = (ev: Event) => {
      const detail = (ev as CustomEvent<{ x: number; z: number; label: string }>).detail;
      const safePlayer = resolveCircleWorldCollision(detail.x, detail.z, 0.55, { allowWater: true });
      sim.activeVehicle = null;
      sim.isFlying = false;
      sim.divingSlam = false;
      sim.px = safePlayer.x;
      sim.pz = safePlayer.z;
      sim.py = getGroundHeightAt(safePlayer.x, safePlayer.z);
      sim.pvy = 0;
      sim.onGround = true;
      playerRig.group.visible = true;
      playerRig.group.position.set(sim.px, sim.py, sim.pz);
      playerRig.shadowPlane.position.y = 0.02;

      const spec = VEHICLE_SPECS[playerPersonalCar.specId];
      if (spec.vehicleClass !== 'boat') {
        const carCol = resolveCircleWorldCollision(sim.px + 5.2, sim.pz + 4.2, 2.2);
        playerPersonalCar.x = carCol.x;
        playerPersonalCar.z = carCol.z;
        playerPersonalCar.y = getGroundHeightAt(carCol.x, carCol.z);
        playerPersonalCar.speed = 0;
        playerPersonalCar.vy = 0;
        playerPersonalCar.rig.group.position.set(playerPersonalCar.x, playerPersonalCar.y, playerPersonalCar.z);
      }

      sim.camCurrentLook.set(sim.px, sim.py + 1.5, sim.pz);
      sim.camCurrentPos.set(
        sim.px + Math.sin(sim.camYaw) * 5.4,
        sim.py + 2.8,
        sim.pz + Math.cos(sim.camYaw) * 5.4
      );
      resetContinuousInputs();
    };
    window.addEventListener('citycrime:teleport', handleTeleport);

    let isDraggingCamera = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (useGameStore.getState().screen !== 'playing' || useGameStore.getState().activeModal !== 'none') return;
      audioEngine.init();
      isDraggingCamera = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingCamera) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      gameInput.lookDeltaX += dx;
      gameInput.lookDeltaY += dy;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (
        isDraggingCamera &&
        Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) < 6 &&
        useGameStore.getState().screen === 'playing' &&
        useGameStore.getState().activeModal === 'none' &&
        !sim.activeVehicle
      ) {
        gameInput.firePressed = true;
      }
      isDraggingCamera = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const gq = useGameStore.getState().settings.graphicsQuality;
      lastGraphicsQuality = gq;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : gq === 'medium' ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2)
      );
      if (composer) composer.setSize(w, h);
      if (bloomPass) bloomPass.resolution.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    let activeOwnedSpec = initStore.activeVehicleSpecId;
    let activeOwnedColor = playerCarColor;

    const syncPlayerVehicleModel = (specId: string, colorHex: string, spawnNearPlayer: boolean) => {
      scene.remove(playerPersonalCar.rig.group);
      const newRig = createVehicleModel(specId, colorHex, shadowTex, isSoftwareGl, true, city.glowSpriteTex, vehicleTextures);
      const spec = VEHICLE_SPECS[specId];
      playerPersonalCar.specId = specId;
      playerPersonalCar.rig = newRig;
      playerPersonalCar.health = 100;
      playerPersonalCar.nitro = 100;
      playerPersonalCar.fuel = 100;
      playerPersonalCar.speed = 0;
      playerPersonalCar.vy = 0;
      if (spawnNearPlayer) {
        if (spec.vehicleClass === 'boat') {
          playerPersonalCar.x = 127;
          playerPersonalCar.z = 222;
          playerPersonalCar.y = -0.35;
          playerPersonalCar.rotationY = Math.PI;
        } else {
          const spawnX = sim.px + Math.sin(sim.protY + Math.PI / 2) * 5.2;
          const spawnZ = sim.pz + Math.cos(sim.protY + Math.PI / 2) * 5.2;
          const col = resolveCircleWorldCollision(spawnX, spawnZ, 2.2);
          playerPersonalCar.x = col.x;
          playerPersonalCar.z = col.z;
          playerPersonalCar.y = getGroundHeightAt(col.x, col.z);
          playerPersonalCar.rotationY = sim.protY;
        }
      }
      newRig.group.position.set(playerPersonalCar.x, playerPersonalCar.y, playerPersonalCar.z);
      newRig.group.rotation.y = playerPersonalCar.rotationY;
      scene.add(newRig.group);
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function stepSimulation(dt: number, elapsed: number) {
      const store = useGameStore.getState();

      // Session reset
      if (store.gameSessionId !== sim.lastSessionId) {
        sim.lastSessionId = store.gameSessionId;
        sim.activeVehicle = null;
        sim.isFlying = false;
        sim.divingSlam = false;
        sim.heatVisionTimer = 0;
        sim.shockwaveTimer = 0;
        sim.speedBoostTimer = 0;
        heatBeamLeft.visible = false;
        heatBeamRight.visible = false;
        heatImpactSprite.visible = false;
        shockRingMesh.visible = false;
        sim.px = store.playerPos.x;
        sim.py = store.playerPos.y;
        sim.pz = store.playerPos.z;
        sim.pvy = 0;
        sim.protY = store.playerRotY;
        sim.camYaw = store.playerRotY;
        sim.stamina = store.stamina;
        sim.bustedProgress = 0;
        sim.evadeTimer = 0;
        sim.taxiTarget = null;
        playerRig.group.visible = true;
        const nearStarter = Math.hypot(store.playerPos.x - 2, store.playerPos.z - 19) <= 25;
        if (nearStarter) {
          playerPersonalCar.x = 2;
          playerPersonalCar.z = 19;
        } else {
          const carCol = resolveCircleWorldCollision(store.playerPos.x + 4.5, store.playerPos.z + 4.5, 2.2);
          playerPersonalCar.x = carCol.x;
          playerPersonalCar.z = carCol.z;
        }
        playerPersonalCar.y = getGroundHeightAt(playerPersonalCar.x, playerPersonalCar.z);
        playerPersonalCar.rotationY = Math.PI / 2;
        playerPersonalCar.speed = 0;
        playerPersonalCar.vy = 0;
        playerPersonalCar.health = 100;
        playerPersonalCar.fuel = 100;
        playerPersonalCar.rig.group.position.set(playerPersonalCar.x, playerPersonalCar.y, playerPersonalCar.z);
        playerPersonalCar.rig.group.rotation.y = playerPersonalCar.rotationY;
        policeAgents.forEach((p) => {
          p.active = false;
          p.rig.group.visible = false;
        });
        policeOfficers.forEach((po) => {
          po.active = false;
          po.rig.group.visible = false;
        });
        policeHeli.active = false;
        policeHeli.rig.group.visible = false;
        resetContinuousInputs();
      }

      if (store.outfitId !== sim.lastOutfitId) {
        sim.lastOutfitId = store.outfitId;
        playerRig.applyOutfit(store.outfitId, charTextures);
      }

      if (store.activeWeaponId !== sim.lastWeaponId) {
        sim.lastWeaponId = store.activeWeaponId;
        playerRig.setWeapon(store.activeWeaponId);
      }

      const desiredColor =
        store.vehicleColors[store.activeVehicleSpecId] ??
        VEHICLE_SPECS[store.activeVehicleSpecId]?.defaultColor ??
        '#e11d48';
      if (store.spawnRequestedSpecId) {
        syncPlayerVehicleModel(store.spawnRequestedSpecId, desiredColor, true);
        activeOwnedSpec = store.spawnRequestedSpecId;
        activeOwnedColor = desiredColor;
        store.clearSpawnRequest();
      } else if (store.activeVehicleSpecId !== activeOwnedSpec) {
        syncPlayerVehicleModel(store.activeVehicleSpecId, desiredColor, false);
        activeOwnedSpec = store.activeVehicleSpecId;
        activeOwnedColor = desiredColor;
      } else if (desiredColor !== activeOwnedColor) {
        playerPersonalCar.rig.bodyPaintMat.color.set(desiredColor);
        activeOwnedColor = desiredColor;
      }

      // Time of day & Weather updates
      let timeHour = store.timeOfDay;
      if (store.settings.timeMode === 'noon') timeHour = 13.0;
      else if (store.settings.timeMode === 'sunset') timeHour = 18.2;
      else if (store.settings.timeMode === 'midnight') timeHour = 23.5;
      else if (store.screen === 'playing' && store.activeModal === 'none') {
        timeHour = (timeHour + dt * 0.14) % 24;
        if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) {
          store.setTimeOfDay(timeHour);
        }
      }

      if (store.settings.weatherMode !== 'dynamic') {
        if (store.weather !== store.settings.weatherMode) {
          store.setWeather(store.settings.weatherMode);
        }
      } else if (store.screen === 'playing') {
        sim.weatherCycleTimer += dt;
        if (sim.weatherCycleTimer > 65) {
          sim.weatherCycleTimer = 0;
          const nextW = store.weather === 'sunny' ? 'rain' : store.weather === 'rain' ? 'fog' : 'sunny';
          store.setWeather(nextW);
        }
      }

      // Sun Angle & Atmospheric SkyDome + Wet Road Sheen
      const sunAngle = ((timeHour - 6) / 24) * Math.PI * 2;
      const sunElev = Math.sin(sunAngle);
      const sunX = Math.cos(sunAngle) * 140;
      const sunY = Math.max(-20, sunElev * 140);
      _sunDir.set(sunX, Math.max(8, sunY), 55).normalize();
      sunLight.position.set(sim.px + sunX, sunY, sim.pz + 55);
      sunLight.target.position.set(sim.px, 0, sim.pz);
      sunLight.target.updateMatrixWorld();

      if (store.settings.graphicsQuality !== lastGraphicsQuality) {
        lastGraphicsQuality = store.settings.graphicsQuality;
        renderer.setPixelRatio(
          isSoftwareGl
            ? 1
            : lastGraphicsQuality === 'medium'
              ? 1.0
              : Math.min(window.devicePixelRatio, 1.35)
        );
      }

      const dayFactor = THREE.MathUtils.clamp((sunElev + 0.15) / 0.55, 0, 1);
      const sunsetFactor = THREE.MathUtils.clamp(1 - Math.abs(sunElev - 0.08) * 4.5, 0, 1);
      const isNight = dayFactor < 0.35;
      const isRaining = store.weather === 'rain';
      const rainFactor = isRaining ? 1.0 : 0.0;
      const fogFactor = store.weather === 'fog' ? 1.0 : 0.0;

      if (isRaining) {
        sim.lightningTimer -= dt;
        if (sim.lightningTimer <= 0) {
          sim.lightningFlash = 1.0;
          sim.lightningTimer = 7 + Math.random() * 11;
        }
      }
      sim.lightningFlash = Math.max(0, sim.lightningFlash - dt * 5.2);

      skyDome.update(camera.position, _sunDir, dayFactor, sunsetFactor, rainFactor, fogFactor, elapsed, sim.lightningFlash);
      skyDome.getHorizonColor(_horizonCol);

      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_horizonCol);
        const targetDensity = isRaining ? 0.0042 : store.weather === 'fog' ? 0.0095 : 0.0017;
        scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetDensity, 2, dt);
      }

      const targetRoadRough = isRaining ? 0.16 : 0.82;
      const targetRoadEnv = isRaining ? 1.55 : 0.72;
      for (const am of city.asphaltMaterials) {
        am.roughness = THREE.MathUtils.damp(am.roughness, targetRoadRough, 1.5, dt);
        am.envMapIntensity = THREE.MathUtils.damp(am.envMapIntensity, targetRoadEnv, 1.5, dt);
      }

      sunLight.intensity = Math.max(0.24, dayFactor * (isRaining ? 0.85 : 1.22)) + sim.lightningFlash * 1.8;
      sunLight.color.copy(_sunColorNight).lerp(_sunColorDay, dayFactor).lerp(_sunColorSunset, sunsetFactor * 0.78);
      hemiLight.intensity = 0.30 + dayFactor * 0.28 + sim.lightningFlash * 0.5;
      hemiLight.color.copy(_hemiSkyNight).lerp(_hemiSkyDay, dayFactor);
      rimLight.color.copy(_rimNightCol).lerp(_rimDayCol, dayFactor).lerp(_rimSunsetCol, sunsetFactor * 0.7);
      rimLight.intensity = 0.22 + sunsetFactor * 0.18 + sim.lightningFlash * 0.65;

      const nightEmissive = isNight ? 1.05 : 0.0;
      city.streetlampBulbMat.emissiveIntensity = isNight ? 1.5 : 0.15;
      for (const sp of city.streetlampSprites) {
        sp.material.opacity = THREE.MathUtils.damp(sp.material.opacity, isNight ? 0.55 : 0.0, 4, dt);
      }
      for (const m of city.skyscraperMaterials) {
        m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, nightEmissive, 3, dt);
      }

      // Animated Ocean Water Ripples
      city.waterNormalMap.offset.x = (elapsed * 0.025) % 1;
      city.waterNormalMap.offset.y = (elapsed * 0.015) % 1;
      city.oceanMesh.position.y = -0.45 + Math.sin(elapsed * 1.4) * 0.07;

      // Slanted Rain Streaks & Ground Puddle Splashes
      rainLines.visible = isRaining;
      splashInst.visible = isRaining;
      if (isRaining) {
        rainLines.position.set(sim.px, 0, sim.pz);
        const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          let ry = rainSeeds[i * 3 + 1] - dt * 44;
          if (ry < 0) ry += 36;
          rainSeeds[i * 3 + 1] = ry;
          const rx = rainSeeds[i * 3];
          const rz = rainSeeds[i * 3 + 2];
          arr[i * 6] = rx;
          arr[i * 6 + 1] = ry;
          arr[i * 6 + 2] = rz;
          arr[i * 6 + 3] = rx + 0.18;
          arr[i * 6 + 4] = ry + 1.15;
          arr[i * 6 + 5] = rz + 0.08;
        }
        posAttr.needsUpdate = true;

        for (let i = 0; i < SPLASH_COUNT; i++) {
          const sp = splashOffsets[i];
          const p = (sp.phase + elapsed * 1.65) % 1;
          const sx = sim.px + sp.dx;
          const sz = sim.pz + sp.dz;
          const gy = getGroundHeightAt(sx, sz);
          _splashDummy.position.set(sx, gy + 0.04, sz);
          _splashDummy.scale.setScalar(0.35 + p * 1.65);
          _splashDummy.updateMatrix();
          splashInst.setMatrixAt(i, _splashDummy.matrix);
        }
        splashInst.instanceMatrix.needsUpdate = true;
      }

      // Update Sparks Pool
      if (sparkPool.length > 0) {
        const attr = sparkGeo.attributes.position as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = sparkPool.length - 1; i >= 0; i--) {
          const sp = sparkPool[i];
          sp.life -= dt;
          if (sp.life <= 0) {
            sparkPool.splice(i, 1);
            continue;
          }
          sp.vy -= 18 * dt;
          sp.x += sp.vx * dt;
          sp.y = Math.max(-0.2, sp.y + sp.vy * dt);
          sp.z += sp.vz * dt;
        }
        for (let i = 0; i < MAX_SPARKS; i++) {
          if (i < sparkPool.length) {
            arr[i * 3] = sparkPool[i].x;
            arr[i * 3 + 1] = sparkPool[i].y;
            arr[i * 3 + 2] = sparkPool[i].z;
          } else {
            arr[i * 3 + 1] = -50;
          }
        }
        attr.needsUpdate = true;
      }

      // Update Bullet Tracers Pool
      if (tracerPool.length > 0 || tracerVerts[1] > -40) {
        for (let i = tracerPool.length - 1; i >= 0; i--) {
          tracerPool[i].life -= dt;
          if (tracerPool[i].life <= 0) tracerPool.splice(i, 1);
        }
        for (let i = 0; i < MAX_TRACERS; i++) {
          const idx = i * 6;
          if (i < tracerPool.length) {
            const tr = tracerPool[i];
            tracerVerts[idx] = tr.x1;
            tracerVerts[idx + 1] = tr.y1;
            tracerVerts[idx + 2] = tr.z1;
            tracerVerts[idx + 3] = tr.x2;
            tracerVerts[idx + 4] = tr.y2;
            tracerVerts[idx + 5] = tr.z2;
          } else {
            tracerVerts[idx + 1] = -50;
            tracerVerts[idx + 4] = -50;
          }
        }
        (tracerGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // Update Paragon Heat Vision & Shockwave Ring VFX
      if (sim.heatVisionTimer > 0) {
        sim.heatVisionTimer = Math.max(0, sim.heatVisionTimer - dt);
        const alpha = sim.heatVisionTimer / 0.16;
        heatBeamMat.opacity = alpha * 0.92;
        heatImpactSprite.material.opacity = alpha * 0.95;
        if (sim.heatVisionTimer <= 0) {
          heatBeamLeft.visible = false;
          heatBeamRight.visible = false;
          heatImpactSprite.visible = false;
        }
      }
      if (sim.shockwaveTimer > 0) {
        sim.shockwaveTimer = Math.max(0, sim.shockwaveTimer - dt);
        const progress = 1 - sim.shockwaveTimer / 0.45;
        shockRingMesh.scale.setScalar(1 + progress * 11.5);
        shockRingMat.opacity = (1 - progress) * 0.88;
        if (sim.shockwaveTimer <= 0) {
          shockRingMesh.visible = false;
        }
      }
      sim.shockwaveCooldown = Math.max(0, sim.shockwaveCooldown - dt);
      sim.speedBoostTimer = Math.max(0, sim.speedBoostTimer - dt);

      // Traffic Light Cycle
      const sigCycle = elapsed % 24;
      const nsGo = sigCycle < 12;
      for (const tl of city.trafficLights) {
        tl.nsGreen.color.setHex(nsGo ? 0x22c55e : 0x14532d);
        tl.nsRed.color.setHex(nsGo ? 0x450a0a : 0xef4444);
        tl.ewGreen.color.setHex(nsGo ? 0x14532d : 0x22c55e);
        tl.ewRed.color.setHex(nsGo ? 0xef4444 : 0x450a0a);
      }

      city.zoneMarkers.forEach((ring, id) => {
        const s = 1 + Math.sin(elapsed * 3 + id.length) * 0.08;
        ring.scale.set(s, s, 1);
      });

      if (store.screen !== 'playing' || store.activeModal !== 'none') {
        if (store.screen === 'menu') {
          const menuAngle = elapsed * 0.08;
          camera.position.set(Math.sin(menuAngle) * 86, 36, Math.cos(menuAngle) * 86);
          camera.lookAt(0, 14, 0);
        }
        audioEngine.silenceLooping();
        return;
      }

      // Passive Property Income Tick (every 15 seconds = 1/4 min payout)
      if (store.ownedProperties.length > 0) {
        sim.passiveIncomeTimer += dt;
        if (sim.passiveIncomeTimer >= 15) {
          sim.passiveIncomeTimer = 0;
          let quarterSum = 0;
          for (const pid of store.ownedProperties) {
            const p = PROPERTIES.find((pr) => pr.id === pid);
            if (p) quarterSum += p.incomePerMinute / 4;
          }
          if (quarterSum > 0) {
            store.collectPassiveIncome(quarterSum);
          }
        }
      }

      // Camera Orbit
      const sens = 0.0045 * store.settings.cameraSensitivity;
      if (gameInput.lookDeltaX !== 0 || gameInput.lookDeltaY !== 0) {
        sim.camYaw -= gameInput.lookDeltaX * sens;
        sim.camPitch = THREE.MathUtils.clamp(sim.camPitch + gameInput.lookDeltaY * sens, -0.22, 1.15);
        gameInput.lookDeltaX = 0;
        gameInput.lookDeltaY = 0;
      }

      // Nearby Prompts
      let nearbyPrompt: LiveTelemetry['nearbyPrompt'] = null;
      if (sim.activeVehicle) {
        const gasZone = INTERACTIVE_ZONES.find((z) => z.type === 'gas_station');
        if (gasZone && Math.hypot(sim.px - gasZone.x, sim.pz - gasZone.z) <= gasZone.radius) {
          const ownsFuel = store.ownedProperties.includes('prop_fuel');
          nearbyPrompt = {
            key: 'F',
            label: ownsFuel ? 'Owner Free Fuel, Repair & Nitro' : 'Refuel, Repair & Nitro ($150)',
            actionType: 'gas_station',
            targetId: gasZone.id,
          };
        }
      } else {
        let closestV: WorldVehicle | null = null;
        let closestDist = 4.6;
        for (const v of worldVehicles) {
          const d = Math.hypot(sim.px - v.x, sim.pz - v.z);
          if (d < closestDist) {
            closestDist = d;
            closestV = v;
          }
        }
        if (closestV) {
          nearbyPrompt = {
            key: 'E',
            label: `Enter ${VEHICLE_SPECS[closestV.specId].name}`,
            actionType: 'vehicle',
            targetId: closestV.uid,
          };
        } else {
          for (const z of INTERACTIVE_ZONES) {
            const d = Math.hypot(sim.px - z.x, sim.pz - z.z);
            if (d <= z.radius) {
              const actionType: NonNullable<LiveTelemetry['nearbyPrompt']>['actionType'] =
                z.type === 'garage'
                  ? 'garage'
                  : z.type === 'gas_station'
                    ? 'gas_station'
                    : z.type === 'shop'
                      ? 'shop'
                      : z.type === 'atm'
                        ? 'atm'
                        : z.type === 'property'
                          ? 'property'
                          : z.type === 'hospital'
                            ? 'hospital'
                            : z.type === 'safehouse'
                              ? 'safehouse'
                              : 'mission';
              nearbyPrompt = {
                key: 'E',
                label: z.label,
                actionType,
                targetId: z.id,
              };
              break;
            }
          }
        }
      }

      if (gameInput.interactPressed) {
        gameInput.interactPressed = false;
        if (sim.activeVehicle) {
          const v = sim.activeVehicle;
          const vSpec = VEHICLE_SPECS[v.specId];
          const groundYAtV = getGroundHeightAt(v.x, v.z);
          if (vSpec.vehicleClass === 'helicopter' && v.y > groundYAtV + 2.5) {
            store.pushToast('Land Helicopter First', 'Hold Ctrl to descend below 2m before exiting.', 'warning');
          } else {
            const exitX = v.x - Math.cos(v.rotationY) * 2.2;
            const exitZ = v.z + Math.sin(v.rotationY) * 2.2;
            const safe = resolveCircleWorldCollision(exitX, exitZ, 0.55, { allowWater: vSpec.vehicleClass === 'boat' });
            sim.px = safe.x;
            sim.pz = safe.z;
            sim.py = getGroundHeightAt(safe.x, safe.z);
            sim.pvy = 0;
            v.speed = 0;
            if (v.rig.horseLegs) {
              for (const leg of v.rig.horseLegs) leg.rotation.x = 0;
              v.rig.chassisGroup.position.y = 0;
              v.rig.chassisGroup.rotation.set(0, 0, 0);
            }
            sim.activeVehicle = null;
            playerRig.group.visible = true;
            audioEngine.playDoorToggle();
          }
        } else if (nearbyPrompt) {
          if (nearbyPrompt.actionType === 'vehicle') {
            const targetV = worldVehicles.find((v) => v.uid === nearbyPrompt!.targetId);
            if (targetV) {
              sim.activeVehicle = targetV;
              sim.isFlying = false;
              sim.aimHoldTimer = 0;
              sim.muzzleTimer = 0;
              if (playerRig.muzzleSprite) playerRig.muzzleSprite.material.opacity = 0;
              playerRig.group.visible = false;
              sim.camYaw = targetV.rotationY + Math.PI;
              audioEngine.playDoorToggle();
              const spec = VEHICLE_SPECS[targetV.specId];
              if (spec.vehicleClass === 'helicopter') {
                store.pushToast('Valkyrie Air-1 Controls', 'Space Climb · Ctrl Descend · W/S Pitch · A/D Yaw', 'info');
              } else if (spec.vehicleClass === 'boat') {
                store.pushToast('Barracuda Speedboat', 'Cruise the Solaris Bay oceanfront · Press E to swim/disembark.', 'info');
              } else if (spec.vehicleClass === 'horse') {
                store.pushToast(`Mounted ${spec.name}`, 'Hold Shift to gallop · Space to halt · Press E to dismount.', 'info');
              } else if (spec.vehicleClass === 'sedan') {
                store.pushToast(`Driving ${spec.name}`, 'Press T to start a Taxi Fare or E to exit.', 'info');
              } else if (!targetV.isPlayerOwned) {
                store.pushToast(`Driving ${spec.name}`, 'Press L for headlights, E to exit.', 'info');
              }
            }
          } else if (nearbyPrompt.actionType === 'garage') {
            store.setActiveModal('garage');
          } else if (nearbyPrompt.actionType === 'shop') {
            store.setActiveModal('shop');
          } else if (nearbyPrompt.actionType === 'atm') {
            store.setActiveModal('atm');
          } else if (nearbyPrompt.actionType === 'property') {
            store.setActiveModal('properties');
          } else if (nearbyPrompt.actionType === 'hospital') {
            store.healPlayerFull(200);
          } else if (nearbyPrompt.actionType === 'safehouse') {
            store.setTimeOfDay(7.5);
            store.saveProgress(false);
            store.setActiveModal('properties');
          } else if (nearbyPrompt.actionType === 'gas_station') {
            const ownsFuel = store.ownedProperties.includes('prop_fuel');
            if (ownsFuel || store.spendMoney(150)) {
              playerPersonalCar.health = 100;
              playerPersonalCar.nitro = 100;
              playerPersonalCar.fuel = 100;
              store.pushToast('Serviced at Bay Fuel', 'Personal vehicle repaired, fueled & nitro filled.', 'success');
            }
          } else if (nearbyPrompt.actionType === 'mission') {
            const zone = INTERACTIVE_ZONES.find((z) => z.id === nearbyPrompt!.targetId);
            if (zone?.missionId) {
              if (store.activeMissionId) {
                store.pushToast('Mission Already Active', 'Complete or cancel your current mission in Pause Menu.', 'warning');
              } else {
                store.startMission(zone.missionId);
              }
            }
          }
        }
      }

      if (gameInput.repairOrActionPressed) {
        gameInput.repairOrActionPressed = false;
        if (sim.activeVehicle && nearbyPrompt?.actionType === 'gas_station') {
          const ownsFuel = store.ownedProperties.includes('prop_fuel');
          if (ownsFuel || store.spendMoney(150)) {
            sim.activeVehicle.health = 100;
            sim.activeVehicle.nitro = 100;
            sim.activeVehicle.fuel = 100;
            audioEngine.playCheckpoint();
            store.pushToast('Vehicle Serviced', 'Hull, Fuel & Nitro restored to 100%.', 'success');
          }
        }
      }

      // Headlights Manual Toggle (L)
      if (gameInput.headlightTogglePressed) {
        gameInput.headlightTogglePressed = false;
        if (sim.activeVehicle) {
          const cur = sim.activeVehicle.headlightsManual ?? isNight;
          sim.activeVehicle.headlightsManual = !cur;
          audioEngine.playUiClick();
        }
      }

      // Taxi Fare Dispatch Toggle (T)
      if (gameInput.taxiTogglePressed) {
        gameInput.taxiTogglePressed = false;
        if (sim.activeVehicle) {
          const vClass = VEHICLE_SPECS[sim.activeVehicle.specId].vehicleClass;
          if (vClass === 'sedan') {
            if (sim.taxiTarget) {
              sim.taxiTarget = null;
              store.pushToast('Taxi Dispatch Ended', 'Off duty.', 'info');
            } else {
              const candidates = TAXI_DESTINATIONS.filter(
                (d) => Math.hypot(d.x - sim.px, d.z - sim.pz) > 65
              );
              const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? TAXI_DESTINATIONS[0];
              const dist = Math.hypot(pick.x - sim.px, pick.z - sim.pz);
              sim.taxiTarget = pick;
              sim.taxiPayout = Math.round(350 + dist * 2.8);
              audioEngine.playCheckpoint();
              store.pushToast(
                `Taxi Dispatch: ${pick.label}`,
                `Drop off passenger for ~$${sim.taxiPayout} (+Dante bonus if active).`,
                'info'
              );
            }
          } else {
            store.pushToast('Sedan Required', 'Enter Metro LX or Sovereign V8 to run Taxi Fares.', 'warning');
          }
        }
      }

      if (gameInput.reloadPressed) {
        gameInput.reloadPressed = false;
        audioEngine.playUiClick();
        store.pushToast(
          `${WEAPONS[store.activeWeaponId].name}`,
          store.activeWeaponId === 'unarmed' || store.activeWeaponId === 'sword'
            ? 'Melee active.'
            : `Reserve Ammo: ${store.weaponAmmo[store.activeWeaponId] ?? 0} rds`,
          'info'
        );
      }

      const moveFwd = (gameInput.forward ? 1 : 0) - (gameInput.backward ? 1 : 0) + gameInput.joyY;
      const moveTurn = (gameInput.left ? 1 : 0) - (gameInput.right ? 1 : 0) - gameInput.joyX;

      let speedKmh = 0;
      let gearLabel = 'N';
      let isDrifting = false;
      let activeTurnSignal: -1 | 0 | 1 = 0;
      let headlightsActive = false;
      let inWaterNow = false;
      let isCrouchingNow = false;

      const isParagonHero = store.activeCharacterId === 'paragon' || store.outfitId === 'paragon_suit';
      const isBatmanHero = store.activeCharacterId === 'batman' || store.outfitId === 'dark_knight';
      const isNomadHero = store.activeCharacterId === 'nomad' || store.outfitId === 'desert_commando';
      const isSunburstHero = store.activeCharacterId === 'sunburst' || store.outfitId === 'sunburst_nika';
      const isNarutoHero =
        store.activeCharacterId === 'naruto' ||
        store.outfitId === 'naruto_sage_cloak' ||
        store.outfitId === 'naruto_tracksuit';
      const isGokuHero = store.activeCharacterId === 'goku' || store.outfitId === 'goku_damaged_gi';
      const isSuperHero = isParagonHero || isBatmanHero || isSunburstHero || isNarutoHero || isGokuHero;
      if (isSuperHero && store.health > 0 && store.health < 100) {
        sim.regenAccum += dt;
        if (sim.regenAccum >= 0.8) {
          sim.regenAccum = 0;
          store.regenHealth(2);
        }
      } else {
        sim.regenAccum = 0;
      }

      if (sim.activeVehicle) {
        gameInput.flyTogglePressed = false;
        gameInput.shockwavePressed = false;
        sim.isFlying = false;
        sim.divingSlam = false;
        const v = sim.activeVehicle;
        const spec = VEHICLE_SPECS[v.specId];
        const vClass = spec.vehicleClass;
        const throttle = THREE.MathUtils.clamp(moveFwd, -1, 1);
        const steerInput = THREE.MathUtils.clamp(moveTurn, -1, 1);

        const isVex = store.activeCharacterId === 'vex';
        const fuelDepleted = vClass !== 'bicycle' && vClass !== 'horse' && v.fuel <= 0;
        const fuelScale = fuelDepleted ? 0.25 : 1.0;

        if (steerInput > 0.22) activeTurnSignal = -1;
        else if (steerInput < -0.22) activeTurnSignal = 1;

        headlightsActive = v.headlightsManual ?? isNight;

        if (vClass === 'helicopter') {
          // 3D HELICOPTER FLIGHT PHYSICS
          const climb = (gameInput.jumpOrBrake ? 1 : 0) - (gameInput.descend ? 1 : 0);
          const groundH = getGroundHeightAt(v.x, v.z);
          if (climb > 0 && !fuelDepleted) {
            v.vy = THREE.MathUtils.damp(v.vy, 14, 3.5, dt);
          } else if (climb < 0) {
            v.vy = THREE.MathUtils.damp(v.vy, -13, 3.8, dt);
          } else if (v.y > groundH + 0.25) {
            // Stable auto-hover damping
            v.vy = THREE.MathUtils.damp(v.vy, 0, 4.5, dt);
          } else {
            v.vy = 0;
          }

          v.y = THREE.MathUtils.clamp(v.y + v.vy * dt, groundH, 74);
          const airborne = v.y > groundH + 0.4;

          if (airborne) {
            v.speed = THREE.MathUtils.damp(v.speed, throttle * spec.maxSpeed * fuelScale, 2.2, dt);
            v.rotationY += steerInput * spec.handling * dt;
          } else {
            v.speed = THREE.MathUtils.damp(v.speed, 0, 5, dt);
          }

          const vx = Math.sin(v.rotationY) * v.speed;
          const vz = Math.cos(v.rotationY) * v.speed;
          const col = resolveCircleWorldCollision(v.x + vx * dt, v.z + vz * dt, spec.width * 0.55, {
            isAircraft: v.y > groundH + 10,
          });
          v.x = col.x;
          v.z = col.z;

          if ((Math.abs(throttle) > 0.1 || airborne) && v.fuel > 0) {
            v.fuel = Math.max(0, v.fuel - dt * 0.55);
          }

          v.rig.group.position.set(v.x, v.y, v.z);
          v.rig.group.rotation.y = v.rotationY;
          const pitchTarget = airborne ? throttle * 0.16 : 0;
          const rollTarget = airborne ? -steerInput * 0.22 : 0;
          v.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.x, pitchTarget, 5, dt);
          v.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.z, rollTarget, 5, dt);
          if (v.rig.mainRotor) v.rig.mainRotor.rotation.y += dt * (airborne || Math.abs(climb) > 0 ? 28 : 11);
          if (v.rig.tailRotor) v.rig.tailRotor.rotation.x += dt * 34;

          gearLabel = airborne ? 'AIR' : 'GND';
          speedKmh = Math.round(Math.hypot(v.speed, v.vy) * 3.6);
        } else if (vClass === 'boat') {
          // OCEAN SPEEDBOAT BUOYANCY & WAKE
          const useNitro = (gameInput.nitro || gameInput.sprint) && v.nitro > 1 && throttle > 0.2;
          const nitroMult = useNitro ? (isVex ? 1.44 : 1.32) : 1.0;
          if (useNitro) v.nitro = Math.max(0, v.nitro - dt * 20);
          else v.nitro = Math.min(100, v.nitro + dt * (isVex ? 5.2 : 3.5));

          const effectiveMax = spec.maxSpeed * nitroMult * fuelScale;
          if (throttle > 0.05) v.speed += throttle * spec.acceleration * nitroMult * dt;
          else if (throttle < -0.05) v.speed += throttle * spec.acceleration * 0.55 * dt;
          else v.speed = THREE.MathUtils.damp(v.speed, 0, 1.3, dt);

          v.speed = THREE.MathUtils.clamp(v.speed, -spec.maxSpeed * 0.3, effectiveMax);
          const turnScale = Math.min(1, Math.abs(v.speed) / 4.5 + 0.18);
          v.rotationY += steerInput * spec.handling * turnScale * (v.speed >= -0.2 ? 1 : -1) * dt;

          const nextX = v.x + Math.sin(v.rotationY) * v.speed * dt;
          const nextZ = v.z + Math.cos(v.rotationY) * v.speed * dt;
          const col = resolveCircleWorldCollision(nextX, nextZ, spec.width * 0.6, { isBoat: true });
          if (col.hit) v.speed *= 0.4;
          v.x = col.x;
          v.z = col.z;
          v.y = -0.35 + Math.sin(elapsed * 2.1 + v.x * 0.08) * 0.12;

          if (Math.abs(v.speed) > 1.5 && v.fuel > 0) {
            v.fuel = Math.max(0, v.fuel - dt * 0.45);
          }
          if (Math.abs(v.speed) > 9) {
            sim.wakeAccum += dt;
            if (sim.wakeAccum > 0.07) {
              sim.wakeAccum = 0;
              spawnImpactSparks(
                v.x - Math.sin(v.rotationY) * 2.7,
                -0.15,
                v.z - Math.cos(v.rotationY) * 2.7,
                3
              );
            }
          }

          v.rig.group.position.set(v.x, v.y, v.z);
          v.rig.group.rotation.y = v.rotationY;
          const bowPitch = -Math.min(0.12, Math.max(-0.04, (v.speed / spec.maxSpeed) * 0.11));
          const hullRoll = -steerInput * Math.min(1, Math.abs(v.speed) / 22) * 0.16;
          v.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.x, bowPitch, 6, dt);
          v.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.z, hullRoll, 6, dt);

          speedKmh = Math.round(Math.abs(v.speed) * 3.6);
          gearLabel = v.speed < -0.5 ? 'R' : speedKmh < 3 ? 'N' : 'SEA';
        } else {
          // WHEELED LAND VEHICLES & HORSE MOUNTS
          const handbrake = gameInput.jumpOrBrake;
          const isHorse = vClass === 'horse';
          const useNitro =
            vClass !== 'bicycle' && (gameInput.nitro || gameInput.sprint) && v.nitro > 1 && throttle > 0.2;
          const healthFactor = v.health < 25 ? 0.65 : 1.0;
          const nitroBoost = useNitro ? (isVex ? 1.48 : 1.38) : 1.0;

          if (useNitro) {
            v.nitro = Math.max(0, v.nitro - dt * 22);
          } else {
            v.nitro = Math.min(100, v.nitro + dt * (isVex ? 4.8 : 3.5));
          }

          const effectiveMax = spec.maxSpeed * healthFactor * nitroBoost * fuelScale;
          if (throttle > 0.05) {
            v.speed += throttle * spec.acceleration * nitroBoost * dt;
          } else if (throttle < -0.05) {
            if (v.speed > 1.5) v.speed -= spec.braking * dt;
            else v.speed += throttle * spec.acceleration * 0.55 * dt;
          } else {
            v.speed = THREE.MathUtils.damp(v.speed, 0, isHorse ? 4.2 : 1.8, dt);
          }

          if (handbrake) {
            v.speed = THREE.MathUtils.damp(v.speed, 0, isHorse ? 7.5 : 4.2, dt);
            if (!isHorse && Math.abs(v.speed) > 7.5 && Math.abs(steerInput) > 0.2) {
              isDrifting = true;
            }
          }

          v.speed = THREE.MathUtils.clamp(v.speed, -spec.maxSpeed * (isHorse ? 0.25 : 0.38), effectiveMax);

          const speedSteerScale = Math.min(1, Math.abs(v.speed) / (vClass === 'bicycle' || isHorse ? 2.2 : 6.5));
          const turnSign = v.speed >= -0.2 ? 1 : -1;
          const targetSteer = steerInput * 0.58;
          v.steerAngle = THREE.MathUtils.damp(v.steerAngle, targetSteer, 10, dt);
          const driftMult = isDrifting ? 1.35 : 1.0;
          v.rotationY += steerInput * spec.handling * (isHorse ? Math.max(0.35, speedSteerScale) : speedSteerScale) * driftMult * turnSign * dt;

          const vx = Math.sin(v.rotationY) * v.speed;
          const vz = Math.cos(v.rotationY) * v.speed;
          const nextX = v.x + vx * dt;
          const nextZ = v.z + vz * dt;

          const col = resolveCircleWorldCollision(nextX, nextZ, spec.width * 0.58);
          if (col.hit && Math.abs(v.speed) > 6) {
            const impact = Math.min(1, Math.abs(v.speed) / 35);
            audioEngine.playImpact(impact);
            sim.camShake = Math.max(sim.camShake, impact * 0.55);
            spawnImpactSparks(col.x, v.y, col.z, 14);
            v.health = Math.max(10, v.health - Math.abs(v.speed) * 0.35);
            v.speed *= -0.32;
          } else if (col.hit) {
            v.speed *= 0.5;
          }

          v.x = col.x;
          v.z = col.z;
          v.y = getGroundHeightAt(v.x, v.z);

          if (vClass !== 'bicycle' && !isHorse && Math.abs(v.speed) > 1.2 && v.fuel > 0) {
            v.fuel = Math.max(0, v.fuel - dt * (0.28 + Math.abs(v.speed) / spec.maxSpeed * 0.45));
          }

          if (isDrifting && vClass !== 'bicycle' && !isHorse) {
            sim.skidAccum += Math.abs(v.speed) * dt;
            if (sim.skidAccum > 0.7) {
              sim.skidAccum = 0;
              addSkidPair(v.x, v.z, v.rotationY, spec.width * 0.42);
            }
          }

          v.rig.group.position.set(v.x, v.y, v.z);
          v.rig.group.rotation.y = v.rotationY;
          const isTwoWheeler = vClass === 'motorcycle' || vClass === 'bicycle' || isHorse;
          const targetRoll = isTwoWheeler
            ? steerInput * Math.min(1, Math.abs(v.speed) / 14) * (isHorse ? 0.14 : 0.24)
            : -steerInput * Math.min(1, Math.abs(v.speed) / 28) * 0.068;
          const targetPitch =
            (throttle < 0 || handbrake ? 0.042 : throttle > 0 ? -0.026 : 0) * Math.min(1, Math.abs(v.speed) / 14);
          v.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.z, targetRoll, 9, dt);
          v.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.x, targetPitch, 9, dt);

          if (isHorse && v.rig.horseLegs) {
            const absSpd = Math.abs(v.speed);
            const speedRatio = Math.min(1.2, absSpd / spec.maxSpeed);
            if (absSpd > 0.4) {
              const stride = elapsed * (4.5 + speedRatio * 10.5);
              const swingAmp = 0.28 + speedRatio * 0.56;
              v.rig.horseLegs[0].rotation.x = Math.sin(stride) * swingAmp;
              v.rig.horseLegs[1].rotation.x = Math.sin(stride + 1.05) * swingAmp;
              v.rig.horseLegs[2].rotation.x = -Math.sin(stride + 0.55) * swingAmp;
              v.rig.horseLegs[3].rotation.x = -Math.sin(stride + 1.55) * swingAmp;
              v.rig.chassisGroup.position.y = Math.abs(Math.sin(stride)) * 0.095 * speedRatio;
              if (v.rig.horseNeckPivot) {
                v.rig.horseNeckPivot.rotation.x = Math.sin(stride) * 0.11 * speedRatio;
              }
              if (v.rig.horseTailPivot) {
                v.rig.horseTailPivot.rotation.x = 0.24 + speedRatio * 0.35 + Math.sin(stride * 2) * 0.12;
                v.rig.horseTailPivot.rotation.z = Math.cos(stride) * 0.14;
              }
            } else {
              for (const leg of v.rig.horseLegs) leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 10, dt);
              v.rig.chassisGroup.position.y = THREE.MathUtils.damp(v.rig.chassisGroup.position.y, 0, 10, dt);
              if (v.rig.horseNeckPivot) {
                v.rig.horseNeckPivot.rotation.x = Math.sin(elapsed * 1.4) * 0.04;
              }
              if (v.rig.horseTailPivot) {
                v.rig.horseTailPivot.rotation.x = 0.06;
                v.rig.horseTailPivot.rotation.z = Math.sin(elapsed * 2.2) * 0.09;
              }
            }
          }

          if (!isHorse) {
            const brakingNow = throttle < -0.05 || handbrake;
            v.rig.taillightMat.emissiveIntensity = brakingNow ? 2.1 : headlightsActive ? 0.85 : 0.25;
            v.rig.headlightMat.emissiveIntensity = headlightsActive ? 1.9 : 0.35;
            for (const hs of v.rig.headlightSprites) hs.material.opacity = headlightsActive ? 0.68 : 0.1;
            for (const ts of v.rig.taillightSprites) ts.material.opacity = brakingNow ? 0.72 : headlightsActive ? 0.35 : 0.08;
            if (v.rig.headlightSpot) v.rig.headlightSpot.intensity = headlightsActive ? 5.2 : 0;

            // Blinking Amber Turn Signals & Working Steering Wheel
            const blink = Math.floor(elapsed * 6) % 2 === 0;
            v.rig.leftSignalMat.emissiveIntensity = activeTurnSignal === -1 && blink ? 2.4 : 0.05;
            v.rig.rightSignalMat.emissiveIntensity = activeTurnSignal === 1 && blink ? 2.4 : 0.05;
            if (v.rig.steeringWheel) {
              v.rig.steeringWheel.rotation.z = -v.steerAngle * 2.2;
            }
          }

          for (const fw of v.rig.frontWheelSteers) fw.rotation.y = v.steerAngle;
          for (const w of v.rig.wheels) w.rotation.x += v.speed * dt * 2.4;

          speedKmh = Math.round(Math.abs(v.speed) * 3.6);
          if (isHorse) {
            gearLabel = speedKmh < 3 ? 'IDL' : speedKmh < 24 ? 'WLK' : speedKmh < 54 ? 'TRT' : 'GLP';
          } else {
            const gearIdx = v.speed < -0.5 ? 0 : speedKmh < 3 ? 0 : Math.min(6, Math.ceil(speedKmh / 28));
            gearLabel = v.speed < -0.5 ? 'R' : speedKmh < 3 ? 'N' : String(gearIdx);
          }
        }

        // Check Taxi Fare Completion
        if (sim.taxiTarget) {
          const tDist = Math.hypot(v.x - sim.taxiTarget.x, v.z - sim.taxiTarget.z);
          if (tDist < 9 && speedKmh < 14) {
            const label = sim.taxiTarget.label;
            const payout = sim.taxiPayout;
            sim.taxiTarget = null;
            store.addMoney(payout);
            audioEngine.playMissionComplete();
            store.pushToast(`Taxi Dropoff Complete!`, `Arrived at ${label} · Earned $${payout}`, 'success');
          }
        }

        sim.px = v.x;
        sim.py = v.y;
        sim.pz = v.z;
        sim.protY = v.rotationY;

        if (!isDraggingCamera && store.cameraMode !== 'first_person') {
          const desiredYaw = v.rotationY + Math.PI;
          let diff = desiredYaw - sim.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          sim.camYaw += diff * Math.min(1, dt * 3.8);
        }

        // Vehicle Camera Modes: third_far, third_close, first_person cockpit
        if (store.cameraMode === 'first_person') {
          const fwdX = Math.sin(v.rotationY);
          const fwdZ = Math.cos(v.rotationY);
          const rightX = Math.cos(v.rotationY);
          const rightZ = -Math.sin(v.rotationY);
          const seatY =
            vClass === 'horse'
              ? v.y + 1.92
              : vClass === 'helicopter'
                ? v.y + 1.45
                : vClass === 'motorcycle' || vClass === 'bicycle'
                  ? v.y + 1.45
                  : v.y + spec.height * 0.76;
          const seatSide = vClass === 'motorcycle' || vClass === 'bicycle' || vClass === 'boat' || vClass === 'horse' ? 0 : -spec.width * 0.18;
          _camDesired.set(
            v.x + fwdX * (spec.length * 0.14) + rightX * seatSide,
            seatY,
            v.z + fwdZ * (spec.length * 0.14) + rightZ * seatSide
          );
          _camTarget.set(
            _camDesired.x + fwdX * 16,
            seatY - 0.18,
            _camDesired.z + fwdZ * 16
          );
        } else {
          const distMult = store.cameraMode === 'third_close' ? 1.05 : 1.45;
          const camDist = spec.length * distMult + (store.cameraMode === 'third_close' ? 1.2 : 2.3);
          const camHeight = (store.cameraMode === 'third_close' ? 1.9 : 2.65) + Math.sin(sim.camPitch) * 3.8;
          _camTarget.set(v.x, v.y + 1.35, v.z);
          _camDesired.set(
            v.x + Math.sin(sim.camYaw) * camDist,
            Math.max(getGroundHeightAt(v.x, v.z) + 1.0, v.y + camHeight),
            v.z + Math.cos(sim.camYaw) * camDist
          );
        }

        const targetFov = store.cameraMode === 'first_person' ? 74 : 62 + Math.min(18, (Math.abs(v.speed) / 48) * 18);
        if (Math.abs(camera.fov - targetFov) > 0.1) {
          camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5, dt);
          camera.updateProjectionMatrix();
        }

        const gearIdx = Math.min(6, Math.max(1, Math.ceil(speedKmh / 28)));
        const gearMin = Math.max(0, (gearIdx - 1) * 28);
        const rpmBand = v.speed < 1 ? Math.abs(v.speed) / spec.maxSpeed : 0.35 + ((speedKmh - gearMin) / 28) * 0.65;

        audioEngine.updateVehicleAudio(
          true,
          THREE.MathUtils.clamp(rpmBand, 0.1, 1.15),
          isDrifting,
          isRaining,
          store.wantedLevel,
          elapsed,
          vClass
        );
      } else {
        // ON-FOOT THIRD-PERSON / FIRST-PERSON CHARACTER + FLIGHT + SWIMMING + CROUCH STEALTH
        const triggerShockwaveSlam = () => {
          sim.shockwaveTimer = 0.45;
          sim.shockwaveCooldown = 1.4;
          const groundYSlam = getGroundHeightAt(sim.px, sim.pz, sim.py);
          shockRingMat.color.set(
            isSunburstHero
              ? '#e0f2fe'
              : isGokuHero || isNarutoHero
                ? '#38bdf8'
                : isBatmanHero
                  ? '#c49d62'
                  : '#facc15'
          );
          shockRingMesh.position.set(sim.px, groundYSlam + 0.16, sim.pz);
          shockRingMesh.scale.setScalar(1);
          shockRingMesh.visible = true;
          shockRingMat.opacity = 0.88;
          audioEngine.playShockwave();
          sim.camShake = Math.max(sim.camShake, 0.55);
          spawnImpactSparks(sim.px, groundYSlam + 0.3, sim.pz, 22);

          let triggeredHeat = false;
          for (const off of policeOfficers) {
            if (!off.active) continue;
            const dx = off.x - sim.px;
            const dz = off.z - sim.pz;
            const dist = Math.hypot(dx, dz) || 0.1;
            if (dist < 12.5) {
              off.stunTimer = 5.5;
              off.x += (dx / dist) * 5.2;
              off.z += (dz / dist) * 5.2;
              triggeredHeat = true;
            }
          }
          for (const cop of policeAgents) {
            if (!cop.active) continue;
            const dx = cop.x - sim.px;
            const dz = cop.z - sim.pz;
            const dist = Math.hypot(dx, dz) || 0.1;
            if (dist < 12.5) {
              cop.x += (dx / dist) * 4.2;
              cop.z += (dz / dist) * 4.2;
              cop.speed = -12;
              spawnImpactSparks(cop.x, groundYSlam + 0.5, cop.z, 10);
              triggeredHeat = true;
            }
          }
          for (const tr of trafficAgents) {
            const dist = Math.hypot(tr.x - sim.px, tr.z - sim.pz);
            if (dist < 12.5) {
              tr.speed = 0;
              spawnImpactSparks(tr.x, groundYSlam + 0.5, tr.z, 8);
              triggeredHeat = true;
            }
          }
          for (const wv of worldVehicles) {
            if (wv.isPlayerOwned) continue;
            const dist = Math.hypot(wv.x - sim.px, wv.z - sim.pz);
            if (dist < 12.5) {
              wv.health = Math.max(10, wv.health - 28);
              spawnImpactSparks(wv.x, wv.y + 0.5, wv.z, 8);
              triggeredHeat = true;
            }
          }
          for (const ped of pedestrians) {
            const dx = ped.x - sim.px;
            const dz = ped.z - sim.pz;
            const dist = Math.hypot(dx, dz) || 0.1;
            if (dist < 12.5) {
              ped.rotY = Math.atan2(dx, dz);
              ped.x += (dx / dist) * 4.2;
              ped.z += (dz / dist) * 4.2;
              triggeredHeat = true;
            }
          }
          if (triggeredHeat) {
            store.triggerCrimeHeat(2);
          }
        };

        if (gameInput.flyTogglePressed) {
          gameInput.flyTogglePressed = false;
          sim.isFlying = !sim.isFlying;
          sim.divingSlam = false;
          gameInput.crouch = false;
          if (sim.isFlying) {
            sim.pvy = 6.0;
            sim.onGround = false;
            audioEngine.playJump();
            store.pushToast(
              'Flight Engaged',
              'WASD Glide · Shift Boost · Space Up · Ctrl Down · H Land',
              'info'
            );
          } else {
            store.pushToast('Flight Disengaged', undefined, 'info');
          }
        }

        const groundYNow = getGroundHeightAt(sim.px, sim.pz, sim.py);
        if (gameInput.shockwavePressed) {
          gameInput.shockwavePressed = false;
          if (isSuperHero && sim.shockwaveCooldown <= 0) {
            if (sim.isFlying && sim.py > groundYNow + 3.5) {
              sim.divingSlam = true;
              sim.pvy = -34;
              audioEngine.playJump();
            } else {
              triggerShockwaveSlam();
            }
          }
        }

        isCrouchingNow = !sim.isFlying && gameInput.crouch;
        inWaterNow =
          !sim.isFlying &&
          sim.pz > 214 &&
          Math.abs(sim.px) > 6.5 &&
          Math.abs(sim.px - 118) > 5.5 &&
          sim.py < 2.2;

        const inputMag = Math.min(1, Math.hypot(moveFwd, moveTurn));
        const isSprinting = gameInput.sprint && !isCrouchingNow && inputMag > 0.1 && (sim.isFlying || sim.stamina > 2);
        if (isSprinting && !sim.isFlying) sim.stamina = Math.max(0, sim.stamina - dt * 20);
        else sim.stamina = Math.min(100, sim.stamina + dt * 15);

        const baseWalkSpeed = sim.isFlying
          ? isSprinting
            ? 48
            : 28
          : inWaterNow
            ? 3.8
            : isCrouchingNow
              ? 3.1
              : isSprinting
                ? 10.2
                : 5.4;
        const heroSpeedMult = isGokuHero
          ? 1.25
          : isNarutoHero
            ? 1.22
            : isSunburstHero
              ? 1.18
              : isBatmanHero
                ? 1.12
                : isNomadHero
                  ? 1.08
                  : 1.0;
        const walkSpeed = baseWalkSpeed * heroSpeedMult * (sim.speedBoostTimer > 0 ? 1.32 : 1.0);

        if (inputMag > 0.05) {
          const camForwardX = -Math.sin(sim.camYaw);
          const camForwardZ = -Math.cos(sim.camYaw);
          const camRightX = Math.cos(sim.camYaw);
          const camRightZ = -Math.sin(sim.camYaw);

          let dirX = camForwardX * moveFwd - camRightX * moveTurn;
          let dirZ = camForwardZ * moveFwd - camRightZ * moveTurn;
          const len = Math.hypot(dirX, dirZ) || 1;
          dirX /= len;
          dirZ /= len;

          const targetRot = Math.atan2(dirX, dirZ);
          let rDiff = targetRot - sim.protY;
          while (rDiff > Math.PI) rDiff -= Math.PI * 2;
          while (rDiff < -Math.PI) rDiff += Math.PI * 2;
          sim.protY += rDiff * Math.min(1, dt * 12);

          const nextX = sim.px + dirX * walkSpeed * inputMag * dt;
          const nextZ = sim.pz + dirZ * walkSpeed * inputMag * dt;
          const col = resolveCircleWorldCollision(nextX, nextZ, 0.48, {
            allowWater: true,
            isAircraft: sim.isFlying && sim.py > groundYNow + 10,
            currentY: sim.py,
          });
          sim.px = col.x;
          sim.pz = col.z;
          sim.walkCycle += dt * (isSprinting ? 14 : 9);
        } else {
          sim.walkCycle = THREE.MathUtils.damp(sim.walkCycle, 0, 8, dt);
        }

        if (sim.isFlying) {
          const climb = (gameInput.jumpOrBrake ? 1 : 0) - (gameInput.descend ? 1 : 0);
          const targetVy = sim.divingSlam ? -44 : climb > 0 ? 16 : climb < 0 ? -15 : 0;
          sim.pvy = THREE.MathUtils.damp(sim.pvy, targetVy, sim.divingSlam ? 12 : 6.5, dt);
          const groundY = getGroundHeightAt(sim.px, sim.pz, sim.py);
          sim.py = THREE.MathUtils.clamp(sim.py + sim.pvy * dt, groundY, 110);
          sim.onGround = false;
          if (sim.divingSlam && sim.py <= groundY + 0.15) {
            sim.py = groundY;
            sim.pvy = 0;
            sim.isFlying = false;
            sim.divingSlam = false;
            sim.onGround = true;
            triggerShockwaveSlam();
          } else if (climb < 0 && sim.py <= groundY + 0.04) {
            sim.py = groundY;
            sim.pvy = 0;
            sim.isFlying = false;
            sim.onGround = true;
            store.pushToast('Landed', undefined, 'info');
          }
        } else if (inWaterNow) {
          sim.py = -0.34 + Math.sin(elapsed * 2.5) * 0.05;
          sim.pvy = 0;
          sim.onGround = false;
        } else {
          if (gameInput.jumpOrBrake && sim.onGround) {
            sim.pvy = 7.4;
            sim.onGround = false;
            isCrouchingNow = false;
            gameInput.crouch = false;
            audioEngine.playJump();
          }
          sim.pvy -= 20 * dt;
          sim.py += sim.pvy * dt;
          const groundY = getGroundHeightAt(sim.px, sim.pz, sim.py);
          if (sim.py <= groundY) {
            sim.py = groundY;
            sim.pvy = 0;
            sim.onGround = true;
          } else if (sim.onGround && sim.py > groundY + 0.15) {
            sim.onGround = false;
          }
        }

        // MULTI-WEAPON & HERO POWER COMBAT (Heat Vision / Kamehameha-Rasengan Energy Blast / Sonic Punch / Melee, Pistol, SMG, Carbine Rifle, Shotgun, RPG-7)
        const weaponId = store.activeWeaponId;
        const wSpec = WEAPONS[weaponId];
        const useHeatVision = isParagonHero && weaponId === 'unarmed';
        const useEnergyBlast = (isGokuHero || isNarutoHero) && weaponId === 'unarmed';
        const useBeamPower = useHeatVision || useEnergyBlast;
        const useSonicPunch = isSunburstHero && weaponId === 'unarmed';
        sim.fireCooldown = Math.max(0, sim.fireCooldown - dt);
        sim.aimHoldTimer = Math.max(0, sim.aimHoldTimer - dt);
        sim.muzzleTimer = Math.max(0, sim.muzzleTimer - dt);

        const wantsAutoFire = (weaponId === 'rifle' || weaponId === 'smg' || useBeamPower || useSonicPunch) && gameInput.fireHeld;
        if ((gameInput.firePressed || wantsAutoFire) && !inWaterNow) {
          gameInput.firePressed = false;
          if (sim.fireCooldown <= 0) {
            if (!store.consumeAmmo(weaponId)) {
              store.pushToast('Out of Ammo', `Visit Solaris Tactical or press 1 for Melee / Hero Power.`, 'warning');
              sim.fireCooldown = 0.35;
            } else {
              sim.fireCooldown = useBeamPower ? 0.17 : useSonicPunch ? 0.2 : wSpec.cooldown;
              sim.aimHoldTimer = useBeamPower || useSonicPunch ? 0.28 : weaponId === 'sword' ? 0.42 : 0.78;
              sim.muzzleTimer = weaponId === 'unarmed' || weaponId === 'sword' ? 0 : 0.075;
              sim.protY = sim.camYaw + Math.PI;
              sim.camShake = Math.max(
                sim.camShake,
                weaponId === 'rpg'
                  ? 0.65
                  : useSonicPunch
                    ? 0.22
                    : useBeamPower
                      ? 0.14
                      : weaponId === 'shotgun'
                        ? 0.24
                        : weaponId === 'sword'
                          ? 0.12
                          : weaponId === 'unarmed'
                            ? 0.08
                            : 0.14
              );
              if (useBeamPower) {
                audioEngine.playHeatVision();
              } else if (useSonicPunch) {
                audioEngine.playMelee();
              } else {
                audioEngine.playGunshot(weaponId);
              }

              const baseLookX = -Math.sin(sim.camYaw);
              const baseLookZ = -Math.cos(sim.camYaw);
              const muzzleY = sim.py + (isCrouchingNow ? 1.05 : 1.44);
              const muzzleX = sim.px + baseLookX * 0.65;
              const muzzleZ = sim.pz + baseLookZ * 0.65;
              const effRange = useBeamPower ? 75 : useSonicPunch ? 13.5 : wSpec.range;
              const effSpread = useBeamPower || useSonicPunch ? 0 : wSpec.spread;
              const effDamage = useBeamPower ? 46 : useSonicPunch ? 48 : wSpec.damage;
              let triggeredHeat = false;
              let heatBestT = effRange;
              let lastImpactX = sim.px + baseLookX * effRange;
              let lastImpactZ = sim.pz + baseLookZ * effRange;

              if (useSonicPunch) {
                spawnImpactSparks(muzzleX + baseLookX * 1.4, muzzleY - 0.1, muzzleZ + baseLookZ * 1.4, 8);
              }

              for (let pellet = 0; pellet < wSpec.pellets; pellet++) {
                const spreadAngle = (Math.random() - 0.5) * effSpread * 2;
                const cosA = Math.cos(spreadAngle);
                const sinA = Math.sin(spreadAngle);
                const lookX = baseLookX * cosA - baseLookZ * sinA;
                const lookZ = baseLookX * sinA + baseLookZ * cosA;

                let bestT = effRange;
                let hitType: 'police' | 'officer' | 'vehicle' | 'ped' | null = null;
                let hitVehicle: WorldVehicle | null = null;
                let hitPed: PedestrianAgent | null = null;
                let hitOfficer: PoliceOfficerAgent | null = null;
                let hitPoliceCop: PoliceAgent | null = null;

                for (const cop of policeAgents) {
                  if (!cop.active) continue;
                  const dx = cop.x - sim.px;
                  const dz = cop.z - sim.pz;
                  const proj = dx * lookX + dz * lookZ;
                  if (proj > 1 && proj < bestT) {
                    const perp = Math.hypot(dx - lookX * proj, dz - lookZ * proj);
                    if (perp < 1.85) {
                      bestT = proj;
                      hitType = 'police';
                      hitPoliceCop = cop;
                    }
                  }
                }
                for (const off of policeOfficers) {
                  if (!off.active) continue;
                  const dx = off.x - sim.px;
                  const dz = off.z - sim.pz;
                  const proj = dx * lookX + dz * lookZ;
                  if (proj > 0.7 && proj < bestT) {
                    const perp = Math.hypot(dx - lookX * proj, dz - lookZ * proj);
                    if (perp < 0.85) {
                      bestT = proj;
                      hitType = 'officer';
                      hitOfficer = off;
                    }
                  }
                }
                for (const tr of trafficAgents) {
                  const dx = tr.x - sim.px;
                  const dz = tr.z - sim.pz;
                  const proj = dx * lookX + dz * lookZ;
                  if (proj > 1 && proj < bestT) {
                    const perp = Math.hypot(dx - lookX * proj, dz - lookZ * proj);
                    if (perp < 1.85) {
                      bestT = proj;
                      hitType = 'vehicle';
                      hitVehicle = null;
                    }
                  }
                }
                for (const wv of worldVehicles) {
                  const dx = wv.x - sim.px;
                  const dz = wv.z - sim.pz;
                  const proj = dx * lookX + dz * lookZ;
                  if (proj > 1 && proj < bestT) {
                    const perp = Math.hypot(dx - lookX * proj, dz - lookZ * proj);
                    if (perp < 1.85) {
                      bestT = proj;
                      hitType = 'vehicle';
                      hitVehicle = wv;
                    }
                  }
                }
                for (const ped of pedestrians) {
                  const dx = ped.x - sim.px;
                  const dz = ped.z - sim.pz;
                  const proj = dx * lookX + dz * lookZ;
                  if (proj > 0.6 && proj < bestT) {
                    const perp = Math.hypot(dx - lookX * proj, dz - lookZ * proj);
                    if (perp < 0.88) {
                      bestT = proj;
                      hitType = 'ped';
                      hitPed = ped;
                    }
                  }
                }

                heatBestT = bestT;
                const hx = sim.px + lookX * bestT;
                const hz = sim.pz + lookZ * bestT;
                lastImpactX = hx;
                lastImpactZ = hz;
                if (weaponId !== 'unarmed' && weaponId !== 'sword') {
                  addTracer(muzzleX, muzzleY, muzzleZ, hx, muzzleY - 0.05, hz);
                }

                if (hitType === 'police') {
                  spawnImpactSparks(hx, getGroundHeightAt(hx, hz) + 0.55, hz, 12);
                  audioEngine.playImpact(0.55);
                  if ((useBeamPower || useSonicPunch) && hitPoliceCop) {
                    hitPoliceCop.speed = useSonicPunch ? -11 : -9;
                  }
                  store.triggerCrimeHeat(2);
                  triggeredHeat = true;
                } else if (hitType === 'officer' && hitOfficer) {
                  spawnImpactSparks(hx, getGroundHeightAt(hx, hz) + 0.85, hz, 10);
                  hitOfficer.stunTimer = useSonicPunch ? 5.2 : 4.5;
                  hitOfficer.x += lookX * (useSonicPunch ? 3.8 : useBeamPower ? 2.6 : 1.4);
                  hitOfficer.z += lookZ * (useSonicPunch ? 3.8 : useBeamPower ? 2.6 : 1.4);
                  store.triggerCrimeHeat(3);
                  triggeredHeat = true;
                } else if (hitType === 'vehicle') {
                  spawnImpactSparks(hx, getGroundHeightAt(hx, hz) + 0.55, hz, 10);
                  audioEngine.playImpact(0.45);
                  if (hitVehicle) hitVehicle.health = Math.max(10, hitVehicle.health - effDamage * 0.35);
                  store.triggerCrimeHeat(1);
                  triggeredHeat = true;
                } else if (hitType === 'ped' && hitPed && hitPed.active) {
                  spawnImpactSparks(hitPed.x, getGroundHeightAt(hitPed.x, hitPed.z) + 0.7, hitPed.z, 8);
                  hitPed.rotY = Math.atan2(hitPed.x - sim.px, hitPed.z - sim.pz);
                  hitPed.x += lookX * (useSonicPunch ? 3.8 : useBeamPower ? 2.6 : 1.6);
                  hitPed.z += lookZ * (useSonicPunch ? 3.8 : useBeamPower ? 2.6 : 1.6);
                  const dmg = weaponId === 'rpg' ? 160 : weaponId === 'shotgun' ? 75 : weaponId === 'rifle' ? 60 : weaponId === 'sword' ? 70 : weaponId === 'pistol' ? 45 : 35;
                  hitPed.hp -= useBeamPower || useSonicPunch ? 120 : dmg;
                  if (hitPed.hp <= 0 && hitPed.active) {
                    hitPed.active = false;
                    hitPed.rig.group.position.y = -100;
                    const cash = Math.floor(120 + Math.random() * 280);
                    store.addMoney(cash);
                    store.pushToast('Pedestrian Eliminated', `Looted +$${cash} cash from civilian.`, 'success');
                    audioEngine.playCheckpoint();
                  }
                  store.triggerCrimeHeat(2);
                  triggeredHeat = true;
                }
              }

              // Explosive AOE Blast for Solaris RPG-7 Launcher
              if (weaponId === 'rpg') {
                const blastY = getGroundHeightAt(lastImpactX, lastImpactZ);
                audioEngine.playExplosion();
                shockRingMat.color.set('#fb923c');
                shockRingMesh.position.set(lastImpactX, blastY + 0.2, lastImpactZ);
                shockRingMesh.scale.setScalar(1);
                shockRingMesh.visible = true;
                shockRingMat.opacity = 0.92;
                sim.shockwaveTimer = 0.45;
                spawnImpactSparks(lastImpactX, blastY + 0.5, lastImpactZ, 30);

                for (const off of policeOfficers) {
                  if (!off.active) continue;
                  const dx = off.x - lastImpactX;
                  const dz = off.z - lastImpactZ;
                  const dist = Math.hypot(dx, dz) || 0.1;
                  if (dist < 13.5) {
                    off.stunTimer = 6;
                    off.x += (dx / dist) * 5.5;
                    off.z += (dz / dist) * 5.5;
                    triggeredHeat = true;
                  }
                }
                for (const cop of policeAgents) {
                  if (!cop.active) continue;
                  const dx = cop.x - lastImpactX;
                  const dz = cop.z - lastImpactZ;
                  const dist = Math.hypot(dx, dz) || 0.1;
                  if (dist < 13.5) {
                    cop.x += (dx / dist) * 4.5;
                    cop.z += (dz / dist) * 4.5;
                    cop.speed = -13;
                    triggeredHeat = true;
                  }
                }
                for (const tr of trafficAgents) {
                  if (Math.hypot(tr.x - lastImpactX, tr.z - lastImpactZ) < 13.5) {
                    tr.speed = 0;
                    triggeredHeat = true;
                  }
                }
                for (const wv of worldVehicles) {
                  if (wv.isPlayerOwned) continue;
                  if (Math.hypot(wv.x - lastImpactX, wv.z - lastImpactZ) < 13.5) {
                    wv.health = Math.max(10, wv.health - 55);
                    triggeredHeat = true;
                  }
                }
                for (const ped of pedestrians) {
                  const dx = ped.x - lastImpactX;
                  const dz = ped.z - lastImpactZ;
                  const dist = Math.hypot(dx, dz) || 0.1;
                  if (dist < 13.5) {
                    ped.rotY = Math.atan2(dx, dz);
                    ped.x += (dx / dist) * 4.5;
                    ped.z += (dz / dist) * 4.5;
                    triggeredHeat = true;
                  }
                }
                store.triggerCrimeHeat(3);
              }

              // Render Twin Crimson Eye Beams (Paragon) or Cyan Energy Beams (Goku Kamehameha / Naruto Rasengan Blast)
              if (useBeamPower) {
                sim.heatVisionTimer = 0.16;
                heatBeamMat.color.set(useEnergyBlast ? '#38bdf8' : '#ff2d20');
                heatImpactSprite.material.color.set(useEnergyBlast ? '#7dd3fc' : '#ff4d2e');
                const eyeY = sim.py + (isCrouchingNow ? 1.24 : useEnergyBlast ? 1.28 : 1.7);
                const rightX = Math.cos(sim.protY);
                const rightZ = -Math.sin(sim.protY);
                const fwdOffsetX = baseLookX * (useEnergyBlast ? 0.45 : 0.14);
                const fwdOffsetZ = baseLookZ * (useEnergyBlast ? 0.45 : 0.14);
                const tx = sim.px + baseLookX * heatBestT;
                const ty = Math.max(getGroundHeightAt(tx, sim.pz + baseLookZ * heatBestT) + 0.2, eyeY - Math.sin(sim.camPitch - 0.14) * heatBestT * 0.45);
                const tz = sim.pz + baseLookZ * heatBestT;
                _hvTargetPos.set(tx, ty, tz);

                const positionBeam = (beamMesh: THREE.Mesh, side: -1 | 1) => {
                  _hvEyePos.set(
                    sim.px + fwdOffsetX + rightX * side * (useEnergyBlast ? 0.03 : 0.055),
                    eyeY,
                    sim.pz + fwdOffsetZ + rightZ * side * (useEnergyBlast ? 0.03 : 0.055)
                  );
                  _hvDir.subVectors(_hvTargetPos, _hvEyePos);
                  const dist = Math.max(0.5, _hvDir.length());
                  _hvDir.divideScalar(dist);
                  _hvMid.addVectors(_hvEyePos, _hvTargetPos).multiplyScalar(0.5);
                  beamMesh.position.copy(_hvMid);
                  beamMesh.quaternion.setFromUnitVectors(_hvUp, _hvDir);
                  beamMesh.scale.set(useEnergyBlast ? 2.4 : 1, dist, useEnergyBlast ? 2.4 : 1);
                  beamMesh.visible = true;
                };
                positionBeam(heatBeamLeft, -1);
                positionBeam(heatBeamRight, 1);
                heatBeamMat.opacity = 0.92;
                heatImpactSprite.position.copy(_hvTargetPos);
                heatImpactSprite.material.opacity = 0.95;
                heatImpactSprite.visible = true;
              }

              // Non-silent firearm alerts nearby pedestrians within radius (halved when crouching)
              if (!triggeredHeat && ((weaponId !== 'unarmed' && weaponId !== 'sword') || useBeamPower || useSonicPunch)) {
                const alertRadius = isCrouchingNow ? 11 : 22;
                for (const ped of pedestrians) {
                  if (Math.hypot(ped.x - sim.px, ped.z - sim.pz) < alertRadius) {
                    ped.rotY = Math.atan2(ped.x - sim.px, ped.z - sim.pz);
                    store.triggerCrimeHeat(1);
                    break;
                  }
                }
              }
            }
          }
        } else {
          gameInput.firePressed = false;
        }

        // Character Pose & First-Person Head / Mask / Gear Visibility
        const isFirstPersonFoot = store.cameraMode === 'first_person';
        const isParagonSuit = store.outfitId === 'paragon_suit';
        const isDarkKnightSuit = store.outfitId === 'dark_knight';
        const isDesertSuit = store.outfitId === 'desert_commando';
        const isSunburstSuit = store.outfitId === 'sunburst_nika';
        const isNarutoSage = store.outfitId === 'naruto_sage_cloak';
        const isNarutoTrack = store.outfitId === 'naruto_tracksuit';
        const isNarutoSuit = isNarutoSage || isNarutoTrack;
        const isGokuSuit = store.outfitId === 'goku_damaged_gi';
        const isSpecialOutfit = [
          'tactical_operator',
          'street_hoodie',
          'academy_sailor',
          'arachnid_suit',
          'paragon_suit',
          'dark_knight',
          'desert_commando',
          'sunburst_nika',
          'naruto_sage_cloak',
          'naruto_tracksuit',
          'goku_damaged_gi',
        ].includes(store.outfitId);
        playerRig.head.visible =
          !isFirstPersonFoot &&
          !isParagonSuit &&
          !isDarkKnightSuit &&
          !isDesertSuit &&
          !isSunburstSuit &&
          !isNarutoSuit &&
          !isGokuSuit &&
          store.outfitId !== 'arachnid_suit';
        playerRig.baseFaceGroup.visible =
          !isFirstPersonFoot &&
          !isParagonSuit &&
          !isDarkKnightSuit &&
          !isDesertSuit &&
          !isSunburstSuit &&
          !isNarutoSuit &&
          !isGokuSuit &&
          store.outfitId !== 'arachnid_suit';
        playerRig.paragonHeadGroup.visible = !isFirstPersonFoot && isParagonSuit;
        playerRig.darkKnightHeadGroup.visible = !isFirstPersonFoot && isDarkKnightSuit;
        playerRig.desertHeadGroup.visible = !isFirstPersonFoot && isDesertSuit;
        playerRig.capeTopPivot.visible = !isFirstPersonFoot && (isParagonSuit || isDarkKnightSuit);
        playerRig.paragonCapeMeshes.forEach((m) => (m.visible = isParagonSuit));
        playerRig.darkKnightCapeMeshes.forEach((m) => (m.visible = isDarkKnightSuit));
        playerRig.sunburstHeadGroup.visible = !isFirstPersonFoot && isSunburstSuit;
        playerRig.sunburstCloudRing.visible = !isFirstPersonFoot && isSunburstSuit;
        playerRig.narutoHeadGroup.visible = !isFirstPersonFoot && isNarutoSuit;
        playerRig.narutoSageItems.forEach((o) => {
          o.visible = !isFirstPersonFoot && isNarutoSage;
        });
        playerRig.narutoTrackItems.forEach((o) => {
          o.visible = !isFirstPersonFoot && isNarutoTrack;
        });
        playerRig.gokuHeadGroup.visible = !isFirstPersonFoot && isGokuSuit;
        playerRig.gokuGearItems.forEach((o) => {
          o.visible = !isFirstPersonFoot && isGokuSuit;
        });
        playerRig.hairMesh.visible = !isFirstPersonFoot && !isSpecialOutfit;
        playerRig.arachnidMaskGroup.visible = !isFirstPersonFoot && store.outfitId === 'arachnid_suit';
        playerRig.tacticalGearGroup.visible = !isFirstPersonFoot && store.outfitId === 'tactical_operator';
        playerRig.hoodieGearGroup.visible = !isFirstPersonFoot && store.outfitId === 'street_hoodie';
        if (playerRig.shadesMesh) playerRig.shadesMesh.visible = !isFirstPersonFoot && !isSpecialOutfit;

        playerRig.group.position.set(sim.px, sim.py, sim.pz);
        playerRig.group.rotation.y = sim.protY;
        const groundForShadow = getGroundHeightAt(sim.px, sim.pz, sim.py);
        playerRig.shadowPlane.position.y = Math.min(0.02, groundForShadow - sim.py + 0.02);
        const shadowMat = playerRig.shadowPlane.material as THREE.MeshBasicMaterial;
        shadowMat.opacity = inWaterNow ? 0 : Math.max(0.08, 0.48 - Math.max(0, sim.py - groundForShadow) * 0.022);

        const swing = inputMag > 0.05 ? Math.sin(sim.walkCycle) * (isSprinting ? 0.85 : 0.55) : 0;
        if (sim.isFlying) {
          const targetPitch = inputMag > 0.1 ? (isSprinting ? 1.15 : 0.72) : 0.12;
          playerRig.bodyGroup.rotation.x = THREE.MathUtils.damp(playerRig.bodyGroup.rotation.x, targetPitch, 8, dt);
          playerRig.bodyGroup.position.y = Math.sin(elapsed * 3.2) * 0.06;
          playerRig.leftArm.rotation.x = THREE.MathUtils.damp(
            playerRig.leftArm.rotation.x,
            inputMag > 0.1 ? -0.35 : -0.45 + Math.sin(elapsed * 2.8) * 0.08,
            8,
            dt
          );
          if (sim.aimHoldTimer > 0 && weaponId === 'sword') {
            const slashT = 1 - Math.min(1, sim.aimHoldTimer / 0.42);
            playerRig.rightArm.rotation.x = -Math.PI * 0.85 + slashT * Math.PI * 0.72;
            playerRig.rightArm.rotation.z = -0.35 + slashT * 0.75;
          } else {
            playerRig.rightArm.rotation.z = 0;
            playerRig.rightArm.rotation.x =
              sim.aimHoldTimer > 0
                ? weaponId === 'unarmed'
                  ? -Math.PI * 0.58
                  : -Math.PI * 0.48 - sim.muzzleTimer * 2.2
                : THREE.MathUtils.damp(
                    playerRig.rightArm.rotation.x,
                    inputMag > 0.1 ? -0.35 : -0.45 - Math.sin(elapsed * 2.8) * 0.08,
                    8,
                    dt
                  );
          }
          playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(playerRig.leftLeg.rotation.x, 0.18, 8, dt);
          playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(playerRig.rightLeg.rotation.x, 0.08, 8, dt);
        } else if (inWaterNow) {
          playerRig.bodyGroup.rotation.x = 0.65;
          playerRig.leftArm.rotation.x = -Math.PI * 0.55 + Math.sin(elapsed * 5) * 0.55;
          playerRig.rightArm.rotation.x = -Math.PI * 0.55 - Math.sin(elapsed * 5) * 0.55;
          playerRig.rightArm.rotation.z = 0;
          playerRig.leftLeg.rotation.x = Math.sin(elapsed * 6) * 0.45;
          playerRig.rightLeg.rotation.x = -Math.sin(elapsed * 6) * 0.45;
        } else {
          playerRig.bodyGroup.rotation.x = isCrouchingNow ? 0.28 : 0;
          playerRig.leftLeg.rotation.x = isCrouchingNow ? -0.35 + swing * 0.6 : swing;
          playerRig.rightLeg.rotation.x = isCrouchingNow ? -0.35 - swing * 0.6 : -swing;
          playerRig.leftArm.rotation.x = -swing * 0.75;
          if (sim.aimHoldTimer > 0 && weaponId === 'sword') {
            const slashT = 1 - Math.min(1, sim.aimHoldTimer / 0.42);
            playerRig.rightArm.rotation.x = -Math.PI * 0.85 + slashT * Math.PI * 0.72;
            playerRig.rightArm.rotation.z = -0.35 + slashT * 0.75;
          } else {
            playerRig.rightArm.rotation.z = 0;
            playerRig.rightArm.rotation.x =
              sim.aimHoldTimer > 0
                ? weaponId === 'unarmed'
                  ? -Math.PI * 0.58
                  : -Math.PI * 0.48 - sim.muzzleTimer * 2.2
                : swing * 0.75;
          }
          playerRig.bodyGroup.position.y = isCrouchingNow
            ? -0.34
            : inputMag > 0.05
              ? Math.abs(Math.sin(sim.walkCycle)) * 0.06
              : 0;
        }

        // Flowing 2-segment Cape Physics for Paragon & Dark Knight Suits
        if (isParagonSuit || isDarkKnightSuit) {
          const flutter =
            Math.sin(elapsed * (sim.isFlying ? 14 : isSprinting ? 10 : 3.2)) *
            (sim.isFlying ? 0.16 : isSprinting ? 0.12 : 0.035);
          const targetTopCapeX = sim.isFlying
            ? inputMag > 0.1
              ? isSprinting
                ? 0.48
                : 0.34
              : 0.22
            : inWaterNow
              ? 0.38
              : 0.11 + inputMag * (isSprinting ? 0.48 : 0.22);
          playerRig.capeTopPivot.rotation.x = THREE.MathUtils.damp(
            playerRig.capeTopPivot.rotation.x,
            targetTopCapeX + flutter,
            9,
            dt
          );
          playerRig.capeBottomPivot.rotation.x = THREE.MathUtils.damp(
            playerRig.capeBottomPivot.rotation.x,
            -0.08 + flutter * 1.45,
            10,
            dt
          );
          playerRig.capeBottomPivot.rotation.y = Math.cos(elapsed * 4.2) * 0.05;
        }

        // Floating Cloud Halo Ring Animation for Sunburst Suit
        if (isSunburstSuit) {
          playerRig.sunburstCloudRing.rotation.y = Math.sin(elapsed * 2.2) * 0.08;
          playerRig.sunburstCloudRing.position.y = Math.sin(elapsed * 3.4) * 0.035;
        }

        if (playerRig.muzzleSprite) {
          playerRig.muzzleSprite.material.opacity = sim.muzzleTimer > 0 ? Math.min(1, sim.muzzleTimer / 0.05) : 0;
        }

        // On-Foot Camera Modes
        if (isFirstPersonFoot) {
          const eyeY = sim.py + (isCrouchingNow ? 1.22 : 1.66);
          const lookDirX = -Math.sin(sim.camYaw);
          const lookDirZ = -Math.cos(sim.camYaw);
          _camDesired.set(sim.px + lookDirX * 0.2, eyeY, sim.pz + lookDirZ * 0.2);
          _camTarget.set(
            _camDesired.x + lookDirX * 16,
            eyeY - Math.sin(sim.camPitch - 0.15) * 14,
            _camDesired.z + lookDirZ * 16
          );
          if (Math.abs(camera.fov - 74) > 0.1) {
            camera.fov = THREE.MathUtils.damp(camera.fov, 74, 7, dt);
            camera.updateProjectionMatrix();
          }
        } else {
          const camDist = store.cameraMode === 'third_close' ? 3.8 : 5.4;
          const camHeight = (isCrouchingNow ? 1.25 : 1.62) + Math.sin(sim.camPitch) * 3.1;
          const gHeight = getGroundHeightAt(sim.px, sim.pz, sim.py);
          _camTarget.set(sim.px, sim.py + (isCrouchingNow ? 1.15 : 1.52), sim.pz);
          _camDesired.set(
            sim.px + Math.sin(sim.camYaw) * camDist,
            Math.max(gHeight + 0.75, sim.py + camHeight),
            sim.pz + Math.cos(sim.camYaw) * camDist
          );
          if (Math.abs(camera.fov - 62) > 0.1) {
            camera.fov = THREE.MathUtils.damp(camera.fov, 62, 6, dt);
            camera.updateProjectionMatrix();
          }
        }

        speedKmh = Math.round(inputMag * walkSpeed * 3.6);
        if (sim.isFlying) gearLabel = 'FLY';
        audioEngine.updateVehicleAudio(false, 0, false, isRaining, store.wantedLevel, elapsed, 'foot');
      }

      // Camera Damping + Impact Shake (Fast snap in First-Person)
      const camPosDamp = store.cameraMode === 'first_person' ? 28 : 10;
      const camLookDamp = store.cameraMode === 'first_person' ? 32 : 14;
      sim.camCurrentPos.x = THREE.MathUtils.damp(sim.camCurrentPos.x, _camDesired.x, camPosDamp, dt);
      sim.camCurrentPos.y = THREE.MathUtils.damp(sim.camCurrentPos.y, _camDesired.y, camPosDamp, dt);
      sim.camCurrentPos.z = THREE.MathUtils.damp(sim.camCurrentPos.z, _camDesired.z, camPosDamp, dt);
      sim.camCurrentLook.x = THREE.MathUtils.damp(sim.camCurrentLook.x, _camTarget.x, camLookDamp, dt);
      sim.camCurrentLook.y = THREE.MathUtils.damp(sim.camCurrentLook.y, _camTarget.y, camLookDamp, dt);
      sim.camCurrentLook.z = THREE.MathUtils.damp(sim.camCurrentLook.z, _camTarget.z, camLookDamp, dt);

      camera.position.copy(sim.camCurrentPos);
      if (sim.camShake > 0.005) {
        camera.position.x += (Math.random() - 0.5) * sim.camShake;
        camera.position.y += (Math.random() - 0.5) * sim.camShake;
        sim.camShake = THREE.MathUtils.damp(sim.camShake, 0, 12, dt);
      }
      camera.lookAt(sim.camCurrentLook);

      // AI TRAFFIC UPDATE
      const trafficMiniList: Array<{ x: number; z: number }> = [];
      for (const t of trafficAgents) {
        let stopForSignal = false;
        for (const tl of city.trafficLights) {
          if (t.axis === 'ns' && Math.abs(t.x - tl.x) < 10) {
            const distToStop = (tl.z - t.dir * 12 - t.z) * t.dir;
            if (distToStop > 0 && distToStop < 10 && !nsGo) stopForSignal = true;
          } else if (t.axis === 'ew' && Math.abs(t.z - tl.z) < 10) {
            const distToStop = (tl.x - t.dir * 12 - t.x) * t.dir;
            if (distToStop > 0 && distToStop < 10 && nsGo) stopForSignal = true;
          }
        }
        const distPlayer = Math.hypot(t.x - sim.px, t.z - sim.pz);
        if (distPlayer < 9.5 && sim.py < 4) stopForSignal = true;

        const targetSpd = stopForSignal ? 0 : t.maxSpeed;
        t.speed = THREE.MathUtils.damp(t.speed, targetSpd, 4, dt);

        if (t.axis === 'ns') {
          t.z += t.dir * t.speed * dt;
          if (t.z > 185) t.z = -185;
          if (t.z < -185) t.z = 185;
        } else {
          t.x += t.dir * t.speed * dt;
          if (t.x > 195) t.x = -195;
          if (t.x < -195) t.x = 195;
        }

        if (distPlayer < 3.1 && sim.py < 3 && sim.activeVehicle && Math.abs(sim.activeVehicle.speed) > 7) {
          audioEngine.playImpact(0.8);
          sim.camShake = Math.max(sim.camShake, 0.45);
          spawnImpactSparks(t.x, 0.5, t.z, 12);
          sim.activeVehicle.speed *= -0.25;
          sim.activeVehicle.health = Math.max(10, sim.activeVehicle.health - 9);
          t.speed = 0;
          store.triggerCrimeHeat(1);
        }

        t.rig.group.position.set(t.x, 0, t.z);
        for (const w of t.rig.wheels) w.rotation.x += t.speed * dt * 2.2;
        trafficMiniList.push({ x: t.x, z: t.z });
      }

      // PEDESTRIANS UPDATE
      for (const p of pedestrians) {
        if (!p.active) {
          p.rig.group.position.y = -100;
          const distP = Math.hypot(p.x - sim.px, p.z - sim.pz);
          if (!p.looted && distP < 2.2 && sim.py < 2.5) {
            p.looted = true;
            const cash = Math.floor(90 + Math.random() * 200);
            store.addMoney(cash);
            store.pushToast('Searched Civilian', `Looted +$${cash} cash & supplies!`, 'success');
            audioEngine.playCheckpoint();
          }
          continue;
        }

        const distP = Math.hypot(p.x - sim.px, p.z - sim.pz);
        const flee = distP < 9 && sim.py < 3 && sim.activeVehicle && Math.abs(sim.activeVehicle.speed) > 9;
        if (flee) {
          p.rotY = Math.atan2(p.x - sim.px, p.z - sim.pz);
        } else {
          p.turnTimer -= dt;
          if (p.turnTimer <= 0) {
            p.rotY += (Math.random() - 0.5) * Math.PI;
            p.turnTimer = 4 + Math.random() * 6;
          }
        }
        const spd = flee ? 5.5 : p.speed;
        const nx = p.x + Math.sin(p.rotY) * spd * dt;
        const nz = p.z + Math.cos(p.rotY) * spd * dt;
        const col = resolveCircleWorldCollision(nx, nz, 0.45);
        if (col.hit) p.rotY += Math.PI * 0.75;
        p.x = col.x;
        p.z = col.z;
        p.walkPhase += dt * spd * 3.5;
        p.rig.group.position.set(p.x, getGroundHeightAt(p.x, p.z), p.z);
        p.rig.group.rotation.y = p.rotY;
        const sw = Math.sin(p.walkPhase) * 0.55;
        p.rig.leftLeg.rotation.x = sw;
        p.rig.rightLeg.rotation.x = -sw;

        if (distP < 1.9 && sim.py < 2 && sim.activeVehicle && Math.abs(sim.activeVehicle.speed) > 10) {
          p.hp = 0;
          p.active = false;
          p.rig.group.position.y = -100;
          const cash = Math.floor(100 + Math.random() * 220);
          store.addMoney(cash);
          store.pushToast('Roadside Eliminator', `Looted +$${cash} cash!`, 'success');
          store.triggerCrimeHeat(2);
          audioEngine.playImpact(0.45);
        }
      }

      // ROAMING BLACK CATS UPDATE
      for (const cat of blackCats) {
        cat.turnTimer -= dt;
        if (cat.turnTimer <= 0) {
          cat.rotY += (Math.random() - 0.5) * Math.PI * 1.1;
          cat.turnTimer = 3.5 + Math.random() * 5;
        }
        const nx = cat.x + Math.sin(cat.rotY) * cat.speed * dt;
        const nz = cat.z + Math.cos(cat.rotY) * cat.speed * dt;
        const col = resolveCircleWorldCollision(nx, nz, 0.32);
        if (col.hit) cat.rotY += Math.PI * 0.7;
        cat.x = col.x;
        cat.z = col.z;
        cat.walkPhase += dt * cat.speed * 5.2;
        cat.rig.group.position.set(cat.x, getGroundHeightAt(cat.x, cat.z), cat.z);
        cat.rig.group.rotation.y = cat.rotY;
        const gait = Math.sin(cat.walkPhase) * 0.42;
        if (cat.rig.legs.length >= 4) {
          cat.rig.legs[0].rotation.x = gait;
          cat.rig.legs[1].rotation.x = -gait;
          cat.rig.legs[2].rotation.x = -gait;
          cat.rig.legs[3].rotation.x = gait;
        }
        cat.rig.tailPivot.rotation.z = Math.sin(elapsed * 3.5 + cat.x) * 0.35;
      }

      // POLICE PURSUIT AI (Cruisers + Armed Foot Officers at Wanted 3+ + Air Heli at Wanted 5)
      const activePoliceCount = Math.min(4, store.wantedLevel);
      const policeMiniList: Array<{ x: number; z: number }> = [];
      let closestPoliceDist = Infinity;

      for (let i = 0; i < policeAgents.length; i++) {
        const cop = policeAgents[i];
        if (i < activePoliceCount) {
          if (!cop.active) {
            cop.active = true;
            const angle = (i * Math.PI) / 2 + 0.5;
            cop.x = THREE.MathUtils.clamp(sim.px + Math.cos(angle) * 72, -195, 195);
            cop.z = THREE.MathUtils.clamp(sim.pz + Math.sin(angle) * 72, -195, 195);
            cop.speed = 16;
            cop.rig.group.visible = true;
          }

          const dx = sim.px - cop.x;
          const dz = sim.pz - cop.z;
          const dist = Math.hypot(dx, dz);
          closestPoliceDist = Math.min(closestPoliceDist, dist);

          const targetAngle = Math.atan2(dx, dz);
          let aDiff = targetAngle - cop.rotationY;
          while (aDiff > Math.PI) aDiff -= Math.PI * 2;
          while (aDiff < -Math.PI) aDiff += Math.PI * 2;
          cop.rotationY += THREE.MathUtils.clamp(aDiff, -2.5 * dt, 2.5 * dt);

          const chaseSpeed = dist > 25 ? 29 + store.wantedLevel * 2.2 : 21;
          cop.speed = THREE.MathUtils.damp(cop.speed, chaseSpeed, 3, dt);
          const nx = cop.x + Math.sin(cop.rotationY) * cop.speed * dt;
          const nz = cop.z + Math.cos(cop.rotationY) * cop.speed * dt;
          const col = resolveCircleWorldCollision(nx, nz, 1.35);
          if (col.hit) cop.rotationY += 0.9 * dt * 10;
          cop.x = col.x;
          cop.z = col.z;

          if (dist < 3.4 && sim.py < 3) {
            audioEngine.playImpact(0.75);
            sim.camShake = Math.max(sim.camShake, 0.4);
            spawnImpactSparks(cop.x, 0.5, cop.z, 10);
            if (sim.activeVehicle) {
              sim.activeVehicle.health = Math.max(10, sim.activeVehicle.health - 6);
              sim.activeVehicle.speed *= 0.45;
            } else {
              store.damagePlayer(14);
            }
            cop.speed = -6;
          }

          cop.rig.group.position.set(cop.x, getGroundHeightAt(cop.x, cop.z), cop.z);
          cop.rig.group.rotation.y = cop.rotationY;
          for (const w of cop.rig.wheels) w.rotation.x += cop.speed * dt * 2.2;

          const flash = Math.floor(elapsed * 8 + i) % 2 === 0;
          if (cop.rig.sirenRedMat && cop.rig.sirenBlueMat) {
            cop.rig.sirenRedMat.emissiveIntensity = flash ? 2.6 : 0.15;
            cop.rig.sirenBlueMat.emissiveIntensity = flash ? 0.15 : 2.6;
          }
          if (cop.rig.sirenRedSprite && cop.rig.sirenBlueSprite) {
            cop.rig.sirenRedSprite.material.opacity = flash ? 0.88 : 0.1;
            cop.rig.sirenBlueSprite.material.opacity = flash ? 0.1 : 0.88;
          }
          policeMiniList.push({ x: cop.x, z: cop.z });
        } else if (cop.active) {
          cop.active = false;
          cop.rig.group.visible = false;
        }
      }

      // Armed On-Foot SBPD Officers at Wanted 3+
      const activeOfficerCount = store.wantedLevel >= 3 ? (store.wantedLevel >= 4 ? 2 : 1) : 0;
      for (let i = 0; i < policeOfficers.length; i++) {
        const off = policeOfficers[i];
        if (i < activeOfficerCount) {
          if (!off.active) {
            off.active = true;
            const cruiser = policeAgents[i];
            off.x = cruiser.active ? cruiser.x + 2.5 : sim.px + 28;
            off.z = cruiser.active ? cruiser.z + 2.5 : sim.pz + 28;
            off.stunTimer = 0;
            off.rig.group.visible = true;
          }

          if (off.stunTimer > 0) {
            off.stunTimer -= dt;
            off.rig.bodyGroup.rotation.x = 0.65;
          } else {
            off.rig.bodyGroup.rotation.x = 0;
            const dx = sim.px - off.x;
            const dz = sim.pz - off.z;
            const dist = Math.hypot(dx, dz);
            closestPoliceDist = Math.min(closestPoliceDist, dist);
            off.rotY = Math.atan2(dx, dz);

            if (dist > 14 && dist < 85) {
              const spd = 4.6;
              const col = resolveCircleWorldCollision(
                off.x + Math.sin(off.rotY) * spd * dt,
                off.z + Math.cos(off.rotY) * spd * dt,
                0.48
              );
              off.x = col.x;
              off.z = col.z;
              off.walkPhase += dt * 11;
            } else if (dist > 95) {
              // Relocate near player perimeter
              off.x = THREE.MathUtils.clamp(sim.px + (i === 0 ? 32 : -32), -210, 210);
              off.z = THREE.MathUtils.clamp(sim.pz + 32, -210, 210);
            }

            off.fireTimer -= dt;
            if (off.fireTimer <= 0 && dist < 34 && sim.py < 8) {
              off.fireTimer = 2.1 + Math.random() * 0.9;
              audioEngine.playGunshot('pistol');
              const hitRoll = Math.random() < (sim.activeVehicle ? 0.45 : 0.62);
              addTracer(off.x, 1.4, off.z, sim.px + (Math.random() - 0.5) * 1.4, sim.py + 1.1, sim.pz + (Math.random() - 0.5) * 1.4);
              if (hitRoll) {
                if (sim.activeVehicle) {
                  sim.activeVehicle.health = Math.max(10, sim.activeVehicle.health - 4);
                } else {
                  store.damagePlayer(8);
                  sim.camShake = Math.max(sim.camShake, 0.18);
                }
              }
            }
            const sw = dist > 14 ? Math.sin(off.walkPhase) * 0.55 : 0;
            off.rig.leftLeg.rotation.x = sw;
            off.rig.rightLeg.rotation.x = -sw;
            off.rig.rightArm.rotation.x = -Math.PI * 0.48;
          }

          off.rig.group.position.set(off.x, getGroundHeightAt(off.x, off.z), off.z);
          off.rig.group.rotation.y = off.rotY;
          policeMiniList.push({ x: off.x, z: off.z });
        } else if (off.active) {
          off.active = false;
          off.rig.group.visible = false;
        }
      }

      // Police Air Support Helicopter at Wanted 5
      if (store.wantedLevel >= 5) {
        if (!policeHeli.active) {
          policeHeli.active = true;
          policeHeli.rig.group.visible = true;
          if (policeHeli.rig.searchlightCone) policeHeli.rig.searchlightCone.visible = true;
          policeHeli.x = sim.px + 55;
          policeHeli.z = sim.pz - 55;
        }
        policeHeli.orbitAngle += dt * 0.48;
        const targetX = sim.px + Math.cos(policeHeli.orbitAngle) * 32;
        const targetZ = sim.pz + Math.sin(policeHeli.orbitAngle) * 32;
        policeHeli.x = THREE.MathUtils.damp(policeHeli.x, targetX, 2.2, dt);
        policeHeli.z = THREE.MathUtils.damp(policeHeli.z, targetZ, 2.2, dt);
        policeHeli.y = Math.max(26, sim.py + 22);
        policeHeli.rig.group.position.set(policeHeli.x, policeHeli.y, policeHeli.z);
        policeHeli.rig.group.rotation.y = Math.atan2(sim.px - policeHeli.x, sim.pz - policeHeli.z);
        if (policeHeli.rig.mainRotor) policeHeli.rig.mainRotor.rotation.y += dt * 30;
        if (policeHeli.rig.tailRotor) policeHeli.rig.tailRotor.rotation.x += dt * 36;
        closestPoliceDist = Math.min(closestPoliceDist, Math.hypot(policeHeli.x - sim.px, policeHeli.z - sim.pz));
        policeMiniList.push({ x: policeHeli.x, z: policeHeli.z });
      } else if (policeHeli.active) {
        policeHeli.active = false;
        policeHeli.rig.group.visible = false;
      }

      if (store.wantedLevel > 0) {
        if (closestPoliceDist > 74) {
          sim.evadeTimer += dt;
          const nextHeat = Math.max(0, 100 - (sim.evadeTimer / 11) * 100);
          if (Math.floor(elapsed * 4) !== Math.floor((elapsed - dt) * 4)) {
            store.setWantedHeat(nextHeat);
          }
          if (sim.evadeTimer >= 11) {
            sim.evadeTimer = 0;
            store.setWantedLevel(0);
            store.pushToast('Pursuit Evaded', 'SBPD lost your trail.', 'success');
          }
        } else {
          sim.evadeTimer = 0;
          if (closestPoliceDist < 5.5 && speedKmh < 5 && sim.py < 4) {
            sim.bustedProgress += dt;
            if (sim.bustedProgress >= 4.2) {
              sim.bustedProgress = 0;
              store.setScreen('busted');
              return;
            }
          } else {
            sim.bustedProgress = Math.max(0, sim.bustedProgress - dt * 1.5);
          }
        }
      }

      // ACTIVE MISSION CHECKPOINT
      if (store.activeMissionId) {
        const mission = MISSIONS.find((m) => m.id === store.activeMissionId);
        const step = mission?.steps[store.activeMissionStepIndex];
        if (step) {
          missionBeaconGroup.visible = true;
          missionBeaconGroup.position.set(step.targetX, getGroundHeightAt(step.targetX, step.targetZ), step.targetZ);
          beaconRing.rotation.z = elapsed * 1.6;

          if (store.missionTimer !== null) store.tickMissionTimer(dt);

          const distGoal = Math.hypot(sim.px - step.targetX, sim.pz - step.targetZ);
          const vehicleOk = !step.requiresVehicle || Boolean(sim.activeVehicle);
          const wantedOk = !step.requiresWantedClear || store.wantedLevel === 0;
          if (distGoal <= step.radius && vehicleOk && wantedOk) {
            store.advanceMissionStep();
          }
        }
      } else {
        missionBeaconGroup.visible = false;
      }

      // GPS WAYPOINT / TAXI BEACON
      const activeCyanTarget = sim.taxiTarget ?? store.gpsWaypoint;
      if (activeCyanTarget) {
        gpsBeaconGroup.visible = true;
        gpsBeaconGroup.position.set(
          activeCyanTarget.x,
          getGroundHeightAt(activeCyanTarget.x, activeCyanTarget.z),
          activeCyanTarget.z
        );
        gpsRing.rotation.z = -elapsed * 1.4;
        if (
          store.gpsWaypoint &&
          !sim.taxiTarget &&
          Math.hypot(sim.px - store.gpsWaypoint.x, sim.pz - store.gpsWaypoint.z) < 8
        ) {
          store.setGpsWaypoint(null);
          audioEngine.playCheckpoint();
          store.pushToast('Arrived at GPS Waypoint', undefined, 'success');
        }
      } else {
        gpsBeaconGroup.visible = false;
      }

      // THROTTLED TELEMETRY & AUTOSAVE SYNC (15 Hz)
      if (elapsed - sim.lastTelemetrySync > 0.065) {
        sim.lastTelemetrySync = elapsed;
        store.syncPlayerVitals(
          store.health,
          store.armor,
          Math.round(sim.stamina),
          { x: Number(sim.px.toFixed(2)), y: Number(sim.py.toFixed(2)), z: Number(sim.pz.toFixed(2)) },
          Number(sim.protY.toFixed(3))
        );
        store.updateTelemetry({
          x: sim.px,
          y: sim.py,
          z: sim.pz,
          rotationY: sim.protY,
          speedKmh,
          altitude: Math.max(0, Math.round(sim.py)),
          gear: gearLabel,
          inVehicle: Boolean(sim.activeVehicle),
          vehicleClass: sim.activeVehicle ? VEHICLE_SPECS[sim.activeVehicle.specId].vehicleClass : 'foot',
          vehicleName: sim.activeVehicle ? VEHICLE_SPECS[sim.activeVehicle.specId].name : '',
          vehicleHealth: sim.activeVehicle ? Math.round(sim.activeVehicle.health) : 100,
          vehicleNitro: sim.activeVehicle ? Math.round(sim.activeVehicle.nitro) : 100,
          vehicleFuel: sim.activeVehicle ? Math.round(sim.activeVehicle.fuel) : 100,
          headlightsOn: headlightsActive,
          turnSignal: activeTurnSignal,
          isCrouching: isCrouchingNow,
          isFlying: sim.isFlying,
          inWater: inWaterNow,
          district: getDistrictName(sim.px, sim.pz),
          taxiFareActive: Boolean(sim.taxiTarget),
          taxiFareTarget: sim.taxiTarget,
          nearbyPrompt,
          policePositions: policeMiniList,
          trafficPositions: trafficMiniList,
        });
      }

      if (elapsed - sim.lastAutosave > 20) {
        sim.lastAutosave = elapsed;
        store.saveProgress(true);
      }
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;
      stepSimulation(dt, elapsed);
      if (composer && useGameStore.getState().settings.graphicsQuality === 'high') {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('citycrime:use_item', handleUseItem);
      window.removeEventListener('citycrime:teleport', handleTeleport);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('webglcontextlost', handleContextLost);
      domEl.removeEventListener('webglcontextrestored', handleContextRestored);
      skyDome.dispose();
      city.dispose();
      skidGeo.dispose();
      skidMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      tracerGeo.dispose();
      tracerMat.dispose();
      heatBeamGeo.dispose();
      heatBeamMat.dispose();
      (heatImpactSprite.material as THREE.SpriteMaterial).dispose();
      shockRingGeo.dispose();
      shockRingMat.dispose();
      shadowTex.dispose();
      paragonEmblemTex.dispose();
      darkKnightEmblemTex.dispose();
      uzumakiCrestTex.dispose();
      vehicleTextures.policeDoor?.dispose();
      vehicleTextures.muscle01?.dispose();
      vehicleTextures.expressSide?.dispose();
      vehicleTextures.expressHood?.dispose();
      vehicleTextures.skylineHood?.dispose();
      vehicleTextures.skylineSide?.dispose();
      camoTextures.map.dispose();
      camoTextures.normalMap.dispose();
      desertCamoTextures.map.dispose();
      desertCamoTextures.normalMap.dispose();
      hoodieTextures.map.dispose();
      hoodieTextures.normalMap.dispose();
      denimTextures.map.dispose();
      denimTextures.normalMap.dispose();
      rainGeo.dispose();
      rainMat.dispose();
      splashGeo.dispose();
      splashMat.dispose();
      composer?.dispose();
      bloomTarget?.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 z-0 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center">
        <h2 className="font-display text-2xl font-bold text-amber-400">3D Viewport Unavailable</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">{webglError}</p>
      </div>
    );
  }

  return <div ref={mountRef} className="fixed inset-0 z-0 h-full w-full cursor-grab active:cursor-grabbing" />;
}
