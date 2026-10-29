// MarkovJunior Model Editor: split-screen code editor, real-time 3D Three.js viewport & interactive CAD voxel tools (T59b).

import * as THREE from 'three';
import { CATALOG, GROUPS } from '../3d/catalog';
import {
  highlightXml,
  validateMjx,
  type ValidationResult,
  type PaletteColorInfo,
  getContrastColor,
  escapeHtml,
  TAG_SCHEMAS,
  parseTagAtCursor,
  type ParsedTagAtCursor,
} from './syntax';
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
  setLetterColorInXml,
  threeToVoxel,
  findShapeAtVoxel,
  getShapeVoxelBounds,
  moveShapesInXml,
  deleteShapesFromXml,
  duplicateShapesInXml,
  doubleDefinitionInXml,
  alignCenterToSize,
  alignShapeAt,
} from './cad';
import { MJ_PALETTE } from '../../src/mj/palette';
import type { PaletteEntry } from '../../src/mj/engine';
import { PlaybackController, getOrComputeFrameMesh } from './playback';
import {
  type RuleNodeType,
  type SymmetryType,
  type SingleRuleItem,
  type AnyMjNodeConfig,
  type CodeRuleInfo,
  generateNodeXml,
  getPaletteSymbols,
  insertRuleIntoXmlAt,
  insertRuleAtEndOfSequence,
  parsePattern3D,
  formatPattern3D,
  resizePattern3D,
  countColorSymbolOccurrences,
  refactorColorSymbol,
  extractRuleAtPos,
  replaceRuleInCode,
} from './rules';
import {
  type WfcOutputMode,
  type WfcConfig,
  WFC_PRESETS,
  generateWfcXml,
} from './wfc';

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
const matMeshGlass = glowing(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false }), 'editor-glass');
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
  if (m.alpha) geo.setAttribute('alpha', new THREE.BufferAttribute(m.alpha, 1));
  geo.setIndex(new THREE.BufferAttribute(m.indices, 1));
  if (m.opaqueCount !== undefined) {
    if (m.opaqueCount > 0) geo.addGroup(0, m.opaqueCount, 0);
    const transCount = m.indices.length - m.opaqueCount;
    if (transCount > 0) geo.addGroup(m.opaqueCount, transCount, 1);
  }
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

function applyFrameMesh(m: MeshData) {
  const geo = createBufferGeometry(m);
  const mat = geo.groups.length > 0 ? [matMesh, matMeshGlass] : matMesh;
  if (!currentMesh) {
    currentMesh = new THREE.Mesh(geo, mat);
    currentMesh.castShadow = true;
    currentMesh.receiveShadow = true;
    scene.add(currentMesh);
  } else {
    currentMesh.geometry.dispose();
    currentMesh.geometry = geo;
    currentMesh.material = mat;
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
let activeGlass = false;
const selectedShapeIndices = new Set<number>();
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
let dragStart = { x: 0, y: 0 };
let dragPrev = { x: 0, y: 0 };

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  dragStart = { x: e.clientX, y: e.clientY };
  dragPrev = { x: e.clientX, y: e.clientY };

  if (e.button === 2) {
    // Right button: free orbit
    isDragging = true;
    isPanning = false;
  } else if (e.button === 1 || (e.button === 0 && e.shiftKey && activeTool !== 'select')) {
    // Middle button or Shift+Left (when not selecting): pan
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
  const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
  const wasClick = dist < 8 && e.button === 0;
  isDragging = false;
  isPanning = false;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch { }

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
  } catch { }
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
const tagInspectorBar = $('tag-inspector-bar');
const tagInspectorName = $('tag-inspector-name');
const tagInspectorAttrs = $('tag-inspector-attrs');
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
const btnCadGlass = $('btn-cad-glass');
const btnDoubleDef = $('btn-double-def');
const cadCustomColor = $<HTMLInputElement>('cad-custom-color');
const cadPartSelect = $<HTMLSelectElement>('cad-part-select');
const paletteSourceSelect = $<HTMLSelectElement>('palette-source-select');

// Inline Editor Color Picker Popup Elements
const pickerPopup = $('editor-color-picker-popup');
const pickerAttrInfo = $('picker-attr-info');
const btnPickerClose = $('btn-picker-close');
const tabPickerModel = $('tab-picker-model');
const tabPickerDefault = $('tab-picker-default');
const pickerSwatchesGrid = $('picker-swatches-grid');

let activePaletteSource: 'model' | 'default' = 'model';
let hasCustomColorsPrev: boolean | null = null;
let pickerActiveTab: 'model' | 'default' = 'model';
let pickerTargetPos: number | null = null;

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
  updateTagInspector();
}

function updateTagInspector() {
  const pos = codeInput.selectionStart;
  const parsed = parseTagAtCursor(codeInput.value, pos);

  if (!parsed) {
    tagInspectorBar.classList.add('hidden');
    return;
  }

  tagInspectorBar.classList.remove('hidden');
  tagInspectorName.textContent = `<${parsed.isClosing ? '/' : ''}${parsed.tag}>`;

  if (parsed.isClosing) {
    tagInspectorAttrs.innerHTML = '<span class="dim-label">Tag di chiusura</span>';
    return;
  }

  tagInspectorAttrs.innerHTML = '';
  const schema = TAG_SCHEMAS[parsed.tag.toLowerCase()];
  const declaredNames = new Set(parsed.declaredAttrs.map((a) => a.name.toLowerCase()));

  // 1. Declared attributes
  for (const attr of parsed.declaredAttrs) {
    const chip = document.createElement('span');
    chip.className = 'tag-attr-chip declared';
    chip.title = `Attributo dichiarato: ${attr.name}="${attr.value}"`;
    chip.innerHTML = `<span class="attr-chip-name">${escapeHtml(attr.name)}</span>=<span class="attr-chip-val">"${escapeHtml(attr.value)}"</span>`;
    tagInspectorAttrs.appendChild(chip);
  }

  // 2. Default undeclared attributes
  if (schema) {
    for (const def of schema) {
      if (!declaredNames.has(def.name.toLowerCase())) {
        const chip = document.createElement('span');
        chip.className = 'tag-attr-chip default';
        const defVal = def.default !== undefined && def.default !== '' ? `="${def.default}"` : '';
        chip.title = `${def.description ? def.description + ' · ' : ''}Default: ${def.default || 'nessuno'} · Clicca per inserire`;
        chip.innerHTML = `<span class="attr-chip-name">+ ${escapeHtml(def.name)}</span><span class="attr-chip-def">${escapeHtml(defVal)} (def)</span>`;
        chip.addEventListener('click', () => {
          insertAttrIntoCurrentTag(parsed, def.name, def.default || '');
        });
        tagInspectorAttrs.appendChild(chip);
      }
    }
  }
}

function insertAttrIntoCurrentTag(parsed: ParsedTagAtCursor, attrName: string, defaultValue: string) {
  const currentXml = codeInput.value;
  // Verify tag is still at the same position
  if (currentXml.slice(parsed.tagStart, parsed.tagEnd).startsWith('<') === false) return;

  const rawTag = currentXml.slice(parsed.tagStart, parsed.tagEnd);
  const isSelf = rawTag.endsWith('/>');
  const insertOffset = isSelf ? parsed.tagEnd - 2 : parsed.tagEnd - 1;

  const attrStr = ` ${attrName}="${defaultValue}"`;
  const newXml = currentXml.slice(0, insertOffset) + attrStr + currentXml.slice(insertOffset);
  codeInput.value = newXml;

  // Move cursor inside the quotes of the newly inserted attribute
  const newCursor = insertOffset + attrStr.length - 1;
  codeInput.setSelectionRange(newCursor, newCursor);

  onCodeChange();
  void triggerBuild();
  updateCursorPos();
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
      currentMesh = new THREE.Mesh(geo, geo.groups.length > 0 ? [matMesh, matMeshGlass] : matMesh);
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
    if (selectedShapeIndices.size > 0) {
      updateSelectionBoxes();
    } else {
      deselectAllShapes();
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
  const activePaletteMap = getActivePaletteMap();
  codeOutput.innerHTML = highlightXml(code, { colorChips: true, palette: activePaletteMap }) + '\n';
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

  const at = alignShapeAt([voxel[0], voxel[1], voxel[2]], size);

  // Position ghost in Three.js coordinates
  const s = 1 / currentVpt;
  const px = gridDims.X / 2;
  const py = gridDims.Y / 2;
  const pz = 0;

  const threeX = (at[0] - px) * s;
  const threeY = (at[2] + size[2] / 2 - pz) * s;
  const threeZ = (at[1] - py) * s;

  ghostGroup.position.set(threeX, threeY, threeZ);
  ghostGroup.visible = true;
}

function handleCanvasClick(e: PointerEvent) {
  const { voxel } = getRaycastTarget(e);
  const [vx, vy, vz] = voxel;

  if (activeTool === 'select') {
    const hit = findShapeAtVoxel(vx, vy, vz, shapes);
    if (hit) {
      selectShape(hit.index, e.shiftKey);
    } else {
      if (!e.shiftKey) {
        deselectAllShapes();
      }
    }
    return;
  }

  if (activeTool === 'erase') {
    const hit = findShapeAtVoxel(vx, vy, vz, shapes);
    if (hit) {
      codeInput.value = deleteShapeFromXml(codeInput.value, hit.index);
      onCodeChange();
      deselectAllShapes();
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

  const at = alignShapeAt([vx, vy, vz], size);

  const { newXml, line } = insertShapeIntoXml(codeInput.value, {
    kind,
    at,
    size,
    color: activeColorSymbol,
  });

  codeInput.value = newXml;
  onCodeChange();
  jumpToLine(line);
}

// ------------------------------------------------------------------ Shape Inspector & Multi-Selection

function selectShape(index: number, toggle = false) {
  if (index < 0 || index >= shapes.length) return;
  if (toggle) {
    if (selectedShapeIndices.has(index)) {
      selectedShapeIndices.delete(index);
    } else {
      selectedShapeIndices.add(index);
    }
  } else {
    selectedShapeIndices.clear();
    selectedShapeIndices.add(index);
  }
  updateSelectionState();
}

function deselectAllShapes() {
  selectedShapeIndices.clear();
  updateSelectionState();
}

function updateSelectionState() {
  if (selectedShapeIndices.size === 0) {
    cadInspector.classList.add('hidden');
    cadInspector.classList.remove('multi-mode');
    if (selectionHelper) {
      scene.remove(selectionHelper);
      selectionHelper.dispose();
      selectionHelper = null;
    }
    return;
  }

  cadInspector.classList.remove('hidden');

  if (selectedShapeIndices.size === 1) {
    cadInspector.classList.remove('multi-mode');
    const index = Array.from(selectedShapeIndices)[0];
    const shape = shapes[index];
    if (!shape) {
      deselectAllShapes();
      return;
    }

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

    $('btn-insp-dup').textContent = '+ Duplica';
    $('btn-insp-del').textContent = '🗑 Elimina';

    updateSelectionBoxes();
  } else {
    // Multi-selection mode
    cadInspector.classList.add('multi-mode');
    $('insp-shape-kind').textContent = 'MULTI';
    $('insp-shape-info').textContent = `${selectedShapeIndices.size} forme selezionate`;

    $<HTMLInputElement>('insp-at-x').value = '0';
    $<HTMLInputElement>('insp-at-y').value = '0';
    $<HTMLInputElement>('insp-at-z').value = '0';

    $('btn-insp-dup').textContent = `+ Duplica (${selectedShapeIndices.size})`;
    $('btn-insp-del').textContent = `🗑 Elimina (${selectedShapeIndices.size})`;

    updateSelectionBoxes();
  }
}

function updateSelectionBoxes() {
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }
  if (selectedShapeIndices.size === 0) return;

  let minVx = Infinity, maxVx = -Infinity;
  let minVy = Infinity, maxVy = -Infinity;
  let minVz = Infinity, maxVz = -Infinity;

  for (const idx of selectedShapeIndices) {
    const shape = shapes[idx];
    if (!shape) continue;
    const b = getShapeVoxelBounds(shape);
    minVx = Math.min(minVx, b.minX);
    maxVx = Math.max(maxVx, b.maxX);
    minVy = Math.min(minVy, b.minY);
    maxVy = Math.max(maxVy, b.maxY);
    minVz = Math.min(minVz, b.minZ);
    maxVz = Math.max(maxVz, b.maxZ);
  }

  if (!Number.isFinite(minVx)) return;

  const s = 1 / currentVpt;
  const px = gridDims.X / 2;
  const py = gridDims.Y / 2;
  const pz = 0;

  const minThreeX = (minVx - px) * s;
  const maxThreeX = (maxVx + 1 - px) * s;
  const minThreeY = (minVz - pz) * s;
  const maxThreeY = (maxVz + 1 - pz) * s;
  const minThreeZ = (minVy - py) * s;
  const maxThreeZ = (maxVy + 1 - py) * s;

  const box = new THREE.Box3(
    new THREE.Vector3(minThreeX, minThreeY, minThreeZ),
    new THREE.Vector3(maxThreeX, maxThreeY, maxThreeZ),
  );
  selectionHelper = new THREE.Box3Helper(box, new THREE.Color(0xf59e0b));
  scene.add(selectionHelper);
}

// ------------------------------------------------------------------ Palette & Materials

function getActivePaletteMap(): Record<string, PaletteColorInfo> {
  const map: Record<string, PaletteColorInfo> = {};
  for (const [sym, info] of Object.entries(MJ_PALETTE)) {
    map[sym] = {
      color: info.color,
      name: info.name,
      glow: false,
    };
  }
  const customColors = parseColorsFromXml(codeInput.value);
  for (const [sym, c] of Object.entries(customColors)) {
    map[sym] = {
      color: c.value ?? map[sym]?.color ?? '#ffffff',
      name: c.name ?? map[sym]?.name ?? `Colore ${sym}`,
      glow: !!c.glow,
      alpha: c.alpha,
    };
  }
  return map;
}

function renderPaletteSwatches(source: 'model' | 'default') {
  paletteSwatches.innerHTML = '';
  const inspColorSelect = $<HTMLSelectElement>('insp-color-select');
  inspColorSelect.innerHTML = '';

  const customColors = parseColorsFromXml(codeInput.value);
  const symbolsToRender: Array<{ symbol: string; color: string; name: string; glow?: boolean; alpha?: number }> = [];

  if (source === 'model') {
    const modelSymbols = getPaletteSymbols(codeInput.value);
    for (const s of modelSymbols) {
      const cDef = customColors[s.symbol];
      symbolsToRender.push({
        symbol: s.symbol,
        color: s.color,
        name: s.name ?? `Colore ${s.symbol}`,
        glow: s.glow,
        alpha: cDef?.alpha,
      });
    }
  } else {
    for (const sym of SWATCH_LETTERS) {
      const info = MJ_PALETTE[sym];
      if (!info) continue;
      const cDef = customColors[sym];
      symbolsToRender.push({
        symbol: sym,
        color: cDef?.value ?? info.color,
        name: cDef?.name ?? info.name,
        glow: cDef?.glow,
        alpha: cDef?.alpha,
      });
    }
  }

  for (const item of symbolsToRender) {
    const isGlass = item.alpha !== undefined && item.alpha < 1.0;
    const btn = document.createElement('button');
    btn.className =
      'swatch-btn' +
      (item.symbol === activeColorSymbol ? ' active' : '') +
      (item.glow ? ' glow' : '') +
      (isGlass ? ' glass' : '');
    btn.dataset.symbol = item.symbol;
    btn.textContent = item.symbol;
    btn.style.backgroundColor = item.color;
    btn.style.color = getContrastColor(item.color);
    btn.title = `${item.symbol}: ${item.name} (${item.color})${item.glow ? ' ✨ Glow' : ''}${isGlass ? ' 🧊 Vetro' : ''}`;
    btn.onclick = () => setActiveColor(item.symbol);
    paletteSwatches.appendChild(btn);

    const opt = document.createElement('option');
    opt.value = item.symbol;
    opt.textContent = `${item.symbol} · ${item.name}${isGlass ? ' (Vetro)' : ''}`;
    inspColorSelect.appendChild(opt);
  }

  updateActiveColorDetails();
}

function updateActiveColorDetails() {
  const activeMap = getActivePaletteMap();
  const info = activeMap[activeColorSymbol] || { color: '#ffffff', name: activeColorSymbol };
  activeSwatch.style.backgroundColor = info.color;
  const isGlass = info.alpha !== undefined && info.alpha < 1.0;
  activeSwatch.classList.toggle('glass', isGlass);
  activeColorName.textContent = `${info.name ?? activeColorSymbol}${isGlass ? ' (Vetro)' : ''}`;
  activeColorCode.textContent = `${activeColorSymbol} · ${info.color}`;
  cadCustomColor.value = info.color.startsWith('#') ? info.color : `#${info.color}`;

  const customColors = parseColorsFromXml(codeInput.value);
  const cur = customColors[activeColorSymbol];
  activeGlow = !!cur?.glow;
  btnCadGlow.classList.toggle('active', activeGlow);
  activeGlass = cur?.alpha !== undefined && cur.alpha < 1.0;
  btnCadGlass.classList.toggle('glass-active', activeGlass);

  const swatches = paletteSwatches.querySelectorAll('.swatch-btn');
  swatches.forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.symbol === activeColorSymbol);
  });
}

