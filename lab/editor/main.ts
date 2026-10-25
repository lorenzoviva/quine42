// MarkovJunior Model Editor: split-screen code editor, real-time 3D Three.js viewport & interactive CAD voxel tools (T59b).

import * as THREE from 'three';
import { CATALOG, GROUPS } from '../3d/catalog';
import { highlightXml, validateMjx, type ValidationResult } from './syntax';
import type { EditorBuildRequest, EditorBuildResponse } from './worker';
import { Bloom } from '../../src/render/bloom';
import { glowing } from '../../src/render/materials';
import type { MeshData } from '../../src/mj/mesh';
import {
  type CadShape,
  type ShapeKind,
  parseShapesFromXml,
  parseColorsFromXml,
  insertShapeIntoXml,
  updateShapeInXml,
  deleteShapeFromXml,
  duplicateShapeInXml,
  setLetterColorInXml,
  threeToVoxel,
  findShapeAtVoxel,
} from './cad';
import { MJ_PALETTE } from '../../src/mj/palette';
import type { PaletteEntry } from '../../src/mj/engine';
import { PlaybackController, getOrComputeFrameMesh } from './playback';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ------------------------------------------------------------------ Starter templates

const TEMPLATE_CUBE = `<!-- Cubo elementare con gradiente di colore -->
<sequence values="0BGY" size="12 12 12">
  <box at="6 6 0" size="10 10 2" color="B"/>
  <box at="6 6 2" size="8 8 4" color="G"/>
  <box at="6 6 6" size="6 6 4" color="Y"/>
</sequence>`;

// ------------------------------------------------------------------ Worker Pool

class WorkerClient {
  private worker: Worker;
  private currentId = 0;
  private pending: Map<number, (res: EditorBuildResponse) => void> = new Map();

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev: MessageEvent<EditorBuildResponse>) => {
      const handler = this.pending.get(ev.data.id);
      if (handler) {
        this.pending.delete(ev.data.id);
        handler(ev.data);
      }
    };
  }

  build(req: Omit<EditorBuildRequest, 'id'>): Promise<EditorBuildResponse> {
    const id = ++this.currentId;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ ...req, id } satisfies EditorBuildRequest);
    });
  }

  get latestId() {
    return this.currentId;
  }
}

const workerClient = new WorkerClient();

// ------------------------------------------------------------------ 3D Three.js Scene

const canvas = $<HTMLCanvasElement>('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e14);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xdcecff, 0x222a3a, 1.2);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
sun.position.set(12, 20, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0x6080b0, 0.6);
fillLight.position.set(-12, 10, -14);
scene.add(fillLight);

// Ground Grid Helper
const gridHelper = new THREE.GridHelper(16, 16, 0x38bdf8, 0x1e293b);
gridHelper.position.y = -0.001;
scene.add(gridHelper);

// Materials & Bloom
const matMesh = glowing(new THREE.MeshLambertMaterial({ vertexColors: true }), 'editor');
const bloom = new Bloom(renderer, scene, camera, 0.85, 0.4);

// Active model mesh & bounding box
let currentMesh: THREE.Mesh | null = null;
let currentBBox: THREE.Box3Helper | null = null;

// CAD 3D Helpers
const ghostGroup = new THREE.Group();
ghostGroup.visible = false;
scene.add(ghostGroup);

const ghostMaterial = new THREE.MeshLambertMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});
const ghostWireMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.85,
});
let ghostMesh: THREE.Mesh | null = null;
let ghostWire: THREE.LineSegments | null = null;

let selectionHelper: THREE.Box3Helper | null = null;

function createBufferGeometry(m: MeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.glow) geo.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  geo.setIndex(new THREE.BufferAttribute(m.indices, 1));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

function applyFrameMesh(m: MeshData) {
  if (!currentMesh) {
    const geo = createBufferGeometry(m);
    currentMesh = new THREE.Mesh(geo, matMesh);
    currentMesh.castShadow = true;
    currentMesh.receiveShadow = true;
    scene.add(currentMesh);
  } else {
    currentMesh.geometry.dispose();
    currentMesh.geometry = createBufferGeometry(m);
  }

  if (!currentBBox && currentMesh) {
    const box = new THREE.Box3().setFromObject(currentMesh);
    currentBBox = new THREE.Box3Helper(box, new THREE.Color(0x38bdf8));
    scene.add(currentBBox);
  } else if (currentBBox && currentMesh) {
    currentBBox.box.setFromObject(currentMesh);
  }
}

// ------------------------------------------------------------------ CAD State

type CadTool = 'select' | 'box' | 'voxel' | 'cylinder' | 'ellipsoid' | 'cone' | 'erase';

let activeTool: CadTool = 'select';
let activeColorSymbol = 'G';
let activeGlow = false;
let selectedShapeIndex: number | null = null;
let shapes: CadShape[] = [];
let gridDims = { X: 12, Y: 12, Z: 12 };
let currentVpt = 20;

const SWATCH_LETTERS = [
  'B', 'I', 'P', 'E', 'N', 'D', 'A', 'W',
  'R', 'O', 'Y', 'G', 'U', 'S', 'K', 'F',
  'C', 'H', 'J', 'L', 'M', 'Q', 'T', 'V', 'X', 'Z',
];

// ------------------------------------------------------------------ Orbit Controls & Mouse Interactions

interface CamState {
  yaw: number;
  pitch: number;
  dist: number;
  target: THREE.Vector3;
}

