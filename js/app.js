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

/* ── Boot ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  Game.init(canvas);

  /* ── Welcome screen ─────────────────────────────────────── */
  document.getElementById('btn-start').addEventListener('click', async () => {
    showScreen('screen-calibration');
    try {
      await EyeTracker.init();
      startCalibration();
    } catch (err) {
      console.error('Eye tracker init failed:', err);
      alert(
        'Could not start the eye tracker.\n\n' +
        'Make sure you:\n' +
        '• Allow camera access in the browser\n' +
        '• Are running via http://localhost (not file://)\n\n' +
        'Tip: run  npm start  in this folder, then open http://localhost:3000'
      );
      showScreen('screen-welcome');
    }
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