function setActiveColor(symbol: string) {
  activeColorSymbol = symbol;
  updateActiveColorDetails();

  // If shapes are selected, apply color immediately
  if (selectedShapeIndices.size > 0) {
    let newXml = codeInput.value;
    for (const idx of selectedShapeIndices) {
      newXml = updateShapeInXml(newXml, idx, { color: symbol });
    }
    codeInput.value = newXml;
    onCodeChange();
    updateSelectionState();
  }
}

function initPaletteBar() {
  paletteSourceSelect.addEventListener('change', () => {
    activePaletteSource = paletteSourceSelect.value as 'model' | 'default';
    renderPaletteSwatches(activePaletteSource);
    onCodeChange();
  });

  renderPaletteSwatches(activePaletteSource);
  setActiveColor(activeColorSymbol);
}

function syncPaletteState() {
  const customColors = parseColorsFromXml(codeInput.value);
  const customCount = Object.keys(customColors).length;
  const hasCustom = customCount > 0;

  // Rebuild paletteSourceSelect options
  paletteSourceSelect.innerHTML = '';

  if (hasCustom) {
    const optModel = document.createElement('option');
    optModel.value = 'model';
    optModel.textContent = `Modello (${customCount} col.)`;
    paletteSourceSelect.appendChild(optModel);
  }

  const optDefault = document.createElement('option');
  optDefault.value = 'default';
  optDefault.textContent = 'Default MJ (26 col.)';
  paletteSourceSelect.appendChild(optDefault);

  if (!hasCustom) {
    const optModelDis = document.createElement('option');
    optModelDis.value = 'model';
    optModelDis.textContent = 'Modello (nessun colore)';
    optModelDis.disabled = true;
    paletteSourceSelect.appendChild(optModelDis);
  }

  // If custom colors defined, make it active by default on load or first detection
  if (hasCustom && (hasCustomColorsPrev === false || hasCustomColorsPrev === null)) {
    activePaletteSource = 'model';
  } else if (!hasCustom) {
    activePaletteSource = 'default';
  }
  hasCustomColorsPrev = hasCustom;

  paletteSourceSelect.value = activePaletteSource;
  renderPaletteSwatches(activePaletteSource);

  const cur = customColors[activeColorSymbol];
  activeGlow = !!cur?.glow;
  btnCadGlow.classList.toggle('active', activeGlow);
  activeGlass = cur?.alpha !== undefined && cur.alpha < 1.0;
  btnCadGlass.classList.toggle('glass-active', activeGlass);
  cadPartSelect.value = cur?.part || '';
  if (cur?.value) {
    cadCustomColor.value = cur.value.startsWith('#') ? cur.value : `#${cur.value}`;
  }
}

// ------------------------------------------------------------------ XML Editor Inline Color Picker

function openColorPickerPopup(pos: number, attr: string, letter: string, rect: DOMRect) {
  pickerTargetPos = pos;

  pickerAttrInfo.textContent = `${attr}="${letter}" · Voxel ${letter}`;

  const customColors = parseColorsFromXml(codeInput.value);
  const hasCustom = Object.keys(customColors).length > 0;

  if (hasCustom) {
    pickerActiveTab = 'model';
  } else {
    pickerActiveTab = 'default';
  }

  updatePickerTabs();
  renderPickerSwatches();

  pickerPopup.classList.remove('hidden');

  const popupWidth = 290;
  const popupHeight = 260;
  let top = rect.bottom + 6;
  let left = Math.max(12, Math.min(rect.left - 20, window.innerWidth - popupWidth - 16));

  if (top + popupHeight > window.innerHeight) {
    top = Math.max(12, rect.top - popupHeight - 6);
  }

  pickerPopup.style.top = `${top}px`;
  pickerPopup.style.left = `${left}px`;
}

function closeColorPickerPopup() {
  pickerPopup.classList.add('hidden');
  pickerTargetPos = null;
}

function updatePickerTabs() {
  tabPickerModel.classList.toggle('active', pickerActiveTab === 'model');
  tabPickerDefault.classList.toggle('active', pickerActiveTab === 'default');
}

function renderPickerSwatches() {
  pickerSwatchesGrid.innerHTML = '';

  const symbols: Array<{ symbol: string; color: string; name: string; glow?: boolean }> = [];

  if (pickerActiveTab === 'model') {
    const modelSymbols = getPaletteSymbols(codeInput.value);
    for (const s of modelSymbols) {
      symbols.push({
        symbol: s.symbol,
        color: s.color,
        name: s.name ?? `Colore ${s.symbol}`,
        glow: s.glow,
      });
    }

    if (symbols.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'picker-empty-hint';
      hint.textContent = 'Nessun colore dichiarato nel modello.';
      pickerSwatchesGrid.appendChild(hint);
      return;
    }
  } else {
    for (const sym of SWATCH_LETTERS) {
      const info = MJ_PALETTE[sym];
      if (!info) continue;
      symbols.push({
        symbol: sym,
        color: info.color,
        name: info.name,
        glow: false,
      });
    }
  }

  for (const item of symbols) {
    const btn = document.createElement('button');
    btn.className = 'picker-swatch-btn' + (item.glow ? ' picker-glow' : '');
    btn.textContent = item.symbol;
    btn.style.backgroundColor = item.color;
    btn.style.color = getContrastColor(item.color);
    btn.title = `${item.symbol}: ${item.name} (${item.color})${item.glow ? ' ✨ Glow' : ''}`;
    btn.onclick = (e) => {
      e.stopPropagation();
      applyPickerSelection(item.symbol);
    };
    pickerSwatchesGrid.appendChild(btn);
  }
}

function applyPickerSelection(newChar: string) {
  if (pickerTargetPos === null || pickerTargetPos < 0 || pickerTargetPos >= codeInput.value.length) {
    closeColorPickerPopup();
    return;
  }

  const val = codeInput.value;
  const before = val.slice(0, pickerTargetPos);
  const after = val.slice(pickerTargetPos + 1);
  codeInput.value = before + newChar + after;

  const nextPos = pickerTargetPos + 1;
  closeColorPickerPopup();

  onCodeChange();

  codeInput.focus();
  codeInput.setSelectionRange(nextPos, nextPos);
}

