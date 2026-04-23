const startBtn = document.querySelector("#start-btn");
const introMsg = document.querySelector("#intro-msg");
const screens = {
  intro: document.querySelector("#intro"),
  laser: document.querySelector("#game-laser"),
  memory: document.querySelector("#game-memory"),
  penalty: document.querySelector("#game-penalty"),
  final: document.querySelector("#final")
};
const fxLayer = document.querySelector("#fx-layer");
const trollZone = document.querySelector("#troll-zone");
const puzzleBoard = document.querySelector("#ultras-puzzle");
const laserMsg = document.querySelector("#laser-msg");
const memorySequence = document.querySelector("#memory-sequence");
const memoryGrid = document.querySelector("#memory-grid");
const memoryMsg = document.querySelector("#memory-msg");
const shotButtons = document.querySelectorAll(".shot-btn");
const keeper = document.querySelector("#keeper");
const shotBall = document.querySelector("#shot-ball");
const penaltyMsg = document.querySelector("#penalty-msg");

const trollTexts = [
  "Start",
  "Oops ana hna 👀",
  "Mazal ma chditnich 😏",
  "Derniere chance... peut-etre",
  "Okay daba nbdaw ⚽"
];
const supporterSymbols = ["🟢", "🔵", "🔴", "🏁", "🔥", "🥁", "🎺", "⭐"];

let trollStep = 0;
let escapedClicks = 0;
let selectedMemory = [];
let memoryPattern = [];
let penaltyLocked = false;
let puzzleTiles = [];
let puzzleSolved = false;
let draggedPuzzleIndex = null;

const puzzleImageSrc = "https://i.pinimg.com/1200x/69/8a/8d/698a8d92dfefc0511eea58e8883dfe81.jpg";

boot();

function boot() {
  gsap.from("h1", { y: 24, opacity: 0, duration: 1, ease: "power3.out" });
  gsap.to(".flood-raja", { opacity: 0.9, repeat: -1, yoyo: true, duration: 1.8 });
  gsap.to(".flood-barca", { opacity: 0.88, repeat: -1, yoyo: true, duration: 1.5 });
  gsap.to(".pitch", { boxShadow: "0 0 72px rgba(255,255,255,0.28)", duration: 2, repeat: -1, yoyo: true });
  gsap.to(".screen-panel", { opacity: 0.55, duration: 1, repeat: -1, yoyo: true, stagger: 0.2 });
  setupTrollButton();
}

function setupTrollButton() {
  startBtn.addEventListener("mouseenter", trollMove);
  startBtn.addEventListener("click", (event) => {
    if (trollStep < 4) {
      event.preventDefault();
      trollMove();
      return;
    }
    playTone(620, 0.12);
    introMsg.textContent = "Accepted. Welcome to game mode.";
    startLaserGame();
  });
}

function trollMove() {
  const zoneRect = trollZone.getBoundingClientRect();
  const btnRect = startBtn.getBoundingClientRect();
  const maxX = zoneRect.width - btnRect.width - 8;
  const maxY = zoneRect.height - btnRect.height - 8;
  const nx = Math.random() * Math.max(20, maxX);
  const ny = Math.random() * Math.max(20, maxY);
  gsap.to(startBtn, { left: nx, top: ny, duration: 0.26, ease: "back.out(1.7)" });
  escapedClicks += 1;
  trollStep = Math.min(trollStep + 1, trollTexts.length - 1);
  startBtn.textContent = trollTexts[trollStep];
  introMsg.textContent = `Button escaped ${escapedClicks} times.`;
  playTone(250 + trollStep * 75, 0.08);
  triggerConfetti(10);
}

function startLaserGame() {
  showScreen("laser");
  puzzleSolved = false;
  draggedPuzzleIndex = null;
  laserMsg.textContent = "Recompose l'image (12 pieces) pour unlock le niveau suivant.";
  initPuzzleTiles();
  renderPuzzleBoard();
  ensurePuzzleMixed();
}

function initPuzzleTiles() {
  puzzleTiles = Array.from({ length: 12 }, (_, i) => i);
}

function ensurePuzzleMixed() {
  do {
    shufflePuzzleTiles();
  } while (isPuzzleSolved());
}

function shufflePuzzleTiles() {
  for (let i = puzzleTiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzleTiles[i], puzzleTiles[j]] = [puzzleTiles[j], puzzleTiles[i]];
  }
}

