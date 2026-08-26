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

  /* Stay on the loading screen — switch to error state */
  document.getElementById('loading-spinner-wrap').style.display = 'none';
  document.getElementById('loading-error-wrap').style.display  = 'block';

  let msg = '';
  if (isSafari()) {
    msg = '⚠️ Safari is not supported. Please open http://localhost:8080 in Google Chrome.';
  } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    msg = 'Camera requires http://localhost. Open the page via the local server, not by double-clicking the file.';
  } else {
    msg =
      'Could not start the camera.\n\n' +
      '• Make sure you are using Google Chrome\n' +
      '• Click "Allow" when Chrome asks for camera permission\n' +
      '• Go to System Settings → Privacy & Security → Camera and enable Chrome\n\n' +
      (err && err.message ? 'Detail: ' + err.message : '');
  }
  document.getElementById('loading-error-msg').textContent = msg;
}

function resetLoadingScreen() {
  document.getElementById('loading-spinner-wrap').style.display = 'block';
  document.getElementById('loading-error-wrap').style.display   = 'none';
  setLoadingStatus('Loading face detection model…');
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
  async function startEyeTracker() {
    resetLoadingScreen();
    showScreen('screen-loading');
    setLoadingStatus('Requesting camera access…');

    try {
      await tick(); /* let the browser paint the loading screen first */
      setLoadingStatus('Loading face detection model…');
      await EyeTracker.init(setLoadingStatus);
      setLoadingStatus('Eye tracker ready! ✓');
      await sleep(600);
      showScreen('screen-calibration');
      startCalibration();
    } catch (err) {
      showEyeTrackerError(err); /* stays on loading screen, shows error state */
    }
  }

  document.getElementById('btn-start').addEventListener('click', startEyeTracker);

  /* Loading screen buttons */
  document.getElementById('btn-loading-cancel').addEventListener('click', () => showScreen('screen-welcome'));
  document.getElementById('btn-loading-back').addEventListener('click',   () => showScreen('screen-welcome'));
  document.getElementById('btn-loading-retry').addEventListener('click',  startEyeTracker);
  document.getElementById('btn-loading-mouse').addEventListener('click',  () => {
    EyeTracker.enableMouseMode();
    showScreen('screen-game');
    Game.startLevel(0);
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

  function goToGame() {
    document.body.classList.add('game-active');
    showScreen('screen-game');
    Game.startLevel(0);
  }

  document.getElementById('btn-done-calib').addEventListener('click', goToGame);
  document.getElementById('btn-skip-calib').addEventListener('click', goToGame);

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
