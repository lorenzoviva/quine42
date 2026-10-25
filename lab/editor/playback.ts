// MarkovJunior Model Editor: Playback & Animation Controller (T59c).
// Controls execution of rewrite rules (single step, continuous loop, pause/stop, scrub timeline)
// and frame sequence preview for animated models (<animation> and <action> tags).

import type { Grid3, PaletteEntry, Snapshot } from '../../src/mj/engine';
import { meshVoxels, type MeshData } from '../../src/mj/mesh';
import type { MjxModel } from '../../src/mj/model';
import { act, clipFrames } from '../../src/mj/run';

export type PlaybackTrackKind = 'generation' | 'animation' | 'action';

export interface PlaybackFrameGrid {
  X: number;
  Y: number;
  Z: number;
  cells: Uint8Array;
  alphabet: string[];
  solidCount: number;
}

export interface PlaybackFrame {
  index: number;
  step: number;
  label: string;
  grid: PlaybackFrameGrid;
  mesh?: MeshData;
}

export interface PlaybackTrack {
  id: string;
  name: string;
  kind: PlaybackTrackKind;
  frames: PlaybackFrame[];
  fps: number;
  loop: boolean;
}

export interface PlaybackState {
  trackId: string;
  trackName: string;
  kind: PlaybackTrackKind;
  frameIndex: number;
  totalFrames: number;
  isPlaying: boolean;
  isLooping: boolean;
  fps: number;
  currentLabel: string;
  solidCount: number;
}

export const copyGrid = (g: Grid3): Grid3 => ({
  ...g,
  cells: new Uint8Array(g.cells),
  alphabet: [...g.alphabet],
  log: [],
  epoch: 0,
});

export function countSolidVoxels(
  cells: Uint8Array,
  alphabet: string[],
  palette: Record<string, PaletteEntry>,
): number {
  let count = 0;
  for (let i = 0; i < cells.length; i++) {
    const val = cells[i];
    if (val !== 0) {
      const sym = alphabet[val];
      if (sym && palette[sym]?.color && !palette[sym].hidden) {
        count++;
      }
    }
  }
  return count;
}

export function getOrComputeFrameMesh(
  frame: PlaybackFrame,
  palette: Record<string, PaletteEntry>,
  vpt: number,
): MeshData {
  if (!frame.mesh) {
    frame.mesh = meshVoxels(
      {
        X: frame.grid.X,
        Y: frame.grid.Y,
        Z: frame.grid.Z,
        cells: frame.grid.cells,
        alphabet: frame.grid.alphabet,
      },
      palette,
      { vpt },
    );
  }
  return frame.mesh;
}

/**
 * Builds playback tracks for a MarkovJunior model:
 * 1. Generation track: intermediate rule execution snapshots
 * 2. Animation tracks: for each <animation> clip
 * 3. Action tracks: for each <action> clip (before & after states)
 */
