/* ============================================================================
   MYSTERY BOX — Arcade RPG Edition (game.js)
   Expects items.json in the same folder.
   ============================================================================ */

const SAVE_KEY = 'mysterybox.rpg.v1';
const FINAL_LOCKDOWN_AT = 30;
const MAX_HINTS = 10;

const CFG = {
  wrongPenalty: 15,
  letterCost: 20,
  categoryCost: 15
};

/* ---------- 32 RPG AWARDS (Accuracy, Hints, Streaks, Levels, Collection) ---------- */
const AWARDS = [
  { id: 'first_box',    icon: '📦', name: 'First Unboxing',    desc: 'Solve your very first Mystery Box.' },
  { id: 'blind_1',      icon: '🧠', name: 'Psychic Hero',      desc: 'Solve a box with 0 hints (+100 pts).' },
  { id: 'blind_5',      icon: '👁️', name: 'Third Eye',         desc: 'Solve 5 boxes with 0 hints.' },
  { id: 'blind_15',     icon: '🔮', name: 'Arcane Oracle',     desc: 'Solve 15 boxes with 0 hints.' },
  { id: 'one_clue',     icon: '⚡', name: 'Quick Draw',        desc: 'Solve a box using only 1 hint (+90 pts).' },
  { id: 'low_hints_10', icon: '🎯', name: 'Sharp Scout',       desc: 'Solve 10 boxes using 3 or fewer hints.' },
  { id: 'zero_pt_win',  icon: '😅', name: '10th-Hour Hero',    desc: 'Solve a box yourself after all 10 hints (0 pts).' },
  { id: 'purist_10',    icon: '🚫', name: 'No Potions',        desc: 'Solve 10 boxes without 1st Letter or Category.' },
  { id: 'perfect_1',    icon: '✨', name: 'Clean Strike',      desc: 'Solve a box with zero wrong guesses.' },
  { id: 'perfect_5',    icon: '🛡️', name: 'Iron Shield',       desc: 'Solve 5 boxes in a row with 0 wrong guesses.' },
  { id: 'perfect_10',   icon: '⚔️', name: 'Master Knight',     desc: 'Solve 10 boxes in a row with 0 wrong guesses.' },
  { id: 'perfect_20',   icon: '🐉', name: 'Dragon Slayer',     desc: 'Solve 20 boxes in a row with 0 wrong guesses.' },
  { id: 'persistent',   icon: '🐢', name: 'Never Surrender',   desc: 'Solve a box after 4 or more wrong guesses.' },
  { id: 'curious_cat',  icon: '🗝️', name: 'Curious Explorer',  desc: 'Reveal a Mystery Box after using all 10 hints.' },
  { id: 'phoenix',      icon: '🐦', name: 'Phoenix Feather',   desc: 'Reveal a box, then solve the next in <= 1 hint.' },
  { id: 'streak_3',     icon: '🔥', name: 'Combo x3',          desc: 'Reach a 3-win streak.' },
  { id: 'streak_5',     icon: '💥', name: 'Combo x5',          desc: 'Reach a 5-win streak.' },
  { id: 'streak_10',    icon: '🌩️', name: 'Combo x10',         desc: 'Reach a 10-win streak.' },
  { id: 'streak_20',    icon: '🌟', name: 'Combo x20',         desc: 'Reach a 20-win streak.' },
  { id: 'streak_30',    icon: '👑', name: 'Combo Monarch',     desc: 'Reach a 30-win streak.' },
  { id: 'lvl_2',        icon: '⭐', name: 'Box Apprentice',    desc: 'Reach RPG Level 2.' },
  { id: 'lvl_5',        icon: '🎖️', name: 'Tavern Scout',      desc: 'Reach RPG Level 5.' },
  { id: 'lvl_10',       icon: '🏅', name: 'Treasure Hunter',   desc: 'Reach RPG Level 10.' },
  { id: 'lvl_15',       icon: '💎', name: 'Guild Champion',    desc: 'Reach RPG Level 15.' },
  { id: 'lvl_20',       icon: '🚀', name: 'Arcane Sage',       desc: 'Reach RPG Level 20.' },
  { id: 'lvl_25',       icon: '🛸', name: 'Mythic Explorer',   desc: 'Reach RPG Level 25.' },
  { id: 'lvl_30',       icon: '🏆', name: 'Grand Boxmaster',   desc: 'Reach RPG Level 30.' },
  { id: 'solved_25',    icon: '💰', name: 'Quarter Vault',     desc: 'Solve 25 Mystery Boxes.' },
  { id: 'solved_50',    icon: '💎', name: 'Half Hoard',        desc: 'Solve 50 Mystery Boxes.' },
  { id: 'solved_100',   icon: '💯', name: 'Centurion',         desc: 'Solve 100 Mystery Boxes.' },
  { id: 'final_30',     icon: '🔒', name: 'Final Dungeon',     desc: 'Reach the Final 30 Blind Lockdown.' },
  { id: 'master_all',   icon: '🌍', name: 'Box Legend',        desc: 'Clear every Mystery Box in the catalog.' }
];

/* ---------- STATE ---------- */
let ALL_ITEMS = [];
let ITEM_BY_ID = new Map();
let currentItem = null;

function defaultState() {
  return {
    score: 0,
    bestScore: 0,
    exp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    playedIds: [],
    solvedIds: [],
    unlockedAwards: [],
    soundOn: true,
    stats: {
      zeroHintWins: 0,
      oneHintWins: 0,
      lowHintWins: 0,
      noLifelineWins: 0,
      perfectStreak: 0,
      lastRoundRevealed: false
    },
    activeRound: null
  };
}

