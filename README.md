# Pixel Playground — The Gauntlet

A difficult, offline stickman obstacle course built with plain HTML, CSS and Canvas JavaScript. Open `index.html` in a modern browser. No install or build step is needed.

## Play

Select **Enter the gauntlet**. Move with WASD or arrow keys; touch devices also have direction buttons. Start at the green ENTRY in the upper left. Follow four connected corridors: right, down, left, down, right, down, then left to the yellow EXIT.

Pink spikes and cannonballs end the run on contact. Cannons flash a warning along their firing lane before releasing a ball. Duck into the blue bunker alcoves to let shots pass. Later sectors have faster cannonballs and shorter firing intervals. There are no checkpoints: retry returns you to the entry. Reaching the exit wins the game, and your fastest escape is saved when browser storage is available.

The full rectangular course stays visible so you can plan your route. Keyboard diagonals have the same speed as straight movement. Hidden tabs suspend gameplay.

## Files

- `index.html`: page, instructions, HUD, overlays, touch controls.
- `game.js`: course geometry, stickman movement, solid boundary checks, spike collision, telegraphed cannons, projectile collision, win/retry state, rendering.
- `style.css`: responsive cabinet, page palette and controls.
- `starter/`: original movement-only workshop exercise, kept as a separate demo.
- `EXERCISES.md`: workshop exercises and checks.

## Tune difficulty

In `game.js`, `RULES` controls stickman speed and collision sizes. `rows`, `corridors`, `bunkers` and `spikes` define the map. Cannon speed and firing intervals increase by sector inside `update()`. Keep bunker entrances open and corridors wide enough for the player's collision footprint when editing geometry.

## Quick playtest

Test WASD, arrow keys and diagonal movement. Try crossing the solid divider between corridors. Navigate around alternating spikes, wait inside a bunker as a cannonball passes, and check that a hit ends the run. Retry should reset position, time and projectiles. Follow the whole winding route to the exit and verify the victory panel and best time. Check touch buttons at a narrow window width.
