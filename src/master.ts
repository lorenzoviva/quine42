// The master's tools (T41): what a client needs only beyond the simulation, or to make the world. The corona and
// the studio drawn in 3D, the studio's panels, the atlas, the world's graph, the Council's feed, the console, the
// editor and the Genesis. main.ts loads this module on demand (a chunk of its own in the build) only for the
// master: alone, always; in a game of many, the wanderer who made the universe. A player's client never fetches it.

import type { Kernel } from './kernel/kernel';
import type { Renderer } from './render/renderer';
import { CoronaView } from './render/coronaview';
import { Editor } from './ui/editor';
import { Console } from './ui/console';
import { FeedPanel } from './ui/feed';
import { GenesisScreen } from './ui/genesis';
import { StudioPanel } from './ui/studio';
import { AtlasPanel } from './ui/atlas';
import { GraphPanel } from './ui/graph';
import { $ } from './ui/dom';

export class MasterTools {
  readonly editor: Editor;
  readonly konsole: Console;
  readonly feed: FeedPanel;
  readonly genesis: GenesisScreen;
  readonly studio: StudioPanel;
  readonly atlas: AtlasPanel;
  readonly graph: GraphPanel;

  /** `onFocus`: a window opened or closed (the keys go to the world only when none is open). */
  constructor(
    private kernel: Kernel,
    renderer: Renderer,
    dev: boolean,
    onFocus: () => void,
  ) {
    renderer.useCorona(new CoronaView(kernel));
    this.editor = new Editor(kernel);
    this.konsole = new Console(kernel);
    this.feed = new FeedPanel($('#hud'), kernel);
    this.genesis = new GenesisScreen(kernel);
    this.studio = new StudioPanel(kernel);
    this.atlas = new AtlasPanel(kernel);
    this.graph = new GraphPanel(kernel);
    this.konsole.dev = dev;
    for (const w of [this.editor, this.konsole, this.studio, this.atlas, this.graph]) w.onClose = onFocus;
    const edit = (path: string, line?: number) => {
      this.editor.open(path, line);
      onFocus();
    };
    this.graph.onEdit = (path) => {
      this.graph.close();
      edit(path);
    };
    this.konsole.onEdit = (path) => {
      this.konsole.close();
      edit(path);
    };
    this.studio.onEdit = (path) => edit(path);
    kernel.bus.on('ui:edit', ({ path, line }) => edit(path, line));
  }

  /** Whether one of the master's windows holds the keys. */
  get isOpen(): boolean {
    return this.editor.isOpen || this.konsole.isOpen || this.genesis.isOpen || this.studio.isOpen || this.atlas.isOpen || this.graph.isOpen;
  }

  /** The Genesis: generation waits for it, the windows hold the keys meanwhile. */
  async runGenesis(online: boolean, onFocus: () => void): Promise<void> {
    this.kernel.generationHeld = true;
    onFocus();
    await this.genesis.show(online);
    this.kernel.generationHeld = false;
    onFocus();
  }
}
