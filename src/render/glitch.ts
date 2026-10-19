// Glitch as aesthetics: when the universe breaks, the screen tears, shifts and flickers.
// Intensity 0..1. Also used, very faintly, for the occasional "crack" of a healthy world.

export function applyGlitch(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, intensity: number, dpr: number): void {
  if (intensity <= 0.01) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Horizontal tearing.
  const slices = 1 + Math.floor(intensity * 14);
  for (let i = 0; i < slices; i++) {
    const y = Math.random() * h;
    const sh = (2 + Math.random() * 28 * intensity) * dpr;
    const dx = (Math.random() - 0.5) * 90 * intensity * dpr;
    ctx.drawImage(canvas, 0, y, w, sh, dx, y, w, sh);
  }

  // Chromatic ghost.
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.18 * intensity;
  ctx.drawImage(canvas, 3 * dpr * intensity, 0);
  ctx.globalAlpha = 0.12 * intensity;
  ctx.drawImage(canvas, -3 * dpr * intensity, 1 * dpr);

  // Scanlines.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.06 + 0.14 * intensity;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3 * dpr) ctx.fillRect(0, y, w, dpr);

  // Noise blocks.
  ctx.globalAlpha = 0.5 * intensity;
  const blocks = Math.floor(intensity * 10);
  for (let i = 0; i < blocks; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#ff2a6d' : '#05d9e8';
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 60 * dpr, (1 + Math.random() * 4) * dpr);
  }

  // Rare inversion flash.
  if (Math.random() < 0.025 * intensity) {
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

const NOISE = '#$%&@!?*+=<>/\\|{}[]01ΣΔλψ∂∑≠∞';
export const randomGlyph = () => NOISE[Math.floor(Math.random() * NOISE.length)];
