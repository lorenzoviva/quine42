import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  extractLineFromError,
  highlightXml,
  validateMjx,
  getContrastColor,
  COLOR_ATTRS,
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
  getShapeVoxelBounds,
  moveShapesInXml,
  deleteShapesFromXml,
  duplicateShapesInXml,
  doubleDefinitionInXml,
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
import {
  generateRuleXml,
  getPaletteSymbols,
  insertRuleIntoXmlAt,
  insertRuleAtEndOfSequence,
  type RuleBlockConfig,
} from '../lab/editor/rules';
import {
  WFC_PRESETS,
  generateWfcXml,
  type WfcConfig,
} from '../lab/editor/wfc';

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

  describe('MarkovJunior Rule & WFC Tools (T59d)', () => {
    describe('rules & substitution generator', () => {
      it('generates a concise single rule line for <all>', () => {
        const config: RuleBlockConfig = {
          type: 'all',
          steps: 4,
          symmetry: '(xy)',
          rules: [{ in: 'B', out: 'W' }],
        };
        const xml = generateRuleXml(config);
        expect(xml.trim()).toBe('<all in="B" out="W" steps="4" symmetry="(xy)"/>');
      });

      it('generates a block form with child <rule> elements for multiple rules', () => {
        const config: RuleBlockConfig = {
          type: 'prl',
          steps: 2,
          p: 0.5,
          symmetry: '(xy)',
          rules: [
            { in: 'P', out: 'S', p: 0.15 },
            { in: 'P', out: 'D', p: 0.1, comment: 'pietra scura' },
          ],
          comment: 'Sfumature pietra',
        };
        const xml = generateRuleXml(config);
        expect(xml).toContain('<!-- Sfumature pietra -->');
        expect(xml).toContain('<prl steps="2" p="0.5" symmetry="(xy)">');
        expect(xml).toContain('<rule in="P" out="S" p="0.15"/>');
        expect(xml).toContain('<rule in="P" out="D" p="0.1"/> <!-- pietra scura -->');
        expect(xml).toContain('</prl>');
      });

      it('generates a <one> rule block with weights', () => {
        const config: RuleBlockConfig = {
          type: 'one',
          steps: 10,
          rules: [
            { in: '0', out: 'R', p: 0.8 },
            { in: '0', out: 'G', p: 0.2 },
          ],
        };
        const xml = generateRuleXml(config);
        expect(xml).toContain('<one steps="10">');
        expect(xml).toContain('<rule in="0" out="R" p="0.8"/>');
        expect(xml).toContain('<rule in="0" out="G" p="0.2"/>');
        expect(xml).toContain('</one>');
      });

      it('returns empty string if all rules are blank', () => {
        const config: RuleBlockConfig = {
          type: 'all',
          rules: [{ in: '', out: '' }, { in: '   ', out: '  ' }],
        };
        const xml = generateRuleXml(config);
        expect(xml).toBe('');
      });

      it('extracts palette symbols accurately from XML', () => {
        const sampleXml = `
<sequence values="0BGY" size="10 10 10">
  <color symbol="B" value="1a1e2e" name="nero"/>
  <color symbol="G" value="00e436" name="verde" glow="True"/>
</sequence>`;
        const symbols = getPaletteSymbols(sampleXml);
        expect(symbols.length).toBeGreaterThanOrEqual(4);

        const bSym = symbols.find((s) => s.symbol === 'B');
        expect(bSym).toBeDefined();
        expect(bSym?.color).toBe('#1a1e2e');
        expect(bSym?.name).toBe('nero');

        const gSym = symbols.find((s) => s.symbol === 'G');
        expect(gSym).toBeDefined();
        expect(gSym?.glow).toBe(true);

        const ySym = symbols.find((s) => s.symbol === 'Y');
        expect(ySym).toBeDefined();
      });

      it('inserts rule into XML at cursor position with clean newlines', () => {
        const xml = '<sequence values="BW" size="4 4 4">\n  <box at="2 2 0" size="2 2 2" color="B"/>\n</sequence>';
        const ruleXml = '  <all in="B" out="W"/>';
        const cursor = xml.indexOf('</sequence>');

        const res = insertRuleIntoXmlAt(xml, ruleXml, cursor);
        expect(res.newXml).toContain('  <box at="2 2 0" size="2 2 2" color="B"/>\n  <all in="B" out="W"/>\n</sequence>');
        expect(res.newCursor).toBeGreaterThan(cursor);
      });

      it('inserts rule at the end of root sequence or markov tag', () => {
        const xml = '<sequence values="BW" size="4 4 4">\n  <box at="2 2 0" size="2 2 2" color="B"/>\n</sequence>';
        const ruleXml = '  <prl in="B" out="W" p="0.5"/>';

        const res = insertRuleAtEndOfSequence(xml, ruleXml);
        expect(res.newXml).toContain('<prl in="B" out="W" p="0.5"/>\n</sequence>');
      });

      it('produces valid XML that passes validateMjx', () => {
        const baseXml = '<sequence values="0BW" size="6 6 6">\n  <box at="3 3 0" size="4 4 4" color="B"/>\n</sequence>';
        const ruleXml = generateRuleXml({
          type: 'all',
          steps: 2,
          symmetry: '(xy)',
          rules: [{ in: 'B', out: 'W' }],
        });

        const res = insertRuleAtEndOfSequence(baseXml, ruleXml);
        const val = validateMjx(res.newXml);
        expect(val.ok).toBe(true);
      });
    });

    describe('WFC guided configuration & generation', () => {
      it('has predefined presets with valid metadata', () => {
        expect(WFC_PRESETS.length).toBeGreaterThanOrEqual(5);
        const presetIds = WFC_PRESETS.map((p) => p.id);
        expect(presetIds).toContain('pipes');
        expect(presetIds).toContain('maze');
        expect(presetIds).toContain('castle');
        expect(presetIds).toContain('dungeon');
        expect(presetIds).toContain('islands');

        for (const p of WFC_PRESETS) {
          expect(p.name).toBeTruthy();
          expect(p.tiles.length).toBeGreaterThanOrEqual(3);
          expect(p.size.length).toBe(3);
          expect(p.nativeMjXml).toContain('<sequence');
        }
      });

      it('generates standard WFC specification XML', () => {
        const config: WfcConfig = {
          presetId: 'pipes',
          mode: 'wfc_standard',
          size: [16, 16, 16],
          periodic: true,
          symmetry: '(xyz+)',
          tiles: [
            { name: 'Aria', symbol: 'B', color: '#000000', weight: 5 },
            { name: 'Tubo', symbol: 'R', color: '#ff0000', weight: 2 },
          ],
          comment: 'WFC Tubi 3D',
        };

        const xml = generateWfcXml(config);
        expect(xml).toContain('<!-- WFC Tubi 3D -->');
        expect(xml).toContain('<wfc sample="PIPES3D" size="16 16 16" n="2" periodic="True" symmetry="(xyz+)">');
        expect(xml).toContain('weight="5"');
        expect(xml).toContain('weight="2"');
        expect(xml).toContain('</wfc>');
      });

      it('generates native MarkovJunior model from preset that compiles and runs in runMjx', () => {
        for (const preset of WFC_PRESETS) {
          const config: WfcConfig = {
            presetId: preset.id,
            mode: 'mj_native',
            size: preset.size,
            periodic: preset.periodic,
            symmetry: preset.symmetry,
            tiles: preset.tiles,
          };

          const xml = generateWfcXml(config);
          expect(xml).toContain('<sequence');

          // Validate compilation
          const val = validateMjx(xml);
          expect(val.ok).toBe(true);

          if (val.ok) {
            // Test execution
            const runRes = runMjx(val.model, 1);
            expect(runRes.grid).toBeDefined();
            expect(runRes.grid.cells.length).toBeGreaterThan(0);
          }
        }
      });

      it('generates custom native MarkovJunior constraint model when no preset id is given', () => {
        const config: WfcConfig = {
          mode: 'mj_native',
          size: [8, 8, 8],
          periodic: false,
          symmetry: '(xy)',
          tiles: [
            { name: 'Pavimento', symbol: 'F', color: '#444444' },
            { name: 'Muro', symbol: 'W', color: '#888888' },
          ],
          comment: 'Custom room',
        };

        const xml = generateWfcXml(config);
        expect(xml).toContain('<!-- Custom room -->');
        expect(xml).toContain('<sequence values="0FW" size="8 8 8" symmetry="(xy)">');
        expect(xml).toContain('<color symbol="F" value="444444" name="pavimento"/>');
        expect(xml).toContain('<color symbol="W" value="888888" name="muro"/>');

        const val = validateMjx(xml);
        expect(val.ok).toBe(true);
      });

      it('recognizes WFC tags and attributes in syntax highlighter', () => {
        expect(MJ_NODES.has('wfc')).toBe(true);
        expect(MJ_NODES.has('tileset')).toBe(true);
        expect(MJ_NODES.has('tile')).toBe(true);
        expect(MJ_NODES.has('overlapping')).toBe(true);

        expect(MJ_ATTRS.has('sample')).toBe(true);
        expect(MJ_ATTRS.has('tilesize')).toBe(true);
        expect(MJ_ATTRS.has('periodic')).toBe(true);
        expect(MJ_ATTRS.has('weight')).toBe(true);

        const wfcXml = '<wfc sample="Test" size="10 10 10" periodic="True"/>';
        const html = highlightXml(wfcXml);
        expect(html).toContain('<span class="tok-tag tok-mj-node">wfc</span>');
        expect(html).toContain('<span class="tok-attr tok-mj-attr">sample</span>');
        expect(html).toContain('<span class="tok-attr tok-mj-attr">periodic</span>');
      });
    });

    describe('XML Editor Color Chips & Palette Interaction', () => {
      it('calculates high contrast foreground color for hex background', () => {
        expect(getContrastColor('#ffffff')).toBe('#0c0e14'); // light -> dark
        expect(getContrastColor('#000000')).toBe('#ffffff'); // dark -> light
        expect(getContrastColor('#ffec27')).toBe('#0c0e14'); // yellow -> dark
        expect(getContrastColor('#1d2b53')).toBe('#ffffff'); // dark indigo -> white
      });

      it('recognizes color attribute names', () => {
        expect(COLOR_ATTRS.has('color')).toBe(true);
        expect(COLOR_ATTRS.has('on')).toBe(true);
        expect(COLOR_ATTRS.has('values')).toBe(true);
        expect(COLOR_ATTRS.has('in')).toBe(true);
        expect(COLOR_ATTRS.has('out')).toBe(true);
        expect(COLOR_ATTRS.has('symbol')).toBe(true);
      });

      it('generates colored chips with exact character offsets in highlightXml with colorChips', () => {
        const xml = '<box color="G" size="4 4 4"/>';
        const html = highlightXml(xml, { colorChips: true });

        expect(html).toContain('tok-color-chip');
        expect(html).toContain('data-letter="G"');
        expect(html).toContain('data-attr="color"');

        // Verify exact offset
        const posMatch = /data-pos="(\d+)"/.exec(html);
        expect(posMatch).not.toBeNull();
        const offset = parseInt(posMatch![1], 10);
        expect(xml[offset]).toBe('G');
        expect(xml.slice(0, offset)).toBe('<box color="');
      });

      it('supports custom palette colors and glow class in highlightXml', () => {
        const xml = '<color symbol="K" value="ff00aa" glow="true"/>\n<box color="K"/>';
        const customPalette = {
          K: { color: '#ff00aa', name: 'CustomPink', glow: true },
        };
        const html = highlightXml(xml, { colorChips: true, palette: customPalette });

        expect(html).toContain('--chip-bg:#ff00aa');
        expect(html).toContain('tok-glow');
        expect(html).toContain('data-letter="K"');
      });

      it('renders wildcard (*) and air (.) chips in rules', () => {
        const xml = '<rule in="*G." out="W*B"/>';
        const html = highlightXml(xml, { colorChips: true });

        expect(html).toContain('tok-wildcard');
        expect(html).toContain('data-letter="*"');
        expect(html).toContain('tok-air');
        expect(html).toContain('data-letter="."');
      });

      it('allows replacing character at data-pos to modify color in XML', () => {
        const xml = '<sequence values="BGW"><box color="B"/></sequence>';
        const html = highlightXml(xml, { colorChips: true });

        // Find chip for color="B" in box
        const matches = [...html.matchAll(/data-letter="B"[^>]*data-pos="(\d+)"/g)];
        expect(matches.length).toBeGreaterThan(0);
        const lastMatch = matches[matches.length - 1];
        const offset = parseInt(lastMatch[1], 10);

        expect(xml[offset]).toBe('B');
        const updated = xml.slice(0, offset) + 'G' + xml.slice(offset + 1);
        expect(updated).toBe('<sequence values="BGW"><box color="G"/></sequence>');
      });

      it('resolves palette symbols combining custom colors and values', () => {
        const xml = `<sequence values="0BWG" size="10 10 10">
          <color symbol="N" value="8b5a2b" name="Legno"/>
          <box color="N"/>
        </sequence>`;

        const symbols = getPaletteSymbols(xml);
        const symMap = new Map(symbols.map((s) => [s.symbol, s]));

        expect(symMap.has('N')).toBe(true);
        expect(symMap.get('N')?.color).toBe('#8b5a2b');
        expect(symMap.get('N')?.name).toBe('Legno');

        expect(symMap.has('G')).toBe(true);
        expect(symMap.has('W')).toBe(true);
        expect(symMap.has('B')).toBe(true);
      });
    });

    describe('CAD Advanced: Glass, Raycasting Bounds, Multi-Selection & Double Definition', () => {
      it('parses translucent glass colors with alpha/opacity', () => {
        const xml = `<sequence values="0VG">
          <color symbol="V" value="88ccff" glass="true" name="Vetro"/>
          <color symbol="T" value="ffffff" alpha="0.3"/>
        </sequence>`;

        const colors = parseColorsFromXml(xml);
        expect(colors.V?.alpha).toBeCloseTo(0.45);
        expect(colors.T?.alpha).toBeCloseTo(0.3);

        const updated = setLetterColorInXml(xml, 'V', { glass: true });
        expect(updated).toContain('alpha="0.45"');
      });

      it('computes exact integer voxel bounds with zero half-voxel offset', () => {
        // A single voxel box at (5, 5, 0) with size (1, 1, 1)
        const box1: CadShape = {
          id: 1,
          kind: 'box',
          at: [5, 5, 0],
          size: [1, 1, 1],
          color: 'G',
          line: 2,
          startIndex: 0,
          endIndex: 10,
        };
        const b1 = getShapeVoxelBounds(box1);
        expect(b1.minX).toBe(5);
        expect(b1.maxX).toBe(5);
        expect(b1.minY).toBe(5);
        expect(b1.maxY).toBe(5);
        expect(b1.minZ).toBe(0);
        expect(b1.maxZ).toBe(0);

        // A 3x3x2 box at center (4, 4, 1)
        const box2: CadShape = {
          id: 2,
          kind: 'box',
          at: [4, 4, 1],
          size: [3, 3, 2],
          color: 'B',
          line: 3,
          startIndex: 11,
          endIndex: 20,
        };
        const b2 = getShapeVoxelBounds(box2);
        // x spans 4 - 1 to 4 + 1 = 3 to 5
        expect(b2.minX).toBe(3);
        expect(b2.maxX).toBe(5);
        expect(b2.minY).toBe(3);
        expect(b2.maxY).toBe(5);
        expect(b2.minZ).toBe(1);
        expect(b2.maxZ).toBe(2);
      });

      it('threeToVoxel uses floor so points inside voxel span map to the correct voxel', () => {
        const grid = { X: 12, Y: 12, Z: 12 };
        const vpt = 20;
        const s = 1 / vpt; // 0.05
        const px = 6;
        const py = 6;

        // Voxel x=5 spans Three.js X [(5 - 6)*0.05, (6 - 6)*0.05] = [-0.05, 0.0]
        // Center of voxel 5 is at Three.js X = (5.5 - 6)*0.05 = -0.025
        const insideVoxel5 = threeToVoxel([-0.025, 0.025, -0.025], grid, vpt);
        expect(insideVoxel5[0]).toBe(5);
        expect(insideVoxel5[1]).toBe(5);
        expect(insideVoxel5[2]).toBe(0);
      });

      it('moves multiple shapes together in XML without index shifting bugs', () => {
        const xml = `<sequence values="0RGB">
  <box at="2 3 0" size="1 1 1" color="R"/>
  <box at="4 5 1" size="2 2 2" color="G"/>
  <box at="6 7 2" size="3 3 3" color="B"/>
</sequence>`;

        // Move shapes 0 and 2 by (+1, -1, +2)
        const moved = moveShapesInXml(xml, [0, 2], [1, -1, 2]);
        const shapes = parseShapesFromXml(moved);

        expect(shapes[0].at).toEqual([3, 2, 2]);
        expect(shapes[1].at).toEqual([4, 5, 1]); // Untouched
        expect(shapes[2].at).toEqual([7, 6, 4]);
      });

      it('deletes and duplicates multiple shapes cleanly', () => {
        const xml = `<sequence values="0RGB">
  <box at="2 3 0" size="1 1 1" color="R"/>
  <box at="4 5 1" size="2 2 2" color="G"/>
  <box at="6 7 2" size="3 3 3" color="B"/>
</sequence>`;

        const deleted = deleteShapesFromXml(xml, [0, 2]);
        const shapesAfterDel = parseShapesFromXml(deleted);
        expect(shapesAfterDel.length).toBe(1);
        expect(shapesAfterDel[0].color).toBe('G');

        const { newXml, newIndices } = duplicateShapesInXml(xml, [0, 1], [0, 0, 5]);
        const shapesAfterDup = parseShapesFromXml(newXml);
        expect(shapesAfterDup.length).toBe(5);
        expect(newIndices.length).toBe(2);
        expect(shapesAfterDup[newIndices[0]].at).toEqual([2, 3, 5]);
        expect(shapesAfterDup[newIndices[1]].at).toEqual([4, 5, 6]);
      });

      it('doubles definition (8x volume: 2x in X, Y, Z) leaving rules untouched', () => {
        const xml = `<sequence values="0w" size="9 9 9">
  <!-- Static CAD shapes -->
  <box at="4 4 0" size="1 1 1" color="w"/>
  <cylinder at="4 4 2" size="3 3 4" color="w"/>
  <!-- Generative rules -->
  <one steps="5">
    <rule in="w" out="0"/>
  </one>
</sequence>`;

        const doubled = doubleDefinitionInXml(xml);

        // Size doubled
        expect(doubled).toContain('size="18 18 18"');

        // Static shapes doubled:
        // box at cx=4, cy=4, bz=0 with w=1, d=1, h=1:
        // new cx = 2*4 + 0.5 = 8.5, new cy = 8.5, new bz = 0
        // new size = 2 2 2
        expect(doubled).toContain('<box at="8.5 8.5 0" size="2 2 2" color="w"/>');

        // cylinder at cx=4, cy=4, bz=2 with w=3, d=3, h=4:
        // new cx = 8.5, new cy = 8.5, new bz = 4
        // new size = 6 6 8
        expect(doubled).toContain('<cylinder at="8.5 8.5 4" size="6 6 8" color="w"/>');

        // Generative rules completely intact
        expect(doubled).toContain('<one steps="5">');
        expect(doubled).toContain('<rule in="w" out="0"/>');
      });
    });
  });
});


