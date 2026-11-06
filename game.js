// A fixed, connected course. Coordinates describe the stickman's feet/center.
const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['overlay', 'action', 'score', 'level', 'best', 'status', 'panel-title', 'panel-detail'].map(id => [id, document.getElementById(id)]));
const W = canvas.width, H = canvas.height;
const RULES = { speed: 185, radius: 11, ballRadius: 17 };
const rows = [110, 290, 470, 650];
const corridors = rows.map(y => ({ x: 40, y: y - 42, w: 1020, h: 84 }));
corridors.push({ x: 976, y: 68, w: 84, h: 264 }, { x: 40, y: 248, w: 84, h: 264 }, { x: 976, y: 428, w: 84, h: 264 });
const bunkers = rows.flatMap((y, row) => [260, 500, 740].map(x => ({ x, y: y - 100, w: 64, h: 68, row })));
const floor = [...corridors, ...bunkers];
const spikes = rows.flatMap((y, row) => [200, 410, 620, 830].map((x, i) => ({ x, y: i % 2 ? y + 10 : y - 42, w: 48, h: 32, row })));
const cannons = rows.map((y, i) => ({ x: i % 2 ? 61 : 1039, y, direction: i % 2 ? 1 : -1, timer: 2 + i * .35, row: i }));
const keys = new Set(), touches = new Map();
let player, balls, state = 'ready', elapsed = 0, attempts = 0, best = 0, previousTime;
try { best = Number(localStorage.getItem('pixel-gauntlet-best')) || 0; } catch {}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inside = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
function walkable(x, y) {
  // Sample the full footprint, including corners, across joined corridor rectangles.
  for (const dx of [-RULES.radius, 0, RULES.radius]) {
    for (const dy of [-RULES.radius, 0, RULES.radius]) {
      if (!floor.some(r => inside(x + dx, y + dy, r))) return false;
    }
  }
  return true;
}
function circleRect(x, y, radius, rect) {
  return Math.hypot(x - clamp(x, rect.x, rect.x + rect.w), y - clamp(y, rect.y, rect.y + rect.h)) < radius;
}
function reset() {
  player = { x: 70, y: rows[0], step: 0 };
  balls = []; elapsed = 0; previousTime = undefined;
  cannons.forEach((c, i) => c.timer = 2 + i * .35);
  keys.clear(); touches.clear(); hud();
}
function start() {
  reset(); attempts++; state = 'playing'; ui.overlay.hidden = true; canvas.focus();
}
function finish(won, reason) {
  state = won ? 'won' : 'over'; keys.clear(); touches.clear();
  if (won && (!best || elapsed < best)) {
    best = elapsed;
    try { localStorage.setItem('pixel-gauntlet-best', String(best)); } catch {}
  }
  ui.status.textContent = won ? 'COURSE CLEARED' : 'RUN ENDED';
  ui['panel-title'].textContent = won ? 'You made it out.' : reason;
  ui['panel-detail'].textContent = won ? `Exit reached in ${elapsed.toFixed(1)} seconds. Try for a faster escape.` : 'One hit ends the run. Watch the cannon warning and duck into the blue bunkers.';
  ui.action.textContent = won ? 'Run again' : 'Retry course';
  ui.overlay.hidden = false; ui.action.focus(); hud();
}
function section() { return clamp(Math.round((player.y - 110) / 180), 0, 3); }
function hud() {
  ui.score.textContent = `${elapsed.toFixed(1)}s`;
  ui.level.textContent = `${section() + 1} / 4`;
  ui.best.textContent = best ? `${best.toFixed(1)}s` : '—';
}
function update(dt) {
  elapsed += dt;
  const held = key => keys.has(key) || [...touches.values()].includes(key);
  const dx = Number(held('d') || held('arrowright')) - Number(held('a') || held('arrowleft'));
  const dy = Number(held('s') || held('arrowdown')) - Number(held('w') || held('arrowup'));
  const distance = RULES.speed * dt / (Math.hypot(dx, dy) || 1);
  // Small steps keep collision reliable even on slower screens.
  const steps = Math.max(1, Math.ceil(distance / 3));
  for (let i = 0; i < steps; i++) {
    if (walkable(player.x + dx * distance / steps, player.y)) player.x += dx * distance / steps;
    if (walkable(player.x, player.y + dy * distance / steps)) player.y += dy * distance / steps;
    if (spikes.some(r => circleRect(player.x, player.y, RULES.radius, r))) { finish(false, 'Caught by the spikes.'); return; }
  }
  if (dx || dy) player.step += dt * 12;
  for (const cannon of cannons) {
    cannon.timer -= dt;
    if (cannon.timer <= 0) {
      balls.push({ x: cannon.x + cannon.direction * 26, y: cannon.y, vx: cannon.direction * (270 + cannon.row * 35) });
      cannon.timer += 2.7 - cannon.row * .25;
    }
  }
  for (const ball of balls) {
    const oldX = ball.x;
    ball.x += ball.vx * dt;
    // Swept collision prevents a fast cannonball skipping through the player.
    const nearestX = clamp(player.x, Math.min(oldX, ball.x), Math.max(oldX, ball.x));
    if (Math.hypot(player.x - nearestX, player.y - ball.y) < RULES.radius + RULES.ballRadius) {
      finish(false, 'Hit by a cannonball.'); return;
    }
  }
  balls = balls.filter(b => b.x > 40 && b.x < 1060);
  if (player.x < 96 && player.y > 622) { finish(true); return; }
  hud();
}
function rect(r, color) { ctx.fillStyle = color; ctx.fillRect(r.x, r.y, r.w, r.h); }
function text(value, x, y, color = '#aabbd0', size = 12) {
  ctx.fillStyle = color; ctx.font = `600 ${size}px monospace`; ctx.textAlign = 'center'; ctx.fillText(value, x, y);
}
function draw() {
  ctx.fillStyle = '#0b111b'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 20) { ctx.strokeStyle = '#111e2c'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (const r of floor) { rect({ x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }, '#51627a'); }
  for (const r of floor) rect(r, '#1e2c3d');
  for (const b of bunkers) {
    rect(b, '#153f50');
    text('BUNKER', b.x + 32, b.y + 22, '#75d8ee', 10);
    text('⌄', b.x + 32, b.y + 43, '#75d8ee', 20);
  }
  rows.forEach((y, i) => {
    text(`SECTOR 0${i + 1}  ${i % 2 ? '←' : '→'}`, 550, y + 36, '#8095ad', 11);
    ctx.setLineDash([5, 12]); ctx.strokeStyle = '#435267'; ctx.beginPath(); ctx.moveTo(125, y); ctx.lineTo(975, y); ctx.stroke(); ctx.setLineDash([]);
  });
  rect({ x: 43, y: 74, w: 55, h: 72 }, '#185745'); text('ENTRY', 71, 61, '#70edcf', 11);
  rect({ x: 43, y: 614, w: 55, h: 72 }, '#626024'); text('EXIT', 71, 713, '#ffdc76', 14);
  for (const r of spikes) {
    for (let x = r.x; x < r.x + r.w; x += 12) {
      ctx.fillStyle = '#fa7c85'; ctx.beginPath();
      const top = r.y < rows[r.row];
      ctx.moveTo(x, top ? r.y : r.y + r.h); ctx.lineTo(x + 6, top ? r.y + r.h : r.y); ctx.lineTo(x + 12, top ? r.y : r.y + r.h); ctx.fill();
    }
  }
  for (const c of cannons) {
    if (c.timer < .85) {
      ctx.strokeStyle = `rgba(255,120,90,${.2 + .2 * Math.sin(elapsed * 22)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(99, c.y); ctx.lineTo(1001, c.y); ctx.stroke();
      text('FIRING', c.x, c.y - 49, '#ff9e75', 10);
    }
    rect({ x: c.x - 15, y: c.y - 22, w: 30, h: 44 }, '#8994a2');
    rect({ x: c.x + (c.direction > 0 ? 0 : -28), y: c.y - 9, w: 28, h: 18 }, '#ffab75');
  }
  for (const b of balls) {
    ctx.fillStyle = '#ff8c65'; ctx.beginPath(); ctx.arc(b.x, b.y, RULES.ballRadius + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#26313e'; ctx.beginPath(); ctx.arc(b.x, b.y, RULES.ballRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b2bfcb'; ctx.beginPath(); ctx.arc(b.x - 5, b.y - 5, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Stickman stays inside the collision footprint; legs animate while moving.
  ctx.strokeStyle = '#8ff5d6'; ctx.fillStyle = '#8ff5d6'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(player.x, player.y - 8, 4, 0, Math.PI * 2); ctx.fill();
  const stride = Math.sin(player.step) * 5;
  ctx.beginPath(); ctx.moveTo(player.x, player.y - 3); ctx.lineTo(player.x, player.y + 5);
  ctx.moveTo(player.x - 7, player.y + 1 + stride / 2); ctx.lineTo(player.x, player.y - 1); ctx.lineTo(player.x + 7, player.y + 1 - stride / 2);
  ctx.moveTo(player.x - 4 - stride / 2, player.y + 11); ctx.lineTo(player.x, player.y + 5); ctx.lineTo(player.x + 4 + stride / 2, player.y + 11); ctx.stroke();
  text('THE GAUNTLET  /  ONE HIT. NO CHECKPOINTS.', W / 2, 738, '#7c91aa', 12);
}
function clearInput() { keys.clear(); touches.clear(); }
ui.action.addEventListener('click', start);
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (state !== 'playing' || !['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key) || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault(); keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { clearInput(); previousTime = undefined; });
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', e => { if (state !== 'playing') return; button.setPointerCapture(e.pointerId); touches.set(e.pointerId, button.dataset.key); });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name, e => touches.delete(e.pointerId));
}
function frame(time) {
  const dt = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, .033);
  previousTime = time;
  if (state === 'playing' && !document.hidden) update(dt);
  draw(); requestAnimationFrame(frame);
}
reset(); requestAnimationFrame(frame);
