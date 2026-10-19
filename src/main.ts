import wasmUri from 'wasmoon/dist/glue.wasm?url';
import { Kernel } from './kernel/kernel';
import { bundledFiles } from './kernel/bundle';
import { localStore } from './kernel/repo';
import { MockProvider } from './kernel/gateway/mock';
import { Renderer } from './render/renderer';
import { Hud } from './ui/hud';
import { Editor } from './ui/editor';
import { Console } from './ui/console';
import { Sfx } from './audio';
import { $ } from './ui/dom';
import './style.css';

const DT = 1 / 60;
const dev = import.meta.env.DEV || new URLSearchParams(location.search).has('dev');

async function main() {
  const kernel = await Kernel.boot({ files: bundledFiles, store: localStore, provider: new MockProvider(), wasmUri });
  const renderer = new Renderer($<HTMLCanvasElement>('#world'), kernel);
  const hud = new Hud(kernel, renderer);
  const editor = new Editor(kernel);
  const konsole = new Console(kernel);
  const sfx = new Sfx();
  konsole.dev = dev;
  (window as any).rune = kernel;

  const syncFocus = () => {
    kernel.input.enabled = !editor.isOpen && !konsole.isOpen;
    if (!kernel.input.enabled) kernel.input.releaseAll();
  };
  editor.onClose = syncFocus;
  konsole.onClose = syncFocus;
  konsole.onEdit = (path) => {
    konsole.close();
    editor.open(path);
    syncFocus();
  };
  kernel.bus.on('ui:edit', ({ path, line }) => {
    editor.open(path, line);
    syncFocus();
  });

  kernel.input.attach(window);
  kernel.input.onAny = () => sfx.unlock();
  const intro = $('#intro');
  const help = $('#help');
  const startGame = () => {
    if (intro.hidden) return;
    intro.classList.add('out');
    setTimeout(() => (intro.hidden = true), 700);
    sfx.unlock();
    sfx.chord([220, 330, 440]);
  };
  window.addEventListener('keydown', startGame);
  intro.addEventListener('click', startGame);
  const params = new URLSearchParams(location.search);
  if (params.has('skip')) intro.hidden = true;
  // Dev: ?dev&teleport=46,0 stops the carpet and drops you at real coordinates (e.g. in the corona).
  const tp = dev && params.get('teleport')?.split(',').map(Number);
  if (tp && tp.length === 2 && tp.every(Number.isFinite)) {
    kernel.carpet()!.active = false;
    Object.assign(kernel.playerPos(), { x: tp[0], y: tp[1] });
  }

  kernel.bus.on('rune:picked', () => sfx.blip(660, 0.07));
  kernel.bus.on('rune:inscribed', () => sfx.chord([440, 554, 659], 0.25));
  kernel.bus.on('fault', ({ isNew }) => isNew && sfx.noise(0.3));
  kernel.bus.on('rollback', () => sfx.chord([660, 440, 330], 0.3));
  kernel.bus.on('zone', ({ zone }) => zone === 'corona' && sfx.chord([196, 294, 392, 587], 1.2));

  const handle = (a: string) => {
    switch (a) {
      case 'interact':
        hud.hideDialog();
        void kernel.interact();
        break;
      case 'inscribe':
        kernel.inscribeHand();
        break;
      case 'drop':
        kernel.dropSelected();
        break;
      case 'rollback':
        kernel.rollback();
        break;
      case 'prev':
        kernel.select(-1);
        break;
      case 'next':
        kernel.select(1);
        break;
      case 'movePrev':
        kernel.select(-1, true);
        break;
      case 'moveNext':
        kernel.select(1, true);
        break;
      case 'help':
        help.hidden = !help.hidden;
        break;
      case 'console':
        if (!editor.isOpen) konsole.toggle();
        syncFocus();
        break;
      case 'escape':
        if (editor.isOpen) editor.close();
        else if (konsole.isOpen) konsole.close();
        else if (!help.hidden) help.hidden = true;
        else hud.hideDialog();
        syncFocus();
        break;
    }
  };

  window.addEventListener('wheel', (e) => kernel.input.enabled && kernel.select(e.deltaY > 0 ? 1 : -1), { passive: true });

  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const a of kernel.input.drain()) handle(a);
    acc += elapsed;
    let steps = 0;
    while (acc >= DT && steps < 4) {
      kernel.tick(DT);
      acc -= DT;
      steps++;
    }
    if (steps === 4) acc = 0;
    renderer.render(elapsed);
    hud.update(elapsed);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  $('#loading').hidden = true;

  if (import.meta.hot) {
    import.meta.hot.accept('./kernel/bundle', (mod) => {
      if (mod) kernel.syncFromDisk(mod.bundledFiles);
    });
  }
}

main().catch((e) => {
  console.error(e);
  $('#loading').textContent = `KERNEL PANIC: ${(e as Error).message}`;
});