function renderPuzzleBoard() {
  puzzleBoard.innerHTML = "";
  puzzleTiles.forEach((piece, index) => {
    const tile = document.createElement("div");
    tile.className = "puzzle-tile";
    tile.draggable = true;
    tile.dataset.index = String(index);
    tile.style.backgroundImage = `url("${puzzleImageSrc}")`;
    tile.style.backgroundPosition = `${(piece % 4) * 33.333333333333336}% ${Math.floor(piece / 4) * 50}%`;
    tile.addEventListener("dragstart", onPuzzleDragStart);
    tile.addEventListener("dragend", onPuzzleDragEnd);
    tile.addEventListener("dragover", onPuzzleDragOver);
    tile.addEventListener("dragleave", onPuzzleDragLeave);
    tile.addEventListener("drop", onPuzzleDrop);
    puzzleBoard.appendChild(tile);
  });
}

function onPuzzleDragStart(event) {
  if (puzzleSolved) return;
  const index = Number(event.currentTarget.dataset.index);
  draggedPuzzleIndex = index;
  event.currentTarget.classList.add("dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
  playTone(330, 0.05);
}

function onPuzzleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  clearPuzzleDropTargets();
}

function onPuzzleDragOver(event) {
  if (puzzleSolved || draggedPuzzleIndex === null) return;
  event.preventDefault();
  event.currentTarget.classList.add("drop-target");
}

function onPuzzleDragLeave(event) {
  event.currentTarget.classList.remove("drop-target");
}

function onPuzzleDrop(event) {
  if (puzzleSolved || draggedPuzzleIndex === null) return;
  event.preventDefault();
  const targetIndex = Number(event.currentTarget.dataset.index);
  event.currentTarget.classList.remove("drop-target");

  if (targetIndex !== draggedPuzzleIndex) {
    [puzzleTiles[draggedPuzzleIndex], puzzleTiles[targetIndex]] = [puzzleTiles[targetIndex], puzzleTiles[draggedPuzzleIndex]];
    renderPuzzleBoard();
    playTone(440, 0.06);
    if (isPuzzleSolved()) {
      puzzleSolved = true;
      laserMsg.textContent = "Waaa3er! Puzzle kamla. Yallah niveau 2.";
      triggerConfetti(80);
      playTone(740, 0.14);
      setTimeout(startMemoryGame, 900);
    }
  }
  draggedPuzzleIndex = null;
}

function clearPuzzleDropTargets() {
  puzzleBoard.querySelectorAll(".puzzle-tile").forEach((tile) => {
    tile.classList.remove("drop-target");
  });
}

function isPuzzleSolved() {
  return puzzleTiles.every((piece, index) => piece === index);
}

function startMemoryGame() {
  showScreen("memory");
  selectedMemory = [];
  memoryPattern = buildMemoryPattern();
  renderMemoryGrid();
  showMemoryPattern();
}

function buildMemoryPattern() {
  return [...supporterSymbols].sort(() => Math.random() - 0.5).slice(0, 3);
}

function renderMemoryGrid() {
  memoryGrid.innerHTML = "";
  const list = [...supporterSymbols].sort(() => Math.random() - 0.5);
  list.forEach((symbol) => {
    const card = document.createElement("button");
    card.className = "memory-card";
    card.dataset.symbol = symbol;
    card.textContent = "?";
    card.addEventListener("click", () => handleMemoryPick(card));
    memoryGrid.appendChild(card);
  });
}

function showMemoryPattern() {
  memoryMsg.textContent = "Memorise la combinaison...";
  memorySequence.innerHTML = "";
  memoryPattern.forEach((symbol) => {
    const pill = document.createElement("span");
    pill.className = "seq-pill";
    pill.textContent = symbol;
    memorySequence.appendChild(pill);
  });

  const cards = document.querySelectorAll(".memory-card");
  cards.forEach((card) => {
    card.textContent = card.dataset.symbol;
    card.classList.add("reveal");
  });
  setTimeout(() => {
    cards.forEach((card) => {
      card.textContent = "?";
      card.classList.remove("reveal");
    });
    memoryMsg.textContent = "Retrouve les 3 bons symboles (ordre libre).";
  }, 2200);
}

function handleMemoryPick(card) {
  if (selectedMemory.length >= 3 || card.classList.contains("selected")) return;
  card.classList.add("selected");
  card.textContent = card.dataset.symbol;
  selectedMemory.push(card.dataset.symbol);
  playTone(350 + selectedMemory.length * 90, 0.08);

  if (selectedMemory.length === 3) {
    const success = selectedMemory.every((s) => memoryPattern.includes(s));
    if (success) {
      memoryMsg.textContent = "Perfect memory. Penalty time!";
      triggerConfetti(80);
      setTimeout(startPenalty, 900);
    } else {
      memoryMsg.textContent = "Mauvaise combinaison. Retry.";
      playTone(170, 0.1);
      setTimeout(() => {
        selectedMemory = [];
        renderMemoryGrid();
        showMemoryPattern();
      }, 900);
    }
  }
}

function startPenalty() {
  showScreen("penalty");
  penaltyLocked = false;
  penaltyMsg.textContent = "Decisive penalty. Choose your shot.";
  shotButtons.forEach((button) => button.addEventListener("click", takeShot));
}