let S = defaultState();

/* ---------- DOM CACHE ---------- */
const el = {
  score: document.getElementById('score-val'),
  streak: document.getElementById('streak-val'),
  rankBadge: document.getElementById('rank-badge'),
  levelBadge: document.getElementById('level-badge'),
  expText: document.getElementById('exp-text'),
  expFill: document.getElementById('exp-fill'),
  deckLabel: document.getElementById('deck-progress-label'),
  awardsBtn: document.getElementById('awards-btn'),
  awardsCount: document.getElementById('awards-count'),
  soundBtn: document.getElementById('sound-btn'),
  fsBtn: document.getElementById('fullscreen-btn'),
  menuBtn: document.getElementById('menu-btn'),

  rewardVal: document.getElementById('reward-val'),
  remainingPill: document.getElementById('remaining-pill'),
  lifelineTags: document.getElementById('lifeline-tags'),
  clueCard: document.getElementById('clue-card'),
  cardStatus: document.getElementById('card-status'),
  cardCostTag: document.getElementById('card-cost-tag'),
  cardArt: document.getElementById('card-art'),
  cardText: document.getElementById('card-text'),
  cardSub: document.getElementById('card-sub'),
  prevCardBtn: document.getElementById('prev-card-btn'),
  nextCardBtn: document.getElementById('next-card-btn'),
  cardPips: document.getElementById('card-pips'),

  showHintBtn: document.getElementById('show-hint-btn'),
  letterBtn: document.getElementById('letter-btn'),
  categoryBtn: document.getElementById('category-btn'),

  suspectTitle: document.getElementById('suspect-header-title'),
  matchCount: document.getElementById('match-count'),
  searchWrap: document.getElementById('search-wrap'),
  searchInput: document.getElementById('search-input'),
  clearBtn: document.getElementById('clear-btn'),
  itemList: document.getElementById('item-list'),

  blindWrap: document.getElementById('blind-wrap'),
  blindForm: document.getElementById('blind-form'),
  blindInput: document.getElementById('blind-input'),
  blindFeedback: document.getElementById('blind-feedback'),
  blindWrongList: document.getElementById('blind-wrong-list'),

  toastStack: document.getElementById('toast-stack'),

  startOverlay: document.getElementById('start-overlay'),
  startStats: document.getElementById('start-stats'),
  startBtn: document.getElementById('start-btn'),

  revealConfirmOverlay: document.getElementById('reveal-confirm-overlay'),
  confirmRevealYes: document.getElementById('confirm-reveal-yes'),
  confirmRevealNo: document.getElementById('confirm-reveal-no'),

  resultOverlay: document.getElementById('result-overlay'),
  resEmoji: document.getElementById('res-emoji'),
  resTitle: document.getElementById('res-title'),
  resItem: document.getElementById('res-item'),
  resDelta: document.getElementById('res-delta'),
  resExp: document.getElementById('res-exp'),
  resSub: document.getElementById('res-sub'),
  resAwards: document.getElementById('res-awards'),
  nextRoundBtn: document.getElementById('next-round-btn'),

  completeOverlay: document.getElementById('complete-overlay'),
  completeStats: document.getElementById('complete-stats'),
  replayDeckBtn: document.getElementById('replay-deck-btn'),
  fullResetBtn: document.getElementById('full-reset-btn'),

  awardsOverlay: document.getElementById('awards-overlay'),
  awardsSummary: document.getElementById('awards-summary'),
  awardsGrid: document.getElementById('awards-grid'),
  closeAwardsBtn: document.getElementById('close-awards-btn'),

  menuOverlay: document.getElementById('menu-overlay'),
  menuStatsGrid: document.getElementById('menu-stats-grid'),
  resetDeckBtn: document.getElementById('reset-deck-btn'),
  wipeSaveBtn: document.getElementById('wipe-save-btn'),
  closeMenuBtn: document.getElementById('close-menu-btn'),

  loadErrorOverlay: document.getElementById('load-error-overlay'),
  loadErrorMsg: document.getElementById('load-error-msg'),
  manualJsonInput: document.getElementById('manual-json-input'),
  retryFetchBtn: document.getElementById('retry-fetch-btn')
};

/* ============================================================================
   CARTOON RPG AUDIO SYNTH
   ============================================================================ */
let audioCtx = null;
function playTone(freq, dur, type, vol, slideTo) {
  if (!S.soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol || 0.055, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch (_) {}
}

const sfx = {
  click:  () => playTone(580, 0.06, 'triangle', 0.045),
  flip:   () => playTone(740, 0.06, 'sine', 0.04, 920),
  hint:   () => playTone(520, 0.11, 'triangle', 0.05, 860),
  perk:   () => { playTone(660, 0.08, 'triangle', 0.05); setTimeout(() => playTone(940, 0.09, 'triangle', 0.05), 70); },
  wrong:  () => playTone(210, 0.22, 'sawtooth', 0.045, 110),
  reveal: () => { playTone(440, 0.12, 'triangle', 0.05); setTimeout(() => playTone(350, 0.2, 'triangle', 0.05), 110); },
  win:    () => { playTone(587, 0.09, 'triangle', 0.06); setTimeout(() => playTone(784, 0.1, 'triangle', 0.06), 85); setTimeout(() => playTone(1046, 0.2, 'triangle', 0.07), 180); },
  award:  () => { playTone(880, 0.08, 'sine', 0.06); setTimeout(() => playTone(1174, 0.12, 'sine', 0.06), 90); setTimeout(() => playTone(1567, 0.22, 'sine', 0.07), 190); }
};

/* ============================================================================
   HELPERS & STORAGE
   ============================================================================ */
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const base = defaultState();
    S = {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats || {}) }
    };
  } catch (_) {
    S = defaultState();
  }
}

