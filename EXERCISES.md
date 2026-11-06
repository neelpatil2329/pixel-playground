# The Gauntlet workshop exercises

The full game is now a stickman obstacle course. `starter/index.html` remains a simple, independent movement demo.

1. **Movement:** open the starter, change speed or player color, then refresh. Check diagonal speed and arena boundaries.
2. **Course design:** inspect `corridors`, `bunkers` and `spikes` in `game.js`. Move one obstacle without closing the route. Check that every bunker remains reachable and the exit still requires following all four corridors.
3. **Difficulty:** adjust cannon velocity or firing interval in `update()`. Keep the warning visible long enough to react. Check that bunker cover still works.
4. **Remix:** change the palette, stickman art and mission together. Preserve the entry, exit, hazard warnings and cover markers so another player can understand the course.

## Playtest

Try both keyboard layouts and touch controls. Confirm walls block movement, spikes and cannonballs end the run, and bunkers provide room to dodge. Retry must reset the full course state. Reaching the exit should end the run with a completion time and save a faster personal best.