const cam: CamState = {
  yaw: Math.PI / 4,
  pitch: 0.55,
  dist: 8,
  target: new THREE.Vector3(0, 0.5, 0),
};

let isDragging = false;
let isPanning = false;
let dragPrev = { x: 0, y: 0 };
let pointerMovedDist = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  dragPrev = { x: e.clientX, y: e.clientY };
  pointerMovedDist = 0;

  if (e.button === 2) {
    // Right button: free orbit
    isDragging = true;
    isPanning = false;
  } else if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    // Middle button or Shift+Left: pan
    isPanning = true;
    isDragging = false;
  } else if (e.button === 0) {
    // Left button: could be drag orbit or click
    isDragging = true;
    isPanning = false;
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  // Always update raycasting & hover readout when cursor is over viewport
  handlePointerHover(e);

  if (!isDragging && !isPanning) return;
  const dx = e.clientX - dragPrev.x;
  const dy = e.clientY - dragPrev.y;
  pointerMovedDist += Math.hypot(dx, dy);
  dragPrev = { x: e.clientX, y: e.clientY };

  if (isDragging) {
    cam.yaw -= dx * 0.007;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.005, 0.05, 1.55);
  } else if (isPanning) {
    // Move target parallel to camera view plane
    const right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    const up = new THREE.Vector3(0, 1, 0);
    const factor = cam.dist * 0.0018;
    cam.target.addScaledVector(right, -dx * factor);
    cam.target.addScaledVector(up, dy * factor);
  }
});

const endDrag = (e: PointerEvent) => {
  const wasClick = pointerMovedDist < 6 && e.button === 0;
  isDragging = false;
  isPanning = false;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {}

  if (wasClick) {
    handleCanvasClick(e);
  }
};

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    cam.dist = THREE.MathUtils.clamp(cam.dist * factor, 1.2, 80);
  },
  { passive: false },
);

function fitCameraToMesh(box: THREE.Box3) {
  const center = new THREE.Vector3();
  box.getCenter(center);
  cam.target.copy(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.5);
  cam.dist = maxDim * 2.5;
}

// ------------------------------------------------------------------ Resize Handling

function updateViewportSize() {
  const container = $('pane-view');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w <= 0 || h <= 0) return;
  renderer.setSize(w, h, false);
  bloom.setSize(w, h, renderer.getPixelRatio());
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(() => updateViewportSize());
resizeObserver.observe($('pane-view'));

// ------------------------------------------------------------------ Render Loop

let lastTime = performance.now();
let enableBloom = true;

function animate(now: number) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  const off = new THREE.Vector3(
    Math.sin(cam.yaw) * Math.cos(cam.pitch),
    Math.sin(cam.pitch),
    Math.cos(cam.yaw) * Math.cos(cam.pitch),
  ).multiplyScalar(cam.dist);

  camera.position.copy(cam.target).add(off);
  camera.lookAt(cam.target);

  if (enableBloom) {
    bloom.render(dt);
  } else {
    renderer.render(scene, camera);
  }
}

requestAnimationFrame(animate);

// ------------------------------------------------------------------ Resizable Splitter

const splitter = $('splitter');
const paneCode = $('pane-code');
let isSplitting = false;

splitter.addEventListener('pointerdown', (e) => {
  isSplitting = true;
  splitter.classList.add('dragging');
  splitter.setPointerCapture(e.pointerId);
  e.preventDefault();
});

window.addEventListener('pointermove', (e) => {
  if (!isSplitting) return;
  const containerWidth = $('main-split').clientWidth;
  const newWidth = THREE.MathUtils.clamp(e.clientX, 280, containerWidth - 280);
  const pct = (newWidth / containerWidth) * 100;
  paneCode.style.width = `${pct}%`;
  updateViewportSize();
});

window.addEventListener('pointerup', (e) => {
  if (!isSplitting) return;
  isSplitting = false;
  splitter.classList.remove('dragging');
  try {
    splitter.releasePointerCapture(e.pointerId);
  } catch {}
  updateViewportSize();
});

// ------------------------------------------------------------------ Code Editor & UI Sync

const codeInput = $<HTMLTextAreaElement>('code-input');
const codeOutput = $<HTMLElement>('code-output');
const highlightLayer = $<HTMLElement>('highlight-layer');
const gutter = $('gutter');
const statusPill = $('status-pill');
const statusText = $('status-text');
const diagnostics = $('diagnostics');
const presetSelect = $<HTMLSelectElement>('preset-select');
const seedInput = $<HTMLInputElement>('seed-input');
const vptSelect = $<HTMLSelectElement>('vpt-select');
const cursorPos = $('cursor-pos');
const loadingOverlay = $('loading-overlay');
const viewportInfo = $('viewport-info');
const viewportCoords = $('viewport-coords');

// CAD elements
const cadInspector = $('cad-inspector');
const cadSizeGroup = $('cad-size-group');
const cadDimW = $<HTMLInputElement>('cad-dim-w');
const cadDimD = $<HTMLInputElement>('cad-dim-d');
const cadDimH = $<HTMLInputElement>('cad-dim-h');
const activeSwatch = $('active-swatch');
const activeColorName = $('active-color-name');
const activeColorCode = $('active-color-code');
const paletteSwatches = $('palette-swatches');
const btnCadGlow = $('btn-cad-glow');
const cadCustomColor = $<HTMLInputElement>('cad-custom-color');
const cadPartSelect = $<HTMLSelectElement>('cad-part-select');