function expNeeded(lvl) {
  return 60 + lvl * 50;
}

function rpgRank(lvl) {
  if (lvl >= 30) return 'Boxmaster';
  if (lvl >= 25) return 'Mythic';
  if (lvl >= 20) return 'Sage';
  if (lvl >= 15) return 'Champion';
  if (lvl >= 10) return 'Hunter';
  if (lvl >= 6)  return 'Seeker';
  if (lvl >= 3)  return 'Scout';
  return 'Apprentice';
}

function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['’`\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function remainingItems() {
  const played = new Set(S.playedIds);
  return ALL_ITEMS.filter(it => !played.has(it.id));
}

function isLockdownMode() {
  return remainingItems().length <= FINAL_LOCKDOWN_AT;
}

function currentReward() {
  if (!S.activeRound) return 100;
  return Math.max(0, 100 - S.activeRound.hintsRevealed * 10);
}

function flashEl(node) {
  node.classList.remove('flash');
  void node.offsetWidth;
  node.classList.add('flash');
}

function showToast(icon, title, name) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = `<div class="t-ico">${icon}</div><div><div class="t-title">${title}</div><div class="t-name">${name}</div></div>`;
  el.toastStack.appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity 0.3s'; }, 3000);
  setTimeout(() => div.remove(), 3350);
}

/* ============================================================================
   RENDER HUD & CLUE CARD
   ============================================================================ */
function renderHud() {
  el.score.textContent = S.score;
  el.streak.textContent = `${S.streak} 🔥`;
  el.rankBadge.textContent = rpgRank(S.level);

  const req = expNeeded(S.level);
  const pct = Math.min(100, Math.round((S.exp / req) * 100));
  el.levelBadge.textContent = `LVL ${S.level}`;
  el.expText.textContent = `${S.exp} / ${req} EXP`;
  el.expFill.style.width = `${pct}%`;

  const rem = remainingItems().length;
  el.deckLabel.textContent = `${S.playedIds.length}/${ALL_ITEMS.length} OPENED`;
  el.awardsCount.textContent = `${S.unlockedAwards.length}/${AWARDS.length}`;
  el.soundBtn.textContent = S.soundOn ? '🔊' : '🔇';

  if (rem <= FINAL_LOCKDOWN_AT) {
    el.remainingPill.textContent = `🔒 FINAL ${rem}`;
    el.remainingPill.classList.add('lockdown');
  } else {
    el.remainingPill.textContent = `${rem} LEFT`;
    el.remainingPill.classList.remove('lockdown');
  }
}

function renderCard(animateFlip) {
  const r = S.activeRound;
  if (!r || !currentItem) return;

  const pts = currentReward();
  el.rewardVal.textContent = `BOUNTY: +${pts} PTS`;
  el.rewardVal.classList.toggle('zero', pts === 0);

  const tags = [];
  if (r.usedLetter) tags.push(`🔤 Starts with "${currentItem.name.charAt(0).toUpperCase()}"`);
  if (r.usedCategory) tags.push(`🏷️ Category: ${currentItem.category}`);
  el.lifelineTags.innerHTML = tags.map(t => `<span class="l-tag">${t}</span>`).join('');

  if (animateFlip) {
    el.clueCard.classList.remove('card-flip');
    void el.clueCard.offsetWidth;
    el.clueCard.classList.add('card-flip');
  }

  const allUsed = r.hintsRevealed >= MAX_HINTS;
  el.clueCard.classList.toggle('blind-ready', r.hintsRevealed === 0);
  el.clueCard.classList.toggle('all-used', allUsed);

  if (r.hintsRevealed === 0) {
    el.cardStatus.textContent = 'SEALED BOX · 0/10 CLUES';
    el.cardCostTag.textContent = 'NEXT CLUE: −10 PTS';
    el.cardArt.classList.remove('hidden');
    el.cardText.className = 'card-text-plain';
    el.cardText.textContent = "What's hidden inside the Mystery Box?";
    el.cardSub.textContent = 'Guess blindly right now for +100 PTS, or click SHOW HINT #1!';
  } else {
    const idx = r.cardIndex;
    el.cardStatus.textContent = `CLUE #${idx + 1} OF ${r.hintsRevealed} REVEALED`;
    el.cardCostTag.textContent = !allUsed
      ? `NEXT CLUE #${r.hintsRevealed + 1}: −10 PTS`
      : 'ALL 10 CLUES FINISHED';
    el.cardArt.classList.add('hidden');
    el.cardText.className = 'scroll-tag';
    el.cardText.textContent = currentItem.hints[idx];
    el.cardSub.textContent = allUsed
      ? 'All 10 hints finished! Still stuck? Click "REVEAL ITEM?" below to open the box.'
      : (r.hintsRevealed > 1 ? 'Use < and > to flip through unlocked clues.' : 'Draw another clue or accuse an item!');
  }

  // < and > card navigation
  el.prevCardBtn.disabled = r.hintsRevealed === 0 || r.cardIndex <= 0;
  el.nextCardBtn.disabled = r.hintsRevealed === 0 || r.cardIndex >= r.hintsRevealed - 1;

  // Clickable 10 pips
  el.cardPips.innerHTML = '';
  for (let i = 0; i < MAX_HINTS; i++) {
    const pip = document.createElement('button');
    pip.type = 'button';
    pip.className = 'pip';
    if (i < r.hintsRevealed) {
      pip.classList.add('revealed');
      pip.title = `Clue #${i + 1}`;
      pip.addEventListener('click', () => {
        r.cardIndex = i;
        saveState();
        sfx.flip();
        renderCard(true);
      });
    }
    if (r.hintsRevealed > 0 && i === r.cardIndex) {
      pip.classList.add('current');
    }
    el.cardPips.appendChild(pip);
  }

  // Action buttons
  const active = !r.over;
  el.showHintBtn.disabled = !active;
  if (allUsed) {
    el.showHintBtn.classList.remove('hint-btn');
    el.showHintBtn.classList.add('reveal-mode');
    el.showHintBtn.innerHTML = '<span>📦 REVEAL ITEM?</span><small>OPEN BOX (0 PTS)</small>';
  } else {
    el.showHintBtn.classList.remove('reveal-mode');
    el.showHintBtn.classList.add('hint-btn');
    el.showHintBtn.innerHTML = `<span>SHOW HINT #${r.hintsRevealed + 1}</span><small>−10 PTS</small>`;
  }

  el.letterBtn.disabled = !active || r.usedLetter;
  el.letterBtn.innerHTML = r.usedLetter
    ? '<span>1ST LETTER</span><small>USED</small>'
    : '<span>1ST LETTER</span><small>−20 PTS</small>';

  el.categoryBtn.disabled = !active || r.usedCategory;
  el.categoryBtn.innerHTML = r.usedCategory
    ? '<span>CATEGORY</span><small>USED</small>'
    : '<span>CATEGORY</span><small>−15 PTS</small>';
}

