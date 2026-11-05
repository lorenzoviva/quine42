// Where the floating pieces are, per seed: a debugging aid for the bench.  npx vite-node lab/banco/fauna-biomi-cloud/fluttuanti.ts -- <file.xml> <classe>
import { readFileSync } from 'node:fs';
import { compileMjx } from '../../../src/mj/model';
import { runMjx, FORM_LIMITS } from '../../../src/mj/run';
import { colorTable } from '../../../src/mj/mesh';
import { boxOf, classOf } from '../../../src/mj/classes';
const [f, cl, ...semi] = process.argv.slice(2).filter(a=>a!=='--');
const box = boxOf(classOf(cl)!);
const m = compileMjx(readFileSync(f,'utf8'), { size: box });
for (const seed of (semi.length ? semi.map(Number) : Array.from({ length: 20 }, (_, i) => i + 1))) {
  const g = runMjx(m, seed, { deadline: 30000, limits: FORM_LIMITS }).grid;
  const col = colorTable(g.alphabet, m.program.palette); const X=g.X,Y=g.Y,Z=g.Z,XY=X*Y;
  const seen = new Int32Array(g.cells.length).fill(-1); const comps: {n:number, min:number[], max:number[], letters:Set<string>}[] = [];
  for (let i=0;i<g.cells.length;i++){ if(!col[g.cells[i]]||seen[i]>=0) continue; const c={n:0,min:[1e9,1e9,1e9],max:[-1,-1,-1],letters:new Set<string>()}; const st=[i]; seen[i]=comps.length;
    while(st.length){const k=st.pop()!; c.n++; const p=[k%X, Math.floor(k/X)%Y, Math.floor(k/XY)]; c.letters.add(g.alphabet[g.cells[k]]); for(let a=0;a<3;a++){c.min[a]=Math.min(c.min[a],p[a]);c.max[a]=Math.max(c.max[a],p[a]);}
      for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=p[0]+dx,b=p[1]+dy,d=p[2]+dz; if(a<0||b<0||d<0||a>=X||b>=Y||d>=Z)continue; const q=a+b*X+d*XY; if(col[g.cells[q]]&&seen[q]<0){seen[q]=comps.length;st.push(q);}}}
    comps.push(c);}
  comps.sort((a,b)=>b.n-a.n);
  if (comps.length > 1) console.log(seed, comps.slice(1).map(c=>`${c.n}v [${c.min}]-[${c.max}] ${[...c.letters].join('')}`).join(' | '));
}