export function buildPlaybackTracks(
  model: MjxModel,
  finalGrid: Grid3,
  palette: Record<string, PaletteEntry>,
  seed: number,
  vpt: number,
  snapshots?: Snapshot[],
  meshAll = false,
): PlaybackTrack[] {
  const tracks: PlaybackTrack[] = [];

  // 1. Generation track (rule rewrite snapshots)
  const genFrames: PlaybackFrame[] = [];
  if (snapshots && snapshots.length > 0) {
    for (let i = 0; i < snapshots.length; i++) {
      const s = snapshots[i];
      const solids = countSolidVoxels(s.cells, finalGrid.alphabet, palette);
      const isLast = i === snapshots.length - 1;
      const label = isLast ? `Passo ${s.step} (Completato)` : s.step === 0 ? `Passo 0 (Inizio)` : `Passo ${s.step}`;
      const frame: PlaybackFrame = {
        index: i,
        step: s.step,
        label,
        grid: {
          X: s.X,
          Y: s.Y,
          Z: s.Z,
          cells: s.cells,
          alphabet: finalGrid.alphabet,
          solidCount: solids,
        },
      };
      if (meshAll) {
        getOrComputeFrameMesh(frame, palette, vpt);
      }
      genFrames.push(frame);
    }

    // If final snapshot doesn't match final grid, append final grid as ending frame
    const last = snapshots[snapshots.length - 1];
    if (last.cells !== finalGrid.cells) {
      const solids = countSolidVoxels(finalGrid.cells, finalGrid.alphabet, palette);
      const frame: PlaybackFrame = {
        index: genFrames.length,
        step: last.step + 1,
        label: `Passo finale (Completato)`,
        grid: {
          X: finalGrid.X,
          Y: finalGrid.Y,
          Z: finalGrid.Z,
          cells: finalGrid.cells,
          alphabet: finalGrid.alphabet,
          solidCount: solids,
        },
      };
      if (meshAll) {
        getOrComputeFrameMesh(frame, palette, vpt);
      }
      genFrames.push(frame);
    }
  } else {
    // Static model or 0 snapshots
    const solids = countSolidVoxels(finalGrid.cells, finalGrid.alphabet, palette);
    const frame: PlaybackFrame = {
      index: 0,
      step: 0,
      label: `Passo 0 (Statico)`,
      grid: {
        X: finalGrid.X,
        Y: finalGrid.Y,
        Z: finalGrid.Z,
        cells: finalGrid.cells,
        alphabet: finalGrid.alphabet,
        solidCount: solids,
      },
    };
    if (meshAll) {
      getOrComputeFrameMesh(frame, palette, vpt);
    }
    genFrames.push(frame);
  }

  tracks.push({
    id: 'generation',
    name: '⚙️ Generazione regole',
    kind: 'generation',
    frames: genFrames,
    fps: 15,
    loop: false,
  });

  // 2. Animation tracks (<animation> tags)
  for (const anim of model.animations) {
    const rawFrames = clipFrames(copyGrid(finalGrid), anim, seed);
    const frames: PlaybackFrame[] = rawFrames.map((g, idx) => {
      const solids = countSolidVoxels(g.cells, g.alphabet, palette);
      const frame: PlaybackFrame = {
        index: idx,
        step: idx + 1,
        label: `Fotogramma ${idx + 1}/${anim.frames}`,
        grid: {
          X: g.X,
          Y: g.Y,
          Z: g.Z,
          cells: g.cells,
          alphabet: g.alphabet,
          solidCount: solids,
        },
      };
      if (meshAll) {
        getOrComputeFrameMesh(frame, palette, vpt);
      }
      return frame;
    });

    tracks.push({
      id: `anim:${anim.name}`,
      name: `🎬 Animazione: ${anim.name} (${anim.frames} fotogrammi)`,
      kind: 'animation',
      frames,
      fps: 10,
      loop: true,
    });
  }

  // 3. Action tracks (<action> tags)
  for (const action of model.actions) {
    const gBefore = copyGrid(finalGrid);
    const gAfter = copyGrid(finalGrid);
    act(gAfter, action, seed);

    const fBefore: PlaybackFrame = {
      index: 0,
      step: 0,
      label: `Stato iniziale`,
      grid: {
        X: gBefore.X,
        Y: gBefore.Y,
        Z: gBefore.Z,
        cells: gBefore.cells,
        alphabet: gBefore.alphabet,
        solidCount: countSolidVoxels(gBefore.cells, gBefore.alphabet, palette),
      },
    };
    if (meshAll) getOrComputeFrameMesh(fBefore, palette, vpt);

    const fAfter: PlaybackFrame = {
      index: 1,
      step: 1,
      label: action.label ?? action.name,
      grid: {
        X: gAfter.X,
        Y: gAfter.Y,
        Z: gAfter.Z,
        cells: gAfter.cells,
        alphabet: gAfter.alphabet,
        solidCount: countSolidVoxels(gAfter.cells, gAfter.alphabet, palette),
      },
    };
    if (meshAll) getOrComputeFrameMesh(fAfter, palette, vpt);

    tracks.push({
      id: `action:${action.name}`,
      name: `⚡ Azione: ${action.label ?? action.name}`,
      kind: 'action',
      frames: [fBefore, fAfter],
      fps: 2,
      loop: true,
    });
  }

  return tracks;
}