// Playback Elements (T59c)
const playbackBar = $('playback-bar');
const playbackTrackSelect = $<HTMLSelectElement>('playback-track-select');
const btnPlayFirst = $('btn-play-first');
const btnPlayPrev = $('btn-play-prev');
const btnPlayToggle = $('btn-play-toggle');
const btnPlayNext = $('btn-play-next');
const btnPlayLast = $('btn-play-last');
const btnPlayStop = $('btn-play-stop');
const btnPlayLoop = $('btn-play-loop');
const playbackSlider = $<HTMLInputElement>('playback-slider');
const playbackFrameIndicator = $('playback-frame-indicator');
const playbackFpsSelect = $<HTMLSelectElement>('playback-fps-select');

const playbackController = new PlaybackController();
let currentPalette: Record<string, PaletteEntry> = {};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function updateGutter(lineCount: number, errorLine?: number) {
  gutter.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= lineCount; i++) {
    const lineEl = document.createElement('div');
    lineEl.className = 'gutter-line' + (errorLine === i ? ' error-line' : '');
    lineEl.textContent = String(i);
    lineEl.onclick = () => jumpToLine(i);
    frag.appendChild(lineEl);
  }
  gutter.appendChild(frag);
}

function syncScroll() {
  highlightLayer.scrollTop = codeInput.scrollTop;
  highlightLayer.scrollLeft = codeInput.scrollLeft;
  gutter.scrollTop = codeInput.scrollTop;
}

function updateCursorPos() {
  const pos = codeInput.selectionStart;
  const textBefore = codeInput.value.slice(0, pos);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  cursorPos.textContent = `Riga ${line}, Col ${col}`;
}

function jumpToLine(line: number) {
  const lines = codeInput.value.split('\n');
  let offset = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
    offset += lines[i].length + 1;
  }
  const lineLen = lines[line - 1]?.length ?? 0;
  codeInput.focus();
  codeInput.setSelectionRange(offset, offset + lineLen);

  const lineHeight = 20;
  codeInput.scrollTop = Math.max(0, (line - 4) * lineHeight);
  syncScroll();
}

function renderDiagnostics(
  res: ValidationResult,
  buildRes?: EditorBuildResponse,
) {
  diagnostics.innerHTML = '';

  if (!res.ok) {
    statusPill.className = 'status-pill error';
    statusText.textContent = `Errore (riga ${res.line})`;

    const errEl = document.createElement('div');
    errEl.className = 'diag-error';
    errEl.innerHTML = `<span>✕</span><div><strong>Riga ${res.line}:</strong> ${res.error}</div>`;
    errEl.onclick = () => jumpToLine(res.line);
    diagnostics.appendChild(errEl);
    return;
  }

  if (res.warnings.length > 0) {
    statusPill.className = 'status-pill warning';
    statusText.textContent = `${res.warnings.length} avviso/i`;
    for (const w of res.warnings) {
      const warnEl = document.createElement('div');
      warnEl.className = 'diag-warning';
      warnEl.innerHTML = `<span>⚠</span><div>${w}</div>`;
      diagnostics.appendChild(warnEl);
    }
  } else {
    statusPill.className = 'status-pill valid';
    statusText.textContent = 'Valido';
  }

  if (buildRes && buildRes.ok) {
    const statsEl = document.createElement('div');
    statsEl.className = 'diag-stats';
    const g = buildRes.grid;
    const info = buildRes.info;
    statsEl.innerHTML = `
      <div>Griglia: <b>${g.X}×${g.Y}×${g.Z}</b></div>
      <div>Voxel: <b>${g.solidCount.toLocaleString('it')}</b></div>
      <div>Triangoli: <b>${info.triangles.toLocaleString('it')}</b></div>
      <div>Passi: <b>${info.steps}</b></div>
      <div>Tempo: <b>${info.ms} ms</b></div>
      <div>Stato: <b>${info.finished ? 'Completato' : 'Limite passi'}</b></div>
    `;
    diagnostics.appendChild(statsEl);
  }
}

async function triggerBuild() {
  const xml = codeInput.value;
  const seed = parseInt(seedInput.value, 10) || 1;
  const vpt = parseInt(vptSelect.value, 10) || 20;
  currentVpt = vpt;

  // Immediate synchronous validation
  const val = validateMjx(xml);

  const lines = xml.split('\n');
  updateGutter(lines.length, val.ok ? undefined : val.line);

  // Sync shapes & palette
  shapes = parseShapesFromXml(xml);
  syncPaletteState();

  if (!val.ok) {
    renderDiagnostics(val);
    loadingOverlay.classList.add('hidden');
    return;
  }

  loadingOverlay.classList.remove('hidden');

  try {
    const res = await workerClient.build({ xml, seed, vpt });
    loadingOverlay.classList.add('hidden');

    if (!res.ok) {
      renderDiagnostics({ ok: false, error: res.error, line: res.errorLine });
      updateGutter(lines.length, res.errorLine);
      return;
    }

    renderDiagnostics(val, res);
    gridDims = res.grid;
    currentPalette = res.palette;

    // Reset current mesh and bounding box
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh = null;
    }
    if (currentBBox) {
      scene.remove(currentBBox);
      currentBBox.dispose();
      currentBBox = null;
    }

    // Set playback tracks: triggers onFrameChange which creates/updates currentMesh & currentBBox
    playbackController.setTracks(res.tracks);

    // Ensure fallback mesh in case tracks were empty
    if (!currentMesh) {
      const geo = createBufferGeometry(res.mesh);
      currentMesh = new THREE.Mesh(geo, matMesh);
      currentMesh.castShadow = true;
      currentMesh.receiveShadow = true;
      scene.add(currentMesh);
    }
    if (!currentBBox && currentMesh) {
      const box = new THREE.Box3().setFromObject(currentMesh);
      currentBBox = new THREE.Box3Helper(box, new THREE.Color(0x38bdf8));
      scene.add(currentBBox);
    }

    viewportInfo.textContent = `Griglia ${res.grid.X}×${res.grid.Y}×${res.grid.Z} · ${res.grid.solidCount.toLocaleString('it')} voxel · ${res.info.triangles.toLocaleString('it')} triangoli`;

    // Refresh active shape selection if any
    if (selectedShapeIndex !== null && shapes[selectedShapeIndex]) {
      updateSelectionBox(shapes[selectedShapeIndex]);
    } else {
      deselectShape();
    }
  } catch (err: unknown) {
    loadingOverlay.classList.add('hidden');
    renderDiagnostics({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      line: 1,
    });
  }
}

