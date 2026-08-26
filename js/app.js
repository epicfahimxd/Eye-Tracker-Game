/**
 * app.js — entry point.
 * Wires all modules together and handles button events.
 *
 * Load order (index.html script tags):
 *   levels.js → scene.js → eyetracker.js → calibration.js → game.js → app.js
 */

/* ── Global screen helper (used by game.js) ─────────────── */
window.showScreen = function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
};

/* ── Helpers ────────────────────────────────────────────── */
function tick()        { return new Promise(r => setTimeout(r, 50)); }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }

function setLoadingStatus(msg) {
  const el = document.getElementById('loading-status');
  if (el) el.textContent = msg;
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function showEyeTrackerError(err) {
  console.error('[EyeTracker] init failed:', err);

  if (isSafari()) {
    alert(
      '⚠️ Safari is not supported by WebGazer.\n\n' +
      'Please open this page in Google Chrome:\n' +
      'http://localhost:8080\n\n' +
      '(Or click "Use Mouse (Demo Mode)" to play without eye tracking.)'
    );
    return;
  }

  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  if (!isSecure) {
    alert('Camera access requires http://localhost — open the page via the local server, not by double-clicking the file.');
    return;
  }

  alert(
    'Camera error: ' + (err && err.message ? err.message : String(err)) + '\n\n' +
    'Try:\n' +
    '1. Use Google Chrome (not Safari or Firefox)\n' +
    '2. Refresh and click "Allow" when the browser asks for camera access\n' +
    '3. Check System Settings → Privacy & Security → Camera → allow Chrome\n' +
    '4. Or click "Use Mouse (Demo Mode)" to play without eye tracking'
  );
}

/* ── Boot ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  Game.init(canvas);

  /* Warn Safari users immediately */
  if (isSafari()) {
    const w = document.getElementById('browser-warning');
    if (w) w.style.display = 'block';
  }

  /* ── Welcome screen ─────────────────────────────────────── */
  document.getElementById('btn-start').addEventListener('click', async () => {
    showScreen('screen-loading');
    setLoadingStatus('Requesting camera access…');

    try {
      /* Give the browser a tick to show the loading screen */
      await tick();

      setLoadingStatus('Loading face detection model…');
      await EyeTracker.init(setLoadingStatus);

      setLoadingStatus('Eye tracker ready! ✓');
      await sleep(500);

      showScreen('screen-calibration');
      startCalibration();
    } catch (err) {
      console.error('Eye tracker init failed:', err);
      showScreen('screen-welcome');
      showEyeTrackerError(err);
    }
  });

  document.getElementById('btn-loading-cancel').addEventListener('click', () => {
    showScreen('screen-welcome');
  });

  document.getElementById('btn-mouse-mode').addEventListener('click', () => {
    EyeTracker.enableMouseMode();
    /* skip calibration — go straight to game */
    showScreen('screen-game');
    Game.startLevel(0);
  });

  /* ── Calibration screen ─────────────────────────────────── */
  function startCalibration() {
    const container = document.getElementById('calib-dots-container');
    Calibration.start(container, () => {
      /* all 9 dots clicked — show "Start Game" button */
    });
  }

  document.getElementById('btn-done-calib').addEventListener('click', () => {
    showScreen('screen-game');
    Game.startLevel(0);
  });

  document.getElementById('btn-skip-calib').addEventListener('click', () => {
    showScreen('screen-game');
    Game.startLevel(0);
  });

  /* ── Game screen ────────────────────────────────────────── */
  document.getElementById('btn-hint').addEventListener('click', () => Game.showHint());
  document.getElementById('btn-close-hint').addEventListener('click', () => Game.hideHint());

  /* ── Level complete screen ──────────────────────────────── */
  document.getElementById('btn-next-level').addEventListener('click', () => Game.nextLevel());

  /* ── Game over screen ───────────────────────────────────── */
  document.getElementById('btn-retry').addEventListener('click', () => {
    showScreen('screen-game');
    Game.retry();
  });
  document.getElementById('btn-menu').addEventListener('click', () => Game.goToMenu());

  /* ── Victory screen ─────────────────────────────────────── */
  document.getElementById('btn-play-again').addEventListener('click', () => {
    Game.goToMenu();
  });

  /* ── Window resize — keep canvas sized ─────────────────── */
  window.addEventListener('resize', () => Game.handleResize());
});
