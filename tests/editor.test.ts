import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  extractLineFromError,
  highlightXml,
  validateMjx,
  MJ_NODES,
  MJ_ATTRS,
} from '../lab/editor/syntax';
import { CATALOG } from '../lab/3d/catalog';
import {
  parseShapesFromXml,
  insertShapeIntoXml,
  updateShapeInXml,
  deleteShapeFromXml,
  duplicateShapeInXml,
  parseColorsFromXml,
  setLetterColorInXml,
  voxelToThree,
  threeToVoxel,
  isVoxelInsideShape,
  findShapeAtVoxel,
} from '../lab/editor/cad';
import {
  buildPlaybackTracks,
  PlaybackController,
  countSolidVoxels,
  getOrComputeFrameMesh,
  type PlaybackTrack,
  type PlaybackFrame,
} from '../lab/editor/playback';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';

describe('MarkovJunior Editor (T59a)', () => {
  describe('syntax highlighting & tokenizer', () => {
    it('escapes special characters', () => {
      expect(escapeHtml('<div id="a&b">')).toBe('&lt;div id="a&amp;b"&gt;');
    });

    it('highlights XML comments and meta declarations', () => {
      const xml = '<!-- Questo è un commento -->\n<?xml version="1.0"?>';
      const html = highlightXml(xml);
      expect(html).toContain('<span class="tok-comment">&lt;!-- Questo è un commento --&gt;</span>');
      expect(html).toContain('<span class="tok-meta">&lt;?xml version="1.0"?&gt;</span>');
    });

    it('highlights tags, MarkovJunior nodes and attributes', () => {
      const xml = '<sequence values="BW" size="10 10 10">\n  <one>\n    <rule in="B" out="W"/>\n  </one>\n</sequence>';
      const html = highlightXml(xml);

      // Node tags
      expect(html).toContain('<span class="tok-tag tok-mj-node">sequence</span>');
      expect(html).toContain('<span class="tok-tag tok-mj-node">one</span>');
      expect(html).toContain('<span class="tok-tag tok-mj-node">rule</span>');

      // Attributes
      expect(html).toContain('<span class="tok-attr tok-mj-attr">values</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">size</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">in</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">out</span>');

      // Attribute values
      expect(html).toContain('<span class="tok-val">"BW"</span>');
      expect(html).toContain('<span class="tok-val">"10 10 10"</span>');
    });

    it('identifies MarkovJunior nodes and attributes in predefined sets', () => {
      expect(MJ_NODES.has('sequence')).toBe(true);
      expect(MJ_NODES.has('markov')).toBe(true);
      expect(MJ_NODES.has('all')).toBe(true);
      expect(MJ_NODES.has('prl')).toBe(true);
      expect(MJ_NODES.has('box')).toBe(true);
      expect(MJ_NODES.has('cylinder')).toBe(true);
      expect(MJ_NODES.has('action')).toBe(true);

      expect(MJ_ATTRS.has('values')).toBe(true);
      expect(MJ_ATTRS.has('size')).toBe(true);
      expect(MJ_ATTRS.has('in')).toBe(true);
      expect(MJ_ATTRS.has('out')).toBe(true);
      expect(MJ_ATTRS.has('glow')).toBe(true);
    });
  });

  describe('XML validation and line error extraction', () => {
    it('extracts line number from error message', () => {
      expect(extractLineFromError('riga 14: tag di chiusura non valido')).toBe(14);
      expect(extractLineFromError('riga 3, <rule>: pattern errato')).toBe(3);
      expect(extractLineFromError('Error at line 42: unexpected token')).toBe(42);
      expect(extractLineFromError('errore generico senza riga')).toBe(1);
    });

    it('rejects empty XML with line 1', () => {
      const res = validateMjx('   ');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(1);
        expect(res.error).toContain('vuoto');
      }
    });

    it('validates a correct MarkovJunior XML', () => {
      const validXml = `
<sequence values="BW" size="10 10 10">
  <one>
    <rule in="B" out="W"/>
  </one>
</sequence>`;
      const res = validateMjx(validXml);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.model).toBeDefined();
        expect(res.warnings).toBeInstanceOf(Array);
      }
    });

    it('detects unclosed tags and indicates the exact line', () => {
      const brokenXml = `<sequence values="BW" size="10 10 10">
  <one>
    <rule in="B" out="W"/>
</sequence>`;
      const res = validateMjx(brokenXml);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(4);
        expect(res.error).toContain('chiude');
      }
    });

    it('detects invalid MJ attributes / missing values', () => {
      const brokenXml = `<sequence size="10 10 10">
  <one>
    <rule in="B" out="W"/>
  </one>
</sequence>`;
      const res = validateMjx(brokenXml);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(1);
        expect(res.error).toContain('values');
      }
    });
  });

  describe('catalog and templates', () => {
    it('has valid catalog entries available for the editor', () => {
      expect(CATALOG.length).toBeGreaterThan(10);
      const barile = CATALOG.find((e) => e.id === 'barile');
      expect(barile).toBeDefined();
      if (barile) {
        const res = validateMjx(barile.xml);
        expect(res.ok).toBe(true);
      }

      const casetta = CATALOG.find((e) => e.id === 'casetta');
      expect(casetta).toBeDefined();
      if (casetta) {
        const res = validateMjx(casetta.xml);
        expect(res.ok).toBe(true);
      }
    });
  });

  describe('CAD voxel tools & manipulation (T59b)', () => {
    const SAMPLE_XML = `<sequence values="0BGY" size="12 12 12">
  <box at="6 6 0" size="10 10 2" color="B"/>
  <box at="6 6 2" size="8 8 4" color="G"/>
  <cylinder at="6 6 6" size="6 6 4" color="Y"/>
</sequence>`;

    it('parses existing shapes from XML with lines and dimensions', () => {
      const shapes = parseShapesFromXml(SAMPLE_XML);
      expect(shapes).toHaveLength(3);

      expect(shapes[0].kind).toBe('box');
      expect(shapes[0].at).toEqual([6, 6, 0]);
      expect(shapes[0].size).toEqual([10, 10, 2]);
      expect(shapes[0].color).toBe('B');
      expect(shapes[0].line).toBe(2);

      expect(shapes[1].kind).toBe('box');
      expect(shapes[1].at).toEqual([6, 6, 2]);
      expect(shapes[1].color).toBe('G');

      expect(shapes[2].kind).toBe('cylinder');
      expect(shapes[2].at).toEqual([6, 6, 6]);
      expect(shapes[2].size).toEqual([6, 6, 4]);
      expect(shapes[2].color).toBe('Y');
    });

    it('inserts a new shape into XML and updates root values', () => {
      const { newXml, line } = insertShapeIntoXml(SAMPLE_XML, {
        kind: 'cone',
        at: [6, 6, 10],
        size: [4, 4, 2],
        color: 'R',
      });

      expect(newXml).toContain('values="0BGYR"');
      expect(newXml).toContain('<cone at="6 6 10" size="4 4 2" color="R"/>');
      expect(line).toBeGreaterThan(3);

      const parsed = parseShapesFromXml(newXml);
      expect(parsed).toHaveLength(4);
      expect(parsed[3].kind).toBe('cone');
      expect(parsed[3].color).toBe('R');
    });

    it('updates position, size, and color of an existing shape', () => {
      const updated = updateShapeInXml(SAMPLE_XML, 1, {
        at: [7, 7, 3],
        size: [6, 6, 3],
        color: 'W',
      });

      expect(updated).toContain('values="0BGYW"');
      expect(updated).toContain('<box at="7 7 3" size="6 6 3" color="W"/>');

      const shapes = parseShapesFromXml(updated);
      expect(shapes[1].at).toEqual([7, 7, 3]);
      expect(shapes[1].size).toEqual([6, 6, 3]);
      expect(shapes[1].color).toBe('W');
    });

    it('deletes a shape from XML cleanly', () => {
      const deleted = deleteShapeFromXml(SAMPLE_XML, 1);
      const shapes = parseShapesFromXml(deleted);
      expect(shapes).toHaveLength(2);
      expect(shapes[0].color).toBe('B');
      expect(shapes[1].color).toBe('Y');
      expect(deleted).not.toContain('size="8 8 4"');
    });

    it('duplicates a shape with coordinate offset', () => {
      const { newXml } = duplicateShapeInXml(SAMPLE_XML, 0, [0, 0, 8]);
      const shapes = parseShapesFromXml(newXml);
      expect(shapes).toHaveLength(4);
      expect(shapes[1].at).toEqual([6, 6, 8]);
      expect(shapes[1].size).toEqual([10, 10, 2]);
      expect(shapes[1].color).toBe('B');
    });

    it('manages palette, custom colors and glow properties', () => {
      const withGlow = setLetterColorInXml(SAMPLE_XML, 'R', {
        value: '#ff0055',
        glow: true,
        part: 'testa',
      });

      expect(withGlow).toContain('values="0BGYR"');
      expect(withGlow).toContain('glow="True"');
      expect(withGlow).toContain('value="ff0055"');
      expect(withGlow).toContain('part="testa"');

      const colors = parseColorsFromXml(withGlow);
      expect(colors.R).toBeDefined();
      expect(colors.R.glow).toBe(true);
      expect(colors.R.value).toBe('#ff0055');
      expect(colors.R.part).toBe('testa');
    });

    it('converts between voxel coordinates and Three.js 3D coordinates', () => {
      const grid = { X: 12, Y: 12, Z: 12 };
      const vpt = 20;

      // Center of floor: (6, 6, 0) in voxel space -> (0, 0, 0) in Three.js space
      const threePos = voxelToThree([6, 6, 0], grid, vpt);
      expect(threePos).toEqual([0, 0, 0]);

      // Roundtrip back to voxel
      const voxelPos = threeToVoxel(threePos, grid, vpt);
      expect(voxelPos).toEqual([6, 6, 0]);

      // Elevated voxel
      const elevatedThree = voxelToThree([8, 10, 4], grid, vpt);
      const roundtripElevated = threeToVoxel(elevatedThree, grid, vpt);
      expect(roundtripElevated).toEqual([8, 10, 4]);
    });

    it('tests voxel containment inside shapes for hit testing', () => {
      const shapes = parseShapesFromXml(SAMPLE_XML);
      const box0 = shapes[0]; // at="6 6 0" size="10 10 2"
      // Voxel (6, 6, 0) is inside box0
      expect(isVoxelInsideShape(6, 6, 0, box0)).toBe(true);
      // Voxel (6, 6, 3) is outside box0 (z=3 > bz+h=2)
      expect(isVoxelInsideShape(6, 6, 3, box0)).toBe(false);

      const hit = findShapeAtVoxel(6, 6, 0, shapes);
      expect(hit).not.toBeNull();
      expect(hit?.shape.color).toBe('B');

      const hitCylinder = findShapeAtVoxel(6, 6, 7, shapes);
      expect(hitCylinder).not.toBeNull();
      expect(hitCylinder?.shape.kind).toBe('cylinder');
      expect(hitCylinder?.shape.color).toBe('Y');
    });
  });

  describe('Playback & Animation Controller (T59c)', () => {
    const XML_WITH_ANIM_AND_ACTION = `
<sequence values="BWR" size="6 6 6" origin="True">
  <color symbol="R" value="ff0000" glow="True"/>
  <one in="B" out="W" steps="4"/>
</sequence>
<animation name="battito" frames="4">
  <prl in="W" out="R" p="0.5" steps="1"/>
  <prl in="R" out="W" p="0.5" steps="1"/>
</animation>
<action name="accendi" label="Accendi luce">
  <all in="W" out="R"/>
</action>`;

    it('builds generation, animation, and action playback tracks', () => {
      const model = compileMjx(XML_WITH_ANIM_AND_ACTION);
      const res = runMjx(model, 1, { snapshots: 10 });
      const tracks = buildPlaybackTracks(
        model,
        res.grid,
        model.program.palette,
        1,
        20,
        res.snapshots,
        true,
      );

      expect(tracks).toHaveLength(3);

      // Track 1: Generation
      const genTrack = tracks[0];
      expect(genTrack.id).toBe('generation');
      expect(genTrack.kind).toBe('generation');
      expect(genTrack.frames.length).toBeGreaterThanOrEqual(1);
      expect(genTrack.frames[0].label).toContain('Passo');
      expect(genTrack.frames[0].mesh).toBeDefined();

      // Track 2: Animation
      const animTrack = tracks[1];
      expect(animTrack.id).toBe('anim:battito');
      expect(animTrack.kind).toBe('animation');
      expect(animTrack.frames).toHaveLength(4);
      expect(animTrack.frames[0].label).toBe('Fotogramma 1/4');
      expect(animTrack.frames[3].label).toBe('Fotogramma 4/4');
      expect(animTrack.loop).toBe(true);
      expect(animTrack.fps).toBe(10);
      expect(animTrack.frames[0].mesh).toBeDefined();

      // Track 3: Action
      const actTrack = tracks[2];
      expect(actTrack.id).toBe('action:accendi');
      expect(actTrack.kind).toBe('action');
      expect(actTrack.frames).toHaveLength(2);
      expect(actTrack.frames[0].label).toContain('iniziale');
      expect(actTrack.frames[1].label).toBe('Accendi luce');
      expect(actTrack.frames[0].mesh).toBeDefined();
      expect(actTrack.frames[1].mesh).toBeDefined();
    });

    it('handles static models without rewrite rules or snapshots cleanly', () => {
      const staticXml = `
<sequence values="0B" size="8 8 8">
  <box at="4 4 0" size="4 4 4" color="B"/>
</sequence>`;
      const model = compileMjx(staticXml);
      const res = runMjx(model, 1);
      const tracks = buildPlaybackTracks(
        model,
        res.grid,
        model.program.palette,
        1,
        20,
        undefined,
      );

      expect(tracks).toHaveLength(1);
      const genTrack = tracks[0];
      expect(genTrack.frames).toHaveLength(1);
      expect(genTrack.frames[0].label).toContain('Statico');
    });

    it('controls step-by-step navigation and clamping/wrapping', () => {
      const controller = new PlaybackController();
      const mockTrack: PlaybackTrack = {
        id: 'test',
        name: 'Test Track',
        kind: 'generation',
        fps: 10,
        loop: false,
        frames: [
          { index: 0, step: 0, label: 'Frame 0', grid: { X: 2, Y: 2, Z: 2, cells: new Uint8Array(8), alphabet: ['B'], solidCount: 0 } },
          { index: 1, step: 1, label: 'Frame 1', grid: { X: 2, Y: 2, Z: 2, cells: new Uint8Array(8), alphabet: ['B'], solidCount: 1 } },
          { index: 2, step: 2, label: 'Frame 2', grid: { X: 2, Y: 2, Z: 2, cells: new Uint8Array(8), alphabet: ['B'], solidCount: 2 } },
        ],
      };

      controller.setTracks([mockTrack]);
      // For generation track, initial index defaults to last frame (2)
      expect(controller.getState().frameIndex).toBe(2);

      // Jump to first
      controller.jumpToFirst();
      expect(controller.getState().frameIndex).toBe(0);

      // Step forward
      controller.stepForward();
      expect(controller.getState().frameIndex).toBe(1);

      controller.stepForward();
      expect(controller.getState().frameIndex).toBe(2);

      // At end, with loop=false, stepForward clamps to last frame
      controller.stepForward();
      expect(controller.getState().frameIndex).toBe(2);

      // Enable loop: stepForward wraps to 0
      controller.setLoop(true);
      expect(controller.getState().isLooping).toBe(true);
      controller.stepForward();
      expect(controller.getState().frameIndex).toBe(0);

      // Step backward with loop=true wraps to last frame
      controller.stepBackward();
      expect(controller.getState().frameIndex).toBe(2);

      // Step backward normally
      controller.stepBackward();
      expect(controller.getState().frameIndex).toBe(1);

      // Stop resets to frame 0
      controller.stop();
      expect(controller.getState().frameIndex).toBe(0);
      expect(controller.getState().isPlaying).toBe(false);

      // Jump to frame with clamping
      controller.jumpToFrame(10);
      expect(controller.getState().frameIndex).toBe(2);
      controller.jumpToFrame(-5);
      expect(controller.getState().frameIndex).toBe(0);

      controller.dispose();
    });

    it('manages play, pause, togglePlay, fps settings and state notifications', () => {
      const controller = new PlaybackController();
      const mockTrack: PlaybackTrack = {
        id: 'anim',
        name: 'Animation Track',
        kind: 'animation',
        fps: 8,
        loop: true,
        frames: [
          { index: 0, step: 1, label: 'F1', grid: { X: 2, Y: 2, Z: 2, cells: new Uint8Array(8), alphabet: ['B'], solidCount: 1 } },
          { index: 1, step: 2, label: 'F2', grid: { X: 2, Y: 2, Z: 2, cells: new Uint8Array(8), alphabet: ['B'], solidCount: 2 } },
        ],
      };

      let stateChanges = 0;
      let frameChanges = 0;
      controller.onStateChange(() => stateChanges++);
      controller.onFrameChange(() => frameChanges++);

      controller.setTracks([mockTrack]);
      // Animation track defaults to frame 0
      expect(controller.getState().frameIndex).toBe(0);
      expect(controller.getState().fps).toBe(8);

      controller.play();
      expect(controller.getState().isPlaying).toBe(true);

      controller.pause();
      expect(controller.getState().isPlaying).toBe(false);

      controller.togglePlay();
      expect(controller.getState().isPlaying).toBe(true);

      controller.togglePlay();
      expect(controller.getState().isPlaying).toBe(false);

      controller.setFps(24);
      expect(controller.getState().fps).toBe(24);

      // FPS clamped to 1..60
      controller.setFps(100);
      expect(controller.getState().fps).toBe(60);
      controller.setFps(-5);
      expect(controller.getState().fps).toBe(1);

      expect(stateChanges).toBeGreaterThan(0);
      expect(frameChanges).toBeGreaterThan(0);

      controller.dispose();
    });

    it('counts solid voxels and computes frame meshes lazily', () => {
      const palette = {
        B: { color: '#000000', hidden: false },
        W: { color: '#ffffff', hidden: false },
        H: { color: '#888888', hidden: true },
      };
      const cells = new Uint8Array([0, 1, 2, 3]); // 0=air, 1=B, 2=W, 3=H(hidden)
      const alphabet = ['.', 'B', 'W', 'H'];

      const count = countSolidVoxels(cells, alphabet, palette);
      // B and W are solid & visible; 0 is air; H is hidden
      expect(count).toBe(2);

      const frame: PlaybackFrame = {
        index: 0,
        step: 0,
        label: 'Test',
        grid: {
          X: 2,
          Y: 2,
          Z: 1,
          cells,
          alphabet,
          solidCount: count,
        },
      };

      const mesh = getOrComputeFrameMesh(frame, palette, 20);
      expect(mesh).toBeDefined();
      expect(mesh.positions.length).toBeGreaterThan(0);
      expect(frame.mesh).toBe(mesh); // Cached
    });
  });
});