function takeShot(event) {
  if (penaltyLocked) return;
  penaltyLocked = true;
  const dir = event.currentTarget.dataset.shot;
  const keeperDive = ["left", "center", "right"][Math.floor(Math.random() * 3)];
  const goal = dir !== keeperDive;
  const shotX = dir === "left" ? -180 : dir === "right" ? 180 : 0;
  const diveX = keeperDive === "left" ? -140 : keeperDive === "right" ? 140 : 0;

  gsap.to(keeper, { x: diveX, duration: 0.35, ease: "power2.out" });
  gsap.to(shotBall, {
    x: shotX,
    y: -190,
    scale: 0.66,
    duration: 0.65,
    ease: "power2.out",
    onComplete: () => {
      if (goal) {
        penaltyMsg.textContent = "GOOOOL! Slow motion + stadium blast.";
        playTone(750, 0.16);
        triggerConfetti(150);
        triggerFireworks(50);
        setTimeout(startFinal, 850);
      } else {
        penaltyMsg.textContent = "Saved... birthday magic gives another chance.";
        playTone(180, 0.1);
        gsap.to(shotBall, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.55,
          onComplete: () => {
            penaltyLocked = false;
          }
        });
      }
    }
  });
}

function startFinal() {
  showScreen("final");
  gsap.to("#stadium-bg", { filter: "brightness(1.45) saturate(1.35)", duration: 0.9 });
  triggerConfetti(280);
  triggerFireworks(140);
  launchSmoke();
  burstBallParticles();
  gsap.fromTo(".mega-screen", { opacity: 0, y: 24, scale: 0.84 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(1.3)" });
}

function showScreen(key) {
  Object.keys(screens).forEach((name) => {
    screens[name].classList.add("hidden");
    screens[name].classList.remove("active");
  });
  screens[key].classList.remove("hidden");
  screens[key].classList.add("active");
  gsap.fromTo(screens[key], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" });
}

function triggerConfetti(count) {
  const colors = ["#ffffff", "#004d98", "#a50044", "#f2c14e", "#122f6d"];
  for (let i = 0; i < count; i += 1) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.top = "-24px";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    fxLayer.appendChild(c);
    gsap.to(c, {
      y: window.innerHeight + 120,
      x: (Math.random() - 0.5) * 280,
      rotation: Math.random() * 720,
      duration: 2 + Math.random() * 2,
      ease: "power1.out",
      onComplete: () => c.remove()
    });
  }
}

function launchSmoke() {
  const colors = ["rgba(242,193,78,0.75)", "rgba(58,132,255,0.8)", "rgba(214,42,120,0.8)"];
  for (let i = 0; i < 24; i += 1) {
    const puff = document.createElement("span");
    puff.className = "smoke";
    puff.style.left = `${Math.random() * 100}vw`;
    puff.style.top = `${65 + Math.random() * 20}vh`;
    puff.style.background = colors[Math.floor(Math.random() * colors.length)];
    fxLayer.appendChild(puff);
    gsap.fromTo(
      puff,
      { scale: 0.2, opacity: 0.6 },
      {
        scale: 2.2,
        y: -(80 + Math.random() * 120),
        opacity: 0,
        duration: 1.9 + Math.random(),
        onComplete: () => puff.remove()
      }
    );
  }
}

function triggerFireworks(count) {
  const colors = ["#21d974", "#3ea2ff", "#f54291", "#ffe47f"];
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = `${40 + Math.random() * 20}vw`;
    s.style.top = `${20 + Math.random() * 30}vh`;
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    fxLayer.appendChild(s);
    gsap.fromTo(
      s,
      { scale: 0.2, opacity: 1 },
      {
        x: (Math.random() - 0.5) * 420,
        y: (Math.random() - 0.5) * 280,
        scale: 2,
        opacity: 0,
        duration: 0.85 + Math.random() * 0.6,
        onComplete: () => s.remove()
      }
    );
  }
}

function burstBallParticles() {
  for (let i = 0; i < 80; i += 1) {
    const p = document.createElement("span");
    p.className = "spark";
    p.style.left = "50vw";
    p.style.top = "62vh";
    p.style.background = i % 2 === 0 ? "#ffffff" : "#f2c14e";
    fxLayer.appendChild(p);
    gsap.to(p, {
      x: (Math.random() - 0.5) * 560,
      y: (Math.random() - 0.5) * 440,
      opacity: 0,
      duration: 1.5 + Math.random(),
      onComplete: () => p.remove()
    });
  }
}

function shakeStadium() {
  gsap.to(".screen", { x: "random(-10,10)", y: "random(-6,6)", duration: 0.08, repeat: 4, yoyo: true });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function playTone(freq, duration) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    // Audio may be blocked by browser policies.
  }
}