/* ============================================================================
   RENDER SUSPECT CATALOG / FINAL 30 BLIND MODE
   ============================================================================ */
function buildHighlightedLabel(name, query) {
  const frag = document.createDocumentFragment();
  if (!query) {
    frag.appendChild(document.createTextNode(name));
    return frag;
  }
  const idx = name.toLowerCase().indexOf(query);
  if (idx === -1) {
    frag.appendChild(document.createTextNode(name));
    return frag;
  }
  if (idx > 0) frag.appendChild(document.createTextNode(name.slice(0, idx)));
  const mark = document.createElement('mark');
  mark.textContent = name.slice(idx, idx + query.length);
  frag.appendChild(mark);
  if (idx + query.length < name.length) frag.appendChild(document.createTextNode(name.slice(idx + query.length)));
  return frag;
}

function renderSuspectPanel(keepScroll = false) {
  const pool = remainingItems();
  const lockdown = pool.length <= FINAL_LOCKDOWN_AT;
  const r = S.activeRound;

  if (lockdown) {
    el.searchWrap.classList.add('hidden');
    el.blindWrap.classList.remove('hidden');
    el.suspectTitle.textContent = '🔒 Final 30 Lockdown';
    el.matchCount.textContent = `${pool.length} hidden boxes left`;

    el.blindInput.disabled = !r || r.over;
    el.blindWrongList.innerHTML = r
      ? r.wrongGuesses.map(w => `<span class="wrong-chip">${w}</span>`).join('')
      : '';
    return;
  }

  el.blindWrap.classList.add('hidden');
  el.searchWrap.classList.remove('hidden');
  el.suspectTitle.textContent = 'Mystery Catalog';

  const raw = el.searchInput.value.trim();
  const q = raw.toLowerCase();
  el.clearBtn.classList.toggle('hidden', el.searchInput.value.length === 0);

  let matches = pool;
  if (q) {
    matches = pool.filter(it => it.name.toLowerCase().includes(q));
    matches.sort((a, b) => {
      const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
      const as = an.startsWith(q) ? 0 : 1;
      const bs = bn.startsWith(q) ? 0 : 1;
      if (as !== bs) return as - bs;
      const ai = an.indexOf(q), bi = bn.indexOf(q);
      if (ai !== bi) return ai - bi;
      return an.localeCompare(bn);
    });
  } else {
    matches = pool.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  el.matchCount.textContent = raw
    ? `${matches.length} match${matches.length === 1 ? '' : 'es'} of ${pool.length}`
    : `${pool.length} items remaining`;

  const prevScroll = el.itemList.scrollTop;
  const frag = document.createDocumentFragment();
  const wrongSet = new Set(r ? r.wrongGuesses : []);

  if (matches.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = `No remaining item matches "${raw}". (Already-finished items are removed from the list.)`;
    frag.appendChild(empty);
  } else {
    matches.forEach(it => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suspect-btn';
      btn.dataset.name = it.name;

      if (wrongSet.has(it.name)) btn.classList.add('dead');
      if (r && r.over && r.won && currentItem && it.id === currentItem.id) btn.classList.add('correct');

      const span = document.createElement('span');
      span.className = 'nm';
      span.appendChild(buildHighlightedLabel(it.name, q));
      btn.appendChild(span);

      btn.addEventListener('click', () => submitGuess(it.name));
      frag.appendChild(btn);
    });
  }

  el.itemList.innerHTML = '';
  el.itemList.appendChild(frag);
  el.itemList.scrollTop = keepScroll ? prevScroll : 0;
}

/* ============================================================================
   ROUND LIFECYCLE
   ============================================================================ */