function onCodeChange() {
  const code = codeInput.value;
  codeOutput.innerHTML = highlightXml(code) + '\n';
  syncScroll();
  updateCursorPos();

  const lines = code.split('\n');
  const val = validateMjx(code);
  updateGutter(lines.length, val.ok ? undefined : val.line);
  renderDiagnostics(val);

  shapes = parseShapesFromXml(code);
  syncPaletteState();

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void triggerBuild();
  }, 350);
}

// ------------------------------------------------------------------ CAD Ghost & Raycasting

function getRaycastTarget(e: { clientX: number; clientY: number }): {
  voxel: [number, number, number];
  hitMesh: boolean;
} {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const s = 1 / currentVpt;

  if (currentMesh) {
    const hits = raycaster.intersectObject(currentMesh, false);
    if (hits.length > 0) {
      const hit = hits[0];
      const normal = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);

      const isCreation = activeTool !== 'select' && activeTool !== 'erase';
      // For creation: offset outward by half a voxel to place adjacent
      // For selection / erasing: offset slightly inward to select the clicked voxel
      const offsetPoint = hit.point.clone().addScaledVector(normal, isCreation ? 0.5 * s : -0.5 * s);
      const [vx, vy, vz] = threeToVoxel([offsetPoint.x, offsetPoint.y, offsetPoint.z], gridDims, currentVpt);

      return {
        voxel: [
          THREE.MathUtils.clamp(vx, 0, Math.max(1, gridDims.X - 1)),
          THREE.MathUtils.clamp(vy, 0, Math.max(1, gridDims.Y - 1)),
          THREE.MathUtils.clamp(vz, 0, Math.max(1, gridDims.Z - 1)),
        ],
        hitMesh: true,
      };
    }
  }

  // Fallback: intersect ground plane y = 0
  const hitPoint = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
    const [vx, vy] = threeToVoxel([hitPoint.x, 0, hitPoint.z], gridDims, currentVpt);
    return {
      voxel: [
        THREE.MathUtils.clamp(vx, 0, Math.max(1, gridDims.X - 1)),
        THREE.MathUtils.clamp(vy, 0, Math.max(1, gridDims.Y - 1)),
        0,
      ],
      hitMesh: false,
    };
  }

  return { voxel: [Math.floor(gridDims.X / 2), Math.floor(gridDims.Y / 2), 0], hitMesh: false };
}

function updateGhostMesh(kind: ShapeKind, size: [number, number, number]) {
  if (ghostMesh) {
    ghostGroup.remove(ghostMesh);
    ghostMesh.geometry.dispose();
    ghostMesh = null;
  }
  if (ghostWire) {
    ghostGroup.remove(ghostWire);
    ghostWire.geometry.dispose();
    ghostWire = null;
  }

  const s = 1 / currentVpt;
  const [w, d, h] = size;

  let geo: THREE.BufferGeometry;
  if (kind === 'box') {
    geo = new THREE.BoxGeometry(w * s, h * s, d * s);
  } else if (kind === 'cylinder') {
    const r = (Math.max(w, d) / 2) * s;
    geo = new THREE.CylinderGeometry(r, r, h * s, 24);
  } else if (kind === 'ellipsoid') {
    geo = new THREE.SphereGeometry(1, 24, 24);
    geo.scale((w / 2) * s, (h / 2) * s, (d / 2) * s);
  } else if (kind === 'cone') {
    const r = (Math.max(w, d) / 2) * s;
    geo = new THREE.ConeGeometry(r, h * s, 24);
  } else {
    geo = new THREE.BoxGeometry(w * s, h * s, d * s);
  }

  const colorHex = MJ_PALETTE[activeColorSymbol]?.color || '#00e436';
  ghostMaterial.color.set(colorHex);

  ghostMesh = new THREE.Mesh(geo, ghostMaterial);
  ghostWire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), ghostWireMat);

  ghostGroup.add(ghostMesh);
  ghostGroup.add(ghostWire);
}

