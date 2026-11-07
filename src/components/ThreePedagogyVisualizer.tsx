import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LessonPlan } from '../types/lesson';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Maximize2,
  ZoomIn,
} from 'lucide-react';

interface Props {
  lesson: LessonPlan | null;
  qc1Score?: number;
  qc2Score?: number;
  onSelectSection?: (index: number) => void;
  activeSectionIndex?: number;
}

export const ThreePedagogyVisualizer: React.FC<Props> = ({
  lesson,
  qc1Score = 94,
  qc2Score = 96,
  onSelectSection,
  activeSectionIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [explosionFactor, setExplosionFactor] = useState(1.0);
  const [rotationSpeed, setRotationSpeed] = useState(0.8);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(activeSectionIndex);

  // References
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const moduleMeshesRef = useRef<THREE.Mesh[]>([]);
  const highlightRingRef = useRef<THREE.Mesh | null>(null);
  const explosionRef = useRef(1.0);
  const speedRef = useRef(0.8);

  explosionRef.current = explosionFactor;
  speedRef.current = rotationSpeed;

  useEffect(() => {
    setSelectedNodeIndex(activeSectionIndex);
  }, [activeSectionIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Software WebGL Guard (per Three.js skill)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    // Low-fatigue midnight slate background (#0a101d)
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.032);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5.0, 9.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // OrbitControls for smooth, responsive 3D manipulation
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Keep above ground
    controls.minDistance = 3.5;
    controls.maxDistance = 24;
    controls.autoRotate = rotationSpeed > 0;
    controls.autoRotateSpeed = rotationSpeed * 1.5;

    // Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig: Warm/Cool balance
    const keyLight = new THREE.DirectionalLight(0xfef3c7, 2.0); // Warm soft light
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2); // Cool sky / dark ground fill
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 1.2); // Muted teal rim
    rimLight.position.set(-8, 3, -6);
    scene.add(rimLight);

    // Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.2;
    scene.add(shadowPlane);

    // Procedural Grid Floor Ring with low-fatigue slate lines
    const gridHelper = new THREE.GridHelper(16, 32, 0x1e2f4a, 0x131f33);
    gridHelper.position.y = -2.21;
    scene.add(gridHelper);

    // Composite Procedural Central Knowledge Core
    const masterCoreGroup = new THREE.Group();
    coreGroupRef.current = masterCoreGroup;
    scene.add(masterCoreGroup);

    // Part 1: Central Faceted Knowledge Nucleus (Dodecahedron with low-fatigue brushed teal PBR)
    const nucleusGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const nucleusMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d9488, // Muted Teal
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    masterCoreGroup.add(nucleusMesh);

    // Part 2: Inner Gyroscope Ring (Torus) - Slate Blue
    const gyroGeo1 = new THREE.TorusGeometry(1.25, 0.04, 16, 64);
    const gyroMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const gyroMesh1 = new THREE.Mesh(gyroGeo1, gyroMat1);
    masterCoreGroup.add(gyroMesh1);

    // Part 3: Middle Counter-Rotating Gyroscope Ring (Torus) - Neutral Sand/Beige
    const gyroGeo2 = new THREE.TorusGeometry(1.45, 0.035, 16, 64);
    const gyroMat2 = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      metalness: 0.8,
      roughness: 0.3,
    });
    const gyroMesh2 = new THREE.Mesh(gyroGeo2, gyroMat2);
    gyroMesh2.rotation.x = Math.PI / 3;
    masterCoreGroup.add(gyroMesh2);

    // Part 4: Dual QC Verification Halos
    // Halo 1: QC Layer 1 - Research & Factual Accuracy (Muted Teal #14b8a6)
    const qc1HaloGeo = new THREE.TorusGeometry(2.2, 0.03, 16, 96);
    const qc1HaloMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
    });
    const qc1HaloMesh = new THREE.Mesh(qc1HaloGeo, qc1HaloMat);
    qc1HaloMesh.rotation.x = Math.PI / 2;
    masterCoreGroup.add(qc1HaloMesh);

    // Halo 2: QC Layer 2 - Instructional Quality (Soft Sky Blue #0284c7)
    const qc2HaloGeo = new THREE.TorusGeometry(2.4, 0.03, 16, 96);
    const qc2HaloMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
    });
    const qc2HaloMesh = new THREE.Mesh(qc2HaloGeo, qc2HaloMat);
    qc2HaloMesh.rotation.x = Math.PI / 2.2;
    masterCoreGroup.add(qc2HaloMesh);

    // Part 5-9: 5 Curriculum Phase Nodes
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    const phases = lesson?.timingBreakdown || [
      { phase: '01. Hook & Motivation', minutes: 5 },
      { phase: '02. Core Architecture', minutes: 13 },
      { phase: '03. Methods & Deep Dive', minutes: 10 },
      { phase: '04. Interactive Lab', minutes: 10 },
      { phase: '05. Knowledge Check', minutes: 7 },
    ];

    // Low-fatigue palette for 5 curriculum phases: Muted Blues, Teals, Neutral Sand/Beige
    const phaseColors = [0x2dd4bf, 0x38bdf8, 0x60a5fa, 0x14b8a6, 0xe2e8f0];
    const moduleMeshes: THREE.Mesh[] = [];

    phases.forEach((item, i) => {
      const angle = (i / phases.length) * Math.PI * 2;
      const baseRadius = 3.6;

      const nodeGroup = new THREE.Group();
      nodeGroup.userData = {
        index: i,
        name: item.phase,
        angle,
        baseRadius,
      };

      // Part A: Orbital Pod Body
      const podGeo = new THREE.IcosahedronGeometry(0.42 + (item.minutes / 20) * 0.15, 2);
      const podMat = new THREE.MeshPhysicalMaterial({
        color: phaseColors[i % phaseColors.length],
        metalness: 0.65,
        roughness: 0.28,
        clearcoat: 0.8,
      });
      const podMesh = new THREE.Mesh(podGeo, podMat);
      podMesh.castShadow = !isSoftwareGl;
      podMesh.userData = { index: i, name: item.phase };
      nodeGroup.add(podMesh);
      moduleMeshes.push(podMesh);

      // Part B: Accent Ring around Node
      const podRingGeo = new THREE.TorusGeometry(0.65, 0.02, 12, 32);
      const podRingMat = new THREE.MeshBasicMaterial({
        color: phaseColors[i % phaseColors.length],
      });
      const podRing = new THREE.Mesh(podRingGeo, podRingMat);
      podRing.rotation.x = Math.PI / 2;
      nodeGroup.add(podRing);

      // Part C: Radial Energy Conduit Link
      const conduitGeo = new THREE.CylinderGeometry(0.015, 0.015, baseRadius, 8);
      const conduitMat = new THREE.MeshBasicMaterial({
        color: 0x334e68,
        transparent: true,
        opacity: 0.5,
      });
      const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
      conduitMesh.rotation.z = Math.PI / 2;
      conduitMesh.position.x = -baseRadius / 2;
      nodeGroup.add(conduitMesh);

      nodeGroup.position.set(
        Math.cos(angle) * baseRadius,
        Math.sin(angle * 2) * 0.35,
        Math.sin(angle) * baseRadius
      );

      nodesGroup.add(nodeGroup);
    });

    moduleMeshesRef.current = moduleMeshes;

    // Active Selection Highlight Ring
    const hlRingGeo = new THREE.RingGeometry(0.72, 0.82, 32);
    const hlRingMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const highlightRing = new THREE.Mesh(hlRingGeo, hlRingMat);
    highlightRing.rotation.x = -Math.PI / 2;
    scene.add(highlightRing);
    highlightRingRef.current = highlightRing;

    // Raycasting for interactive click & hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(moduleMeshesRef.current);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredNodeName(hit.userData.name || `Section ${hit.userData.index + 1}`);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNodeName(null);
        container.style.cursor = 'default';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(moduleMeshesRef.current);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const idx = hit.userData.index;
        setSelectedNodeIndex(idx);
        if (onSelectSection) {
          onSelectSection(idx);
        }
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onClick);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function tick() {
      const time = clock.getElapsedTime();

      // Update controls
      controls.autoRotate = speedRef.current > 0;
      controls.autoRotateSpeed = speedRef.current * 1.5;
      controls.update();

      // Gyroscope counter-rotations
      gyroMesh1.rotation.y = time * 0.7;
      gyroMesh2.rotation.z = -time * 0.5;
      nucleusMesh.rotation.y = -time * 0.3;
      nucleusMesh.rotation.x = Math.sin(time * 0.4) * 0.15;
      qc1HaloMesh.rotation.z = time * 0.25;
      qc2HaloMesh.rotation.z = -time * 0.2;

      // Update Node Radial Distances based on Exploded Slider
      if (nodesGroupRef.current) {
        const explosion = explosionRef.current;
        nodesGroupRef.current.children.forEach((child) => {
          const u = child.userData;
          if (u && u.angle !== undefined) {
            const rad = u.baseRadius * explosion;
            child.position.x = Math.cos(u.angle) * rad;
            child.position.z = Math.sin(u.angle) * rad;
            child.position.y = Math.sin(u.angle * 2 + time * 1.2) * 0.25;

            // Highlight ring tracking active node
            if (u.index === activeSectionIndex && highlightRingRef.current) {
              highlightRingRef.current.position.set(child.position.x, child.position.y - 0.45, child.position.z);
            }
          }
        });
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lesson, activeSectionIndex]);

  // Camera Presets
  const setCameraPreset = (preset: 'overview' | 'top' | 'focus' | 'isometric') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    ctrl.target.set(0, 0, 0);

    if (preset === 'overview') {
      cam.position.set(0, 5.0, 9.8);
    } else if (preset === 'top') {
      cam.position.set(0, 11, 0.1);
    } else if (preset === 'focus') {
      cam.position.set(0, 2.5, 5.0);
    } else if (preset === 'isometric') {
      cam.position.set(7.5, 6.0, 7.5);
    }
    ctrl.update();
  };

  const resetView = () => {
    setExplosionFactor(1.0);
    setRotationSpeed(0.8);
    setCameraPreset('overview');
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[640px] rounded-2xl overflow-hidden bg-[#0a101d] border border-[#1e2f4a] shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Left Spec Badge - Low Fatigue Colors */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-teal-300 bg-[#131f33]/90 px-3 py-1.5 rounded-lg border border-[#1e2f4a]">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>45-Min Pedagogical Knowledge Core</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#131f33]/70 px-3 py-1 rounded-lg border border-[#1e2f4a]/70 backdrop-blur-sm">
          <span>{lesson?.title || 'Interactive Curriculum Model'}</span>
          <span aria-hidden="true">·</span>
          <span>5 Modular Phases</span>
        </div>
      </div>

      {/* Top Right QC Halo Metrics */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-[#131f33]/90 border border-teal-800/60 text-teal-200">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>QC1 Accuracy:</span>
          <span className="font-mono font-bold text-white">{qc1Score}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-[#131f33]/90 border border-sky-800/60 text-sky-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          <span>QC2 Instructional:</span>
          <span className="font-mono font-bold text-white">{qc2Score}%</span>
        </div>
      </div>

      {/* Hover Node Tooltip / HUD Indicator */}
      {hoveredNodeName && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-4 py-2 rounded-lg bg-[#131f33]/95 border border-teal-500/60 shadow-xl text-center">
          <p className="text-[11px] text-teal-300 font-medium uppercase tracking-wider">Click To Inspect Phase</p>
          <p className="text-sm font-semibold text-white">{hoveredNodeName}</p>
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-out flex flex-col items-center gap-2 w-full max-w-[900px] px-4 pointer-events-auto`}
      >
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsZenMode(!isZenMode)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-[#131f33]/90 hover:text-white hover:bg-[#182740] border border-[#1e2f4a] rounded-full shadow-lg transition-colors cursor-pointer"
        >
          {isZenMode ? (
            <>
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>Show 3D Controls</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Zen Mode (Hide Controls)</span>
            </>
          )}
        </button>

        {/* Consolidated Horizontal Control Dock */}
        {!isZenMode && (
          <div className="w-full bg-[#131f33]/95 border border-[#1e2f4a] rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Exploded View Slider */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Exploded View:</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={explosionFactor}
                onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
                className="w-24 sm:w-32 accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-slate-300 w-8 tabular-nums">
                {explosionFactor.toFixed(2)}x
              </span>
            </div>

            {/* Orbit Speed Slider */}
            <div className="flex items-center gap-2.5">
              <span className="text-slate-300 font-medium whitespace-nowrap">Auto-Orbit:</span>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.1"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-16 sm:w-24 accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-slate-300 w-6 tabular-nums">
                {rotationSpeed.toFixed(1)}x
              </span>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCameraPreset('isometric')}
                className="px-2 py-1 rounded bg-[#16253d] hover:bg-[#1e3455] text-slate-200 border border-[#22395d] transition-colors"
                title="Isometric View"
              >
                Iso
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className="px-2 py-1 rounded bg-[#16253d] hover:bg-[#1e3455] text-slate-200 border border-[#22395d] transition-colors"
                title="Top-Down Plan"
              >
                Top
              </button>
              <button
                onClick={() => setCameraPreset('focus')}
                className="px-2 py-1 rounded bg-[#16253d] hover:bg-[#1e3455] text-slate-200 border border-[#22395d] transition-colors"
                title="Core Close-up"
              >
                Core
              </button>
            </div>

            {/* Phase Node Selectors */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedNodeIndex(idx);
                    if (onSelectSection) onSelectSection(idx);
                  }}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedNodeIndex === idx
                      ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                      : 'bg-[#16253d] text-slate-300 hover:text-white hover:bg-[#1e3455]'
                  }`}
                  title={`Phase ${idx + 1}`}
                >
                  P{idx + 1}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetView}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-[#16253d] hover:bg-[#1e3455] border border-[#22395d] rounded transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