function startNewRound() {
  const pool = remainingItems();
  if (pool.length === 0) {
    showCompleteModal();
    return;
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  currentItem = picked;
  S.activeRound = {
    itemId: picked.id,
    hintsRevealed: 0,
    cardIndex: -1,
    wrongGuesses: [],
    usedLetter: false,
    usedCategory: false,
    over: false,
    won: false
  };
  saveState();

  el.searchInput.value = '';
  el.blindInput.value = '';
  el.blindFeedback.textContent = '';

  renderHud();
  renderCard(true);
  renderSuspectPanel();

  if (pool.length <= FINAL_LOCKDOWN_AT && !S.unlockedAwards.includes('final_30')) {
    unlockAward('final_30');
    saveState();
    renderHud();
  }
}

function hydrateSavedRound() {
  if (!S.activeRound) return false;
  const item = ITEM_BY_ID.get(S.activeRound.itemId);
  const played = new Set(S.playedIds);
  if (!item || played.has(item.id) || S.activeRound.over) {
    S.activeRound = null;
    currentItem = null;
    saveState();
    return false;
  }
  currentItem = item;
  return true;
}

/* ============================================================================
   ACTIONS
   ============================================================================ */
function handlePrimaryCardAction() {
  const r = S.activeRound;
  if (!r || r.over) return;

  // When all 10 hints are finished, ask whether to reveal the Mystery Box item
  if (r.hintsRevealed >= MAX_HINTS) {
    sfx.click();
    el.revealConfirmOverlay.classList.remove('hidden');
    return;
  }

  r.hintsRevealed++;
  r.cardIndex = r.hintsRevealed - 1;
  saveState();
  sfx.hint();
  renderCard(true);
  renderHud();
}

function confirmRevealBox() {
  const r = S.activeRound;
  if (!r || r.over || !currentItem) return;

  el.revealConfirmOverlay.classList.add('hidden');
  r.over = true;
  r.won = false;

  S.streak = 0;
  S.stats.perfectStreak = 0;
  S.stats.lastRoundRevealed = true;

  if (!S.playedIds.includes(currentItem.id)) S.playedIds.push(currentItem.id);

  const newlyUnlocked = evaluateAwards(false, true);
  S.activeRound = null;
  saveState();

  sfx.reveal();
  renderHud();
  renderCard(false);
  renderSuspectPanel(true);

  showResultModal(false, 0, 0, false, newlyUnlocked, true);
}

function handleMoveCard(delta) {
  const r = S.activeRound;
  if (!r || r.hintsRevealed === 0) return;
  const next = r.cardIndex + delta;
  if (next < 0 || next >= r.hintsRevealed) return;
  r.cardIndex = next;
  saveState();
  sfx.flip();
  renderCard(true);
}

function handleFirstLetter() {
  const r = S.activeRound;
  if (!r || r.over || r.usedLetter || !currentItem) return;
  r.usedLetter = true;
  S.score = Math.max(0, S.score - CFG.letterCost);
  if (!isLockdownMode() && el.searchInput.value.trim() === '') {
    el.searchInput.value = currentItem.name.charAt(0).toUpperCase();
  }
  saveState();
  sfx.perk();
  flashEl(el.score);
  renderHud();
  renderCard(false);
  renderSuspectPanel();
}

function handleCategory() {
  const r = S.activeRound;
  if (!r || r.over || r.usedCategory) return;
  r.usedCategory = true;
  S.score = Math.max(0, S.score - CFG.categoryCost);
  saveState();
  sfx.perk();
  flashEl(el.score);
  renderHud();
  renderCard(false);
}

function submitGuess(name) {
  const r = S.activeRound;
  if (!r || r.over || !currentItem) return;
  if (r.wrongGuesses.includes(name)) return;

  if (name === currentItem.name) {
    /* ---- SOLVED ---- */
    r.over = true;
    r.won = true;

    const gainedScore = currentReward();
    const streakBonus = Math.min(50, S.streak * 5);
    const expGain = 40 + gainedScore + streakBonus;

    S.score += gainedScore;
    S.bestScore = Math.max(S.bestScore, S.score);
    S.streak++;
    S.bestStreak = Math.max(S.bestStreak, S.streak);

    if (!S.playedIds.includes(currentItem.id)) S.playedIds.push(currentItem.id);
    if (!S.solvedIds.includes(currentItem.id)) S.solvedIds.push(currentItem.id);

    const wrongCount = r.wrongGuesses.length;
    if (r.hintsRevealed === 0) S.stats.zeroHintWins++;
    if (r.hintsRevealed === 1) S.stats.oneHintWins++;
    if (r.hintsRevealed <= 3) S.stats.lowHintWins++;
    if (!r.usedLetter && !r.usedCategory) S.stats.noLifelineWins++;
    if (wrongCount === 0) S.stats.perfectStreak++;
    else S.stats.perfectStreak = 0;

    const oldLevel = S.level;
    S.exp += expGain;
    while (S.exp >= expNeeded(S.level)) {
      S.exp -= expNeeded(S.level);
      S.level++;
    }

    const newlyUnlocked = evaluateAwards(true, false);
    S.stats.lastRoundRevealed = false;
    S.activeRound = null;
    saveState();

    sfx.win();
    renderHud();
    renderCard(false);
    renderSuspectPanel(true);
    flashEl(el.score);
    flashEl(el.streak);

    setTimeout(() => showResultModal(true, gainedScore, expGain, S.level > oldLevel, newlyUnlocked, false), 380);
  } else {
    /* ---- WRONG GUESS (No life limit — keep guessing) ---- */
    r.wrongGuesses.push(name);
    S.score = Math.max(0, S.score - CFG.wrongPenalty);
    S.streak = 0;
    S.stats.perfectStreak = 0;
    saveState();

    sfx.wrong();
    flashEl(el.score);

    const targetBox = isLockdownMode() ? el.blindWrap : el.itemList;
    targetBox.classList.remove('shake');
    void targetBox.offsetWidth;
    targetBox.classList.add('shake');

    renderHud();
    renderSuspectPanel(true);
  }
}

/* ============================================================================
   AWARDS ENGINE
   ============================================================================ */
function unlockAward(id) {
  if (S.unlockedAwards.includes(id)) return null;
  const def = AWARDS.find(a => a.id === id);
  if (!def) return null;
  S.unlockedAwards.push(id);
  sfx.award();
  showToast(def.icon, 'RPG Award Unlocked!', def.name);
  return def;
}

function evaluateAwards(won, revealed) {
  const unlocked = [];
  const r = S.activeRound;
  const check = (cond, id) => {
    if (cond && !S.unlockedAwards.includes(id)) {
      const a = unlockAward(id);
      if (a) unlocked.push(a);
    }
  };

  if (revealed) check(true, 'curious_cat');

  if (won && r) {
    const wrongCount = r.wrongGuesses.length;
    check(S.solvedIds.length >= 1, 'first_box');
    check(S.stats.zeroHintWins >= 1, 'blind_1');
    check(S.stats.zeroHintWins >= 5, 'blind_5');
    check(S.stats.zeroHintWins >= 15, 'blind_15');
    check(S.stats.oneHintWins >= 1, 'one_clue');
    check(S.stats.lowHintWins >= 10, 'low_hints_10');
    check(r.hintsRevealed === MAX_HINTS, 'zero_pt_win');
    check(S.stats.noLifelineWins >= 10, 'purist_10');

    check(wrongCount === 0, 'perfect_1');
    check(S.stats.perfectStreak >= 5, 'perfect_5');
    check(S.stats.perfectStreak >= 10, 'perfect_10');
    check(S.stats.perfectStreak >= 20, 'perfect_20');
    check(wrongCount >= 4, 'persistent');

    check(S.stats.lastRoundRevealed && r.hintsRevealed <= 1, 'phoenix');

    check(S.streak >= 3, 'streak_3');
    check(S.streak >= 5, 'streak_5');
    check(S.streak >= 10, 'streak_10');
    check(S.streak >= 20, 'streak_20');
    check(S.streak >= 30, 'streak_30');

    check(S.solvedIds.length >= 25, 'solved_25');
    check(S.solvedIds.length >= 50, 'solved_50');
    check(S.solvedIds.length >= 100, 'solved_100');
  }

  check(S.level >= 2, 'lvl_2');
  check(S.level >= 5, 'lvl_5');
  check(S.level >= 10, 'lvl_10');
  check(S.level >= 15, 'lvl_15');
  check(S.level >= 20, 'lvl_20');
  check(S.level >= 25, 'lvl_25');
  check(S.level >= 30, 'lvl_30');

  const rem = remainingItems().length;
  check(rem <= FINAL_LOCKDOWN_AT, 'final_30');
  check(rem === 0 && ALL_ITEMS.length > 0, 'master_all');

  return unlocked;
}

/* ============================================================================
   MODALS
   ============================================================================ */
function showResultModal(won, ptsDelta, expGain, leveledUp, newlyUnlocked, wasRevealed) {
  const item = currentItem;
  el.resEmoji.textContent = item.emoji || '🎁';
  el.resItem.textContent = item.name;

  if (wasRevealed) {
    el.resTitle.textContent = 'BOX REVEALED!';
    el.resDelta.textContent = '0 PTS';
    el.resDelta.className = 'res-delta minus';
    el.resExp.textContent = '+0 EXP · Streak Reset';
    el.resSub.textContent = `Inside the Mystery Box was "${item.name}". Removed from the catalog — ${remainingItems().length} boxes remaining.`;
  } else {
    el.resTitle.textContent = 'BOX UNLOCKED!';
    el.resDelta.textContent = `+${ptsDelta} PTS`;
    el.resDelta.className = 'res-delta plus';
    el.resExp.textContent = `+${expGain} EXP${leveledUp ? ` · LEVEL UP TO LVL ${S.level}!` : ''}`;
    el.resSub.textContent = `Solved using ${el.cardStatus.textContent.includes('0/10') ? '0' : (S.playedIds.length ? 'those' : '')} clues · ${remainingItems().length} Mystery Boxes remaining.`;
  }

  el.resAwards.innerHTML = newlyUnlocked.map(a => `<span class="l-tag">${a.icon} ${a.name}</span>`).join('');
  el.nextRoundBtn.textContent = remainingItems().length === 0 ? 'VIEW FINAL REWARDS ➔' : 'NEXT MYSTERY BOX ➔';
  el.resultOverlay.classList.remove('hidden');
}

function showCompleteModal() {
  el.completeStats.innerHTML = `
    <div>🏆 <strong>Final Gold:</strong> ${S.score} (Best: ${S.bestScore})</div>
    <div>⭐ <strong>Hero Level:</strong> Level ${S.level} (${rpgRank(S.level)})</div>
    <div>📦 <strong>Boxes Solved:</strong> ${S.solvedIds.length} / ${ALL_ITEMS.length}</div>
    <div>🔥 <strong>Best Streak:</strong> ${S.bestStreak}</div>
    <div>🎖️ <strong>Awards Unlocked:</strong> ${S.unlockedAwards.length} / ${AWARDS.length}</div>
  `;
  el.completeOverlay.classList.remove('hidden');
}

function openAwardsModal() {
  el.awardsSummary.textContent = `Unlocked ${S.unlockedAwards.length} of ${AWARDS.length} RPG Trophies`;
  const unlockedSet = new Set(S.unlockedAwards);
  el.awardsGrid.innerHTML = AWARDS.map(a => {
    const ok = unlockedSet.has(a.id);
    return `
      <div class="award-tile ${ok ? 'unlocked' : ''}">
        <div class="a-ico">${a.icon}</div>
        <div>
          <div class="a-name">${a.name}</div>
          <div class="a-desc">${a.desc}</div>
        </div>
      </div>
    `;
  }).join('');
  el.awardsOverlay.classList.remove('hidden');
}

function openMenuModal() {
  el.menuStatsGrid.innerHTML = `
    <div class="stat-cell"><div class="v">${S.bestScore}</div><div class="k">Best Gold Score</div></div>
    <div class="stat-cell"><div class="v">LVL ${S.level}</div><div class="k">${rpgRank(S.level)}</div></div>
    <div class="stat-cell"><div class="v">${S.solvedIds.length} / ${ALL_ITEMS.length}</div><div class="k">Boxes Solved</div></div>
    <div class="stat-cell"><div class="v">${S.bestStreak} 🔥</div><div class="k">Best Streak</div></div>
    <div class="stat-cell"><div class="v">${S.stats.zeroHintWins}</div><div class="k">0-Hint Blind Wins</div></div>
    <div class="stat-cell"><div class="v">${S.stats.perfectStreak}</div><div class="k">Clean Strike Streak</div></div>
  `;
  el.menuOverlay.classList.remove('hidden');
}

/* ============================================================================
   EVENTS & KEYBOARD NAVIGATION
   ============================================================================ */
function moveSearchSelection(delta) {
  const rows = Array.from(el.itemList.querySelectorAll('.suspect-btn:not(.dead)'));
  if (!rows.length) return;
  const curr = el.itemList.querySelector('.suspect-btn.active');
  let idx = rows.indexOf(curr);
  idx = idx === -1 ? (delta > 0 ? 0 : rows.length - 1) : (idx + delta + rows.length) % rows.length;
  rows.forEach(r => r.classList.remove('active'));
  rows[idx].classList.add('active');
  rows[idx].scrollIntoView({ block: 'nearest' });
}

el.showHintBtn.addEventListener('click', handlePrimaryCardAction);
el.prevCardBtn.addEventListener('click', () => handleMoveCard(-1));
el.nextCardBtn.addEventListener('click', () => handleMoveCard(1));
el.letterBtn.addEventListener('click', handleFirstLetter);
el.categoryBtn.addEventListener('click', handleCategory);

el.confirmRevealYes.addEventListener('click', confirmRevealBox);
el.confirmRevealNo.addEventListener('click', () => {
  sfx.click();
  el.revealConfirmOverlay.classList.add('hidden');
});

el.soundBtn.addEventListener('click', () => {
  S.soundOn = !S.soundOn;
  saveState();
  renderHud();
  if (S.soundOn) sfx.click();
});

el.fsBtn.addEventListener('click', async () => {
  sfx.click();
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (_) {}
});

el.awardsBtn.addEventListener('click', () => { sfx.click(); openAwardsModal(); });
el.closeAwardsBtn.addEventListener('click', () => { sfx.click(); el.awardsOverlay.classList.add('hidden'); });

el.menuBtn.addEventListener('click', () => { sfx.click(); openMenuModal(); });
el.closeMenuBtn.addEventListener('click', () => { sfx.click(); el.menuOverlay.classList.add('hidden'); });

el.resetDeckBtn.addEventListener('click', () => {
  if (!confirm('Reset the 300-item deck so all Mystery Boxes can appear again? (Your Level, EXP, Best Score, and Awards stay saved.)')) return;
  S.playedIds = [];
  S.solvedIds = [];
  S.activeRound = null;
  currentItem = null;
  S.score = 0;
  S.streak = 0;
  saveState();
  el.menuOverlay.classList.add('hidden');
  startNewRound();
});

el.wipeSaveBtn.addEventListener('click', () => {
  if (!confirm('Wipe ALL local save data, levels, gold, and trophies?')) return;
  localStorage.removeItem(SAVE_KEY);
  S = defaultState();
  currentItem = null;
  el.menuOverlay.classList.add('hidden');
  el.startOverlay.classList.remove('hidden');
  renderHud();
  startNewRound();
});

el.replayDeckBtn.addEventListener('click', () => {
  sfx.click();
  S.playedIds = [];
  S.solvedIds = [];
  S.activeRound = null;
  currentItem = null;
  S.score = 0;
  S.streak = 0;
  saveState();
  el.completeOverlay.classList.add('hidden');
  startNewRound();
});

el.fullResetBtn.addEventListener('click', () => {
  if (!confirm('Reset absolutely everything back to Level 1?')) return;
  localStorage.removeItem(SAVE_KEY);
  S = defaultState();
  el.completeOverlay.classList.add('hidden');
  startNewRound();
});

el.startBtn.addEventListener('click', () => {
  sfx.click();
  el.startOverlay.classList.add('hidden');
  if (!S.activeRound || !currentItem) startNewRound();
  else { renderHud(); renderCard(false); renderSuspectPanel(); }
});

el.nextRoundBtn.addEventListener('click', () => {
  sfx.click();
  el.resultOverlay.classList.add('hidden');
  startNewRound();
});

el.searchInput.addEventListener('input', () => renderSuspectPanel(false));
el.clearBtn.addEventListener('click', () => {
  el.searchInput.value = '';
  renderSuspectPanel(false);
  el.searchInput.focus();
});

el.searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const act = el.itemList.querySelector('.suspect-btn.active:not(.dead)');
    const first = el.itemList.querySelector('.suspect-btn:not(.dead)');
    const target = act || first;
    if (target) submitGuess(target.dataset.name);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveSearchSelection(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveSearchSelection(-1);
  } else if (e.key === 'Escape') {
    el.searchInput.value = '';
    renderSuspectPanel(false);
  }
});