// ------------------------------------------------------------------ Inline Hex Color Picker

let hexTargetPos: number | null = null;
let hexTargetLen = 6;
let hexHasHash = false;

const editorHexColorPicker = document.createElement('input');
editorHexColorPicker.type = 'color';
editorHexColorPicker.id = 'editor-hex-color-picker';
editorHexColorPicker.style.position = 'fixed';
editorHexColorPicker.style.opacity = '0';
editorHexColorPicker.style.pointerEvents = 'none';
editorHexColorPicker.style.width = '0';
editorHexColorPicker.style.height = '0';
document.body.appendChild(editorHexColorPicker);

editorHexColorPicker.addEventListener('input', (e) => {
  if (hexTargetPos === null || hexTargetPos < 0 || hexTargetPos >= codeInput.value.length) return;
  const rawHex = (e.target as HTMLInputElement).value; // e.g. "#e64539"
  const clean = rawHex.replace('#', '');
  const replacement = hexHasHash ? '#' + clean : clean;

  const val = codeInput.value;
  const before = val.slice(0, hexTargetPos);
  const after = val.slice(hexTargetPos + hexTargetLen);
  codeInput.value = before + replacement + after;
  hexTargetLen = replacement.length;

  onCodeChange();
});

function openHexColorPicker(pos: number, len: number, hex: string, rect: DOMRect) {
  hexTargetPos = pos;
  hexTargetLen = len;
  const currentStr = codeInput.value.slice(pos, pos + len);
  hexHasHash = currentStr.startsWith('#');

  editorHexColorPicker.value = '#' + hex.replace('#', '');
  editorHexColorPicker.style.top = `${rect.bottom}px`;
  editorHexColorPicker.style.left = `${rect.left}px`;

  if (typeof (editorHexColorPicker as any).showPicker === 'function') {
    try {
      (editorHexColorPicker as any).showPicker();
      return;
    } catch {
      // Fallback
    }
  }
  editorHexColorPicker.click();
}

/**
 * Robust hit testing through the transparent textarea overlay to elements in #code-output.
 */
function findElementAtPoint<T extends HTMLElement>(
  clientX: number,
  clientY: number,
  selector: string,
  margin = 4,
): T | null {
  codeInput.style.pointerEvents = 'none';
  const hit = document.elementFromPoint(clientX, clientY);
  codeInput.style.pointerEvents = 'auto';

  const direct = hit?.closest(selector) as T | null;
  if (direct) return direct;

  const all = codeOutput.querySelectorAll<T>(selector);
  for (let i = 0; i < all.length; i++) {
    const r = all[i].getBoundingClientRect();
    if (
      clientX >= r.left - margin &&
      clientX <= r.right + margin &&
      clientY >= r.top - margin &&
      clientY <= r.bottom + margin
    ) {
      return all[i];
    }
  }
  return null;
}

// ------------------------------------------------------------------ Event Listeners

codeInput.addEventListener('input', onCodeChange);
codeInput.addEventListener('scroll', () => {
  syncScroll();
  if (!pickerPopup.classList.contains('hidden')) {
    closeColorPickerPopup();
  }
});

codeInput.addEventListener('click', (e) => {
  updateCursorPos();

  // 1. Check if an inline filter button was clicked (tok-filter-btn next to in, out, from, to)
  const filterBtn = findElementAtPoint<HTMLElement>(e.clientX, e.clientY, '.tok-filter-btn', 6);
  if (filterBtn) {
    const pos = parseInt(filterBtn.dataset.pos || '0', 10);
    closeColorPickerPopup();
    openFilterFromCode(pos);
    return;
  }

  // 2. Check if a hex code was clicked (tok-hex-code on symbol value definitions)
  const hexEl = findElementAtPoint<HTMLElement>(e.clientX, e.clientY, '.tok-hex-code', 4);
  if (hexEl && hexEl.dataset.pos !== undefined) {
    const pos = parseInt(hexEl.dataset.pos, 10);
    const len = parseInt(hexEl.dataset.len || '6', 10);
    const hex = hexEl.dataset.hex || 'ffffff';
    closeColorPickerPopup();
    openHexColorPicker(pos, len, hex, hexEl.getBoundingClientRect());
    return;
  }

  // 3. Check if a color chip was clicked (tok-color-chip in rule patterns)
  const chip = findElementAtPoint<HTMLElement>(e.clientX, e.clientY, '.tok-color-chip', 4);
  if (chip && chip.dataset.pos !== undefined) {
    const attr = chip.dataset.attr || 'color';
    // User request: DO NOT show symbol menu on symbol definition (confusing)
    if (attr === 'symbol') {
      closeColorPickerPopup();
      return;
    }
    const pos = parseInt(chip.dataset.pos, 10);
    const letter = chip.dataset.letter || '';
    openColorPickerPopup(pos, attr, letter, chip.getBoundingClientRect());
    return;
  }

  closeColorPickerPopup();
});

codeInput.addEventListener('keyup', updateCursorPos);

// Picker tab and button handlers
tabPickerModel.addEventListener('click', (e) => {
  e.stopPropagation();
  pickerActiveTab = 'model';
  updatePickerTabs();
  renderPickerSwatches();
});

tabPickerDefault.addEventListener('click', (e) => {
  e.stopPropagation();
  pickerActiveTab = 'default';
  updatePickerTabs();
  renderPickerSwatches();
});

btnPickerClose.addEventListener('click', (e) => {
  e.stopPropagation();
  closeColorPickerPopup();
});

document.querySelectorAll('.btn-picker-token').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const token = (btn as HTMLElement).dataset.token;
    if (token) applyPickerSelection(token);
  });
});

document.addEventListener('pointerdown', (e) => {
  if (pickerPopup.classList.contains('hidden')) return;
  const target = e.target as HTMLElement | null;
  if (target && !pickerPopup.contains(target) && target !== codeInput) {
    closeColorPickerPopup();
  }
});

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
  } catch { }
});

// Copy XML
$('btn-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    const btn = $('btn-copy');
    const oldText = btn.textContent;
    btn.textContent = 'Copiato!';
    setTimeout(() => (btn.textContent = oldText), 1500);
  } catch { }
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
  matMeshGlass.wireframe = matMesh.wireframe;
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

  if (selectedShapeIndices.size > 0) {
    updateSelectionBoxes();
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
    deselectAllShapes();
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

// Palette glass toggle
btnCadGlass.addEventListener('click', () => {
  activeGlass = !activeGlass;
  btnCadGlass.classList.toggle('glass-active', activeGlass);
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { glass: activeGlass });
  onCodeChange();
});

// Double definition button (8x volume: 2x in X, Y, Z)
btnDoubleDef.addEventListener('click', () => {
  codeInput.value = doubleDefinitionInXml(codeInput.value);
  onCodeChange();
  deselectAllShapes();
});

// Custom color picker
cadCustomColor.addEventListener('input', (e) => {
  const hex = (e.target as HTMLInputElement).value;
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { value: hex });
  onCodeChange();
});

activeSwatch.style.cursor = 'pointer';
activeSwatch.title = 'Clicca per scegliere un nuovo colore per questo simbolo (Color Picker)';
activeSwatch.addEventListener('click', () => {
  cadCustomColor.click();
});

activeColorCode.style.cursor = 'pointer';
activeColorCode.title = 'Clicca per scegliere un nuovo colore per questo simbolo (Color Picker)';
activeColorCode.addEventListener('click', () => {
  cadCustomColor.click();
});

// Part rigging selector
cadPartSelect.addEventListener('change', (e) => {
  const part = (e.target as HTMLSelectElement).value;
  codeInput.value = setLetterColorInXml(codeInput.value, activeColorSymbol, { part: part || undefined });
  onCodeChange();
});

// Inspector Controls
$('btn-insp-close').addEventListener('click', () => deselectAllShapes());

$('btn-insp-dup').addEventListener('click', () => {
  if (selectedShapeIndices.size === 0) return;
  const indices = [...selectedShapeIndices];
  const { newXml, newIndices } = duplicateShapesInXml(codeInput.value, indices, [0, 0, 1]);
  codeInput.value = newXml;
  onCodeChange();
  selectedShapeIndices.clear();
  newIndices.forEach((i) => selectedShapeIndices.add(i));
  updateSelectionState();
});

$('btn-insp-del').addEventListener('click', () => {
  if (selectedShapeIndices.size === 0) return;
  codeInput.value = deleteShapesFromXml(codeInput.value, [...selectedShapeIndices]);
  onCodeChange();
  deselectAllShapes();
});

$<HTMLSelectElement>('insp-color-select').addEventListener('change', (e) => {
  if (selectedShapeIndices.size === 0) return;
  const col = (e.target as HTMLSelectElement).value;
  let newXml = codeInput.value;
  for (const idx of selectedShapeIndices) {
    newXml = updateShapeInXml(newXml, idx, { color: col });
  }
  codeInput.value = newXml;
  onCodeChange();
  updateSelectionState();
});

// Stepper buttons in Inspector
document.querySelectorAll('.btn-step').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    if (selectedShapeIndices.size === 0) return;
    const target = e.currentTarget as HTMLElement;
    const axis = target.dataset.axis;
    const isInc = target.dataset.action === 'inc';
    const delta = isInc ? 1 : -1;

    if (selectedShapeIndices.size > 1) {
      // Multi-selection: move all shapes together
      const d: [number, number, number] = [
        axis === 'at-x' ? delta : 0,
        axis === 'at-y' ? delta : 0,
        axis === 'at-z' ? delta : 0,
      ];
      if (d[0] !== 0 || d[1] !== 0 || d[2] !== 0) {
        codeInput.value = moveShapesInXml(codeInput.value, [...selectedShapeIndices], d);
        onCodeChange();
        updateSelectionState();
      }
      return;
    }

    // Single selection:
    const selectedShapeIndex = Array.from(selectedShapeIndices)[0];
    const shape = shapes[selectedShapeIndex];
    if (!shape) return;

    const newAt: [number, number, number] = [...shape.at];
    const newSize: [number, number, number] = [...shape.size];

    if (axis === 'at-x') newAt[0] = alignCenterToSize(newAt[0] + delta, shape.size[0]);
    else if (axis === 'at-y') newAt[1] = alignCenterToSize(newAt[1] + delta, shape.size[1]);
    else if (axis === 'at-z') newAt[2] = Math.round(newAt[2] + delta);
    else if (axis === 'size-w') {
      newSize[0] = Math.max(1, newSize[0] + delta);
      newAt[0] = alignCenterToSize(newAt[0], newSize[0]);
    } else if (axis === 'size-d') {
      newSize[1] = Math.max(1, newSize[1] + delta);
      newAt[1] = alignCenterToSize(newAt[1], newSize[1]);
    } else if (axis === 'size-h') {
      newSize[2] = Math.max(1, newSize[2] + delta);
    }

    codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, {
      at: newAt,
      size: newSize,
    });
    onCodeChange();
    updateSelectionState();
  });
});

