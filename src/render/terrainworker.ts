// Makes the meshes of the places' ground off the page's thread (T486, the point 3 of T331): the arrays of a place from the copy of what its
// mesh reads (`chunkInput` in terrain.ts), the same code the page would run (`chunkArrays`), given back without copying them. The page
// turns them into meshes (`chunkView`); what changed meanwhile it asks again (chunkmesher.ts).

import { answerChunk, type ChunkInput } from './terrainmesh';

self.onmessage = (ev: MessageEvent<{ id: number; chunk: ChunkInput }>) => {
  const { answer, transfer } = answerChunk(ev.data.id, ev.data.chunk);
  (self as unknown as Worker).postMessage(answer, transfer);
};
