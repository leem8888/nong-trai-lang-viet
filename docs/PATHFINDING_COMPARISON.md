# Pond and coop pathfinding comparison

Before: the pond used the old fixed rectangle `(1010,710,280,145)` and the coop had no walkable yard fence. Interaction keys used the old pond approach near `(990,780)`, which is now water. The game already had A* with segment checks, but its obstacles did not include pond extension or yard fixtures.

After: `livingLayout()` selects the larger pond `(900,675,390,180)` when it does not overlap placed objects, otherwise retains the old pond. It selects a free yard footprint, and the client and server receive matching extra obstacles. The pond approach is `(850,770)` and coop approach is `(1010,500)`; the contextual menu waits for the character to arrive. A saved player inside a newly blocked area is moved to the nearest valid sampled point on farm load. Existing placements and inventory are retained.

`tests/livingPathfinding.test.js` verifies eight start positions for **each** destination: `(700,650)`, `(700,850)`, `(850,600)`, `(850,860)`, `(1050,650)`, `(1050,880)`, `(700,770)`, `(1000,350)`. All 16 routes exist and every segment is checked against the live collision instance. It also checks a saved mill footprint in the pond extension falls back to the old pond. `npm test` passed 55/55.

The server still validates movement substeps, range, ownership, scene and idempotency. Phase 5 browser regression passed 13/13, including building placement and movement. The contextual browser suite passed 16/16, including mobile touch, distant soil auto-walk, pond/coop entry and direct VAC actions. A dedicated rapid-retarget and multi-obstacle browser traversal remains to be recorded.