// Inspector direct inputs
const bindInput = (id: string, prop: 'at' | 'size', idx: number) => {
  $<HTMLInputElement>(id).addEventListener('change', (e) => {
    if (selectedShapeIndices.size === 0) return;
    const rawVal = parseFloat((e.target as HTMLInputElement).value);
    if (!Number.isFinite(rawVal)) return;

    if (selectedShapeIndices.size === 1) {
      const selectedShapeIndex = Array.from(selectedShapeIndices)[0];
      const shape = shapes[selectedShapeIndex];
      if (!shape) return;

      const updates: Partial<{ at: [number, number, number]; size: [number, number, number] }> = {};
      if (prop === 'at') {
        const at: [number, number, number] = [...shape.at];
        if (idx === 0) at[0] = alignCenterToSize(rawVal, shape.size[0]);
        else if (idx === 1) at[1] = alignCenterToSize(rawVal, shape.size[1]);
        else at[2] = Math.round(rawVal);
        updates.at = at;
      } else {
        const size: [number, number, number] = [...shape.size];
        const newDim = Math.max(1, Math.round(rawVal));
        size[idx] = newDim;
        updates.size = size;

        // Auto-align center when dimension changes
        const at: [number, number, number] = [...shape.at];
        if (idx === 0) at[0] = alignCenterToSize(at[0], newDim);
        else if (idx === 1) at[1] = alignCenterToSize(at[1], newDim);
        updates.at = at;
      }

      codeInput.value = updateShapeInXml(codeInput.value, selectedShapeIndex, updates);
      onCodeChange();
      updateSelectionState();
    }
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
    deselectAllShapes();
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
    if (selectedShapeIndices.size > 0) {
      codeInput.value = deleteShapesFromXml(codeInput.value, [...selectedShapeIndices]);
      onCodeChange();
      deselectAllShapes();
    }
  }
});

// ------------------------------------------------------------------ Rules, Metodi & Sostituisci Modal (T59d)

const modalRulesBackdrop = $('modal-rules-backdrop');
const btnOpenRules = $('btn-open-rules');
const btnOpenFilter = $('btn-open-filter');
const btnRulesClose = $('btn-rules-close');
const ruleNodeRadios = document.querySelectorAll<HTMLInputElement>('input[name="rule-node-type"]');
const ruleStepsInput = $<HTMLInputElement>('rule-steps');
const rulePSlider = $<HTMLInputElement>('rule-p-slider');
const rulePNum = $<HTMLInputElement>('rule-p-num');
const rulePGroup = $('rule-p-group');
const ruleSymmetrySelect = $<HTMLSelectElement>('rule-symmetry');
const rulePaletteSwatches = $('rule-palette-swatches');
const ruleRowsContainer = $('rule-rows-container');
const btnAddRuleRow = $('btn-add-rule-row');
const rulesListTitle = $('rules-list-title');
const ruleXmlPreview = $<HTMLElement>('rule-xml-preview');
const btnInsertRuleCursor = $('btn-insert-rule-cursor');
const btnInsertRuleEnd = $('btn-insert-rule-end');
const btnCopyRule = $('btn-copy-rule');

// Method panels
const methodPanelRules = $('method-panel-rules');
const methodPanelPath = $('method-panel-path');
const methodPanelConv = $('method-panel-convolution');
const methodPanelMap = $('method-panel-map');
const methodPanelShape = $('method-panel-shape');

// Path method inputs
const pathFromInput = $<HTMLInputElement>('path-from');
const pathToInput = $<HTMLInputElement>('path-to');
const pathOnInput = $<HTMLInputElement>('path-on');
const pathColorInput = $<HTMLInputElement>('path-color');
const pathStepsInput = $<HTMLInputElement>('path-steps');
const pathInertiaInput = $<HTMLInputElement>('path-inertia');
const pathLongestInput = $<HTMLInputElement>('path-longest');

// Convolution inputs
const convNeighborhood = $<HTMLSelectElement>('conv-neighborhood');
const convIn = $<HTMLInputElement>('conv-in');
const convOut = $<HTMLInputElement>('conv-out');
const convValues = $<HTMLInputElement>('conv-values');
const convSum = $<HTMLInputElement>('conv-sum');
const convSteps = $<HTMLInputElement>('conv-steps');
const convPeriodic = $<HTMLInputElement>('conv-periodic');

// Map inputs
const mapScaleX = $<HTMLInputElement>('map-scale-x');
const mapScaleY = $<HTMLInputElement>('map-scale-y');
const mapScaleZ = $<HTMLInputElement>('map-scale-z');
const mapValues = $<HTMLInputElement>('map-values');

// Shape inputs
const shapeKind = $<HTMLSelectElement>('shape-kind');
const shapeAtX = $<HTMLInputElement>('shape-at-x');
const shapeAtY = $<HTMLInputElement>('shape-at-y');
const shapeAtZ = $<HTMLInputElement>('shape-at-z');
const shapeSizeW = $<HTMLInputElement>('shape-size-w');
const shapeSizeD = $<HTMLInputElement>('shape-size-d');
const shapeSizeH = $<HTMLInputElement>('shape-size-h');
const shapeToX = $<HTMLInputElement>('shape-to-x');
const shapeToY = $<HTMLInputElement>('shape-to-y');
const shapeToZ = $<HTMLInputElement>('shape-to-z');
const shapeR = $<HTMLInputElement>('shape-r');
const shapeColor = $<HTMLInputElement>('shape-color');
const shapeOn = $<HTMLInputElement>('shape-on');
const shapeSizeGroup = $('shape-size-group');
const shapeLineGroup = $('shape-line-group');

// Multi-Dimensional Filter Editor elements
const filterEditorSection = $('filter-editor-section');
const btnToggleFilterCollapse = $('btn-toggle-filter-collapse');
const filterEditorBody = $('filter-editor-body');
const filterDimX = $<HTMLInputElement>('filter-dim-x');
const filterDimY = $<HTMLInputElement>('filter-dim-y');
const filterDimZ = $<HTMLInputElement>('filter-dim-z');
const btnFilterDecX = $('btn-filter-dec-x');
const btnFilterIncX = $('btn-filter-inc-x');
const btnFilterDecY = $('btn-filter-dec-y');
const btnFilterIncY = $('btn-filter-inc-y');
const btnFilterDecZ = $('btn-filter-dec-z');
const btnFilterIncZ = $('btn-filter-inc-z');
const filterActiveBrush = $('filter-active-brush');
const filterBrushPalette = $('filter-brush-palette');
const btnFilterCopyInOut = $('btn-filter-copy-in-out');
const btnFilterSwapInOut = $('btn-filter-swap-in-out');
const btnFilterFillIn = $('btn-filter-fill-in');
const btnFilterFillOut = $('btn-filter-fill-out');
const btnFilterClearAll = $('btn-filter-clear-all');
const btnFilterApplyToRule = $('btn-filter-apply-to-rule');
const filterInLayersNav = $('filter-in-layers-nav');
const filterInGridContainer = $('filter-in-grid-container');
const filterInText = $<HTMLInputElement>('filter-in-text');
const filterOutLayersNav = $('filter-out-layers-nav');
const filterOutGridContainer = $('filter-out-grid-container');
const filterOutText = $<HTMLInputElement>('filter-out-text');
const filterLinkedCodeBadge = $('filter-linked-code-badge');
const filterLinkedCodeText = $('filter-linked-code-text');
const btnFilterUnlinkCode = $('btn-filter-unlink-code');

// State for Filter Editor
let activeLinkedCodeRule: CodeRuleInfo | null = null;
let filterCurDimX = 3;
let filterCurDimY = 3;
let filterCurDimZ = 1;
let filterActiveLayerZ = 0;
let filterBrushChar = '*';
let filterInLayersData: string[][][] = [[
  ['B', 'B', 'B'],
  ['B', '*', 'B'],
  ['B', 'B', 'B'],
]];
let filterOutLayersData: string[][][] = [[
  ['B', 'B', 'B'],
  ['B', 'H', 'B'],
  ['B', 'B', 'B'],
]];
let activeLinkedRuleRow: HTMLElement | null = null;
let activeRuleFocusField: HTMLInputElement | null = null;

function getSelectedRuleNodeType(): RuleNodeType {
  for (const r of ruleNodeRadios) {
    if (r.checked) return r.value as RuleNodeType;
  }
  return 'all';
}

function setRuleNodeType(type: string) {
  ruleNodeRadios.forEach((r) => {
    r.checked = (r.value === type);
    r.closest('.rule-type-option')?.classList.toggle('active', r.checked);
  });
  updateMethodPanelsVisibility();
}

function updateMethodPanelsVisibility() {
  const nodeType = getSelectedRuleNodeType();

  // Hide all panels
  methodPanelRules.classList.add('hidden');
  methodPanelPath.classList.add('hidden');
  methodPanelConv.classList.add('hidden');
  methodPanelMap.classList.add('hidden');
  methodPanelShape.classList.add('hidden');

  if (nodeType === 'all' || nodeType === 'one' || nodeType === 'prl' || nodeType === 'markov' || nodeType === 'sequence') {
    methodPanelRules.classList.remove('hidden');
    rulePGroup.classList.toggle('disabled', nodeType !== 'prl');

    if (nodeType === 'markov') {
      rulesListTitle.textContent = 'Sotto-regole Markov (esegue in priorità finché almeno una matcha)';
    } else if (nodeType === 'sequence') {
      rulesListTitle.textContent = 'Sotto-passi in Sequenza (eseguiti in ordine)';
    } else {
      rulesListTitle.textContent = 'Pattern di Sostituzione (In ➔ Out)';
    }
  } else if (nodeType === 'path') {
    methodPanelPath.classList.remove('hidden');
  } else if (nodeType === 'convolution') {
    methodPanelConv.classList.remove('hidden');
  } else if (nodeType === 'map') {
    methodPanelMap.classList.remove('hidden');
  } else if (nodeType === 'shape') {
    methodPanelShape.classList.remove('hidden');
  }
}

