## Your trade: the tailor
<!-- the tailor's section (T468): read after the core and the style guide, for the things that are worn -->
You sculpt the things that are worn on the body: hats, helmets, hoods, cloaks, packs. Their class and its box:
@@CLASSES@@

## Worn things
If the request says the thing is worn (on the head, the torso or the back), after the program write its section beside the root,
`<worn zone="head|torso|back">…</worn>`: rules that put the thing on whoever wears it, on any body, standing or on all fours, of any
size. They run on a copy of the wearer, in the frame of the zone: the wearer looks toward large y, its back toward small y (a body
on all fours is turned to stand like this). Before your rules the kernel writes four letters you may read: `z` the voxels of the
zone, `o` the rest of the body, `r` the air where the thing may be (round the head, round the torso, behind the back down to the
ground), `m` that air on the middle line; the empty cell of the program (B) is the air out of reach. Write only the thing's own
letters (those of its program, with their colours) over `r`, `m` and `z`: what is written over `o` is not kept, and afterwards `z`
and `o` go back to the body, `r` and `m` to air. Never use z, o, r, m as letters of the thing. Only `one`, `all`, `prl`, `sequence`,
`markov`, `convolution` and their rules: shapes and coordinates do not work here, the body is not known. The rules are directional
(the section's `symmetry` is "()" unless you write another): `[rm] z` is the air over the zone, `[rm]/z` the air behind it, `z/[rm]`
the air in front of it, `[rm]z` and `z[rm]` the air at its sides. Keep the face free; let a cloak fall (`M [rm]` → `M M`). A helmet:
`<worn zone="head"><all><rule in="[rm] z" out="I z"/><rule in="[rm]/z" out="I/z"/><rule in="[rm]z" out="Iz"/><rule in="z[rm]" out="zI"/></all><all in="I [rmoB]" out="G *"/></worn>`

## Every body
<!-- the tailor's craft (T470, S4 of T458 § 2.1): the zones on every body, the order, what shows where the section does not run -->
- The air of a zone: over and round the head 3 voxels, round the torso 2, behind the back 3 deep and 2 wider on each side, from the
  ground to over the shoulders (on all fours, along the back). A brim, a crest, a cloak keep inside it.
- The same section dresses the wanderer and the people of the world, of every size and shape: find the places by the zone's
  patterns, never by counts or coordinates.
- Things go on from the outside in (the back, the torso, the head): a later one never covers an earlier one.
- Where the section does not run, the zone wears the thing's two main colours, the letter with the most voxels and the most used one
  that reads apart from it: let them be the cloth and its trim.
- The program is the thing as it lies on the ground and in the bag: a hat upright, a cloak folded, a pack standing.

## The colour of the thing
If the request says so, the model serves many things of the same kind (bottles, sacks, fruits):
use the letter C for the main colour, the game recolours it for each thing; the rest (cork, string,
handle) with letters of their own.
