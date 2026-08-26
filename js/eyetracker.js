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

  /* ── Smoothing config ───────────────────────────────────── */
  const ALPHA        = 0.07;   // EMA factor — very low = very smooth, less reactive
  const BUF_SIZE     = 12;     // moving-average window (frames)
  const MAX_JUMP_PX  = 280;    // ignore readings that jump more than this (outliers)

  let smX = null, smY = null;
  const bufX = [], bufY = [];

  const listeners = new Set();

  /* ── Internal helpers ───────────────────────────────────── */
  function emit(x, y) {
    if (!active) return;
    listeners.forEach(fn => { try { fn(x, y); } catch(e){} });
  }

  function bufAvg(buf) {
    return buf.reduce((s, v) => s + v, 0) / buf.length;
  }

  function onGazeData(data) {
    if (!data) return;

    /* 1. Outlier rejection — discard readings that jump wildly */
    if (smX !== null) {
      const dist = Math.hypot(data.x - smX, data.y - smY);
      if (dist > MAX_JUMP_PX) return;
    }

    /* 2. Rolling buffer (moving average) */
    bufX.push(data.x); if (bufX.length > BUF_SIZE) bufX.shift();
    bufY.push(data.y); if (bufY.length > BUF_SIZE) bufY.shift();
    const avgX = bufAvg(bufX);
    const avgY = bufAvg(bufY);

    /* 3. Exponential moving average on top of the buffer average */
    smX = smX === null ? avgX : smX + ALPHA * (avgX - smX);
    smY = smY === null ? avgY : smY + ALPHA * (avgY - smY);

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

    webgazer.showPredictionPoints(false);

    /* Enable WebGazer's built-in Kalman filter for extra smoothing */
    if (typeof webgazer.applyKalmanFilter === 'function') {
      webgazer.applyKalmanFilter(true);
    }

    /*
     * WebGazer hardcodes the face-mesh path to './mediapipe/face_mesh'.
     * We copy those files into /mediapipe/face_mesh/ at the project root
     * so the browser can find them at http://localhost:8080/mediapipe/face_mesh/
     */
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