function updateRulesPreview() {
  const nodeType = getSelectedRuleNodeType();
  const stepsVal = parseInt(ruleStepsInput.value, 10);
  const steps = Number.isFinite(stepsVal) && stepsVal > 0 ? stepsVal : undefined;
  const pVal = parseFloat(rulePNum.value);
  const p = nodeType === 'prl' && Number.isFinite(pVal) ? pVal : undefined;
  const symmetry = (ruleSymmetrySelect.value || '(xy)') as SymmetryType;

  let config: AnyMjNodeConfig;

  if (nodeType === 'path') {
    const pStepsVal = parseInt(pathStepsInput.value, 10);
    config = {
      type: 'path',
      from: pathFromInput.value.trim() || 'a',
      to: pathToInput.value.trim() || 'u',
      on: pathOnInput.value.trim() || 'E',
      color: pathColorInput.value.trim() || 'G',
      steps: Number.isFinite(pStepsVal) && pStepsVal > 0 ? pStepsVal : 1,
      inertia: pathInertiaInput.checked,
      longest: pathLongestInput.checked,
    };
  } else if (nodeType === 'convolution') {
    const cStepsVal = parseInt(convSteps.value, 10);
    config = {
      type: 'convolution',
      neighborhood: convNeighborhood.value as 'Moore' | 'VonNeumann' | 'NoCorners',
      in: convIn.value.trim() || 'B',
      out: convOut.value.trim() || 'W',
      values: convValues.value.trim() || undefined,
      sum: convSum.value.trim() || undefined,
      steps: Number.isFinite(cStepsVal) && cStepsVal > 0 ? cStepsVal : undefined,
      periodic: convPeriodic.checked,
    };
  } else if (nodeType === 'map') {
    const sx = Math.max(1, parseInt(mapScaleX.value, 10) || 2);
    const sy = Math.max(1, parseInt(mapScaleY.value, 10) || 2);
    const sz = Math.max(1, parseInt(mapScaleZ.value, 10) || 2);
    const rules: SingleRuleItem[] = [];
    ruleRowsContainer.querySelectorAll('.rule-row-card').forEach((row) => {
      const inInput = row.querySelector<HTMLInputElement>('.rule-in-input');
      const outInput = row.querySelector<HTMLInputElement>('.rule-out-input');
      if (inInput?.value.trim() && outInput?.value.trim()) {
        rules.push({ in: inInput.value.trim(), out: outInput.value.trim() });
      }
    });
    config = {
      type: 'map',
      scale: [sx, sy, sz],
      values: mapValues.value.trim() || 'BW',
      rules: rules.length > 0 ? rules : [{ in: 'B', out: 'BB/BB BB/BB' }],
    };
  } else if (nodeType === 'shape') {
    const kind = shapeKind.value as 'box' | 'cylinder' | 'ellipsoid' | 'cone' | 'line';
    const at: [number, number, number] = [
      parseFloat(shapeAtX.value) || 0,
      parseFloat(shapeAtY.value) || 0,
      parseFloat(shapeAtZ.value) || 0,
    ];
    if (kind === 'line') {
      const to: [number, number, number] = [
        parseFloat(shapeToX.value) || 4,
        parseFloat(shapeToY.value) || 0,
        parseFloat(shapeToZ.value) || 0,
      ];
      const r = parseFloat(shapeR.value) || 1;
      config = {
        type: 'shape',
        shape: kind,
        at,
        to,
        r,
        color: shapeColor.value.trim() || 'W',
        on: shapeOn.value.trim() || undefined,
      };
    } else {
      const size: [number, number, number] = [
        Math.max(1, parseFloat(shapeSizeW.value) || 4),
        Math.max(1, parseFloat(shapeSizeD.value) || 4),
        Math.max(1, parseFloat(shapeSizeH.value) || 4),
      ];
      config = {
        type: 'shape',
        shape: kind,
        at,
        size,
        color: shapeColor.value.trim() || 'W',
        on: shapeOn.value.trim() || undefined,
      };
    }
  } else {
    // all, one, prl, markov, sequence
    const rules: SingleRuleItem[] = [];
    const rowEls = ruleRowsContainer.querySelectorAll('.rule-row-card');
    rowEls.forEach((row) => {
      const inInput = row.querySelector<HTMLInputElement>('.rule-in-input');
      const outInput = row.querySelector<HTMLInputElement>('.rule-out-input');
      const pInput = row.querySelector<HTMLInputElement>('.rule-row-prob');
      if (inInput && outInput) {
        const inVal = inInput.value.trim();
        const outVal = outInput.value.trim();
        if (inVal && outVal) {
          const itemP = pInput && nodeType === 'prl' ? parseFloat(pInput.value) : undefined;
          rules.push({
            in: inVal,
            out: outVal,
            p: Number.isFinite(itemP) && itemP! > 0 && itemP! <= 1 ? itemP : undefined,
          });
        }
      }
    });

    const activeRules = rules.length > 0 ? rules : [{ in: 'A', out: 'B' }];

    if (nodeType === 'markov') {
      config = {
        type: 'markov',
        steps,
        symmetry,
        rules: activeRules,
      };
    } else if (nodeType === 'sequence') {
      config = {
        type: 'sequence',
        steps,
        rules: activeRules,
      };
    } else {
      config = {
        type: nodeType,
        steps,
        p,
        symmetry,
        rules: activeRules,
      };
    }
  }

  const xml = generateNodeXml(config);
  ruleXmlPreview.textContent = xml || '<!-- Nessuna regola valida configurata -->';
}

function createRuleRow(inVal = '', outVal = '', pVal?: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'rule-row-card';

  // In box
  const inBox = document.createElement('div');
  inBox.className = 'rule-io-box';
  const inLabel = document.createElement('span');
  inLabel.textContent = 'In:';
  const inInput = document.createElement('input');
  inInput.type = 'text';
  inInput.className = 'rule-in-input';
  inInput.value = inVal;
  inInput.placeholder = 'es. P o BBB/B*B/BBB';
  inInput.addEventListener('focus', () => {
    activeRuleFocusField = inInput;
    activeLinkedRuleRow = row;
    loadRowIntoFilter(row);
  });
  inInput.addEventListener('input', () => {
    updateRulesPreview();
    if (activeLinkedRuleRow === row) {
      loadRowIntoFilter(row);
    }
  });
  inBox.appendChild(inLabel);
  inBox.appendChild(inInput);

  // Arrow
  const arrow = document.createElement('span');
  arrow.className = 'rule-arrow';
  arrow.textContent = '➔';

  // Out box
  const outBox = document.createElement('div');
  outBox.className = 'rule-io-box';
  const outLabel = document.createElement('span');
  outLabel.textContent = 'Out:';
  const outInput = document.createElement('input');
  outInput.type = 'text';
  outInput.className = 'rule-out-input';
  outInput.value = outVal;
  outInput.placeholder = 'es. S o BBB/BHB/BBB';
  outInput.addEventListener('focus', () => {
    activeRuleFocusField = outInput;
    activeLinkedRuleRow = row;
    loadRowIntoFilter(row);
  });
  outInput.addEventListener('input', () => {
    updateRulesPreview();
    if (activeLinkedRuleRow === row) {
      loadRowIntoFilter(row);
    }
  });
  outBox.appendChild(outLabel);
  outBox.appendChild(outInput);

  // Prob input (for prl)
  const probInput = document.createElement('input');
  probInput.type = 'number';
  probInput.className = 'rule-row-prob';
  probInput.min = '0.01';
  probInput.max = '1';
  probInput.step = '0.05';
  probInput.placeholder = 'p';
  probInput.title = 'Probabilità p individuale per questa regola (opzionale)';
  if (pVal !== undefined) probInput.value = String(pVal);
  probInput.addEventListener('input', updateRulesPreview);

  // Button to open/edit in Multi-D Filter
  const btnEditFilter = document.createElement('button');
  btnEditFilter.className = 'btn-sm btn-outline';
  btnEditFilter.textContent = '▦ Filtro';
  btnEditFilter.title = 'Modifica questo pattern visivamente nel filtro 3D';
  btnEditFilter.addEventListener('click', (e) => {
    e.stopPropagation();
    loadRowIntoFilter(row);
    filterEditorBody.classList.remove('collapsed');
    filterEditorSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Remove button
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-rule';
  btnRemove.innerHTML = '🗑';
  btnRemove.title = 'Rimuovi questa riga';
  btnRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeLinkedRuleRow === row) activeLinkedRuleRow = null;
    row.remove();
    updateRulesPreview();
  });

  row.appendChild(inBox);
  row.appendChild(arrow);
  row.appendChild(outBox);
  row.appendChild(probInput);
  row.appendChild(btnEditFilter);
  row.appendChild(btnRemove);

  row.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement)?.closest('.btn-remove-rule')) {
      loadRowIntoFilter(row);
    }
  });

  return row;
}

function loadRuleValuesIntoFilter(inVal: string, outVal: string) {
  const parsedIn = parsePattern3D(inVal.trim() || '*');
  const parsedOut = parsePattern3D(outVal.trim() || '*');

  const targetX = Math.max(1, Math.min(12, Math.max(parsedIn.x, parsedOut.x)));
  const targetY = Math.max(1, Math.min(12, Math.max(parsedIn.y, parsedOut.y)));
  const targetZ = Math.max(1, Math.min(12, Math.max(parsedIn.z, parsedOut.z)));

  filterInLayersData = resizePattern3D(parsedIn.layers, targetX, targetY, targetZ, '*');
  filterOutLayersData = resizePattern3D(parsedOut.layers, targetX, targetY, targetZ, '*');

  setFilterDimensions(targetX, targetY, targetZ, false);
  renderFilterLayersNav();
  renderFilterGrids();
}

function loadRowIntoFilter(row: HTMLElement) {
  activeLinkedRuleRow = row;
  ruleRowsContainer.querySelectorAll('.rule-row-card').forEach((r) => r.classList.remove('linked-filter'));
  row.classList.add('linked-filter');

  const inInput = row.querySelector<HTMLInputElement>('.rule-in-input');
  const outInput = row.querySelector<HTMLInputElement>('.rule-out-input');
  if (inInput && outInput) {
    loadRuleValuesIntoFilter(inInput.value, outInput.value);
  }
}

// ------------------------------------------------------------------ Multi-Dimensional Filter Editor Logic

function setFilterDimensions(x: number, y: number, z: number, resizeData = true) {
  filterCurDimX = Math.max(1, Math.min(12, x));
  filterCurDimY = Math.max(1, Math.min(12, y));
  filterCurDimZ = Math.max(1, Math.min(12, z));

  filterDimX.value = String(filterCurDimX);
  filterDimY.value = String(filterCurDimY);
  filterDimZ.value = String(filterCurDimZ);

  if (filterActiveLayerZ >= filterCurDimZ) {
    filterActiveLayerZ = filterCurDimZ - 1;
  }

  // Update preset buttons active state
  document.querySelectorAll<HTMLButtonElement>('.btn-filter-preset').forEach((btn) => {
    const px = parseInt(btn.dataset.x || '0', 10);
    const py = parseInt(btn.dataset.y || '0', 10);
    const pz = parseInt(btn.dataset.z || '0', 10);
    btn.classList.toggle('active', px === filterCurDimX && py === filterCurDimY && pz === filterCurDimZ);
  });

  if (resizeData) {
    filterInLayersData = resizePattern3D(filterInLayersData, filterCurDimX, filterCurDimY, filterCurDimZ, '*');
    filterOutLayersData = resizePattern3D(filterOutLayersData, filterCurDimX, filterCurDimY, filterCurDimZ, '*');
  }

  syncFilterToTextInputs();
  renderFilterLayersNav();
  renderFilterGrids();
}

function setFilterBrush(ch: string) {
  filterBrushChar = ch;
  filterActiveBrush.textContent = ch;

  const pal = getActivePaletteMap()[ch] ?? MJ_PALETTE[ch];
  if (pal?.color) {
    const hex = pal.color.startsWith('#') ? pal.color : `#${pal.color}`;
    filterActiveBrush.style.backgroundColor = hex;
    filterActiveBrush.style.color = getContrastColor(hex);
  } else if (ch === '*') {
    filterActiveBrush.style.backgroundColor = '#475569';
    filterActiveBrush.style.color = '#ffffff';
  } else if (ch === '.') {
    filterActiveBrush.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    filterActiveBrush.style.color = '#94a3b8';
  } else {
    filterActiveBrush.style.backgroundColor = '#38bdf8';
    filterActiveBrush.style.color = '#ffffff';
  }

  document.querySelectorAll<HTMLElement>('.filter-brush-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.symbol === ch);
  });
}

function renderFilterBrushPalette() {
  filterBrushPalette.innerHTML = '';

  // 1. Wildcard (*) and Air (.)
  const tokens = ['*', '.'];
  for (const tok of tokens) {
    const item = document.createElement('div');
    item.className = 'filter-brush-item' + (tok === filterBrushChar ? ' active' : '');
    item.dataset.symbol = tok;
    item.textContent = tok;
    item.title = tok === '*' ? 'Wildcard (*): qualsiasi voxel' : 'Aria (.): vuoto';
    if (tok === '*') {
      item.style.backgroundColor = '#475569';
      item.style.color = '#ffffff';
    } else {
      item.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      item.style.color = '#94a3b8';
    }
    item.onclick = () => setFilterBrush(tok);
    filterBrushPalette.appendChild(item);
  }

  // 2. Model palette symbols
  const symbols = getPaletteSymbols(codeInput.value);
  for (const s of symbols) {
    const item = document.createElement('div');
    item.className = 'filter-brush-item' + (s.symbol === filterBrushChar ? ' active' : '');
    item.dataset.symbol = s.symbol;
    item.textContent = s.symbol;
    item.title = `${s.name ?? s.symbol} (${s.symbol})`;
    item.style.backgroundColor = s.color;
    item.style.color = getContrastColor(s.color);
    item.onclick = () => setFilterBrush(s.symbol);
    filterBrushPalette.appendChild(item);
  }

  setFilterBrush(filterBrushChar);
}