function handlePointerHover(e: PointerEvent) {
  const { voxel } = getRaycastTarget(e);
  viewportCoords.textContent = `Puntatore: (${voxel[0]}, ${voxel[1]}, ${voxel[2]})`;

  const isCreation = activeTool !== 'select' && activeTool !== 'erase';
  if (!isCreation) {
    ghostGroup.visible = false;
    return;
  }

  const kind: ShapeKind = activeTool === 'voxel' ? 'box' : (activeTool as ShapeKind);
  const size: [number, number, number] =
    activeTool === 'voxel'
      ? [1, 1, 1]
      : [
          Math.max(1, parseInt(cadDimW.value, 10) || 4),
          Math.max(1, parseInt(cadDimD.value, 10) || 4),
          Math.max(1, parseInt(cadDimH.value, 10) || 4),
        ];

  updateGhostMesh(kind, size);

  // Position ghost in Three.js coordinates
  const s = 1 / currentVpt;
  const px = gridDims.X / 2;
  const py = gridDims.Y / 2;
  const pz = 0;

  const threeX = (voxel[0] - px) * s;
  const threeY = (voxel[2] + size[2] / 2 - pz) * s;
  const threeZ = (voxel[1] - py) * s;

  ghostGroup.position.set(threeX, threeY, threeZ);
  ghostGroup.visible = true;
}

function handleCanvasClick(e: PointerEvent) {
  const { voxel } = getRaycastTarget(e);
  const [vx, vy, vz] = voxel;

  if (activeTool === 'select') {
    const hit = findShapeAtVoxel(vx, vy, vz, shapes);
    if (hit) {
      selectShape(hit.index);
    } else {
      deselectShape();
    }
    return;
  }

  if (activeTool === 'erase') {
    const hit = findShapeAtVoxel(vx, vy, vz, shapes);
    if (hit) {
      codeInput.value = deleteShapeFromXml(codeInput.value, hit.index);
      onCodeChange();
      deselectShape();
    }
    return;
  }

  // Shape creation tools: box, voxel, cylinder, ellipsoid, cone
  const kind: ShapeKind = activeTool === 'voxel' ? 'box' : (activeTool as ShapeKind);
  const size: [number, number, number] =
    activeTool === 'voxel'
      ? [1, 1, 1]
      : [
          Math.max(1, parseInt(cadDimW.value, 10) || 4),
          Math.max(1, parseInt(cadDimD.value, 10) || 4),
          Math.max(1, parseInt(cadDimH.value, 10) || 4),
        ];

  const { newXml, line } = insertShapeIntoXml(codeInput.value, {
    kind,
    at: [vx, vy, vz],
    size,
    color: activeColorSymbol,
  });

  codeInput.value = newXml;
  onCodeChange();
  jumpToLine(line);
}

// ------------------------------------------------------------------ Shape Inspector

function selectShape(index: number) {
  if (index < 0 || index >= shapes.length) return;
  selectedShapeIndex = index;
  const shape = shapes[index];

  jumpToLine(shape.line);

  // Update Inspector UI
  $('insp-shape-kind').textContent = shape.kind.toUpperCase();
  $('insp-shape-info').textContent = `Forma #${shape.id} · Riga ${shape.line}`;

  $<HTMLInputElement>('insp-at-x').value = String(shape.at[0]);
  $<HTMLInputElement>('insp-at-y').value = String(shape.at[1]);
  $<HTMLInputElement>('insp-at-z').value = String(shape.at[2]);

  $<HTMLInputElement>('insp-size-w').value = String(shape.size[0]);
  $<HTMLInputElement>('insp-size-d').value = String(shape.size[1]);
  $<HTMLInputElement>('insp-size-h').value = String(shape.size[2]);

  const colorSelect = $<HTMLSelectElement>('insp-color-select');
  colorSelect.value = shape.color;
  const hex = MJ_PALETTE[shape.color]?.color || '#ffffff';
  $('insp-color-swatch').style.backgroundColor = hex;

  cadInspector.classList.remove('hidden');
  updateSelectionBox(shape);
}

function deselectShape() {
  selectedShapeIndex = null;
  cadInspector.classList.add('hidden');
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }
}

function updateSelectionBox(shape: CadShape) {
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }

  const s = 1 / currentVpt;
  const px = gridDims.X / 2;
  const py = gridDims.Y / 2;
  const pz = 0;

  const [cx, cy, bz] = shape.at;
  const [w, d, h] = shape.size;

  const minX = (cx - w / 2 - px) * s;
  const maxX = (cx + w / 2 - px) * s;
  const minY = (bz - pz) * s;
  const maxY = (bz + h - pz) * s;
  const minZ = (cy - d / 2 - py) * s;
  const maxZ = (cy + d / 2 - py) * s;

  const box = new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ));
  selectionHelper = new THREE.Box3Helper(box, new THREE.Color(0xf59e0b));
  scene.add(selectionHelper);
}

// ------------------------------------------------------------------ Palette & Materials

function initPaletteBar() {
  paletteSwatches.innerHTML = '';
  const inspColorSelect = $<HTMLSelectElement>('insp-color-select');
  inspColorSelect.innerHTML = '';

  for (const sym of SWATCH_LETTERS) {
    const info = MJ_PALETTE[sym];
    if (!info) continue;

    // Swatch button
    const btn = document.createElement('button');
    btn.className = 'swatch-btn' + (sym === activeColorSymbol ? ' active' : '');
    btn.dataset.symbol = sym;
    btn.textContent = sym;
    btn.style.backgroundColor = info.color;
    btn.title = `${sym}: ${info.name} (${info.color})`;
    btn.onclick = () => setActiveColor(sym);
    paletteSwatches.appendChild(btn);

    // Inspector color option
    const opt = document.createElement('option');
    opt.value = sym;
    opt.textContent = `${sym} · ${info.name}`;
    inspColorSelect.appendChild(opt);
  }

  setActiveColor(activeColorSymbol);
}

