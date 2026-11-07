import * as THREE from 'three';

/**
 * The GPU the drawing asks for (T330): on a laptop with two GPUs the browser may otherwise pick the integrated one.
 * Every `THREE.WebGLRenderer` of the game, the lab and the site is made by `makeRenderer`, which reads it from here
 * (`tests/gpu.test.ts` reads the sources).
 */
export const GPU_PREFERENCE: WebGLPowerPreference = 'high-performance';

/** A WebGL renderer with the preferred GPU; the caller's parameters win on everything else. */
export function makeRenderer(params: THREE.WebGLRendererParameters = {}): THREE.WebGLRenderer {
  return new THREE.WebGLRenderer({ ...params, powerPreference: GPU_PREFERENCE });
}

/**
 * The GPU in use, as the browser names it (`WEBGL_debug_renderer_info`), or `undefined` when it does not say.
 * It stays in the client: nothing sends it to the server.
 */
export function gpuName(gl: THREE.WebGLRenderer | WebGLRenderingContext | WebGL2RenderingContext): string | undefined {
  try {
    const ctx = gl instanceof THREE.WebGLRenderer ? gl.getContext() : gl;
    const info = ctx.getExtension('WEBGL_debug_renderer_info');
    const name = info ? ctx.getParameter(info.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER);
    return typeof name === 'string' && name ? name : undefined;
  } catch {
    return undefined;
  }
}