function renderFilterLayersNav() {
  filterInLayersNav.innerHTML = '';
  filterOutLayersNav.innerHTML = '';

  if (filterCurDimZ <= 1) return;

  for (let z = 0; z < filterCurDimZ; z++) {
    const btnIn = document.createElement('button');
    btnIn.className = 'btn-filter-layer' + (z === filterActiveLayerZ ? ' active' : '');
    btnIn.textContent = `Z=${z + 1}`;
    btnIn.title = `Visualizza strato Z=${z + 1} (${z === 0 ? 'Top' : z === filterCurDimZ - 1 ? 'Base' : 'Intermedio'})`;
    btnIn.onclick = () => {
      filterActiveLayerZ = z;
      renderFilterLayersNav();
      renderFilterGrids();
    };
    filterInLayersNav.appendChild(btnIn);

    const btnOut = document.createElement('button');
    btnOut.className = 'btn-filter-layer' + (z === filterActiveLayerZ ? ' active' : '');
    btnOut.textContent = `Z=${z + 1}`;
    btnOut.title = `Visualizza strato Z=${z + 1}`;
    btnOut.onclick = () => {
      filterActiveLayerZ = z;
      renderFilterLayersNav();
      renderFilterGrids();
    };
    filterOutLayersNav.appendChild(btnOut);
  }
}

function renderFilterGrids() {
  const activePal = getActivePaletteMap();

  const layerIdx = Math.max(0, Math.min(filterCurDimZ - 1, filterActiveLayerZ));

  // Render IN Grid
  filterInGridContainer.innerHTML = '';
  filterInGridContainer.style.setProperty('--filter-cols', String(filterCurDimX));

  const inLayer = filterInLayersData[layerIdx] ?? [];
  for (let y = 0; y < filterCurDimY; y++) {
    for (let x = 0; x < filterCurDimX; x++) {
      const char = inLayer[y]?.[x] ?? '*';
      const cell = document.createElement('div');
      cell.className = 'filter-voxel-cell';
      cell.textContent = char;

      const pal = activePal[char] ?? MJ_PALETTE[char];
      if (pal?.color) {
        const hex = pal.color.startsWith('#') ? pal.color : `#${pal.color}`;
        cell.style.backgroundColor = hex;
        cell.style.color = getContrastColor(hex);
      } else if (char === '*') {
        cell.style.backgroundColor = '#475569';
        cell.style.color = '#f8fafc';
      } else if (char === '.') {
        cell.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        cell.style.color = '#94a3b8';
      } else {
        cell.style.backgroundColor = '#38bdf8';
        cell.style.color = '#ffffff';
      }

      cell.title = `IN (X:${x + 1}, Y:${y + 1}, Z:${layerIdx + 1}): ${char}`;
      cell.onclick = () => {
        if (!filterInLayersData[layerIdx]) filterInLayersData[layerIdx] = [];
        if (!filterInLayersData[layerIdx][y]) filterInLayersData[layerIdx][y] = [];
        filterInLayersData[layerIdx][y][x] = filterBrushChar;
        syncFilterToTextInputs();
        renderFilterGrids();
      };

      filterInGridContainer.appendChild(cell);
    }
  }

  // Render OUT Grid
  filterOutGridContainer.innerHTML = '';
  filterOutGridContainer.style.setProperty('--filter-cols', String(filterCurDimX));

  const outLayer = filterOutLayersData[layerIdx] ?? [];
  for (let y = 0; y < filterCurDimY; y++) {
    for (let x = 0; x < filterCurDimX; x++) {
      const char = outLayer[y]?.[x] ?? '*';
      const cell = document.createElement('div');
      cell.className = 'filter-voxel-cell';
      cell.textContent = char;

      const pal = activePal[char] ?? MJ_PALETTE[char];
      if (pal?.color) {
        const hex = pal.color.startsWith('#') ? pal.color : `#${pal.color}`;
        cell.style.backgroundColor = hex;
        cell.style.color = getContrastColor(hex);
      } else if (char === '*') {
        cell.style.backgroundColor = '#475569';
        cell.style.color = '#f8fafc';
      } else if (char === '.') {
        cell.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        cell.style.color = '#94a3b8';
      } else {
        cell.style.backgroundColor = '#38bdf8';
        cell.style.color = '#ffffff';
      }

      cell.title = `OUT (X:${x + 1}, Y:${y + 1}, Z:${layerIdx + 1}): ${char}`;
      cell.onclick = () => {
        if (!filterOutLayersData[layerIdx]) filterOutLayersData[layerIdx] = [];
        if (!filterOutLayersData[layerIdx][y]) filterOutLayersData[layerIdx][y] = [];
        filterOutLayersData[layerIdx][y][x] = filterBrushChar;
        syncFilterToTextInputs();
        renderFilterGrids();
      };

      filterOutGridContainer.appendChild(cell);
    }
  }
}

function syncFilterToTextInputs() {
  const inStr = formatPattern3D(filterInLayersData);
  const outStr = formatPattern3D(filterOutLayersData);

  filterInText.value = inStr;
  filterOutText.value = outStr;

  if (getSelectedRuleNodeType() === 'path') {
    pathFromInput.value = inStr;
    pathToInput.value = outStr;
    updateRulesPreview();
  } else if (activeLinkedRuleRow) {
    const inInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-in-input');
    const outInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-out-input');
    if (inInput) inInput.value = inStr;
    if (outInput) outInput.value = outStr;
    updateRulesPreview();
  }
}

/**
 * Opens the 3D multi-dimensional filter editor pre-loaded with an existing rule
 * from the XML code editor at or around `pos`.
 */
function openFilterFromCode(pos: number) {
  codeInput.selectionStart = codeInput.selectionEnd = pos;
  updateCursorPos();

  const ruleInfo = extractRuleAtPos(codeInput.value, pos);
  if (!ruleInfo) {
    activeLinkedCodeRule = null;
    filterLinkedCodeBadge.classList.add('hidden');
    btnFilterApplyToRule.textContent = '✓ Applica a Regola';
    openRulesModal();
    filterEditorBody.classList.remove('collapsed');
    filterEditorSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  activeLinkedCodeRule = ruleInfo;

  // Unlink active rule card row
  activeLinkedRuleRow = null;
  document.querySelectorAll('.rule-row-card').forEach((c) => c.classList.remove('linked-filter'));

  const inVal = ruleInfo.attrs?.['from'] ?? ruleInfo.inAttr?.value ?? '*';
  const outVal = ruleInfo.attrs?.['to'] ?? ruleInfo.outAttr?.value ?? '*';
  loadRuleValuesIntoFilter(inVal, outVal);

  // Show linked badge
  filterLinkedCodeBadge.classList.remove('hidden');
  filterLinkedCodeText.textContent = `🔗 Regola collegata dal codice: <${ruleInfo.tag}> (riga ${ruleInfo.line})`;
  btnFilterApplyToRule.textContent = `✓ Applica a Riga ${ruleInfo.line} nel Codice`;

  openRulesModal(ruleInfo);
  filterEditorBody.classList.remove('collapsed');
  setTimeout(() => {
    filterEditorSection.scrollIntoView({ behavior: 'smooth' });
  }, 60);
}

// ------------------------------------------------------------------ Color Symbol Refactoring Modal Logic

const modalRefactorBackdrop = $('modal-refactor-backdrop');
const btnRefactorSymbol = $('btn-refactor-symbol');
const btnRefactorClose = $('btn-refactor-close');
const btnRefactorCancel = $('btn-refactor-cancel');
const btnRefactorApply = $('btn-refactor-apply');
const refactorOldSwatch = $('refactor-old-swatch');
const refactorOldSymbol = $('refactor-old-symbol');
const refactorOldName = $('refactor-old-name');
const refactorNewSymbol = $<HTMLInputElement>('refactor-new-symbol');
const refactorOccurrencesSummary = $('refactor-occurrences-summary');
const refactorTargetWarning = $('refactor-target-warning');

function openRefactorModal() {
  modalRefactorBackdrop.classList.remove('hidden');
  modalRefactorBackdrop.setAttribute('aria-hidden', 'false');

  const oldSym = activeColorSymbol;
  refactorOldSymbol.textContent = oldSym;

  const pal = getActivePaletteMap()[oldSym] ?? MJ_PALETTE[oldSym];
  const hex = pal?.color ? (pal.color.startsWith('#') ? pal.color : `#${pal.color}`) : '#888888';
  refactorOldSwatch.style.backgroundColor = hex;
  refactorOldName.textContent = pal?.name ? `${pal.name} (${hex})` : hex;

  refactorNewSymbol.value = '';
  refactorTargetWarning.classList.add('hidden');

  // Compute occurrences
  const info = countColorSymbolOccurrences(codeInput.value, oldSym);
  if (info.total === 0) {
    refactorOccurrencesSummary.innerHTML = `Nessuna occorrenza del simbolo <b>"${oldSym}"</b> trovata nel codice attuale.`;
    btnRefactorApply.setAttribute('disabled', 'true');
  } else {
    btnRefactorApply.removeAttribute('disabled');
    refactorOccurrencesSummary.innerHTML = `
      <b>${info.total} occorrenze</b> del simbolo <b>"${oldSym}"</b> trovate nel modello:
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        ${info.details.map((d) => `<li>${d}</li>`).join('')}
      </ul>
    `;
  }

  refactorNewSymbol.focus();
}

function closeRefactorModal() {
  modalRefactorBackdrop.classList.add('hidden');
  modalRefactorBackdrop.setAttribute('aria-hidden', 'true');
}

refactorNewSymbol.addEventListener('input', () => {
  const newSym = refactorNewSymbol.value.trim();
  if (!newSym) {
    refactorTargetWarning.classList.add('hidden');
    return;
  }

  const existingSymbols = getPaletteSymbols(codeInput.value).map((s) => s.symbol);
  if (existingSymbols.includes(newSym) && newSym !== activeColorSymbol) {
    refactorTargetWarning.classList.remove('hidden');
    refactorTargetWarning.textContent = `⚠️ Attenzione: il simbolo "${newSym}" è già utilizzato nel modello! La sostituzione unificherà tutte le occorrenze di "${activeColorSymbol}" con "${newSym}".`;
  } else {
    refactorTargetWarning.classList.add('hidden');
  }
});

btnRefactorApply.addEventListener('click', () => {
  const oldSym = activeColorSymbol;
  const newSym = refactorNewSymbol.value.trim();

  if (!newSym || newSym.length !== 1) {
    alert('Inserisci un singolo carattere valido per il nuovo simbolo.');
    return;
  }

  if (newSym === oldSym) {
    closeRefactorModal();
    return;
  }

  const { newXml, count } = refactorColorSymbol(codeInput.value, oldSym, newSym);
  if (count > 0) {
    codeInput.value = newXml;
    activeColorSymbol = newSym;
    onCodeChange();
    void triggerBuild();
    syncPaletteState();
    setActiveColor(newSym);
  }

  closeRefactorModal();
});

btnRefactorSymbol.addEventListener('click', openRefactorModal);
btnRefactorClose.addEventListener('click', closeRefactorModal);
btnRefactorCancel.addEventListener('click', closeRefactorModal);
modalRefactorBackdrop.addEventListener('click', (e) => {
  if (e.target === modalRefactorBackdrop) closeRefactorModal();
});

// ------------------------------------------------------------------ Rules & Sostituisci Listeners

function populateRulesPaletteSwatches() {
  rulePaletteSwatches.innerHTML = '';
  const symbols = getPaletteSymbols(codeInput.value);

  for (const s of symbols) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rule-swatch-btn';
    btn.title = `${s.name ?? s.symbol} (${s.symbol}) · Clicca per inserire`;

    const colorDot = document.createElement('span');
    colorDot.className = 'rule-swatch-color';
    colorDot.style.backgroundColor = s.color;

    const label = document.createElement('span');
    label.textContent = s.symbol;

    btn.appendChild(colorDot);
    btn.appendChild(label);

    btn.addEventListener('click', () => {
      if (activeRuleFocusField) {
        activeRuleFocusField.value = s.symbol;
        activeRuleFocusField.dispatchEvent(new Event('input'));
      } else {
        const firstIn = ruleRowsContainer.querySelector<HTMLInputElement>('.rule-in-input');
        if (firstIn && !firstIn.value) {
          firstIn.value = s.symbol;
          firstIn.dispatchEvent(new Event('input'));
        }
      }
    });

    rulePaletteSwatches.appendChild(btn);
  }
}

