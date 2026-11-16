// Helpers for the pipeline web page (T399): rewrite a container only when its HTML/text/value changes, and when it
// changes preserve the scroll of every scrollable container (self, ancestors, page, keyed descendants) as well as the
// focus, value, and selection of the active form field. `web.mjs` injects these functions via `toString()`, so they must
// stay self-contained and reference no module-level variables.

/** Captures scroll offsets of `el` (unless `skipSelf`), all ancestor elements, the document root/window, and `[data-scroll-key]` descendants. */
export function captureScroll(el, opts = {}) {
  const doc = el?.ownerDocument;
  const scrollers = [];
  const seen = new Set();
  const push = (node) => {
    if (!node || seen.has(node)) return;
    seen.add(node);
    scrollers.push({ node, top: node.scrollTop ?? 0, left: node.scrollLeft ?? 0 });
  };
  if (!opts.skipSelf) push(el);
  let p = el?.parentElement;
  while (p) {
    push(p);
    p = p.parentElement;
  }
  const root = doc?.scrollingElement || doc?.documentElement;
  push(root);

  const win = doc?.defaultView;
  const winPos = win && typeof win.scrollX === 'number' && typeof win.scrollY === 'number'
    ? { x: win.scrollX, y: win.scrollY }
    : null;

  const descendants = new Map();
  if (typeof el?.querySelectorAll === 'function') {
    for (const d of el.querySelectorAll('[data-scroll-key]')) {
      const k = d.getAttribute?.('data-scroll-key') ?? d.dataset?.scrollKey;
      if (k) descendants.set(k, { top: d.scrollTop ?? 0, left: d.scrollLeft ?? 0 });
    }
  }
  return { scrollers, winPos, descendants };
}

/** Restores scroll offsets captured by `captureScroll`, or scrolls `el` to the bottom when `scrollToBottom` is set. */
export function restoreScroll(el, snapshot, opts = {}) {
  if (!snapshot) return;
  if (opts.scrollToBottom && el) {
    el.scrollTop = el.scrollHeight ?? 0;
  }
  for (const s of snapshot.scrollers || []) {
    if (s.node.scrollTop !== s.top) s.node.scrollTop = s.top;
    if (s.node.scrollLeft !== s.left) s.node.scrollLeft = s.left;
  }
  if (snapshot.winPos) {
    const win = el?.ownerDocument?.defaultView;
    if (win && typeof win.scrollTo === 'function' && (win.scrollX !== snapshot.winPos.x || win.scrollY !== snapshot.winPos.y)) {
      win.scrollTo(snapshot.winPos.x, snapshot.winPos.y);
    }
  }
  if (snapshot.descendants?.size && typeof el?.querySelectorAll === 'function') {
    for (const d of el.querySelectorAll('[data-scroll-key]')) {
      const k = d.getAttribute?.('data-scroll-key') ?? d.dataset?.scrollKey;
      const pos = k ? snapshot.descendants.get(k) : undefined;
      if (!pos) continue;
      if (d.scrollTop !== pos.top) d.scrollTop = pos.top;
      if (d.scrollLeft !== pos.left) d.scrollLeft = pos.left;
    }
  }
}

/**
 * Replaces `el.innerHTML` only when `html` differs from `el.dataset.shown`.
 * Preserves focus/value/selection inside `el` and scroll positions of `el`, ancestors, page, and `[data-scroll-key]`
 * descendants. With `stickToBottom`, keeps `el` pinned to the bottom only if it was already near the bottom before
 * the update; otherwise preserves `el.scrollTop`. Returns true if the DOM was updated.
 */