/* Final 30 Blind Submission */
el.blindForm.addEventListener('submit', e => {
  e.preventDefault();
  const r = S.activeRound;
  if (!r || r.over) return;

  const typed = normalizeName(el.blindInput.value);
  if (!typed) {
    el.blindFeedback.textContent = 'Type an item name first!';
    return;
  }

  const matched = ALL_ITEMS.find(it => normalizeName(it.name) === typed);
  if (!matched) {
    el.blindFeedback.textContent = 'Not found in the 300-item catalog — check spelling!';
    el.blindInput.classList.remove('shake');
    void el.blindInput.offsetWidth;
    el.blindInput.classList.add('shake');
    return;
  }

  if (S.playedIds.includes(matched.id)) {
    el.blindFeedback.textContent = `"${matched.name}" was already opened earlier!`;
    el.blindInput.value = '';
    return;
  }

  if (r.wrongGuesses.includes(matched.name)) {
    el.blindFeedback.textContent = `You already tried "${matched.name}" on this box!`;
    el.blindInput.value = '';
    return;
  }

  el.blindFeedback.textContent = '';
  el.blindInput.value = '';
  submitGuess(matched.name);
});

/* Global Keyboard Shortcuts */
document.addEventListener('keydown', e => {
  if (e.target === el.searchInput || e.target === el.blindInput) return;

  if (!el.startOverlay.classList.contains('hidden')) {
    if (e.key === 'Enter') el.startBtn.click();
    return;
  }
  if (!el.revealConfirmOverlay.classList.contains('hidden')) {
    if (e.key === 'Escape') el.confirmRevealNo.click();
    return;
  }
  if (!el.resultOverlay.classList.contains('hidden')) {
    if (e.key === 'Enter') el.nextRoundBtn.click();
    return;
  }

  if (e.key === '/') {
    e.preventDefault();
    (isLockdownMode() ? el.blindInput : el.searchInput).focus();
  } else if (e.key === 'ArrowLeft') {
    handleMoveCard(-1);
  } else if (e.key === 'ArrowRight') {
    handleMoveCard(1);
  } else if (e.key.toLowerCase() === 'h') {
    handlePrimaryCardAction();
  }
});

