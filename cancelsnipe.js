(() => {
  // Remove if already exists
  const oldUI = document.getElementById('snipeUIConsole');
  if (oldUI) oldUI.remove();

  const style = document.createElement('style');
  style.textContent = `
    #snipeUIConsole {
      position: fixed;
      top: 100px;
      left: 100px;
      background: #121212;
      border: 1px solid #5a3e1b;
      border-radius: 6px;
      padding: 8px 10px;
      z-index: 999999;
      font-family: monospace;
      color: #eee;
      width: 240px;
      user-select: none;
      box-shadow: 0 0 8px #a4713f88;
      cursor: move;
      font-size: 12px;
    }
    #snipeUIConsole label {
      display: block;
      margin-top: 6px;
      font-weight: 600;
      user-select: text;
      color: #d6b87a;
    }
    #snipeUIConsole input[type="text"] {
      width: 100%;
      font-family: monospace;
      font-size: 12px;
      padding: 3px 5px;
      box-sizing: border-box;
      border: 1px solid #6d4b21;
      border-radius: 3px;
      margin-top: 2px;
      background: #2a1f0b;
      color: #f3e4b7;
    }
    #snipeUIConsole input[type="text"]::placeholder {
      color: #8b6b3e;
    }
    #snipeUIConsole div.countdown {
      font-size: 14px;
      margin-top: 4px;
      color: #b58934;
      background: #2a1f0b;
      border-radius: 4px;
      padding: 4px 6px;
      text-align: center;
      user-select: text;
      font-weight: 700;
    }
    #snipeUIConsole .buttons-row {
      margin-top: 8px;
      display: flex;
      gap: 6px;
      justify-content: space-between;
    }
    #snipeUIConsole button {
      background: transparent;
      border: 1px solid #a4713f;
      padding: 3px 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      color: #a4713f;
      user-select: none;
      border-radius: 4px;
      transition: background-color 0.2s ease, color 0.2s ease;
      flex: 1;
    }
    #snipeUIConsole button:hover {
      background-color: #a4713f;
      color: #121212;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'snipeUIConsole';
  container.innerHTML = `
    <label>🎯 Arrival: <input type="text" id="arrivalInput" placeholder="HH:mm:ss:ms" value="14:30:00:120" /></label>
    <label>🚀 Launch time: <div id="launchTime" style="min-height:18px; margin-top:2px;"></div></label>
    <label>🛑 Cancel time: <div id="cancelTime" style="min-height:18px; margin-top:2px;"></div></label>
    <label>🚀 Launch countdown: <div id="launchCountdown" class="countdown">00:00:00:000</div></label>
    <label>⏳ Cancel countdown: <div id="cancelCountdown" class="countdown">00:00:00:000</div></label>
    <div class="buttons-row">
      <button id="startBtn">▶️ Start</button>
      <button id="pauseBtn">⏸ Pause</button>
      <button id="copyCancelBtn">📋 Copy</button>
      <button id="resetBtn">🔄 Reset</button>
    </div>
  `;
  document.body.appendChild(container);

  // Drag functionality (same as before)
  (() => {
    let pos = { top: 0, left: 0, x: 0, y: 0 };
    const el = container;

    const mouseDownHandler = function (e) {
      pos = {
        left: el.offsetLeft,
        top: el.offsetTop,
        x: e.clientX,
        y: e.clientY,
      };
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const mouseMoveHandler = function (e) {
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      el.style.left = `${pos.left + dx}px`;
      el.style.top = `${pos.top + dy}px`;
    };
    const mouseUpHandler = function () {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      el.style.cursor = 'move';
      el.style.userSelect = 'auto';
    };
    el.addEventListener('mousedown', mouseDownHandler);
  })();

  const arrivalInput = container.querySelector('#arrivalInput');
  const launchTimeEl = container.querySelector('#launchTime');
  const cancelTimeEl = container.querySelector('#cancelTime');
  const launchCountdownEl = container.querySelector('#launchCountdown');
  const cancelCountdownEl = container.querySelector('#cancelCountdown');

  const startBtn = container.querySelector('#startBtn');
  const pauseBtn = container.querySelector('#pauseBtn');
  const copyCancelBtn = container.querySelector('#copyCancelBtn');
  const resetBtn = container.querySelector('#resetBtn');

  const beepLaunch = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAACQ=");
  const beepCancel = new Audio("data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAA==");

  function playBeep(type) {
    if (type === 'launch') {
      beepLaunch.currentTime = 0;
      beepLaunch.play().catch(() => { });
    } else {
      beepCancel.currentTime = 0;
      beepCancel.play().catch(() => { });
    }
  }

  function parseTimeString(str) {
    const parts = str.trim().split(':');
    if (parts.length < 3) return null;
    let [h, m, s, ms] = parts;
    h = parseInt(h); m = parseInt(m); s = parseInt(s); ms = ms ? parseInt(ms) : 0;
    if ([h, m, s, ms].some(n => isNaN(n))) return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s, ms);
  }

  function formatTimeWithMs(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}:${ms}`;
  }
  function formatTimeNoMs(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    const h = Math.floor(ms / 3600000);
    ms -= h * 3600000;
    const m = Math.floor(ms / 60000);
    ms -= m * 60000;
    const s = Math.floor(ms / 1000);
    ms -= s * 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
  }

  function calculateTimes(arrivalDate) {
  const reactionMs = 10_000;
  const maxSnipeMs = 480_000;
  const now = new Date();
  let diff = arrivalDate - now;
  let snipeWindowMs;

  if (diff > maxSnipeMs + reactionMs) {
    snipeWindowMs = maxSnipeMs;
  } else {
    let available = diff - reactionMs;
    snipeWindowMs = available <= 0 ? 0 : 2 * Math.floor(available / 2);
  }

  // Calculate initial launchTimeMs
  let launchTimeMs = arrivalDate.getTime() - snipeWindowMs;

  // Adjust launchTimeMs so (arrivalDate - launchTimeMs) divisible by 2000 (2 seconds)
  const totalTravelMs = arrivalDate.getTime() - launchTimeMs;
  const remainder = totalTravelMs % 2000;
  if (remainder !== 0) {
    launchTimeMs += remainder; // Move launchTime forward to nearest divisible by 2000 travel time
  }

  // Set launch milliseconds = arrival ms + 20 (mod 1000)
  const arrivalMs = arrivalDate.getMilliseconds();
  const launchDate = new Date(launchTimeMs);
  launchDate.setMilliseconds((arrivalMs + 20) % 1000);

  // Cancel time is midpoint between launch and arrival, rounded to nearest second
  const cancelTimeMs = Math.round((launchDate.getTime() + arrivalDate.getTime()) / 2 / 1000) * 1000;

  return {
    launch: launchDate,
    cancel: new Date(cancelTimeMs),
  };
}



  let times = null;
  let timer = null;
  let paused = false;
  let countdownStarted = false;

  function updateDisplay() {
    if (!times) return;
    const now = new Date();
    const launchDiff = times.launch - now;
    const cancelDiff = times.cancel - now;
    if (launchDiff <= 0) countdownStarted = true;

    launchTimeEl.textContent = formatTimeWithMs(times.launch);
    cancelTimeEl.textContent = formatTimeNoMs(times.cancel);

    launchCountdownEl.textContent = launchDiff > 0 ? formatCountdown(launchDiff) : '00:00:00:000';
    cancelCountdownEl.textContent = countdownStarted ? formatCountdown(cancelDiff) : '00:00:00:000';

    if (!paused && launchDiff <= 0 && !launchCountdownEl.classList.contains('beeped-launch')) {
      playBeep('launch');
      launchCountdownEl.classList.add('beeped-launch');
    }
    if (!paused && cancelDiff <= 0 && !cancelCountdownEl.classList.contains('beeped-cancel')) {
      playBeep('cancel');
      cancelCountdownEl.classList.add('beeped-cancel');
    }
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    paused = false;
    countdownStarted = false;
    launchCountdownEl.classList.remove('beeped-launch');
    cancelCountdownEl.classList.remove('beeped-cancel');

    const arrivalDate = parseTimeString(arrivalInput.value);
    if (!arrivalDate) {
      alert('Invalid arrival time. Use HH:mm:ss:ms');
      return;
    }
    times = calculateTimes(arrivalDate);
    updateDisplay();

    timer = setInterval(() => {
      if (!paused) updateDisplay();
    }, 40);
  }

  function pauseTimer() {
    paused = true;
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    paused = false;
    countdownStarted = false;
    times = null;
    launchTimeEl.textContent = '';
    cancelTimeEl.textContent = '';
    launchCountdownEl.textContent = '00:00:00:000';
    cancelCountdownEl.textContent = '00:00:00:000';
    launchCountdownEl.classList.remove('beeped-launch');
    cancelCountdownEl.classList.remove('beeped-cancel');
  }

  function copyCancelTime() {
    if (!times) return;
    const cancelStr = formatTimeNoMs(times.cancel);
    navigator.clipboard.writeText(cancelStr).then(() => {
      alert(`Cancel time copied: ${cancelStr}`);
    }).catch(() => {
      alert('Copy failed.');
    });
  }

  startBtn.onclick = () => startTimer();
  pauseBtn.onclick = () => pauseTimer();
  resetBtn.onclick = () => resetTimer();
  copyCancelBtn.onclick = () => copyCancelTime();
})();
