/**
 * Calibration — sequential 9-point calibration.
 *
 * Each dot lights up one at a time. The user clicks it 5 times;
 * a progress ring fills so they can see how many clicks remain.
 * More clicks per point = much better WebGazer accuracy.
 */
const Calibration = (() => {

  const CLICKS_NEEDED = 8;   // clicks per dot — more = better accuracy

  /* 9-point grid [fractionX, fractionY]
     Kept well inside the viewport and below the header. */
  const POINTS = [
    [0.08, 0.22], [0.50, 0.22], [0.92, 0.22],
    [0.08, 0.55], [0.50, 0.55], [0.92, 0.55],
    [0.08, 0.88], [0.50, 0.88], [0.92, 0.88],
  ];

  let currentIdx  = 0;
  let clicksOnCurrent = 0;
  let totalDone   = 0;
  let dotEl       = null;
  let onDone      = null;

  /* ── Build one dot at a time ────────────────────────────── */
  function start(container, callback) {
    onDone          = callback;
    currentIdx      = 0;
    clicksOnCurrent = 0;
    totalDone       = 0;
    container.innerHTML = '';
    updateHeader();
    showDot(container);
  }

  function showDot(container) {
    /* Remove previous dot */
    if (dotEl) dotEl.remove();

    if (currentIdx >= POINTS.length) {
      onAllDone();
      return;
    }

    const [fx, fy] = POINTS[currentIdx];
    clicksOnCurrent = 0;

    dotEl = document.createElement('div');
    dotEl.className = 'calib-dot';
    dotEl.style.left = `${fx * 100}%`;
    dotEl.style.top  = `${fy * 100}%`;
    dotEl.innerHTML  = buildRingSVG(0);
    dotEl.title      = `Click ${CLICKS_NEEDED} times`;

    dotEl.addEventListener('click', () => handleClick(container));
    container.appendChild(dotEl);

    /* Briefly pulse to draw attention */
    dotEl.classList.add('calib-dot-active');
  }

  function handleClick(container) {
    clicksOnCurrent++;
    const progress = clicksOnCurrent / CLICKS_NEEDED;
    dotEl.innerHTML = buildRingSVG(progress);

    if (clicksOnCurrent >= CLICKS_NEEDED) {
      /* Mark done */
      dotEl.classList.add('done');
      dotEl.innerHTML = '✓';
      totalDone++;
      updateCount();

      setTimeout(() => {
        currentIdx++;
        showDot(container);
      }, 300);
    }

    updateCount();
  }

  /* SVG progress ring that fills as user clicks */
  function buildRingSVG(progress) {
    const r   = 9;
    const circ = 2 * Math.PI * r;
    const dash = circ * progress;
    return `
      <svg viewBox="0 0 26 26" width="26" height="26" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">
        <circle cx="13" cy="13" r="${r}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2.5"/>
        <circle cx="13" cy="13" r="${r}" fill="none" stroke="#fff" stroke-width="2.5"
          stroke-dasharray="${dash} ${circ}"
          stroke-linecap="round"
          transform="rotate(-90 13 13)"/>
      </svg>`;
  }

  function onAllDone() {
    const doneBtn = document.getElementById('btn-done-calib');
    const skipBtn = document.getElementById('btn-skip-calib');
    if (doneBtn) doneBtn.style.display = 'inline-block';
    if (skipBtn) skipBtn.style.display = 'none';

    /* Update instructions */
    const instr = document.querySelector('.calib-header p');
    if (instr) instr.textContent = 'All done! Eye tracker is calibrated.';

    if (typeof onDone === 'function') onDone();
  }

  function updateCount() {
    const el = document.getElementById('calib-count');
    if (el) el.textContent = currentIdx + 1 > POINTS.length ? POINTS.length : currentIdx + 1;

    /* Also update header instruction with click count */
    const instr = document.querySelector('.calib-header p');
    if (instr && currentIdx < POINTS.length) {
      const remaining = CLICKS_NEEDED - clicksOnCurrent;
      instr.textContent = remaining > 0
        ? `Look at the dot and click it — ${remaining} click${remaining !== 1 ? 's' : ''} remaining`
        : 'Moving to next point…';
    }
  }

  function updateHeader() {
    const el = document.getElementById('calib-count');
    if (el) el.textContent = 1;
  }

  function getCompleted() { return currentIdx; }

  return { start, getCompleted };
})();