function setActiveColor(symbol: string) {
  activeColorSymbol = symbol;
  const info = MJ_PALETTE[symbol] || { color: '#ffffff', name: symbol };

  activeSwatch.style.backgroundColor = info.color;
  activeColorName.textContent = info.name;
  activeColorCode.textContent = `${symbol} · ${info.color}`;
  cadCustomColor.value = info.color;

  // Update swatch button active class
  const swatches = paletteSwatches.querySelectorAll('.swatch-btn');
  swatches.forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.symbol === symbol);
  });

  // If a shape is selected, apply color immediately
  if (selectedShapeIndex !== null) {
    codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, { color: symbol });
    onCodeChange();
    selectShape(selectedShapeIndex);
  }
}

function syncPaletteState() {
  const colors = parseColorsFromXml(codeInput.value);
  const cur = colors[activeColorSymbol];
  activeGlow = !!cur?.glow;
  btnCadGlow.classList.toggle('active', activeGlow);
  cadPartSelect.value = cur?.part || '';
  if (cur?.value) {
    cadCustomColor.value = cur.value;
  }
}

// ------------------------------------------------------------------ Event Listeners

codeInput.addEventListener('input', onCodeChange);
codeInput.addEventListener('scroll', syncScroll);
codeInput.addEventListener('click', updateCursorPos);
codeInput.addEventListener('keyup', updateCursorPos);

codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.setRangeText('  ', start, end, 'end');
    onCodeChange();
  } else if (e.key === 'Enter') {
    // Preserve auto-indentation
    const start = codeInput.selectionStart;
    const textBefore = codeInput.value.slice(0, start);
    const lastLine = textBefore.split('\n').pop() || '';
    const match = /^(\s+)/.exec(lastLine);
    if (match) {
      e.preventDefault();
      const indent = match[1];
      codeInput.setRangeText('\n' + indent, start, codeInput.selectionEnd, 'end');
      onCodeChange();
    }
  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    void triggerBuild();
  }
});

// Seed controls
seedInput.addEventListener('change', () => void triggerBuild());

$('btn-rand-seed').addEventListener('click', () => {
  seedInput.value = String(Math.floor(Math.random() * 99999) + 1);
  void triggerBuild();
});

vptSelect.addEventListener('change', () => void triggerBuild());
$('btn-run').addEventListener('click', () => void triggerBuild());

// Format XML
$('btn-format').addEventListener('click', () => {
  try {
    const raw = codeInput.value;
    let formatted = '';
    let indent = 0;
    const tokens = raw.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/g);
    for (const t of tokens) {
      if (!t.trim()) continue;
      if (t.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      formatted += '  '.repeat(indent) + t.trim() + '\n';
      if (t.startsWith('<') && !t.startsWith('</') && !t.endsWith('/>') && !t.startsWith('<!--') && !t.startsWith('<?')) {
        indent++;
      }
    }
    codeInput.value = formatted.trim();
    onCodeChange();
  } catch {}
});

// Copy XML
$('btn-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    const btn = $('btn-copy');
    const oldText = btn.textContent;
    btn.textContent = 'Copiato!';
    setTimeout(() => (btn.textContent = oldText), 1500);
  } catch {}
});

