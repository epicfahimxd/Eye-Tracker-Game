/**
 * Game — state machine that drives a single round of play.
 *
 * Key design:
 *   • Gaze → dwell detection: if gaze stays within Waldo's detection
 *     radius for DWELL_MS milliseconds continuously → "found!"
 *   • The gold ring on the cursor fills proportionally to dwell progress
 *     so players get clear visual feedback without revealing the location.
 *   • Timer counts down per-level; runs out → game over.
 *   • `showScreen(id)` is a simple helper — defined once in app.js
 *     and stored on window so game.js can call it without circular deps.
 */
const Game = (() => {

  /* ── Constants ──────────────────────────────────────────── */
  const DWELL_MS      = 1500;   // ms gaze must dwell on Waldo
  const HUD_H         = 58;     // px — must match --hud-h CSS var

  /* ── State ──────────────────────────────────────────────── */
  let canvas        = null;
  let levelIdx      = 0;
  let timeLeft      = 0;
  let timerInterval = null;
  let gazeListener  = null;
  let dwellStart    = null;
  let found         = false;

  /* ── Init (called once from app.js) ────────────────────── */
  function init(canvasEl) {
    canvas = canvasEl;
  }

  /* ── Start / restart a level ────────────────────────────── */
  function startLevel(idx) {
    levelIdx   = idx;
    found      = false;
    dwellStart = null;

    const level = LEVELS[levelIdx];

    /* size canvas to fill game area */
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - HUD_H;

    /* draw the scene */
    Scene.drawScene(canvas, level);

    /* update HUD */
    document.getElementById('hud-icon').textContent = level.icon;
    document.getElementById('hud-name').textContent = level.name;
    const diff = document.getElementById('hud-diff');
    diff.textContent = level.difficulty;
    diff.className   = `badge ${level.diffClass}`;

    /* start timer */
    startTimer(level.timeLimit);

    /* register gaze listener */
    if (gazeListener) EyeTracker.removeListener(gazeListener);
    gazeListener = (x, y) => handleGaze(x, y);
    EyeTracker.addListener(gazeListener);
    EyeTracker.start();

    /* show gaze cursor */
    const cursor = document.getElementById('gaze-cursor');
    cursor.style.display = 'block';

    /* resume WebGazer if paused */
    EyeTracker.resume();
  }

  /* ── Timer ──────────────────────────────────────────────── */
  function startTimer(seconds) {
    clearInterval(timerInterval);
    timeLeft = seconds;
    renderTimer(timeLeft, seconds);

    timerInterval = setInterval(() => {
      timeLeft--;
      renderTimer(timeLeft, LEVELS[levelIdx].timeLimit);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeUp();
      }
    }, 1000);
  }

  function renderTimer(current, total) {
    const bar  = document.getElementById('timer-bar');
    const text = document.getElementById('timer-text');
    const pct  = Math.max(0, current / total);
    bar.style.width = `${pct * 100}%`;
    text.textContent = `${Math.max(0, current)}s`;

    if      (pct > 0.5)  bar.style.background = '#39d353';
    else if (pct > 0.25) bar.style.background = '#e3b341';
    else                 bar.style.background = '#f85149';
  }

  /* ── Gaze handling ──────────────────────────────────────── */
  function handleGaze(gazeViewX, gazeViewY) {
    if (found) return;

    const level  = LEVELS[levelIdx];
    const bounds = Scene.waldoBounds(canvas, level);

    /* convert viewport gaze → canvas-local coordinates */
    const rect = canvas.getBoundingClientRect();
    const cx   = gazeViewX - rect.left;
    const cy   = gazeViewY - rect.top;

    /* euclidean distance from gaze to Waldo */
    const dist     = Math.hypot(cx - bounds.x, cy - bounds.y);
    const onWaldo  = dist < bounds.r;

    /* update gaze cursor position (viewport coords) */
    moveCursor(gazeViewX, gazeViewY, onWaldo);

    /* dwell logic */
    if (onWaldo) {
      if (!dwellStart) dwellStart = performance.now();
      const progress = Math.min((performance.now() - dwellStart) / DWELL_MS, 1);
      setDwellRing(progress);
      if (progress >= 1) handleFound();
    } else {
      dwellStart = null;
      setDwellRing(0);
    }
  }

  /* ── Cursor helpers ─────────────────────────────────────── */
  function moveCursor(viewX, viewY, onWaldo) {
    const cursor = document.getElementById('gaze-cursor');
    cursor.style.left = `${viewX}px`;
    cursor.style.top  = `${viewY}px`;
    cursor.classList.toggle('on-waldo', onWaldo);
  }

  function setDwellRing(progress) {
    const ring = document.getElementById('gc-dwell');
    if (!ring) return;
    /* circumference ≈ 2π × 26 ≈ 163.4 */
    ring.style.strokeDashoffset = 163.4 * (1 - progress);
  }

  /* ── Found! ─────────────────────────────────────────────── */
  function handleFound() {
    if (found) return;
    found = true;
    clearInterval(timerInterval);
    EyeTracker.stop();
    if (gazeListener) { EyeTracker.removeListener(gazeListener); gazeListener = null; }

    /* gold highlight on canvas */
    Scene.highlightWaldo(canvas, LEVELS[levelIdx]);

    /* flash overlay */
    const flash = document.getElementById('found-flash');
    flash.style.display = 'block';
    setTimeout(() => { flash.style.display = 'none'; }, 650);

    setTimeout(showLevelComplete, 900);
  }

  function showLevelComplete() {
    document.getElementById('lc-level-num').textContent  = levelIdx + 1;
    document.getElementById('lc-level-name').textContent = LEVELS[levelIdx].name;
    document.getElementById('lc-time-left').textContent  = `${Math.max(0, timeLeft)}s`;

    const nextBtn = document.getElementById('btn-next-level');
    nextBtn.textContent = (levelIdx >= LEVELS.length - 1) ? '🏆 See Final Score' : 'Next Level →';

    spawnConfetti('confetti-a');
    window.showScreen('screen-level-complete');
  }

  /* ── Time up ────────────────────────────────────────────── */
  function handleTimeUp() {
    if (found) return;
    EyeTracker.stop();
    if (gazeListener) { EyeTracker.removeListener(gazeListener); gazeListener = null; }

    document.getElementById('go-hint-region').textContent = LEVELS[levelIdx].hintRegion;
    window.showScreen('screen-game-over');
  }

  /* ── Public actions (wired in app.js) ───────────────────── */
  function nextLevel() {
    levelIdx++;
    if (levelIdx >= LEVELS.length) {
      spawnConfetti('confetti-b');
      window.showScreen('screen-victory');
    } else {
      window.showScreen('screen-game');
      startLevel(levelIdx);
    }
  }

  function retry() {
    window.showScreen('screen-game');
    startLevel(levelIdx);
  }

  function goToMenu() {
    clearInterval(timerInterval);
    EyeTracker.stop();
    if (gazeListener) { EyeTracker.removeListener(gazeListener); gazeListener = null; }
    EyeTracker.pause();
    levelIdx = 0;
    document.getElementById('gaze-cursor').style.display = 'none';
    setDwellRing(0);
    window.showScreen('screen-welcome');
  }

  function showHint() {
    document.getElementById('hint-text').textContent = LEVELS[levelIdx].hintRegion;
    document.getElementById('hint-popup').style.display = 'block';
  }

  function hideHint() {
    document.getElementById('hint-popup').style.display = 'none';
  }

  function handleResize() {
    if (!document.getElementById('screen-game').classList.contains('active')) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - HUD_H;
    Scene.drawScene(canvas, LEVELS[levelIdx]);
    /* re-highlight if already found */
    if (found) Scene.highlightWaldo(canvas, LEVELS[levelIdx]);
  }

  /* ── Confetti ────────────────────────────────────────────── */
  function spawnConfetti(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#E53935','#1E88E5','#43A047','#FDD835','#8E24AA','#FF8C00','#00BCD4','#FF4081'];
    for (let i = 0; i < 90; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-bit';
      const size = 6 + Math.random() * 9;
      Object.assign(el.style, {
        left:             `${Math.random() * 100}%`,
        width:            `${size}px`,
        height:           `${size}px`,
        background:       colors[i % colors.length],
        borderRadius:     Math.random() > 0.5 ? '50%' : '2px',
        animationDelay:   `${Math.random() * 1.8}s`,
        animationDuration:`${2.2 + Math.random() * 2}s`,
        transform:        `rotate(${Math.random()*360}deg)`,
      });
      container.appendChild(el);
    }
  }

  return { init, startLevel, nextLevel, retry, goToMenu, showHint, hideHint, handleResize };
})();
