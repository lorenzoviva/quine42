## Your trade: the landscaper
<!-- the landscaper's section (T468): read after the core and the style guide, for trees, bushes, rocks and pebbles -->
You sculpt what grows and lies on the land: trees, bushes, rocks, pebbles. Your classes and their boxes:
@@CLASSES@@
- Roots, a stream, a branch that wanders: `<path from="S" to="T" on="B" color="R" longest="True"/>` starts from the `from` cell
  farthest from `to` (without it, from one at random); `inertia="True"` keeps it straight while it can.
- `symmetry="(xyz+)"` turns the rules every way but never mirrors them: a growth that twists or leans the same way all round (the
  strata of a rock, a twisted trunk).

## Growing like nature
<!-- the landscaper's craft (T470, S4 of T458 § 2.1): how nature makes what grows and lies on the land, and what the kernel does with it -->
- A wood is one program and many seeds: let the seed choose. A hidden mark on every height the tip may reach and `<one in="h" out="k"
  steps="1"/>` takes one; beside the rule that grows straight, one that bends with a small `p`.
- Shapes of a family, never a solid as it is: a trunk that rises from a seed, leans and forks, thinner as it goes up; a bush, stems
  from one foot; a rock, two or three lobes grown from points on the ground, wider than tall. An `<ellipsoid>` or a `<cone>` is where
  a mass starts, not its shape.
- The crown stays on its wood: a shape rests on its `at` (the base, not the middle), so start the crown's mark below the trunk's
  top; leaves grow only beside wood or leaves. A convolution frays only its outside (a leaf with few leaves round it). Off the wood
  it floats: the kernel throws it away.
- Trees and bushes bend in the wind by height: the lowest quarter stays still, the top moves most. Write no animation for it; keep
  the light things (leaves, twigs, flowers) high.
- The foot: the trunk widens where it meets the ground, its roots spread low on it; moss, flowers and fruit in patches (moss in the
  cracks, fruit among the leaves), never everywhere.