// Export XML
$('btn-export').addEventListener('click', () => {
  const blob = new Blob([codeInput.value], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${presetSelect.value || 'modello'}.xml`;
  a.click();
  URL.revokeObjectURL(url);
});

// Viewport Camera Controls
$('btn-cam-reset').addEventListener('click', () => {
  if (currentMesh) {
    const box = new THREE.Box3().setFromObject(currentMesh);
    fitCameraToMesh(box);
  } else {
    cam.target.set(0, 0.5, 0);
    cam.dist = 8;
  }
});

$('btn-cam-iso').addEventListener('click', () => {
  cam.yaw = Math.PI / 4;
  cam.pitch = 0.55;
});

$('btn-cam-top').addEventListener('click', () => {
  cam.yaw = 0;
  cam.pitch = 1.54;
});

$('btn-cam-front').addEventListener('click', () => {
  cam.yaw = 0;
  cam.pitch = 0.05;
});

$('btn-cam-side').addEventListener('click', () => {
  cam.yaw = Math.PI / 2;
  cam.pitch = 0.05;
});

$('btn-toggle-grid').addEventListener('click', () => {
  gridHelper.visible = !gridHelper.visible;
  $('btn-toggle-grid').classList.toggle('active', gridHelper.visible);
});

$('btn-toggle-bounds').addEventListener('click', () => {
  if (currentBBox) {
    currentBBox.visible = !currentBBox.visible;
    $('btn-toggle-bounds').classList.toggle('active', currentBBox.visible);
  }
});

$('btn-toggle-wireframe').addEventListener('click', () => {
  matMesh.wireframe = !matMesh.wireframe;
  $('btn-toggle-wireframe').classList.toggle('active', matMesh.wireframe);
});

$('btn-toggle-bloom').addEventListener('click', () => {
  enableBloom = !enableBloom;
  $('btn-toggle-bloom').classList.toggle('active', enableBloom);
});

$('btn-toggle-playback').addEventListener('click', () => {
  const isHidden = playbackBar.classList.toggle('hidden');
  $('btn-toggle-playback').classList.toggle('active', !isHidden);
});

// ------------------------------------------------------------------ Playback & Animation Controller (T59c)

playbackController.onTracksChange((tracks, activeId) => {
  playbackTrackSelect.innerHTML = '';
  for (const t of tracks) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    opt.selected = t.id === activeId;
    playbackTrackSelect.appendChild(opt);
  }
  const current = tracks.find((t) => t.id === activeId);
  const total = current?.frames.length ?? 0;
  playbackSlider.max = String(Math.max(0, total - 1));
});

playbackController.onStateChange((state) => {
  btnPlayToggle.textContent = state.isPlaying ? '⏸' : '▶';
  btnPlayToggle.title = state.isPlaying ? 'Pausa (Spazio)' : 'Avvia (Spazio)';
  btnPlayToggle.classList.toggle('playing', state.isPlaying);
  btnPlayLoop.classList.toggle('active', state.isLooping);
  playbackFpsSelect.value = String(state.fps);
  playbackSlider.max = String(Math.max(0, state.totalFrames - 1));
  playbackSlider.value = String(state.frameIndex);
});

playbackController.onFrameChange((frame, state) => {
  const meshData = frame.mesh ?? getOrComputeFrameMesh(frame, currentPalette, currentVpt);
  applyFrameMesh(meshData);

  playbackSlider.value = String(state.frameIndex);
  playbackFrameIndicator.textContent = `${frame.label} (${frame.grid.solidCount ?? 0} vox)`;
  viewportInfo.textContent = `Griglia ${frame.grid.X}×${frame.grid.Y}×${frame.grid.Z} · ${frame.grid.solidCount?.toLocaleString('it') ?? 0} voxel · ${frame.label}`;
  gridDims = frame.grid;

  if (selectedShapeIndex !== null && shapes[selectedShapeIndex]) {
    updateSelectionBox(shapes[selectedShapeIndex]);
  }
});

playbackTrackSelect.addEventListener('change', () => {
  playbackController.selectTrack(playbackTrackSelect.value);
});

btnPlayToggle.addEventListener('click', () => {
  playbackController.togglePlay();
});

btnPlayStop.addEventListener('click', () => {
  playbackController.stop();
});

btnPlayFirst.addEventListener('click', () => {
  playbackController.jumpToFirst();
});

btnPlayPrev.addEventListener('click', () => {
  playbackController.stepBackward();
});

btnPlayNext.addEventListener('click', () => {
  playbackController.stepForward();
});

btnPlayLast.addEventListener('click', () => {
  playbackController.jumpToLast();
});

btnPlayLoop.addEventListener('click', () => {
  playbackController.setLoop(!playbackController.getState().isLooping);
});

playbackSlider.addEventListener('input', () => {
  playbackController.jumpToFrame(parseInt(playbackSlider.value, 10));
});

playbackFpsSelect.addEventListener('change', () => {
  playbackController.setFps(parseInt(playbackFpsSelect.value, 10));
});

// ------------------------------------------------------------------ CAD Tool Actions & Events

function setCadTool(tool: CadTool) {
  activeTool = tool;
  const tools: CadTool[] = ['select', 'box', 'voxel', 'cylinder', 'ellipsoid', 'cone', 'erase'];
  for (const t of tools) {
    $(`tool-${t}`).classList.toggle('active', t === tool);
  }

  // Show/hide size controls for primitive shapes
  const showDims = tool === 'box' || tool === 'cylinder' || tool === 'ellipsoid' || tool === 'cone';
  cadSizeGroup.style.display = showDims ? 'flex' : 'none';

  if (tool !== 'select') {
    deselectShape();
  }
  if (tool === 'select' || tool === 'erase') {
    ghostGroup.visible = false;
  }
}

$('tool-select').addEventListener('click', () => setCadTool('select'));
$('tool-box').addEventListener('click', () => setCadTool('box'));
$('tool-voxel').addEventListener('click', () => setCadTool('voxel'));
$('tool-cylinder').addEventListener('click', () => setCadTool('cylinder'));
$('tool-ellipsoid').addEventListener('click', () => setCadTool('ellipsoid'));
$('tool-cone').addEventListener('click', () => setCadTool('cone'));
$('tool-erase').addEventListener('click', () => setCadTool('erase'));

// Palette glow toggle
btnCadGlow.addEventListener('click', () => {
  activeGlow = !activeGlow;
  btnCadGlow.classList.toggle('active', activeGlow);
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { glow: activeGlow });
  onCodeChange();
});

// Custom color picker
cadCustomColor.addEventListener('input', (e) => {
  const hex = (e.target as HTMLInputElement).value;
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { value: hex });
  onCodeChange();
});

// Part rigging selector
cadPartSelect.addEventListener('change', (e) => {
  const part = (e.target as HTMLSelectElement).value;
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { part: part || undefined });
  onCodeChange();
});

// Inspector Controls
$('btn-insp-close').addEventListener('click', () => deselectShape());

$('btn-insp-dup').addEventListener('click', () => {
  if (selectedShapeIndex === null) return;
  const shape = shapes[selectedShapeIndex];
  const offsetZ = Math.max(1, shape.size[2]);
  const { newXml, newLine } = duplicateShapeInXml(codeInput.value, selectedShapeIndex, [0, 0, offsetZ]);
  codeInput.value = newXml;
  onCodeChange();
  jumpToLine(newLine);
  selectShape(shapes.length);
});

$('btn-insp-del').addEventListener('click', () => {
  if (selectedShapeIndex === null) return;
  codeInput.value = deleteShapeFromXml(codeInput.value, selectedShapeIndex);
  onCodeChange();
  deselectShape();
});

$<HTMLSelectElement>('insp-color-select').addEventListener('change', (e) => {
  if (selectedShapeIndex === null) return;
  const col = (e.target as HTMLSelectElement).value;
  codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, { color: col });
  onCodeChange();
  selectShape(selectedShapeIndex);
});

// Stepper buttons in Inspector
document.querySelectorAll('.btn-step').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    if (selectedShapeIndex === null) return;
    const target = e.currentTarget as HTMLElement;
    const axis = target.dataset.axis;
    const isInc = target.dataset.action === 'inc';
    const delta = isInc ? 1 : -1;

    const shape = shapes[selectedShapeIndex];
    if (!shape) return;

    const newAt: [number, number, number] = [...shape.at];
    const newSize: [number, number, number] = [...shape.size];

    if (axis === 'at-x') newAt[0] += delta;
    else if (axis === 'at-y') newAt[1] += delta;
    else if (axis === 'at-z') newAt[2] += delta;
    else if (axis === 'size-w') newSize[0] = Math.max(1, newSize[0] + delta);
    else if (axis === 'size-d') newSize[1] = Math.max(1, newSize[1] + delta);
    else if (axis === 'size-h') newSize[2] = Math.max(1, newSize[2] + delta);

    codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, {
      at: newAt,
      size: newSize,
    });
    onCodeChange();
    selectShape(selectedShapeIndex);
  });
});

// Inspector direct inputs
const bindInput = (id: string, prop: 'at' | 'size', idx: number) => {
  $<HTMLInputElement>(id).addEventListener('change', (e) => {
    if (selectedShapeIndex === null) return;
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!Number.isFinite(val)) return;

    const shape = shapes[selectedShapeIndex];
    if (!shape) return;

    const updates: Partial<{ at: [number, number, number]; size: [number, number, number] }> = {};
    if (prop === 'at') {
      const at: [number, number, number] = [...shape.at];
      at[idx] = val;
      updates.at = at;
    } else {
      const size: [number, number, number] = [...shape.size];
      size[idx] = Math.max(1, val);
      updates.size = size;
    }

    codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, updates);
    onCodeChange();
    selectShape(selectedShapeIndex);
  });
};

bindInput('insp-at-x', 'at', 0);
bindInput('insp-at-y', 'at', 1);
bindInput('insp-at-z', 'at', 2);
bindInput('insp-size-w', 'size', 0);
bindInput('insp-size-d', 'size', 1);
bindInput('insp-size-h', 'size', 2);

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
    return;
  }

  if (e.key === 'v' || e.key === 'V') setCadTool('select');
  else if (e.key === 'b' || e.key === 'B') setCadTool('box');
  else if (e.key === 'x' || e.key === 'X') setCadTool('voxel');
  else if (e.key === 'c' || e.key === 'C') setCadTool('cylinder');
  else if (e.key === 's' || e.key === 'S') setCadTool('ellipsoid');
  else if (e.key === 'k' || e.key === 'K') setCadTool('cone');
  else if (e.key === 'e' || e.key === 'E') setCadTool('erase');
  else if (e.key === 'Escape') {
    deselectShape();
    playbackController.pause();
  } else if (e.key === ' ') {
    e.preventDefault();
    playbackController.togglePlay();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    playbackController.stepBackward();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    playbackController.stepForward();
  } else if (e.key === 'Home') {
    e.preventDefault();
    playbackController.jumpToFirst();
  } else if (e.key === 'End') {
    e.preventDefault();
    playbackController.jumpToLast();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedShapeIndex !== null) {
      codeInput.value = deleteShapeFromXml(codeInput.value, selectedShapeIndex);
      onCodeChange();
      deselectShape();
    }
  }
});

// ------------------------------------------------------------------ Preset Catalog

function populatePresets() {
  presetSelect.innerHTML = '';

  const optBlank = document.createElement('option');
  optBlank.value = 'template:cube';
  optBlank.textContent = '★ Cubo base (template)';
  presetSelect.appendChild(optBlank);

  for (const [groupName, filter] of GROUPS) {
    const groupEl = document.createElement('optgroup');
    groupEl.label = groupName;
    const items = CATALOG.filter(filter);
    for (const e of items) {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.name;
      groupEl.appendChild(opt);
    }
    presetSelect.appendChild(groupEl);
  }

  presetSelect.addEventListener('change', () => {
    loadSelectedPreset();
  });
}

function loadSelectedPreset() {
  const val = presetSelect.value;
  if (val === 'template:cube') {
    codeInput.value = TEMPLATE_CUBE;
    vptSelect.value = '20';
    seedInput.value = '1';
    onCodeChange();
    void triggerBuild().then(() => {
      if (currentMesh) fitCameraToMesh(new THREE.Box3().setFromObject(currentMesh));
    });
    return;
  }

  const entry = CATALOG.find((e) => e.id === val);
  if (!entry) return;

  codeInput.value = entry.xml.trim();
  vptSelect.value = String(entry.vpt || 20);
  seedInput.value = '1';
  onCodeChange();
  void triggerBuild().then(() => {
    if (currentMesh) fitCameraToMesh(new THREE.Box3().setFromObject(currentMesh));
  });
}

// ------------------------------------------------------------------ Initial Setup

populatePresets();
initPaletteBar();

// Choose 'casetta' or 'barile' as default if available, otherwise template
const defaultEntry = CATALOG.find((e) => e.id === 'casetta') || CATALOG.find((e) => e.id === 'barile');
if (defaultEntry) {
  presetSelect.value = defaultEntry.id;
  loadSelectedPreset();
} else {
  presetSelect.value = 'template:cube';
  loadSelectedPreset();
}

updateViewportSize();