export function patchHtml(el, html, opts = {}) {
  if (!el) return false;
  const next = String(html ?? '');
  const data = el.dataset || (el.dataset = {});
  if (data.shown === next) return false;

  const threshold = typeof opts.bottomThreshold === 'number' ? opts.bottomThreshold : 60;
  const wasAtBottom = Boolean(
    opts.stickToBottom &&
    ((el.scrollHeight ?? 0) - (el.scrollTop ?? 0) - (el.clientHeight ?? 0) < threshold)
  );

  const doc = el.ownerDocument;
  const active = doc?.activeElement;
  let focusState = null;
  if (active && active !== el && typeof el.contains === 'function' && el.contains(active)) {
    const key = active.getAttribute?.('data-focus-key') || active.dataset?.focusKey || '';
    const id = active.id || '';
    if (id || key) {
      focusState = {
        id,
        key,
        tag: active.tagName,
        value: 'value' in active ? active.value : undefined,
        checked: active.type === 'checkbox' || active.type === 'radio' ? active.checked : undefined,
        scrollTop: active.scrollTop,
        scrollLeft: active.scrollLeft,
        selStart: undefined,
        selEnd: undefined,
        selDir: undefined,
      };
      try {
        if (typeof active.selectionStart === 'number') {
          focusState.selStart = active.selectionStart;
          focusState.selEnd = active.selectionEnd;
          focusState.selDir = active.selectionDirection;
        }
      } catch { /* input types like number or checkbox throw on selectionStart */ }
    }
  }

  const snap = captureScroll(el, { skipSelf: wasAtBottom });
  el.innerHTML = next;
  data.shown = next;

  if (focusState) {
    let target = null;
    if (focusState.id && typeof doc?.getElementById === 'function') {
      const byId = doc.getElementById(focusState.id);
      if (byId && el.contains(byId)) target = byId;
    }
    if (!target && typeof el.querySelector === 'function') {
      const escAttr = (v) => String(v).replace(/["\\]/g, '\\$&');
      target = focusState.id
        ? el.querySelector(`[id="${escAttr(focusState.id)}"]`)
        : el.querySelector(`[data-focus-key="${escAttr(focusState.key)}"]`);
    }
    if (target) {
      if (focusState.value !== undefined && 'value' in target && target.tagName === focusState.tag) {
        target.value = focusState.value;
      }
      if (focusState.checked !== undefined && 'checked' in target) {
        target.checked = focusState.checked;
      }
      if (typeof target.focus === 'function') {
        try { target.focus({ preventScroll: true }); } catch { target.focus(); }
      }
      if (focusState.selStart !== undefined && typeof target.setSelectionRange === 'function') {
        try { target.setSelectionRange(focusState.selStart, focusState.selEnd, focusState.selDir || 'none'); } catch { /* ignore */ }
      }
      if (typeof focusState.scrollTop === 'number' && target.scrollTop !== focusState.scrollTop) target.scrollTop = focusState.scrollTop;
      if (typeof focusState.scrollLeft === 'number' && target.scrollLeft !== focusState.scrollLeft) target.scrollLeft = focusState.scrollLeft;
    }
  }

  restoreScroll(el, snap, { scrollToBottom: wasAtBottom });
  return true;
}

/** Replaces `el.textContent` only when it differs, preserving scroll of `el`, ancestors, and page. */
export function patchText(el, text) {
  if (!el) return false;
  const next = String(text ?? '');
  if (el.textContent === next) return false;
  const snap = captureScroll(el);
  el.textContent = next;
  restoreScroll(el, snap);
  return true;
}

/** Updates a form field's `.value` only when it differs (and not while focused unless `force`), preserving scroll. */
export function patchValue(el, nextValue, opts = {}) {
  if (!el) return false;
  const val = String(nextValue ?? '');
  if (el.value === val) return false;
  const doc = el.ownerDocument;
  const isFocused = Boolean(doc && doc.activeElement === el);
  if (isFocused && !opts.force) return false;
  const snap = captureScroll(el);
  const top = el.scrollTop ?? 0;
  const left = el.scrollLeft ?? 0;
  el.value = val;
  if (typeof el.scrollTop === 'number' && el.scrollTop !== top) el.scrollTop = top;
  if (typeof el.scrollLeft === 'number' && el.scrollLeft !== left) el.scrollLeft = left;
  restoreScroll(el, snap);
  return true;
}