/* ============================================================================
   LOAD ITEMS.JSON & BOOT (Error screen ONLY appears if items.json fails)
   ============================================================================ */
function ingestItems(rawArray) {
  if (!Array.isArray(rawArray) || rawArray.length === 0) {
    throw new Error('items.json is empty or not an array');
  }
  ALL_ITEMS = rawArray.map((it, idx) => ({
    id: it.id ?? idx + 1,
    name: String(it.name),
    emoji: it.emoji || '🎁',
    category: it.category || 'General',
    hints: Array.isArray(it.hints) ? it.hints : String(it.hints || '').split('|')
  }));

  ITEM_BY_ID = new Map(ALL_ITEMS.map(it => [it.id, it]));
  el.loadErrorOverlay.classList.add('hidden');
  bootAfterLoad();
}

function bootAfterLoad() {
  renderHud();

  const rem = remainingItems();
  if (rem.length === 0) {
    el.startOverlay.classList.add('hidden');
    showCompleteModal();
    return;
  }

  const resumed = hydrateSavedRound();
  if (resumed) {
    renderHud();
    renderCard(false);
    renderSuspectPanel();
    el.startBtn.textContent = 'RESUME QUEST';
    el.startStats.textContent = `Saved Quest: Level ${S.level} (${rpgRank(S.level)}) · ${S.score} Gold · ${rem.length}/${ALL_ITEMS.length} Left`;
  } else {
    el.startBtn.textContent = S.playedIds.length > 0 ? 'CONTINUE QUEST' : 'ENTER QUEST';
    el.startStats.textContent = S.playedIds.length > 0
      ? `Saved Hero: Level ${S.level} · Best Gold ${S.bestScore} · ${rem.length}/${ALL_ITEMS.length} Boxes Left`
      : `${ALL_ITEMS.length} Mystery Boxes Loaded · Ready to Play!`;
  }
}

async function fetchCatalog() {
  try {
    if (window.ITEMS_DATA) {
      ingestItems(window.ITEMS_DATA);
      return;
    }
    const res = await fetch('items.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} — items.json not found`);
    const data = await res.json();
    ingestItems(data);
  } catch (err) {
    el.loadErrorMsg.textContent = `Error loading items.json (${err.message}).`;
    el.loadErrorOverlay.classList.remove('hidden');
  }
}

el.retryFetchBtn.addEventListener('click', fetchCatalog);
el.manualJsonInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      ingestItems(JSON.parse(ev.target.result));
    } catch (err) {
      el.loadErrorMsg.textContent = `Invalid JSON file: ${err.message}`;
    }
  };
  reader.readAsText(file);
});

(function init() {
  loadState();
  renderHud();
  fetchCatalog();
})();