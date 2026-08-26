/**
 * EyeTracker — wraps WebGazer.js and provides:
 *   - Exponential moving-average smoothing to reduce jitter
 *   - A simple listener/pub-sub so multiple consumers can get gaze updates
 *   - Mouse-fallback mode (for demo / when camera isn't available)
 */
const EyeTracker = (() => {
  /* ── State ─────────────────────────────────────────────── */
  let ready     = false;
  let active    = false;
  let mouseMode = false;

  let rawX = null, rawY = null;
  let smX  = null, smY  = null;

  const ALPHA = 0.28; // lower = smoother but laggier (0.15–0.35 works well)
  const listeners = new Set();

  /* ── Internal helpers ───────────────────────────────────── */
  function emit(x, y) {
    if (!active) return;
    listeners.forEach(fn => { try { fn(x, y); } catch(e){} });
  }

  function smooth(raw, prev) {
    return prev === null ? raw : prev + ALPHA * (raw - prev);
  }

  function onGazeData(data) {
    if (!data) return;
    rawX = data.x; rawY = data.y;
    smX  = smooth(rawX, smX);
    smY  = smooth(rawY, smY);
    emit(smX, smY);
  }

  /* ── Mouse mode ─────────────────────────────────────────── */
  function enableMouseMode() {
    mouseMode = true;
    active    = true;
    document.addEventListener('mousemove', onMouseMove);
  }

  function onMouseMove(e) {
    rawX = e.clientX; rawY = e.clientY;
    smX  = smooth(rawX, smX);
    smY  = smooth(rawY, smY);
    emit(smX, smY);
  }

  /* ── WebGazer init ──────────────────────────────────────── */
  async function init(onStatus) {
    if (ready || mouseMode) return;
    if (typeof webgazer === 'undefined') {
      throw new Error('WebGazer library not loaded — make sure you opened the page via http://localhost');
    }

    const status = typeof onStatus === 'function' ? onStatus : () => {};

    /* Don't configure regression/tracker before begin() — WebGazer 3.x
       handles its own setup internally; calling setRegression/setTracker
       before begin() causes "t is not a function" inside the minified bundle. */
    webgazer.showPredictionPoints(false);

    status('Initialising face detection…');
    await webgazer.begin();

    /* Attach listener only after begin() fully resolves */
    status('Calibrating camera…');
    webgazer.setGazeListener(onGazeData);

    /* Position the webcam preview in the corner */
    setTimeout(styleWebcamPreview, 800);

    ready = true;
  }

  function styleWebcamPreview() {
    const container = document.getElementById('webgazerVideoContainer');
    if (!container) return;
    Object.assign(container.style, {
      position:    'fixed',
      top:         '66px',
      right:       '8px',
      zIndex:      '500',
      width:       '148px',
      borderRadius:'8px',
      overflow:    'hidden',
      border:      '2px solid rgba(255,255,255,0.15)',
      opacity:     '0.7',
    });
  }

  /* ── Public API ─────────────────────────────────────────── */

  /** Add a listener: fn(x, y) called on every smoothed gaze update */
  function addListener(fn)    { listeners.add(fn);    }
  /** Remove a previously added listener */
  function removeListener(fn) { listeners.delete(fn); }

  /** Start emitting gaze events to listeners */
  function start() { active = true;  }
  /** Stop emitting gaze events (listeners remain registered) */
  function stop()  { active = false; }

  /** Latest smoothed gaze position, or null if not yet available */
  function getGaze() {
    return smX !== null ? { x: smX, y: smY } : null;
  }

  /** True once WebGazer (or mouse mode) is initialised */
  function isReady() { return ready || mouseMode; }

  /** Pause WebGazer's ML pipeline (reduces CPU when not on game screen) */
  function pause() {
    if (!mouseMode && ready && typeof webgazer !== 'undefined') webgazer.pause();
  }
  /** Resume after pause() */
  function resume() {
    if (!mouseMode && ready && typeof webgazer !== 'undefined') webgazer.resume();
  }

  return { init, enableMouseMode, addListener, removeListener, start, stop, getGaze, isReady, pause, resume };
})();
