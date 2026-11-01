// Runs the cards' programs off the page's thread (T104): a program may take seconds and the gallery must not stutter.

import type { FormRequest } from '../src/kernel/forms';
import { cardPicture } from './carte-art';

self.onmessage = (ev: MessageEvent<{ id: number; req: FormRequest }>) => {
  const { id, req } = ev.data;
  try {
    const { w, h, data } = cardPicture(req);
    (self as unknown as Worker).postMessage({ id, w, h, data }, [data.buffer]);
  } catch {
    // A program that does not run leaves the card with its gem.
    (self as unknown as Worker).postMessage({ id });
  }
};
