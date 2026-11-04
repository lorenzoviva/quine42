// The Markdown of the pipeline's web page (agents' messages, quadro, dossiers, questions), with no dependencies: the page
// gets these very functions through `toString()`, so they must use nothing from outside. Agents write the text: everything is
// escaped, no raw HTML passes, and only http(s) links become links.
export function markdownToHtml(source, { breaks = false } = {}) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const MAX_DEPTH = 12;

  const inline = (text) => {
    const held = [];
    const hold = (html) => `\u0000${held.push(html) - 1}\u0000`;
    let s = text.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, __, code) => hold(`<code>${esc(code)}</code>`));
    s = s.replace(/\[([^\]\n]+)\]\(([^()\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) =>
      /^https?:\/\//i.test(url) ? hold(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${inline(label)}</a>`) : hold(inline(label)));
    s = esc(s)
      .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<![\w*])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![\w*])/g, '<em>$1</em>')
      .replace(/(?<!\w)_(?=[^\s_])(.+?)(?<=[^\s_])_(?!\w)/g, '<em>$1</em>')
      .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, '<del>$1</del>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
  };

  /** The cells of a table row: a `|` inside backticks or after a backslash does not divide. */
  const cells = (line) => {
    const row = line.trim().replace(/^\|/, '');
    const out = [];
    let cell = '', code = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '\\' && row[i + 1] === '|') { cell += '|'; i++; }
      else if (c === '|' && !code) { out.push(cell.trim()); cell = ''; }
      else { if (c === '`') code = !code; cell += c; }
    }
    if (cell.trim()) out.push(cell.trim());
    return out;
  };

  const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
  const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
  const RULE = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
  const QUOTE = /^\s{0,3}>/;
  const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
  const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
  const isTable = (lines, i) => lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && lines[i + 1].includes('|') && SEPARATOR.test(lines[i + 1]);
  const starts = (lines, i) => FENCE.test(lines[i]) || HEADING.test(lines[i]) || RULE.test(lines[i]) || QUOTE.test(lines[i]) || ITEM.test(lines[i]) || isTable(lines, i);
  const indentOf = (line) => /^\s*/.exec(line)[0].length;

  const blocks = (lines, depth) => {
    if (depth > MAX_DEPTH) return `<p>${esc(lines.join(' '))}</p>`;
    let html = '';
    for (let i = 0; i < lines.length;) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const fence = FENCE.exec(line);
      if (fence) {
        const close = new RegExp(`^\\s{0,3}${fence[1][0]}{${fence[1].length},}\\s*$`);
        const body = [];
        for (i++; i < lines.length && !close.test(lines[i]); i++) body.push(lines[i]);
        i++;
        html += `<pre><code>${esc(body.join('\n'))}</code></pre>`;
        continue;
      }
      const heading = HEADING.exec(line);
      if (heading) { html += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`; i++; continue; }
      if (RULE.test(line)) { html += '<hr>'; i++; continue; }
      if (QUOTE.test(line)) {
        const inner = [];
        for (; i < lines.length && QUOTE.test(lines[i]); i++) inner.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
        html += `<blockquote>${blocks(inner, depth + 1)}</blockquote>`;
        continue;
      }
      if (isTable(lines, i)) {
        const head = cells(line);
        const aligns = cells(lines[i + 1]).map((c) => (c.endsWith(':') ? (c.startsWith(':') ? 'center' : 'right') : ''));
        const cell = (tag, c, n) => `<${tag}${aligns[n] ? ` style="text-align:${aligns[n]}"` : ''}>${inline(c)}</${tag}>`;
        html += `<table><thead><tr>${head.map((c, n) => cell('th', c, n)).join('')}</tr></thead><tbody>`;
        for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) html += `<tr>${cells(lines[i]).map((c, n) => cell('td', c, n)).join('')}</tr>`;
        html += '</tbody></table>';
        continue;
      }
      const first = ITEM.exec(line);
      if (first) {
        const ordered = /\d/.test(first[2]);
        const base = first[1].length;
        const items = [];
        while (i < lines.length) {
          const m = ITEM.exec(lines[i]);
          if (!m || m[1].length > base + 1 || /\d/.test(m[2]) !== ordered) break;
          const width = m[1].length + m[2].length + 1;
          const body = [m[3]];
          for (i++; i < lines.length; i++) {
            const l = lines[i];
            if (!l.trim()) {
              let next = i + 1;
              while (next < lines.length && !lines[next].trim()) next++;
              if (next >= lines.length || indentOf(lines[next]) <= base) break;
              body.push('');
            } else if (indentOf(l) > base) body.push(l.slice(Math.min(width, indentOf(l))));
            else if (starts(lines, i)) break;
            else body.push(l.trim()); // a line that goes on without its indent
          }
          items.push(body);
          // Blank lines between two items of the same list do not end it.
          let next = i;
          while (next < lines.length && !lines[next].trim()) next++;
          const after = ITEM.exec(lines[next] ?? '');
          if (next > i && after && after[1].length <= base + 1 && /\d/.test(after[2]) === ordered) i = next;
        }
        const start = ordered && parseInt(first[2], 10) !== 1 ? ` start="${parseInt(first[2], 10)}"` : '';
        const inner = items.map((body) => `<li>${blocks(body, depth + 1).replace(/^<p>([\s\S]*?)<\/p>(?=<(?:ul|ol)|$)/, '$1')}</li>`).join('');
        html += ordered ? `<ol${start}>${inner}</ol>` : `<ul>${inner}</ul>`;
        continue;
      }
      const para = [line.trim()];
      for (i++; i < lines.length && lines[i].trim() && !starts(lines, i); i++) para.push(lines[i].trim());
      html += `<p>${para.map(inline).join(breaks ? '<br>' : ' ')}</p>`;
    }
    return html;
  };

  return blocks(String(source ?? '').replace(/\u0000/g, '').replace(/\r\n?/g, '\n').split('\n'), 0);
}

/**
 * Marks the references to existing tasks (`T93`, `T89b`) in HTML that is already escaped, with the title of the task as a
 * tooltip. Tags are copied as they are (a `T12` in an attribute stays there) and so is the text of a link; `titles` is a Map
 * from task id to title, and an id it does not know, or one inside a word (`ST12`, `T12x`), stays plain text.
 */
export function taskRefsToHtml(html, titles) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  let inLink = 0;
  return String(html ?? '').replace(/<(?:"[^"]*"|'[^']*'|[^'">])*>|(?<![\p{L}\p{N}_])T\d+[a-z]?(?![\p{L}\p{N}_])/gu, (token) => {
    if (token[0] === '<') {
      if (/^<a[\s>]/i.test(token)) inLink++;
      else if (/^<\/a\s*>/i.test(token)) inLink = Math.max(0, inLink - 1);
      return token;
    }
    const title = inLink ? undefined : titles.get(token);
    return title === undefined ? token : `<span class="task-ref" data-task="${token}" title="${esc(title)}">${token}</span>`;
  });
}