function openRulesModal(explicitRule?: CodeRuleInfo | null) {
  modalRulesBackdrop.classList.remove('hidden');
  modalRulesBackdrop.setAttribute('aria-hidden', 'false');
  populateRulesPaletteSwatches();
  renderFilterBrushPalette();

  const curPos = codeInput.selectionStart ?? 0;
  const codeRule = explicitRule !== undefined ? explicitRule : extractRuleAtPos(codeInput.value, curPos);

  if (codeRule) {
    activeLinkedCodeRule = codeRule;
    filterLinkedCodeBadge.classList.remove('hidden');
    filterLinkedCodeText.textContent = `🔗 Regola collegata dal codice: <${codeRule.tag}> (riga ${codeRule.line})`;
    btnFilterApplyToRule.textContent = `✓ Applica a Riga ${codeRule.line} nel Codice`;

    setRuleNodeType(codeRule.tag);

    if (codeRule.tag === 'path') {
      const fromVal = codeRule.attrs?.['from'] ?? codeRule.inAttr?.value ?? 'a';
      const toVal = codeRule.attrs?.['to'] ?? codeRule.outAttr?.value ?? 'u';
      pathFromInput.value = fromVal;
      pathToInput.value = toVal;
      if (codeRule.attrs?.['on']) pathOnInput.value = codeRule.attrs['on'];
      if (codeRule.attrs?.['color']) pathColorInput.value = codeRule.attrs['color'];
      if (codeRule.attrs?.['steps']) pathStepsInput.value = codeRule.attrs['steps'];
      pathInertiaInput.checked = codeRule.attrs?.['inertia']?.toLowerCase() === 'true';
      pathLongestInput.checked = codeRule.attrs?.['longest']?.toLowerCase() === 'true';
      loadRuleValuesIntoFilter(fromVal, toVal);
    } else {
      ruleRowsContainer.innerHTML = '';
      const newRow = createRuleRow(codeRule.inAttr?.value || '*', codeRule.outAttr?.value || '*');
      ruleRowsContainer.appendChild(newRow);
      loadRowIntoFilter(newRow);
    }
  } else {
    if (!activeLinkedCodeRule) {
      filterLinkedCodeBadge.classList.add('hidden');
      btnFilterApplyToRule.textContent = '✓ Applica a Regola';
    }

    if (ruleRowsContainer.children.length === 0) {
      const symbols = getPaletteSymbols(codeInput.value);
      const inSym = symbols[0]?.symbol || 'P';
      const outSym = symbols[1]?.symbol || 'S';
      const newRow = createRuleRow(inSym, outSym);
      ruleRowsContainer.appendChild(newRow);
      loadRowIntoFilter(newRow);
    } else if (activeLinkedRuleRow && ruleRowsContainer.contains(activeLinkedRuleRow)) {
      loadRowIntoFilter(activeLinkedRuleRow);
    } else {
      const firstRow = ruleRowsContainer.querySelector<HTMLElement>('.rule-row-card');
      if (firstRow) loadRowIntoFilter(firstRow);
    }
  }

  updateMethodPanelsVisibility();
  updateRulesPreview();
}

function closeRulesModal() {
  modalRulesBackdrop.classList.add('hidden');
  modalRulesBackdrop.setAttribute('aria-hidden', 'true');
}

function toggleRulesModal() {
  if (modalRulesBackdrop.classList.contains('hidden')) {
    openRulesModal();
  } else {
    closeRulesModal();
  }
}

// Rules Modal Event Listeners
btnOpenRules.addEventListener('click', () => openRulesModal());
btnOpenFilter.addEventListener('click', () => {
  const curPos = codeInput.selectionStart;
  const ruleInfo = extractRuleAtPos(codeInput.value, curPos);
  if (ruleInfo) {
    openFilterFromCode(curPos);
  } else {
    activeLinkedCodeRule = null;
    filterLinkedCodeBadge.classList.add('hidden');
    btnFilterApplyToRule.textContent = '✓ Applica a Regola';
    openRulesModal();
    filterEditorBody.classList.remove('collapsed');
    filterEditorSection.scrollIntoView({ behavior: 'smooth' });
  }
});

btnRulesClose.addEventListener('click', closeRulesModal);
modalRulesBackdrop.addEventListener('click', (e) => {
  if (e.target === modalRulesBackdrop) closeRulesModal();
});

ruleNodeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    ruleNodeRadios.forEach((r) => {
      r.closest('.rule-type-option')?.classList.toggle('active', r.checked);
    });
    updateMethodPanelsVisibility();
    updateRulesPreview();

    const nodeType = getSelectedRuleNodeType();
    if (nodeType === 'path') {
      loadRuleValuesIntoFilter(pathFromInput.value, pathToInput.value);
    } else if (['all', 'one', 'prl', 'markov', 'sequence'].includes(nodeType)) {
      if (activeLinkedRuleRow && ruleRowsContainer.contains(activeLinkedRuleRow)) {
        loadRowIntoFilter(activeLinkedRuleRow);
      } else {
        const firstRow = ruleRowsContainer.querySelector<HTMLElement>('.rule-row-card');
        if (firstRow) loadRowIntoFilter(firstRow);
      }
    }
  });
});

ruleStepsInput.addEventListener('input', updateRulesPreview);
ruleSymmetrySelect.addEventListener('change', updateRulesPreview);

rulePSlider.addEventListener('input', () => {
  rulePNum.value = rulePSlider.value;
  updateRulesPreview();
});

rulePNum.addEventListener('input', () => {
  rulePSlider.value = rulePNum.value;
  updateRulesPreview();
});

// Path method event listeners
[pathFromInput, pathToInput, pathOnInput, pathColorInput, pathStepsInput].forEach((el) => {
  el.addEventListener('input', () => {
    updateRulesPreview();
    if (el === pathFromInput || el === pathToInput) {
      loadRuleValuesIntoFilter(pathFromInput.value, pathToInput.value);
    }
  });
});
pathInertiaInput.addEventListener('change', updateRulesPreview);
pathLongestInput.addEventListener('change', updateRulesPreview);

// Convolution method event listeners
[convNeighborhood].forEach((el) => el.addEventListener('change', updateRulesPreview));
[convIn, convOut, convValues, convSum, convSteps].forEach((el) => el.addEventListener('input', updateRulesPreview));
convPeriodic.addEventListener('change', updateRulesPreview);

// Map method event listeners
[mapScaleX, mapScaleY, mapScaleZ, mapValues].forEach((el) => el.addEventListener('input', updateRulesPreview));

// Shape method event listeners
shapeKind.addEventListener('change', () => {
  const isLine = shapeKind.value === 'line';
  shapeLineGroup.classList.toggle('hidden', !isLine);
  shapeSizeGroup.classList.toggle('hidden', isLine);
  updateRulesPreview();
});
[shapeAtX, shapeAtY, shapeAtZ, shapeSizeW, shapeSizeD, shapeSizeH, shapeToX, shapeToY, shapeToZ, shapeR, shapeColor, shapeOn].forEach((el) => {
  el.addEventListener('input', updateRulesPreview);
});

btnAddRuleRow.addEventListener('click', () => {
  const row = createRuleRow();
  ruleRowsContainer.appendChild(row);
  loadRowIntoFilter(row);
  updateRulesPreview();
});

btnToggleFilterCollapse.addEventListener('click', () => {
  filterEditorBody.classList.toggle('collapsed');
});

// Stepper buttons for dimensions
btnFilterDecX.addEventListener('click', () => setFilterDimensions(filterCurDimX - 1, filterCurDimY, filterCurDimZ));
btnFilterIncX.addEventListener('click', () => setFilterDimensions(filterCurDimX + 1, filterCurDimY, filterCurDimZ));
btnFilterDecY.addEventListener('click', () => setFilterDimensions(filterCurDimX, filterCurDimY - 1, filterCurDimZ));
btnFilterIncY.addEventListener('click', () => setFilterDimensions(filterCurDimX, filterCurDimY + 1, filterCurDimZ));
btnFilterDecZ.addEventListener('click', () => setFilterDimensions(filterCurDimX, filterCurDimY, filterCurDimZ - 1));
btnFilterIncZ.addEventListener('click', () => setFilterDimensions(filterCurDimX, filterCurDimY, filterCurDimZ + 1));

filterDimX.addEventListener('change', () => setFilterDimensions(parseInt(filterDimX.value, 10), filterCurDimY, filterCurDimZ));
filterDimY.addEventListener('change', () => setFilterDimensions(filterCurDimX, parseInt(filterDimY.value, 10), filterCurDimZ));
filterDimZ.addEventListener('change', () => setFilterDimensions(filterCurDimX, filterCurDimY, parseInt(filterDimZ.value, 10)));

document.querySelectorAll<HTMLButtonElement>('.btn-filter-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    const x = parseInt(btn.dataset.x || '3', 10);
    const y = parseInt(btn.dataset.y || '3', 10);
    const z = parseInt(btn.dataset.z || '1', 10);
    setFilterDimensions(x, y, z);
  });
});

filterInText.addEventListener('input', () => {
  const parsed = parsePattern3D(filterInText.value);
  filterInLayersData = parsed.layers;
  setFilterDimensions(parsed.x, parsed.y, parsed.z, false);
  renderFilterGrids();
});

filterOutText.addEventListener('input', () => {
  const parsed = parsePattern3D(filterOutText.value);
  filterOutLayersData = parsed.layers;
  setFilterDimensions(parsed.x, parsed.y, parsed.z, false);
  renderFilterGrids();
});

btnFilterCopyInOut.addEventListener('click', () => {
  filterOutLayersData = JSON.parse(JSON.stringify(filterInLayersData));
  syncFilterToTextInputs();
  renderFilterGrids();
});

btnFilterSwapInOut.addEventListener('click', () => {
  const tmp = filterInLayersData;
  filterInLayersData = filterOutLayersData;
  filterOutLayersData = tmp;
  syncFilterToTextInputs();
  renderFilterGrids();
});

btnFilterFillIn.addEventListener('click', () => {
  for (let z = 0; z < filterCurDimZ; z++) {
    for (let y = 0; y < filterCurDimY; y++) {
      for (let x = 0; x < filterCurDimX; x++) {
        filterInLayersData[z][y][x] = filterBrushChar;
      }
    }
  }
  syncFilterToTextInputs();
  renderFilterGrids();
});

btnFilterFillOut.addEventListener('click', () => {
  for (let z = 0; z < filterCurDimZ; z++) {
    for (let y = 0; y < filterCurDimY; y++) {
      for (let x = 0; x < filterCurDimX; x++) {
        filterOutLayersData[z][y][x] = filterBrushChar;
      }
    }
  }
  syncFilterToTextInputs();
  renderFilterGrids();
});

btnFilterClearAll.addEventListener('click', () => {
  for (let z = 0; z < filterCurDimZ; z++) {
    for (let y = 0; y < filterCurDimY; y++) {
      for (let x = 0; x < filterCurDimX; x++) {
        filterInLayersData[z][y][x] = '*';
        filterOutLayersData[z][y][x] = '*';
      }
    }
  }
  syncFilterToTextInputs();
  renderFilterGrids();
});

