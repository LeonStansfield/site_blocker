// Function called when any puzzle is successfully completed
function unlockAccess() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("target");
  if (!target) return;

  let targetHost;
  try {
    targetHost = new URL(target).hostname.toLowerCase();
  } catch (error) {
    return;
  }

  chrome.storage.local.get(['unlockedDomains'], (data) => {
    const unlockedDomains = data.unlockedDomains || {};
    unlockedDomains[targetHost] = Date.now() + (60 * 60 * 1000);
    chrome.storage.local.set({ unlockedDomains }, () => {
      window.location.replace(target);
    });
  });
}

// Randomly pick puzzle 0, 1, or 2
const puzzleChoice = Math.floor(Math.random() * 3);

if (puzzleChoice === 0) {
  initStroopPuzzle();
} else if (puzzleChoice === 1) {
  initMemoryPuzzle();
} else {
  initHoldPuzzle();
}

/* ==========================================================================
   PUZZLE 1: STROOP COLOR TEST
   ========================================================================== */
function initStroopPuzzle() {
  document.getElementById("stroop-container").classList.remove("hidden");
  document.getElementById("puzzle-desc").innerText = "Click the COLOR of the text, not what the word says!";

  const colors = [
    { name: "RED", hex: "#ef4444" },
    { name: "BLUE", hex: "#3b82f6" },
    { name: "GREEN", hex: "#22c55e" },
    { name: "YELLOW", hex: "#eab308" }
  ];

  let currentRound = 1;
  const totalRounds = 5;
  let targetColorHex = "";

  const wordEl = document.getElementById("stroop-word");
  const roundEl = document.getElementById("stroop-round");
  const btnGrid = document.getElementById("stroop-buttons");

  colors.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "color-btn";
    btn.style.backgroundColor = c.hex;
    btn.innerText = c.name;
    btn.addEventListener("click", () => handleChoice(c.hex));
    btnGrid.appendChild(btn);
  });

  function nextRound() {
    if (currentRound > totalRounds) {
      unlockAccess();
      return;
    }
    roundEl.innerText = `Round ${currentRound} of ${totalRounds}`;
    
    const wordObj = colors[Math.floor(Math.random() * colors.length)];
    let colorObj = colors[Math.floor(Math.random() * colors.length)];
    while (colorObj.hex === wordObj.hex) {
      colorObj = colors[Math.floor(Math.random() * colors.length)];
    }

    wordEl.innerText = wordObj.name;
    wordEl.style.color = colorObj.hex;
    targetColorHex = colorObj.hex;
  }

  function handleChoice(selectedHex) {
    if (selectedHex === targetColorHex) {
      currentRound++;
      nextRound();
    } else {
      alert("Wrong color! Restarting test.");
      currentRound = 1;
      nextRound();
    }
  }

  nextRound();
}

/* ==========================================================================
   PUZZLE 2: SEQUENCE MEMORY TEST
   ========================================================================== */
function initMemoryPuzzle() {
  document.getElementById("memory-container").classList.remove("hidden");
  document.getElementById("puzzle-desc").innerText = "Repeat the sequence back correctly.";

  const gridContainer = document.getElementById("memory-grid");
  const statusEl = document.getElementById("memory-status");
  const tiles = [];
  const sequenceLength = 5;
  let sequence = [];
  let userStep = 0;
  let isPlaying = false;

  for (let i = 0; i < 9; i++) {
    const tile = document.createElement("div");
    tile.className = "grid-tile";
    tile.addEventListener("click", () => handleTileClick(i));
    gridContainer.appendChild(tile);
    tiles.push(tile);
  }

  function startPuzzle() {
    sequence = Array.from({ length: sequenceLength }, () => Math.floor(Math.random() * 9));
    userStep = 0;
    playSequence();
  }

  function playSequence() {
    isPlaying = true;
    statusEl.innerText = "Watch carefully...";
    let i = 0;

    const interval = setInterval(() => {
      const tileIndex = sequence[i];
      flashTile(tileIndex);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          isPlaying = false;
          statusEl.innerText = "Your turn! Repeat the pattern.";
        }, 600);
      }
    }, 700);
  }

  function flashTile(index) {
    tiles[index].classList.add("active");
    setTimeout(() => tiles[index].classList.remove("active"), 400);
  }

  function handleTileClick(index) {
    if (isPlaying) return;

    flashTile(index);

    if (index === sequence[userStep]) {
      userStep++;
      if (userStep === sequence.length) {
        unlockAccess();
      }
    } else {
      statusEl.innerText = "Wrong tile! Restarting sequence...";
      setTimeout(startPuzzle, 1000);
    }
  }

  startPuzzle();
}

/* ==========================================================================
   PUZZLE 3: FRICTION HOLD TIMER
   ========================================================================== */
function initHoldPuzzle() {
  document.getElementById("timer-container").classList.remove("hidden");
  document.getElementById("puzzle-desc").innerText = "Hold down the button for 15 seconds without releasing.";

  const btn = document.getElementById("hold-btn");
  const bar = document.getElementById("progress-bar");
  
  const requiredMs = 15000;
  let startTime = null;
  let timerInterval = null;

  function startHold(e) {
    e.preventDefault();
    startTime = Date.now();
    btn.style.background = "#52525b";
    btn.innerText = "Holding...";

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / requiredMs) * 100, 100);
      bar.style.width = pct + "%";

      if (elapsed >= requiredMs) {
        clearInterval(timerInterval);
        unlockAccess();
      }
    }, 50);
  }

  function resetHold() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    bar.style.width = "0%";
    btn.style.background = "#27272a";
    btn.innerText = "Press & Hold (15s)";
  }

  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("mouseup", resetHold);
  btn.addEventListener("mouseleave", resetHold);

  btn.addEventListener("touchstart", startHold);
  btn.addEventListener("touchend", resetHold);
}