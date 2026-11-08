const root = document.documentElement;
const grid = document.getElementById("grid");
const chips = document.getElementById("chips");
const marker = chips.querySelector(".chip-marker");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover)").matches;
const DEFAULT_GLOW = "#ffc629";

document.getElementById("game-count").textContent = GAMES.length;

/* ---------- Game cards ---------- */

function makeImage(src, className, alt = "") {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.className = className;
  img.draggable = false;
  return img;
}

function makeCard(game, index) {
  const card = document.createElement("article");
  card.className = "card" + (game.flashlight ? " flashlight" : "");
  card.dataset.genre = game.genre;
  card.style.setProperty("--c", game.color);
  card.style.setProperty("--i", index);
  card.style.viewTransitionName = "game-" + game.id;

  const cover = document.createElement("div");
  cover.className = "cover" + (game.fullArt ? " full-art" : "");
  cover.append(
    makeImage(game.cover, "cover-blur"),
    makeImage(game.cover, "cover-art", game.title + " cover")
  );
  if (game.flashlight) cover.append(makeImage(game.cover, "cover-art cover-lit"));

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h2");
  title.className = "title";
  title.textContent = game.title;

  const meta = document.createElement("p");
  meta.className = "meta";
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = game.genre;
  meta.append(tag);
  if (game.players) meta.append(game.players);

  const blurb = document.createElement("p");
  blurb.className = "blurb";
  blurb.textContent = game.blurb;

  info.append(title, meta, blurb);
  if (game.play) {
    const play = document.createElement("button");
    play.type = "button";
    play.className = "action play";
    play.innerHTML = '<span class="play-icon" aria-hidden="true"></span>Play now';
    play.addEventListener("click", () => openPlayer(game));
    info.append(play);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Play in browser";
    cover.append(badge);
    cover.classList.add("clickable");
    cover.addEventListener("click", () => openPlayer(game));
  }
  info.append(makeAction(game));
  card.append(cover, info);

  if (canHover && !calm) addTilt(card, cover);
  card.addEventListener("pointerenter", () => root.style.setProperty("--glow", game.color));
  card.addEventListener("pointerleave", () => root.style.setProperty("--glow", DEFAULT_GLOW));
  return card;
}

function makeAction(game) {
  if (game.download) {
    const link = document.createElement("a");
    link.className = "action download";
    link.href = game.download;
    link.textContent = "Download for Mac";
    return link;
  }
  const soon = document.createElement("div");
  soon.className = "action soon";
  soon.textContent = "Coming soon to Mac";
  return soon;
}

function addTilt(card, cover) {
  const MAX_TILT = 7;
  cover.addEventListener("pointermove", (e) => {
    const box = cover.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    card.classList.add("tilting");
    card.style.setProperty("--ty", (x - 0.5) * MAX_TILT * 2 + "deg");
    card.style.setProperty("--tx", (0.5 - y) * MAX_TILT * 2 + "deg");
    card.style.setProperty("--sx", x * 100 + "%");
    card.style.setProperty("--sy", y * 100 + "%");

    const lit = cover.querySelector(".cover-lit");
    if (lit) {
      const art = lit.getBoundingClientRect();
      lit.style.setProperty("--lx", e.clientX - art.left + "px");
      lit.style.setProperty("--ly", e.clientY - art.top + "px");
    }
  });
  cover.addEventListener("pointerleave", () => {
    card.classList.remove("tilting");
    card.style.setProperty("--tx", "0deg");
    card.style.setProperty("--ty", "0deg");
  });
}

const cards = GAMES.map(makeCard);
grid.append(...cards);

/* ---------- Player: games with a web version open in a window on the page ---------- */

const player = document.getElementById("player");
const playerFrame = document.getElementById("player-frame");
const playerTitle = document.getElementById("player-title");

function openPlayer(game) {
  playerTitle.textContent = game.title;
  player.style.setProperty("--c", game.color);
  playerFrame.src = game.play;
  player.showModal();
  playerFrame.addEventListener("load", () => playerFrame.focus(), { once: true });
}

function closePlayer() {
  player.close();
}

// The game uses ESC itself, so ESC must not close the window.
player.addEventListener("cancel", (e) => e.preventDefault());
// Stop the game and its sounds when the window closes.
player.addEventListener("close", () => { playerFrame.src = "about:blank"; });
document.getElementById("player-close").addEventListener("click", closePlayer);
document.getElementById("player-full").addEventListener("click", () => {
  playerFrame.requestFullscreen?.();
  playerFrame.focus();
});

/* ---------- Genre filter ---------- */

const genres = ["All", ...new Set(GAMES.map((g) => g.genre))];

const chipButtons = genres.map((genre) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.dataset.genre = genre;
  button.setAttribute("aria-pressed", genre === "All");
  const count = genre === "All" ? GAMES.length : GAMES.filter((g) => g.genre === genre).length;
  const small = document.createElement("small");
  small.textContent = count;
  button.append(genre, small);
  button.addEventListener("click", () => pickGenre(genre));
  chips.append(button);
  return button;
});

function moveMarker() {
  const active = chips.querySelector('[aria-pressed="true"]');
  marker.style.width = active.offsetWidth + "px";
  marker.style.transform = `translateX(${active.offsetLeft}px)`;
}

function pickGenre(genre) {
  chipButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.genre === genre));
  moveMarker();
  chips.querySelector('[aria-pressed="true"]').scrollIntoView({ block: "nearest", inline: "nearest" });

  const apply = () => {
    cards.forEach((card) => {
      card.style.animation = "none";
      card.hidden = genre !== "All" && card.dataset.genre !== genre;
    });
  };
  if (document.startViewTransition && !calm) document.startViewTransition(apply);
  else apply();
}

moveMarker();
addEventListener("resize", moveMarker);
document.fonts?.ready.then(moveMarker);

/* ---------- The two O's in COOP are eyes that watch the cursor ---------- */

const eyes = [...document.querySelectorAll(".eye")];
let pointer = null;
let frame = 0;

const mascot = document.querySelector(".mascot");

function lookAt(x, y) {
  const box = mascot.getBoundingClientRect();
  const lean = Math.max(-1, Math.min(1, (x - (box.left + box.width / 2)) / (innerWidth / 2)));
  mascot.style.setProperty("--lean", lean * 10 + "deg");

  for (const eye of eyes) {
    const box = eye.getBoundingClientRect();
    const dx = x - (box.left + box.width / 2);
    const dy = y - (box.top + box.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.min(distance, box.width * 0.24);
    const pupil = eye.firstElementChild;
    pupil.style.transform = `translate(${(dx / distance) * reach}px, ${(dy / distance) * reach}px)`;
  }
}

addEventListener("pointermove", (e) => {
  pointer = e;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    root.style.setProperty("--mx", pointer.clientX + "px");
    root.style.setProperty("--my", pointer.clientY + "px");
    lookAt(pointer.clientX, pointer.clientY);
  });
}, { passive: true });

if (!calm) {
  const blink = () => {
    eyes.forEach((eye) => eye.classList.add("blink"));
    setTimeout(() => eyes.forEach((eye) => eye.classList.remove("blink")), 130);
    setTimeout(blink, 2400 + Math.random() * 4200);
  };
  setTimeout(blink, 1800);
}

// Start out looking down at the games.
lookAt(innerWidth / 2, innerHeight);