btnFilterApplyToRule.addEventListener('click', () => {
  if (activeLinkedCodeRule) {
    const newIn = filterInText.value;
    const newOut = filterOutText.value;
    const newXml = replaceRuleInCode(codeInput.value, activeLinkedCodeRule, newIn, newOut);
    codeInput.value = newXml;
    onCodeChange();

    if (activeLinkedRuleRow) {
      const inInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-in-input');
      const outInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-out-input');
      if (inInput) inInput.value = newIn;
      if (outInput) outInput.value = newOut;
      updateRulesPreview();
    } else if (getSelectedRuleNodeType() === 'path') {
      pathFromInput.value = newIn;
      pathToInput.value = newOut;
      updateRulesPreview();
    }

    // Re-extract rule to refresh offsets for subsequent edits
    const refreshed = extractRuleAtPos(newXml, activeLinkedCodeRule.tagStart);
    if (refreshed) {
      activeLinkedCodeRule = refreshed;
    }

    const prevText = btnFilterApplyToRule.textContent;
    btnFilterApplyToRule.textContent = '✓ Applicato al Codice!';
    btnFilterApplyToRule.style.background = 'var(--emerald, #10b981)';
    setTimeout(() => {
      btnFilterApplyToRule.textContent = prevText;
      btnFilterApplyToRule.style.background = '';
    }, 1200);
    return;
  }

  if (activeLinkedRuleRow) {
    const inInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-in-input');
    const outInput = activeLinkedRuleRow.querySelector<HTMLInputElement>('.rule-out-input');
    if (inInput) inInput.value = filterInText.value;
    if (outInput) outInput.value = filterOutText.value;
    updateRulesPreview();
    const prevBg = activeLinkedRuleRow.style.background;
    activeLinkedRuleRow.style.background = 'rgba(56, 189, 248, 0.2)';
    setTimeout(() => {
      activeLinkedRuleRow!.style.background = prevBg;
    }, 400);
  } else {
    // Add as new row
    const row = createRuleRow(filterInText.value, filterOutText.value);
    ruleRowsContainer.appendChild(row);
    loadRowIntoFilter(row);
    updateRulesPreview();
  }
});

btnFilterUnlinkCode.addEventListener('click', () => {
  activeLinkedCodeRule = null;
  filterLinkedCodeBadge.classList.add('hidden');
  btnFilterApplyToRule.textContent = '✓ Applica a Regola';
});

btnInsertRuleCursor.addEventListener('click', () => {
  const xml = ruleXmlPreview.textContent;
  if (!xml || xml.startsWith('<!-- Nessuna')) return;

  const start = codeInput.selectionStart;
  const { newXml, newCursor } = insertRuleIntoXmlAt(codeInput.value, xml, start, activeLinkedCodeRule);
  codeInput.value = newXml;
  codeInput.setSelectionRange(newCursor, newCursor);
  activeLinkedCodeRule = null;
  filterLinkedCodeBadge.classList.add('hidden');
  btnFilterApplyToRule.textContent = '✓ Applica a Regola';
  onCodeChange();
  void triggerBuild();
  closeRulesModal();
});

btnInsertRuleEnd.addEventListener('click', () => {
  const xml = ruleXmlPreview.textContent;
  if (!xml || xml.startsWith('<!-- Nessuna')) return;

  const { newXml, newCursor } = insertRuleAtEndOfSequence(codeInput.value, xml);
  codeInput.value = newXml;
  codeInput.setSelectionRange(newCursor, newCursor);
  onCodeChange();
  void triggerBuild();
  closeRulesModal();
});

btnCopyRule.addEventListener('click', () => {
  const xml = ruleXmlPreview.textContent;
  if (!xml) return;
  void navigator.clipboard.writeText(xml).then(() => {
    const orig = btnCopyRule.textContent;
    btnCopyRule.textContent = 'Copiato! ✓';
    setTimeout(() => {
      btnCopyRule.textContent = orig;
    }, 1500);
  });
});

// ------------------------------------------------------------------ WFC Guided Modal (T59d)

const modalWfcBackdrop = $('modal-wfc-backdrop');
const btnOpenWfc = $('btn-open-wfc');
const btnWfcClose = $('btn-wfc-close');
const wfcPresetsGrid = $('wfc-presets-grid');
const wfcModeRadios = document.querySelectorAll<HTMLInputElement>('input[name="wfc-output-mode"]');
const wfcDimX = $<HTMLInputElement>('wfc-dim-x');
const wfcDimY = $<HTMLInputElement>('wfc-dim-y');
const wfcDimZ = $<HTMLInputElement>('wfc-dim-z');
const wfcSymmetry = $<HTMLSelectElement>('wfc-symmetry');
const wfcPeriodic = $<HTMLInputElement>('wfc-periodic');
const wfcTilesContainer = $('wfc-tiles-container');
const wfcXmlPreview = $<HTMLElement>('wfc-xml-preview');
const btnWfcLoadModel = $('btn-wfc-load-model');
const btnWfcInsertCursor = $('btn-wfc-insert-cursor');
const btnWfcCopy = $('btn-wfc-copy');

let selectedWfcPresetId: string = WFC_PRESETS[0]?.id || 'pipes';

function getSelectedWfcMode(): WfcOutputMode {
  for (const r of wfcModeRadios) {
    if (r.checked) return r.value as WfcOutputMode;
  }
  return 'mj_native';
}

function updateWfcPreview() {
  const mode = getSelectedWfcMode();
  const preset = WFC_PRESETS.find((p) => p.id === selectedWfcPresetId);

  const dimX = parseInt(wfcDimX.value, 10) || preset?.size[0] || 12;
  const dimY = parseInt(wfcDimY.value, 10) || preset?.size[1] || 12;
  const dimZ = parseInt(wfcDimZ.value, 10) || preset?.size[2] || 12;
  const symmetry = wfcSymmetry.value || preset?.symmetry || '(xy)';
  const periodic = wfcPeriodic.checked;

  const config: WfcConfig = {
    presetId: selectedWfcPresetId,
    mode,
    size: [dimX, dimY, dimZ],
    periodic,
    symmetry,
    tiles: preset?.tiles || [],
    comment: preset?.description,
  };

  const xml = generateWfcXml(config);
  wfcXmlPreview.textContent = xml;
}

function selectWfcPreset(presetId: string) {
  selectedWfcPresetId = presetId;
  const preset = WFC_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  // Update card highlights
  const cards = wfcPresetsGrid.querySelectorAll('.wfc-preset-card');
  cards.forEach((card) => {
    card.classList.toggle('active', card.getAttribute('data-id') === presetId);
  });

  // Apply preset parameters
  wfcDimX.value = String(preset.size[0]);
  wfcDimY.value = String(preset.size[1]);
  wfcDimZ.value = String(preset.size[2]);
  wfcSymmetry.value = preset.symmetry;
  wfcPeriodic.checked = preset.periodic;

  // Render tile badges
  wfcTilesContainer.innerHTML = '';
  for (const t of preset.tiles) {
    const badge = document.createElement('div');
    badge.className = 'wfc-tile-badge';

    const dot = document.createElement('span');
    dot.className = 'wfc-tile-dot';
    dot.style.backgroundColor = t.color;

    const sym = document.createElement('span');
    sym.className = 'wfc-tile-sym';
    sym.textContent = t.symbol;

    const name = document.createElement('span');
    name.textContent = t.name;

    badge.appendChild(dot);
    badge.appendChild(sym);
    badge.appendChild(name);
    wfcTilesContainer.appendChild(badge);
  }

  updateWfcPreview();
}

function renderWfcPresets() {
  wfcPresetsGrid.innerHTML = '';
  for (const p of WFC_PRESETS) {
    const card = document.createElement('div');
    card.className = 'wfc-preset-card' + (p.id === selectedWfcPresetId ? ' active' : '');
    card.setAttribute('data-id', p.id);

    const icon = document.createElement('span');
    icon.className = 'wfc-preset-icon';
    icon.textContent = p.icon;

    const name = document.createElement('span');
    name.className = 'wfc-preset-name';
    name.textContent = p.name;

    const desc = document.createElement('span');
    desc.className = 'wfc-preset-desc';
    desc.textContent = p.description;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(desc);

    card.addEventListener('click', () => {
      selectWfcPreset(p.id);
    });

    wfcPresetsGrid.appendChild(card);
  }
}

function openWfcModal() {
  modalWfcBackdrop.classList.remove('hidden');
  modalWfcBackdrop.setAttribute('aria-hidden', 'false');
  renderWfcPresets();
  selectWfcPreset(selectedWfcPresetId);
}

function closeWfcModal() {
  modalWfcBackdrop.classList.add('hidden');
  modalWfcBackdrop.setAttribute('aria-hidden', 'true');
}

function toggleWfcModal() {
  if (modalWfcBackdrop.classList.contains('hidden')) {
    openWfcModal();
  } else {
    closeWfcModal();
  }
}

// WFC Modal Event Listeners
btnOpenWfc.addEventListener('click', openWfcModal);
btnWfcClose.addEventListener('click', closeWfcModal);
modalWfcBackdrop.addEventListener('click', (e) => {
  if (e.target === modalWfcBackdrop) closeWfcModal();
});

wfcModeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    wfcModeRadios.forEach((r) => {
      r.closest('.wfc-mode-option')?.classList.toggle('active', r.checked);
    });
    updateWfcPreview();
  });
});

wfcDimX.addEventListener('input', updateWfcPreview);
wfcDimY.addEventListener('input', updateWfcPreview);
wfcDimZ.addEventListener('input', updateWfcPreview);
wfcSymmetry.addEventListener('change', updateWfcPreview);
wfcPeriodic.addEventListener('change', updateWfcPreview);

btnWfcLoadModel.addEventListener('click', () => {
  const xml = wfcXmlPreview.textContent;
  if (!xml) return;

  codeInput.value = xml;
  // If native MJ, reset preset select or select custom
  presetSelect.value = '';
  onCodeChange();
  void triggerBuild().then(() => {
    if (currentMesh) fitCameraToMesh(new THREE.Box3().setFromObject(currentMesh));
  });
  closeWfcModal();
});

btnWfcInsertCursor.addEventListener('click', () => {
  const xml = wfcXmlPreview.textContent;
  if (!xml) return;

  const start = codeInput.selectionStart;
  const { newXml, newCursor } = insertRuleIntoXmlAt(codeInput.value, xml, start);
  codeInput.value = newXml;
  codeInput.setSelectionRange(newCursor, newCursor);
  onCodeChange();
  void triggerBuild();
  closeWfcModal();
});

btnWfcCopy.addEventListener('click', () => {
  const xml = wfcXmlPreview.textContent;
  if (!xml) return;
  void navigator.clipboard.writeText(xml).then(() => {
    const orig = btnWfcCopy.textContent;
    btnWfcCopy.textContent = 'Copiato! ✓';
    setTimeout(() => {
      btnWfcCopy.textContent = orig;
    }, 1500);
  });
});

// Update global keydown to handle Alt+R and Alt+W and Escape in modals
window.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 'r' || e.key === 'R')) {
    e.preventDefault();
    toggleRulesModal();
    return;
  }
  if (e.altKey && (e.key === 'w' || e.key === 'W')) {
    e.preventDefault();
    toggleWfcModal();
    return;
  }
  if (e.key === 'Escape') {
    if (!pickerPopup.classList.contains('hidden')) {
      closeColorPickerPopup();
      return;
    }
    if (!modalRulesBackdrop.classList.contains('hidden')) {
      closeRulesModal();
      return;
    }
    if (!modalWfcBackdrop.classList.contains('hidden')) {
      closeWfcModal();
      return;
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
  hasCustomColorsPrev = null;
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

// Choose default if available, otherwise template
const defaultEntry = CATALOG.find((e) => e.id === 'schermo-struttura') || CATALOG.find((e) => e.id === 'barile');
if (defaultEntry) {
  presetSelect.value = defaultEntry.id;
  loadSelectedPreset();
} else {
  presetSelect.value = 'template:cube';
  loadSelectedPreset();
}

updateViewportSize();