/**
 * PlaybackController: manages state, playback timer, stepping, and subscribers.
 */
export class PlaybackController {
  private tracks: PlaybackTrack[] = [];
  private activeTrackId = '';
  private currentFrameIndex = 0;
  private isPlaying = false;
  private isLooping = false;
  private fps = 10;
  private timer: ReturnType<typeof setTimeout> | null = null;

  private frameListeners: Array<(frame: PlaybackFrame, state: PlaybackState) => void> = [];
  private stateListeners: Array<(state: PlaybackState) => void> = [];
  private tracksListeners: Array<(tracks: PlaybackTrack[], activeTrackId: string) => void> = [];

  /**
   * Updates tracks and activates the selected or first track.
   */
  setTracks(tracks: PlaybackTrack[], preferredTrackId?: string): void {
    this.stopTimer();
    this.tracks = tracks;

    let targetId = preferredTrackId;
    if (!targetId || !this.tracks.some((t) => t.id === targetId)) {
      // Keep activeTrackId if still available, else default to first track
      if (this.tracks.some((t) => t.id === this.activeTrackId)) {
        targetId = this.activeTrackId;
      } else {
        targetId = this.tracks[0]?.id ?? '';
      }
    }

    this.activeTrackId = targetId;
    const track = this.getCurrentTrack();
    if (track) {
      this.fps = track.fps;
      this.isLooping = track.loop;
      // Start at last frame for generation if stopped, otherwise frame 0
      if (track.kind === 'generation') {
        this.currentFrameIndex = Math.max(0, track.frames.length - 1);
      } else {
        this.currentFrameIndex = 0;
      }
    } else {
      this.currentFrameIndex = 0;
    }
    this.isPlaying = false;

    this.notifyTracksChange();
    this.notifyStateChange();
    this.notifyFrameChange();
  }

  selectTrack(trackId: string): boolean {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return false;

    this.stopTimer();
    this.isPlaying = false;
    this.activeTrackId = trackId;
    this.fps = track.fps;
    this.isLooping = track.loop;
    this.currentFrameIndex = 0;

    this.notifyTracksChange();
    this.notifyStateChange();
    this.notifyFrameChange();
    return true;
  }

