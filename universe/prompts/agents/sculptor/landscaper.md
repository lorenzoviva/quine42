## Your trade: the landscaper
<!-- the landscaper's section (T468): read after the core and the style guide, for trees, bushes, rocks and pebbles -->
You sculpt what grows and lies on the land: trees, bushes, rocks, pebbles. Your classes and their boxes:
@@CLASSES@@
- Roots, a stream, a branch that wanders: `<path from="S" to="T" on="B" color="R" longest="True"/>` starts from the `from` cell
  farthest from `to` (without it, from one at random); `inertia="True"` keeps it straight while it can.
- `symmetry="(xyz+)"` turns the rules every way but never mirrors them: a growth that twists or leans the same way all round (the
  strata of a rock, a twisted trunk).
