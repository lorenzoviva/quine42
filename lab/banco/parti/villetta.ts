// The Sculptor's country house of the local models (T354, `MOCK_STRUCTURE_PROGRAM`) with its windows by part-window (T471, lab/banco/parti/
// README.md): how the architect uses the part. Its windows of before (fourteen at random in the band, through the wall) become one line,
// <import file="part-window"/>, and the rest of the band goes back to the plaster as before. The hedge was G, which part-window writes for
// its glass: here it is Z, so that the part's letters are its own (the request says it to the Sculptor).

import { MOCK_STRUCTURE_PROGRAM } from '../../../src/kernel/ai/mockStructure';

const swap = (s: string, from: string, to: string): string => {
  if (!s.includes(from)) throw new Error(`villetta: manca «${from.slice(0, 60)}»`);
  return s.replace(from, to);
};

/** The program with part-window in place of its windows (it throws if the offline house changed under it: the test says so). */
export function villettaWithWindows(xml: string = MOCK_STRUCTURE_PROGRAM): string {
  const windows = /( *)<!-- 4\. Windows in the band[^\n]*\n *<one steps="14">[^\n]*\n *<all in="LUUUUB" out="\*LLLL\*"\/>\n/.exec(xml);
  if (!windows) throw new Error('villetta: mancano le finestre di prima');
  let out = xml.replace(windows[0], `${windows[1]}<!-- 4. Windows in the band, in rows centred on every face (part-window); the rest of the band is plaster. -->\n${windows[1]}<import file="part-window"/>\n`);
  out = swap(out, 'values="BEhwisavpqrgbGYQAfWUFRLOoNkT#90#91#92#93KJyCPDV#20#21"', 'values="BEhwisavpqrgbZYQAfWUFRLOoNkT#90#91#92#93KJyCPDVG#20#21"');
  out = swap(out, '<rule in="x" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>', '<rule in="x" out="ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ/ZZZZZ"/>');
  out = swap(out, '<all in="B G" out="G *" steps="7"/>', '<all in="B Z" out="Z *" steps="7"/>');
  out = swap(out, '<color symbol="G" value="3f6f2f" name="siepe"/>', '<color symbol="Z" value="3f6f2f" name="siepe"/><color symbol="G" value="86b8c8" alpha="0.5" name="vetro"/>');
  return swap(out, '<!--\nCountry house (villetta):', '<!--\nCountry house (villetta) with the windows of part-window (T471, lab/banco/parti/villetta.ts):');
}
