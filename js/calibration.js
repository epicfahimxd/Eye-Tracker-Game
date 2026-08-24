/**
 * Calibration — manages the 9-point eye-tracker calibration UI.
 *
 * Each dot is placed at a well-distributed grid position.
 * When the user looks at a dot and clicks it, WebGazer automatically
 * trains on that sample (it knows where the gaze was because the user
 * was looking at the click target).
 *
 * We track how many dots have been clicked and call onComplete once
 * all 9 are done (or the user skips).
 */
const Calibration = (() => {

  /* 9-point grid: [fractionX, fractionY] */
  const POINTS = [
    [0.05, 0.12], [0.50, 0.12], [0.95, 0.12],
    [0.05, 0.50], [0.50, 0.50], [0.95, 0.50],
    [0.05, 0.88], [0.50, 0.88], [0.95, 0.88],
  ];

  let clicked  = 0;
  let onDone   = null;
  let dotEls   = [];

  /* ── Build calibration dots ─────────────────────────────── */
  function start(container, callback) {
    onDone   = callback;
    clicked  = 0;
    dotEls   = [];
    container.innerHTML = '';
    updateCount();

    POINTS.forEach(([fx, fy], i) => {
      const dot = document.createElement('div');
      dot.className    = 'calib-dot';
      dot.style.left   = `${fx * 100}%`;
      dot.style.top    = `${fy * 100}%`;
      dot.title        = 'Look here, then click';

      dot.addEventListener('click', () => handleClick(dot, i));
      container.appendChild(dot);
      dotEls.push(dot);
    });
  }

  function handleClick(dot, idx) {
    if (dot.classList.contains('done')) return;
    dot.classList.add('done');
    clicked++;
    updateCount();

    if (clicked >= POINTS.length) {
      /* Show "Start Game" button, hide "Skip" */
      document.getElementById('btn-done-calib').style.display  = 'inline-block';
      document.getElementById('btn-skip-calib').style.display  = 'none';
      if (typeof onDone === 'function') onDone();
    }
  }

  function updateCount() {
    const el = document.getElementById('calib-count');
    if (el) el.textContent = clicked;
  }

  function getClicked() { return clicked; }

  return { start, getClicked };
})();
