'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  analyzeMeshGeometry,
  GeometryAnalysisResult,
} from '@/lib/cad/geometry';
import {
  RotateCcw,
  Eye,
  Grid,
  Maximize2,
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export interface CADViewerProps {
  fileUrl?: string;
  fileBuffer?: ArrayBuffer;
  fileName: string;
  fileFormat: 'STL' | 'STEP' | 'STP';
  initialUnit?: 'mm' | 'cm' | 'inch';
  modelColor?: string;
  onAnalysisComplete?: (analysis: GeometryAnalysisResult, unit: 'mm' | 'cm' | 'inch') => void;
  className?: string;
}

export function CADViewer({
  fileUrl,
  fileBuffer,
  fileName,
  fileFormat,
  initialUnit = 'mm',
  modelColor = '#844AFB', // TTRC Brand Violet default
  onAnalysisComplete,
  className = '',
}: CADViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Component state
  const [loading, setLoading] = useState<boolean>(!!(fileBuffer || fileUrl));
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing 3D engine...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'inch'>(initialUnit);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<GeometryAnalysisResult | null>(null);

  // Cached raw geometry data
  const rawGeometryRef = useRef<{
    positions: Float32Array;
    indices?: Uint32Array;
  } | null>(null);

  // Stable references for callbacks, dynamic styling, and unit to avoid re-triggering model loads
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);
  useEffect(() => {
    onAnalysisCompleteRef.current = onAnalysisComplete;
  }, [onAnalysisComplete]);

  const modelColorRef = useRef(modelColor);
  useEffect(() => {
    modelColorRef.current = modelColor;
  }, [modelColor]);

  const isWireframeRef = useRef(isWireframe);
  useEffect(() => {
    isWireframeRef.current = isWireframe;
  }, [isWireframe]);

  const unitRef = useRef(unit);
  useEffect(() => {
    unitRef.current = unit;
  }, [unit]);

  const lastLoadedSourceRef = useRef<string | null>(null);
  const cachedGeometriesRef = useRef<THREE.BufferGeometry[] | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f8); // Light gray studio background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(150, 150, 150);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 2500;
    controls.minDistance = 5;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(200, 400, 200);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-200, 200, -200);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight3.position.set(0, -200, 0); // Bottom fill so undercut surfaces are illuminated
    scene.add(dirLight3);

    // 6. Grid and Axes
    const gridHelper = new THREE.GridHelper(300, 30, 0xd1d5db, 0xe5e7eb);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(40);
    axesHelper.position.set(0, 0.1, 0);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 7. Mesh Container Group
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // If geometries were cached previously, re-populate immediately on scene setup
    if (cachedGeometriesRef.current && cachedGeometriesRef.current.length > 0) {
      populateSceneWithGeometry(cachedGeometriesRef.current.map((g) => g.clone()));
    }

    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_CAD = {
        scene,
        camera,
        controls,
        meshGroup,
        renderer,
      };
    }

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update Grid and Wireframe toggles
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (axesHelperRef.current) axesHelperRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (!meshGroupRef.current) return;
    meshGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = isWireframe));
        } else if (child.material) {
          child.material.wireframe = isWireframe;
        }
      }
    });
  }, [isWireframe]);

  // Update Model Color
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const hex = parseInt(modelColor.replace('#', ''), 16) || 0x844afb;
    meshGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.setHex(hex);
        }
      }
    });
  }, [modelColor]);

  // Fit Camera to Viewport
  const fitToScreen = useCallback(() => {
    if (!meshGroupRef.current || !cameraRef.current || !controlsRef.current) return;

    meshGroupRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(meshGroupRef.current);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 20);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.5;
    cameraZ = Math.max(cameraZ, 40);

    cameraRef.current.position.set(center.x + cameraZ * 0.8, center.y + cameraZ * 0.8, center.z + cameraZ * 0.9);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  }, []);

  // Re-run geometry analysis whenever unit changes
  const applyGeometryAnalysis = useCallback(
    (targetUnit: 'mm' | 'cm' | 'inch') => {
      if (!rawGeometryRef.current) return;
      const result = analyzeMeshGeometry(rawGeometryRef.current, targetUnit);
      setAnalysis(result);
      if (onAnalysisCompleteRef.current) {
        onAnalysisCompleteRef.current(result, targetUnit);
      }
    },
    []
  );

  const handleUnitChange = (newUnit: 'mm' | 'cm' | 'inch') => {
    setUnit(newUnit);
    applyGeometryAnalysis(newUnit);
  };

  // Build Scene from Mesh Geometry
  const populateSceneWithGeometry = useCallback(
    (geometries: THREE.BufferGeometry[]) => {
      if (!meshGroupRef.current || !sceneRef.current) return;

      // Keep a cloned master copy of parsed geometries in cache for remount resilience
      try {
        cachedGeometriesRef.current = geometries.map((g) => g.clone());
      } catch {
        // Safe fallback
      }

      // Clear existing meshes
      while (meshGroupRef.current.children.length > 0) {
        const obj = meshGroupRef.current.children[0];
        meshGroupRef.current.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }

      meshGroupRef.current.position.set(0, 0, 0);

      // Compute unified bounding box across all incoming meshes/bodies
      const overallBox = new THREE.Box3();
      geometries.forEach((geom) => {
        geom.computeVertexNormals();
        geom.computeBoundingBox();
        if (geom.boundingBox) {
          overallBox.union(geom.boundingBox);
        }
      });

      const center = overallBox.getCenter(new THREE.Vector3());
      const size = overallBox.getSize(new THREE.Vector3());

      // Center geometry vertices at (0, 0) and ground base flat on build plate at Y = 0
      geometries.forEach((geom) => {
        geom.translate(-center.x, -overallBox.min.y, -center.z);
        geom.computeBoundingBox();
      });

      const activeColor = modelColorRef.current || '#844AFB';
      const hex = parseInt(activeColor.replace('#', ''), 16) || 0x844afb;

      geometries.forEach((geom) => {
        const material = new THREE.MeshStandardMaterial({
          color: hex,
          roughness: 0.35,
          metalness: 0.1,
          side: THREE.DoubleSide, // Ensure both front & back faces are visible
          wireframe: isWireframeRef.current,
        });

        const mesh = new THREE.Mesh(geom, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshGroupRef.current?.add(mesh);
      });

      meshGroupRef.current.updateMatrixWorld(true);

      // Adjust grid size to encompass part nicely
      if (gridHelperRef.current) {
        const maxDim = Math.max(size.x, size.z, 150);
        gridHelperRef.current.scale.set(maxDim / 150, 1, maxDim / 150);
      }

      fitToScreen();
    },
    [fitToScreen]
  );

  // Load and parse CAD file
  useEffect(() => {
    let isCancelled = false;

    async function loadCadModel() {
      const sourceKey = fileBuffer
        ? `buffer_${fileBuffer.byteLength}_${fileName}`
        : fileUrl
        ? `url_${fileUrl}`
        : null;

      if (!sourceKey) {
        return;
      }

      // Avoid re-loading and re-parsing identical models, but ensure scene is populated
      if (lastLoadedSourceRef.current === sourceKey && rawGeometryRef.current) {
        if (meshGroupRef.current && meshGroupRef.current.children.length === 0 && cachedGeometriesRef.current) {
          populateSceneWithGeometry(cachedGeometriesRef.current.map((g) => g.clone()));
        }
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        let buffer: ArrayBuffer;

        if (fileBuffer) {
          buffer = fileBuffer;
          setLoadingMessage('Parsing CAD model...');
        } else if (fileUrl) {
          setLoadingMessage('Downloading CAD file securely...');
          const resp = await fetch(fileUrl);
          if (!resp.ok) {
            throw new Error(`Failed to download CAD file (${resp.status}: ${resp.statusText})`);
          }
          buffer = await resp.arrayBuffer();
        } else {
          setLoading(false);
          return;
        }

        if (isCancelled) return;

        const isSTL = fileFormat === 'STL' || fileName.toLowerCase().endsWith('.stl');
        const isSTEP =
          fileFormat === 'STEP' ||
          fileFormat === 'STP' ||
          fileName.toLowerCase().endsWith('.step') ||
          fileName.toLowerCase().endsWith('.stp');

        if (isSTL) {
          setLoadingMessage('Parsing STL geometry...');
          const loader = new STLLoader();
          const geometry = loader.parse(buffer);

          const posAttr = geometry.getAttribute('position');
          if (!posAttr) {
            throw new Error('STL file has empty vertex position data.');
          }

          const rawPos = posAttr.array as Float32Array;
          const rawIndices = geometry.index ? (geometry.index.array as Uint32Array) : undefined;
          rawGeometryRef.current = { positions: rawPos, indices: rawIndices };

          populateSceneWithGeometry([geometry]);
          applyGeometryAnalysis(unitRef.current);
          lastLoadedSourceRef.current = sourceKey;
          setLoading(false);
        } else if (isSTEP) {
          setLoadingMessage('Initializing OpenCASCADE WebAssembly engine...');

          // Dynamically import occt-import-js in browser
          const occtModule = await import('occt-import-js');
          const initOcct = occtModule.default || (occtModule as any);

          const occt = await initOcct({
            locateFile: (path: string) => `/wasm/${path}`,
          });

          if (isCancelled) return;
          setLoadingMessage('Tessellating STEP solids into 3D mesh...');

          const uint8 = new Uint8Array(buffer);
          const result = occt.ReadStepFile(uint8, null);

          if (!result || !result.success || !result.meshes || result.meshes.length === 0) {
            throw new Error(
              'Failed to extract valid solid bodies from STEP file. The file may be empty or corrupted.'
            );
          }

          // Combine meshes into Three.js BufferGeometries
          const geometries: THREE.BufferGeometry[] = [];
          const allPositions: number[] = [];
          const allIndices: number[] = [];
          let indexOffset = 0;

          for (const meshData of result.meshes) {
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(meshData.attributes.position.array);
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

            if (meshData.attributes.normal) {
              geom.setAttribute(
                'normal',
                new THREE.BufferAttribute(new Float32Array(meshData.attributes.normal.array), 3)
              );
            }

            if (meshData.index) {
              const idx = new Uint32Array(meshData.index.array);
              geom.setIndex(new THREE.BufferAttribute(idx, 1));

              for (let i = 0; i < idx.length; i++) {
                allIndices.push(idx[i] + indexOffset);
              }
            } else {
              for (let i = 0; i < pos.length / 3; i++) {
                allIndices.push(i + indexOffset);
              }
            }

            for (let i = 0; i < pos.length; i++) {
              allPositions.push(pos[i]);
            }
            indexOffset += pos.length / 3;

            geometries.push(geom);
          }

          rawGeometryRef.current = {
            positions: new Float32Array(allPositions),
            indices: new Uint32Array(allIndices),
          };

          populateSceneWithGeometry(geometries);
          applyGeometryAnalysis(unitRef.current);
          lastLoadedSourceRef.current = sourceKey;
          setLoading(false);
        } else {
          throw new Error(`Unsupported CAD file format: "${fileFormat}". Please upload STL or STEP files.`);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Error processing CAD model.');
          setLoading(false);
        }
      }
    }

    loadCadModel();

    return () => {
      isCancelled = true;
    };
  }, [fileBuffer, fileUrl, fileFormat, fileName]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[460px] bg-[#F7F7F8] border border-slate-200 rounded-xl overflow-hidden flex flex-col ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <Loader2 className="w-10 h-10 text-[#844AFB] animate-spin mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Loading 3D CAD Model</h3>
          <p className="text-sm text-slate-500 mt-1">{loadingMessage}</p>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && !loading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-[#844AFB] flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">CAD Processing Error</h3>
          <p className="text-sm text-slate-600 max-w-md mt-1 mb-4">{errorMessage}</p>
          <div className="text-xs text-slate-400">
            Please ensure your file is a valid, uncorrupted binary/ASCII STL or STEP (ISO 10303-21) file.
          </div>
        </div>
      )}

      {/* Top Floating Overlay: Live Technical Geometry Card */}
      {analysis && !loading && !errorMessage && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3 shadow-md z-10 text-xs text-slate-800">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 mb-2">
            <div className="font-semibold text-slate-900 truncate max-w-[180px]">{fileName}</div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500">Unit:</span>
              <div className="inline-flex rounded-md bg-slate-100 p-0.5">
                {(['mm', 'cm', 'inch'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase transition-colors ${
                      unit === u
                        ? 'bg-[#844AFB] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div className="bg-slate-50 p-1.5 rounded">
              <span className="text-slate-500 block text-[10px]">Length (X)</span>
              <span className="font-semibold text-slate-900">{analysis.dimensions.x} mm</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded">
              <span className="text-slate-500 block text-[10px]">Width (Y)</span>
              <span className="font-semibold text-slate-900">{analysis.dimensions.y} mm</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded">
              <span className="text-slate-500 block text-[10px]">Height (Z)</span>
              <span className="font-semibold text-slate-900">{analysis.dimensions.z} mm</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500">Volume: </span>
              {analysis.volumeCm3 !== null ? (
                <span className="font-semibold text-slate-900">{analysis.volumeCm3} cm³</span>
              ) : (
                <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Non-solid
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Triangles: </span>
              <span className="font-semibold text-slate-900">
                {analysis.triangleCount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Manifold / Watertight Badge */}
          <div className="mt-2 flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
            <span className="text-slate-500">Mesh Status:</span>
            {analysis.isWatertight && analysis.isManifold ? (
              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Watertight & Manifold
              </span>
            ) : (
              <span className="text-amber-600 font-medium inline-flex items-center gap-1" title={analysis.warnings.join(' | ')}>
                <AlertTriangle className="w-3 h-3" /> Open Boundaries / Repaired
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 z-10">
        <button
          onClick={fitToScreen}
          className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Fit Model to Viewport"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200" />

        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`p-1.5 rounded-full transition-colors ${
            isWireframe
              ? 'bg-[#844AFB] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle Wireframe Mode"
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-full transition-colors ${
            showGrid
              ? 'text-slate-900 bg-slate-100'
              : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Toggle Engineering Grid & Reference Axes"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