  play(): void {
    const track = this.getCurrentTrack();
    if (!track || track.frames.length <= 1) return;

    if (!this.isPlaying) {
      // If at end and not looping, rewind to frame 0 first
      if (this.currentFrameIndex >= track.frames.length - 1 && !this.isLooping) {
        this.currentFrameIndex = 0;
        this.notifyFrameChange();
      }
      this.isPlaying = true;
      this.notifyStateChange();
      this.scheduleNextTick();
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.stopTimer();
      this.isPlaying = false;
      this.notifyStateChange();
    }
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stop(): void {
    this.pause();
    const track = this.getCurrentTrack();
    if (track && track.kind === 'generation') {
      // For generation, stop resets to frame 0 or last frame
      this.currentFrameIndex = 0;
    } else {
      this.currentFrameIndex = 0;
    }
    this.notifyFrameChange();
    this.notifyStateChange();
  }

  stepForward(): void {
    this.pause();
    const track = this.getCurrentTrack();
    if (!track || track.frames.length <= 1) return;

    if (this.currentFrameIndex + 1 < track.frames.length) {
      this.currentFrameIndex++;
    } else if (this.isLooping) {
      this.currentFrameIndex = 0;
    }
    this.notifyFrameChange();
    this.notifyStateChange();
  }

  stepBackward(): void {
    this.pause();
    const track = this.getCurrentTrack();
    if (!track || track.frames.length <= 1) return;

    if (this.currentFrameIndex > 0) {
      this.currentFrameIndex--;
    } else if (this.isLooping) {
      this.currentFrameIndex = track.frames.length - 1;
    }
    this.notifyFrameChange();
    this.notifyStateChange();
  }

  jumpToFrame(index: number): void {
    const track = this.getCurrentTrack();
    if (!track || track.frames.length === 0) return;

    const clamped = Math.max(0, Math.min(track.frames.length - 1, Math.round(index)));
    if (this.currentFrameIndex !== clamped) {
      this.currentFrameIndex = clamped;
      this.notifyFrameChange();
      this.notifyStateChange();
    }
  }

  jumpToFirst(): void {
    this.jumpToFrame(0);
  }

  jumpToLast(): void {
    const track = this.getCurrentTrack();
    if (!track) return;
    this.jumpToFrame(track.frames.length - 1);
  }

  setFps(fps: number): void {
    const clamped = Math.max(1, Math.min(60, Math.round(fps)));
    if (this.fps !== clamped) {
      this.fps = clamped;
      this.notifyStateChange();
      if (this.isPlaying) {
        this.stopTimer();
        this.scheduleNextTick();
      }
    }
  }

  setLoop(loop: boolean): void {
    if (this.isLooping !== loop) {
      this.isLooping = loop;
      this.notifyStateChange();
    }
  }

  getTracks(): PlaybackTrack[] {
    return this.tracks;
  }

  getCurrentTrack(): PlaybackTrack | undefined {
    return this.tracks.find((t) => t.id === this.activeTrackId) ?? this.tracks[0];
  }

  getCurrentFrame(): PlaybackFrame | undefined {
    const track = this.getCurrentTrack();
    if (!track || track.frames.length === 0) return undefined;
    const idx = Math.max(0, Math.min(track.frames.length - 1, this.currentFrameIndex));
    return track.frames[idx];
  }

  getState(): PlaybackState {
    const track = this.getCurrentTrack();
    const frame = this.getCurrentFrame();
    return {
      trackId: track?.id ?? '',
      trackName: track?.name ?? 'Nessuna traccia',
      kind: track?.kind ?? 'generation',
      frameIndex: this.currentFrameIndex,
      totalFrames: track?.frames.length ?? 0,
      isPlaying: this.isPlaying,
      isLooping: this.isLooping,
      fps: this.fps,
      currentLabel: frame?.label ?? '',
      solidCount: frame?.grid.solidCount ?? 0,
    };
  }

  onFrameChange(fn: (frame: PlaybackFrame, state: PlaybackState) => void): () => void {
    this.frameListeners.push(fn);
    return () => {
      this.frameListeners = this.frameListeners.filter((l) => l !== fn);
    };
  }

  onStateChange(fn: (state: PlaybackState) => void): () => void {
    this.stateListeners.push(fn);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== fn);
    };
  }

  onTracksChange(fn: (tracks: PlaybackTrack[], activeTrackId: string) => void): () => void {
    this.tracksListeners.push(fn);
    return () => {
      this.tracksListeners = this.tracksListeners.filter((l) => l !== fn);
    };
  }

  dispose(): void {
    this.stopTimer();
    this.frameListeners = [];
    this.stateListeners = [];
    this.tracksListeners = [];
  }

  // --- Internal Timer & Scheduling ---

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextTick(): void {
    if (!this.isPlaying) return;
    const intervalMs = Math.max(16, Math.round(1000 / this.fps));
    this.timer = setTimeout(() => {
      this.timer = null;
      this.advanceTick();
    }, intervalMs);
  }

  private advanceTick(): void {
    if (!this.isPlaying) return;
    const track = this.getCurrentTrack();
    if (!track || track.frames.length <= 1) {
      this.pause();
      return;
    }

    if (this.currentFrameIndex + 1 < track.frames.length) {
      this.currentFrameIndex++;
      this.notifyFrameChange();
      this.notifyStateChange();
      this.scheduleNextTick();
    } else {
      if (this.isLooping) {
        this.currentFrameIndex = 0;
        this.notifyFrameChange();
        this.notifyStateChange();
        this.scheduleNextTick();
      } else {
        this.pause();
      }
    }
  }

  private notifyFrameChange(): void {
    const frame = this.getCurrentFrame();
    if (!frame) return;
    const state = this.getState();
    for (const listener of this.frameListeners) {
      listener(frame, state);
    }
  }

  private notifyStateChange(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private notifyTracksChange(): void {
    for (const listener of this.tracksListeners) {
      listener(this.tracks, this.activeTrackId);
    }
  }
}
