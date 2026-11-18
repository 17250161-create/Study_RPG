(() => {
  'use strict';

  const STORAGE_KEY = 'studyRpgState';
  const GAME_RULES = Object.freeze({
    expPerMinute: 4,
    goldPerMinute: 10,
    levelExpBase: 100,
    levelExpGrowthFactor: 33.6,
    levelExpGrowthPower: 1.2,
    dailyGoalBonusExp: 200,
    dailyGoalBonusGold: 20,
    comboMultiplierPerDay: 0.1,
    maxComboMultiplier: 1.5,
    weeklyLifeCount: 3,
    treatmentCost: 300
  });
  const DEFAULT_TASKS = [
    { id: 'review', title: '今日の勉強を復習する', completedDate: null },
    { id: 'memorize', title: '暗記をする', completedDate: null },
    { id: 'practice', title: '問題を解く', completedDate: null }
  ];
  const SHOP_ITEMS = [
    { id: 'reading-voucher', name: '読書券', description: 'マンガ・小説1巻または1時間', price: 400, currency: 'gold', type: 'consumable' },
    { id: 'efficiency-potion', name: '効率バフ薬', description: '購入後1時間、獲得ゴールドが1.5倍', price: 300, currency: 'gold', type: 'buff' },
    { id: 'evolution-stone', name: '進化の石', description: 'ドラゴンの成長を支える副素材', price: 1500, currency: 'gold', type: 'consumable' },
    { id: 'furniture-library', name: '図書館の家具', description: '自習室を落ち着いた図書館風に変更', price: 200, currency: 'gold', type: 'furniture', theme: 'library' },
    { id: 'furniture-starry', name: '星空の家具', description: '自習室を星空の部屋に変更', price: 400, currency: 'gold', type: 'furniture', theme: 'starry' },
    { id: 'goro-goro-voucher', name: '超高額ゴロゴロ券', description: '1時間ベッドで過ごす権利', price: 30, currency: 'diamonds', type: 'consumable', minLevel: 30 }
  ];
  const FURNITURE_THEMES = {
    forest: { name: '習慣の森', id: 'furniture-forest' },
    library: { name: '図書館', id: 'furniture-library' },
    starry: { name: '星空', id: 'furniture-starry' }
  };
  const DEFAULT_STATE = {
    player: {
      level: 1, currentExp: 0, gold: 0, diamonds: 0, weeklyLife: 3,
      hasColdDebuff: false, lastMissedDate: null, comboDays: 0, lastGoalDate: null,
      lastProcessedDate: null, lastWeeklyResetDate: null, areaDays: 0, areaName: '習慣の森'
    },
    studyLogs: [],
    settings: { dailyGoalMinutes: 60, defaultTimerMinutes: 25 },
    tasks: structuredClone(DEFAULT_TASKS),
    dailyTaskDates: [],
    survivalDates: [],
    insuranceEnabledDate: null,
    insuranceUsedDate: null,
    inventory: { 'reading-voucher': 0, 'evolution-stone': 0, 'goro-goro-voucher': 0 },
    ownedFurniture: ['furniture-forest'],
    selectedFurniture: 'forest',
    buffExpiresAt: null,
    ticketLog: []
  };
  const RATING_LABELS = { 1: '★☆☆ 星1', 2: '★★☆ 星2', 3: '★★★ 星3' };
  const elements = {
    homeScreen: document.getElementById('home-screen'),
    questScreen: document.getElementById('quest-screen'),
    departButton: document.getElementById('depart-button'),
    backButton: document.getElementById('back-button'),
    levelLabel: document.getElementById('level-label'),
    weeklyLife: document.getElementById('weekly-life'),
    dragonStatus: document.getElementById('dragon-status'),
    diamondCount: document.getElementById('diamond-count'),
    expFill: document.getElementById('exp-fill'),
    expTrack: document.querySelector('.exp-track'),
    expCaption: document.getElementById('exp-caption'),
    goldCount: document.getElementById('gold-count'),
    dragonVisual: document.getElementById('dragon-visual'),
    timerDragon: document.getElementById('timer-dragon'),
    dragonName: document.getElementById('dragon-name'),
    dragonLevel: document.getElementById('dragon-level'),
    dragonStageCaption: document.getElementById('dragon-stage-caption'),
    questDragonCaption: document.getElementById('quest-dragon-caption'),
    currentArea: document.getElementById('current-area'),
    areaLevelRange: document.getElementById('area-level-range'),
    areaProgress: document.getElementById('area-progress'),
    dragonCondition: document.getElementById('dragon-condition'),
    durationInput: document.getElementById('duration-input'),
    timerDisplay: document.getElementById('timer-display'),
    timerState: document.getElementById('timer-state'),
    timerPanel: document.querySelector('.timer-panel'),
    startButton: document.getElementById('start-button'),
    pauseButton: document.getElementById('pause-button'),
    abortButton: document.getElementById('abort-button'),
    ratingModal: document.getElementById('rating-modal'),
    completedMinutes: document.getElementById('completed-minutes'),
    resultModal: document.getElementById('result-modal'),
    resultRating: document.getElementById('result-rating'),
    rewardExp: document.getElementById('reward-exp'),
    rewardGold: document.getElementById('reward-gold'),
    levelUpMessage: document.getElementById('level-up-message'),
    levelUpDetail: document.getElementById('level-up-detail'),
    resultHomeButton: document.getElementById('result-home-button'),
    dailyGoalInput: document.getElementById('daily-goal-input'),
    dailyGoalFill: document.getElementById('daily-goal-fill'),
    dailyGoalTrack: document.getElementById('daily-goal-track'),
    dailyGoalCaption: document.getElementById('daily-goal-caption'),
    comboStatus: document.getElementById('combo-status'),
    dailyTaskList: document.getElementById('daily-task-list'),
    dailyTaskForm: document.getElementById('daily-task-form'),
    dailyTaskInput: document.getElementById('daily-task-input'),
    dailyTaskProgress: document.getElementById('daily-task-progress'),
    dailyTaskReward: document.getElementById('daily-task-reward'),
    shopScreen: document.getElementById('shop-screen'),
    shopItems: document.getElementById('shop-items'),
    shopGold: document.getElementById('shop-gold'),
    shopDiamonds: document.getElementById('shop-diamonds'),
    inventoryList: document.getElementById('inventory-list'),
    inventoryEmpty: document.getElementById('inventory-empty'),
    ticketLogList: document.getElementById('ticket-log-list'),
    ticketLogEmpty: document.getElementById('ticket-log-empty'),
    churchScreen: document.getElementById('church-screen'),
    debuffStatus: document.getElementById('debuff-status'),
    healButton: document.getElementById('heal-button'),
    insuranceToggle: document.getElementById('insurance-toggle'),
    insuranceUse: document.getElementById('insurance-use'),
    insuranceStatus: document.getElementById('insurance-status'),
    tabooButton: document.getElementById('taboo-button'),
    weeklyBonusRow: document.getElementById('weekly-bonus-row'),
    weeklyTotal: document.getElementById('weekly-total'),
    weeklyChart: document.getElementById('weekly-chart'),
    studyLogList: document.getElementById('study-log-list'),
    studyHistoryEmpty: document.getElementById('study-history-empty'),
    goalBonusRow: document.getElementById('goal-bonus-row'),
    taskBonusRow: document.getElementById('task-bonus-row'),
    testDuration: document.getElementById('test-duration'),
    testCompleteButton: document.getElementById('test-complete-button'),
    testLevel: document.getElementById('test-level'),
    testLevelButton: document.getElementById('test-level-button'),
    testResetButton: document.getElementById('test-reset-button'),
    testSessionNote: document.getElementById('test-session-note')
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== 'object') return structuredClone(DEFAULT_STATE);
      const player = saved.player || {};
      const settings = saved.settings || {};
      const isDateKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
      const inventory = saved.inventory || {};
      const tasks = Array.isArray(saved.tasks) ? saved.tasks : structuredClone(DEFAULT_TASKS);
      return {
        player: {
          level: Number.isInteger(player.level) && player.level > 0 ? Math.min(player.level, 100) : 1,
          currentExp: Number.isFinite(player.currentExp) && player.currentExp >= 0 ? player.currentExp : 0,
          gold: Number.isFinite(player.gold) && player.gold >= 0 ? player.gold : 0,
          diamonds: Number.isInteger(player.diamonds) && player.diamonds >= 0 ? player.diamonds : 0,
          weeklyLife: Number.isInteger(player.weeklyLife) && player.weeklyLife >= 0 && player.weeklyLife <= 3 ? player.weeklyLife : 3,
          hasColdDebuff: player.hasColdDebuff === true,
          lastMissedDate: isDateKey(player.lastMissedDate) ? player.lastMissedDate : null,
          comboDays: Number.isInteger(player.comboDays) && player.comboDays > 0 ? player.comboDays : 0,
          lastGoalDate: isDateKey(player.lastGoalDate) ? player.lastGoalDate : null,
          lastProcessedDate: isDateKey(player.lastProcessedDate) ? player.lastProcessedDate : getDateKey(),
          lastWeeklyResetDate: isDateKey(player.lastWeeklyResetDate) ? player.lastWeeklyResetDate : null,
          areaDays: Number.isInteger(player.areaDays) && player.areaDays >= 0 ? player.areaDays : 0,
          areaName: typeof player.areaName === 'string' ? player.areaName : '習慣の森'
        },
        studyLogs: Array.isArray(saved.studyLogs) ? saved.studyLogs : [],
        settings: {
          dailyGoalMinutes: Number.isInteger(settings.dailyGoalMinutes) && settings.dailyGoalMinutes >= 1 && settings.dailyGoalMinutes <= 1440
            ? settings.dailyGoalMinutes
            : DEFAULT_STATE.settings.dailyGoalMinutes,
          defaultTimerMinutes: Number.isInteger(settings.defaultTimerMinutes) && settings.defaultTimerMinutes >= 1 && settings.defaultTimerMinutes <= 999
            ? settings.defaultTimerMinutes
            : DEFAULT_STATE.settings.defaultTimerMinutes
        },
        tasks: tasks.filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string')
          .map((task) => ({ id: task.id, title: task.title.slice(0, 60), completedDate: isDateKey(task.completedDate) ? task.completedDate : null })),
        dailyTaskDates: Array.isArray(saved.dailyTaskDates) ? saved.dailyTaskDates.filter(isDateKey) : [],
        survivalDates: Array.isArray(saved.survivalDates) ? saved.survivalDates.filter(isDateKey) : [],
        insuranceEnabledDate: isDateKey(saved.insuranceEnabledDate) ? saved.insuranceEnabledDate : null,
        insuranceUsedDate: isDateKey(saved.insuranceUsedDate) ? saved.insuranceUsedDate : null,
        inventory: Object.fromEntries(Object.keys(DEFAULT_STATE.inventory).map((id) => [
          id,
          Number.isInteger(inventory[id]) && inventory[id] >= 0 ? inventory[id] : 0
        ])),
        ownedFurniture: Array.isArray(saved.ownedFurniture)
          ? [...new Set(['furniture-forest', ...saved.ownedFurniture.filter((id) => Object.values(FURNITURE_THEMES).some((item) => item.id === id))])]
          : [...DEFAULT_STATE.ownedFurniture],
        selectedFurniture: Object.hasOwn(FURNITURE_THEMES, saved.selectedFurniture) ? saved.selectedFurniture : 'forest',
        buffExpiresAt: Number.isFinite(saved.buffExpiresAt) && saved.buffExpiresAt > 0 ? saved.buffExpiresAt : null,
        ticketLog: Array.isArray(saved.ticketLog) ? saved.ticketLog.filter((entry) => entry && typeof entry.date === 'string' && typeof entry.item === 'string').slice(-50) : []
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function scheduleBuffExpiration() {
    window.clearTimeout(buffExpiryTimeout);
    if (!state.buffExpiresAt || state.buffExpiresAt <= Date.now()) {
      state.buffExpiresAt = null;
      buffExpiryTimeout = null;
      return;
    }
    const expiresAt = state.buffExpiresAt;
    buffExpiryTimeout = window.setTimeout(() => {
      if (state.buffExpiresAt !== expiresAt) {
        scheduleBuffExpiration();
        return;
      }
      state.buffExpiresAt = null;
      buffExpiryTimeout = null;
      saveState();
      renderStatus();
    }, Math.max(0, expiresAt - Date.now()) + 50);
  }

  let state = loadState();
  let remainingSeconds = state.settings.defaultTimerMinutes * 60;
  let sessionMinutes = state.settings.defaultTimerMinutes;
  let deadline = 0;
  let timerInterval = null;
  let buffExpiryTimeout = null;
  let isRunning = false;
  let isTestSession = false;

  function requiredTotalExp(level) {
    let totalExp = 0;
    for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
      totalExp += requiredExpForNextLevel(currentLevel);
    }
    return totalExp;
  }

  function requiredExpForNextLevel(level) {
    return Math.round(
      GAME_RULES.levelExpBase
      + GAME_RULES.levelExpGrowthFactor * Math.pow(level - 1, GAME_RULES.levelExpGrowthPower)
    );
  }

  function getDateKey(value = new Date()) {
    const date = value instanceof Date
      ? value
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
        : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDateDifference(fromDate, toDate) {
    const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
    const [toYear, toMonth, toDay] = toDate.split('-').map(Number);
    return (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000;
  }

  function addDays(dateKey, days) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return getDateKey(date);
  }

  function getTodayMinutes() {
    const today = getDateKey();
    return state.studyLogs.reduce((minutes, log) => {
      return !log.test && getDateKey(log.date) === today
        ? minutes + (Number(log.durationMinutes) || 0)
        : minutes;
    }, 0);
  }

  function processElapsedDays() {
    const yesterday = addDays(getDateKey(), -1);
    const today = getDateKey();
    let cursor = state.player.lastProcessedDate || getDateKey();
    let stateChanged = false;
    while (getDateDifference(cursor, yesterday) > 0) {
      stateChanged = true;
      cursor = addDays(cursor, 1);
      const weekday = new Date(`${cursor}T12:00:00`).getDay();
      if (weekday === 1) {
        state.player.weeklyLife = GAME_RULES.weeklyLifeCount;
        state.player.lastWeeklyResetDate = cursor;
      }
      if (!state.survivalDates.includes(cursor)) {
        state.player.weeklyLife = Math.max(0, state.player.weeklyLife - 1);
        state.player.lastMissedDate = cursor;
        state.player.comboDays = 0;
        state.player.lastGoalDate = null;
        if (state.player.weeklyLife === 0) state.player.hasColdDebuff = true;
      }
      state.player.lastProcessedDate = cursor;
    }
    if (new Date(`${today}T12:00:00`).getDay() === 1 && state.player.lastWeeklyResetDate !== today) {
      state.player.weeklyLife = GAME_RULES.weeklyLifeCount;
      state.player.lastWeeklyResetDate = today;
      stateChanged = true;
    }
    if (stateChanged) saveState();
  }

  function recordDailyClear(date) {
    processElapsedDays();
    if (state.survivalDates.includes(date)) return { cleared: false, weeklyBonus: false };
    const previousDate = state.player.lastGoalDate;
    state.player.comboDays = previousDate && getDateDifference(previousDate, date) === 1
      ? state.player.comboDays + 1
      : 1;
    state.player.lastGoalDate = date;
    state.player.lastProcessedDate = date;
    state.player.lastMissedDate = null;
    state.survivalDates.push(date);
    state.survivalDates = state.survivalDates.slice(-60);
    const areaName = getArea(state.player.level).name;
    if (state.player.areaName !== areaName) {
      state.player.areaName = areaName;
      state.player.areaDays = 0;
    }
    state.player.areaDays = Math.min(30, state.player.areaDays + 1);
    const weeklyBonus = state.player.comboDays % 7 === 0;
    if (weeklyBonus) state.player.diamonds += 1;
    return { cleared: true, weeklyBonus };
  }

  function getCurrentGoldMultiplier() {
    const comboMultiplier = getComboStats().multiplier;
    const potionMultiplier = state.buffExpiresAt > Date.now() ? 1.5 : 1;
    const coldMultiplier = state.player.hasColdDebuff ? 0.5 : 1;
    return { comboMultiplier, potionMultiplier, coldMultiplier, total: comboMultiplier * potionMultiplier * coldMultiplier };
  }

  function renderDailyTasks() {
    const today = getDateKey();
    const completed = state.tasks.filter((task) => task.completedDate === today).length;
    const alreadyRewarded = state.dailyTaskDates.includes(today);
    const taskBonusGold = Math.floor(GAME_RULES.dailyGoalBonusGold * (state.player.hasColdDebuff ? 0.5 : 1));
    elements.dailyTaskProgress.textContent = `${completed} / ${state.tasks.length} 完了`;
    elements.dailyTaskInput.disabled = alreadyRewarded;
    elements.dailyTaskForm.querySelector('button').disabled = alreadyRewarded;
    elements.dailyTaskReward.textContent = alreadyRewarded
      ? '今日のタスク達成ボーナスは受け取り済みです。'
      : `すべて完了すると +${GAME_RULES.dailyGoalBonusExp} EXP / +${taskBonusGold} G`;
    elements.dailyTaskList.replaceChildren(...state.tasks.map((task) => {
      const item = document.createElement('li');
      item.className = 'daily-task-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completedDate === today;
      checkbox.disabled = alreadyRewarded;
      checkbox.dataset.taskId = task.id;
      checkbox.setAttribute('aria-label', task.title);
      const title = document.createElement('span');
      title.textContent = task.title;
      if (checkbox.checked) title.className = 'is-completed';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'task-remove';
      remove.dataset.removeTaskId = task.id;
      remove.textContent = '削除';
      remove.setAttribute('aria-label', `「${task.title}」を削除`);
      item.append(checkbox, title, remove);
      return item;
    }));
  }

  function getRecordedStudyLogs() {
    return state.studyLogs.filter((log) => (
      log
      && !log.test
      && typeof log.date === 'string'
      && !Number.isNaN(new Date(log.date).getTime())
      && Number.isFinite(log.durationMinutes)
      && log.durationMinutes > 0
    ));
  }

  function renderStudyHistory() {
    const logs = getRecordedStudyLogs();
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = getDateKey(date);
      const minutes = logs.reduce((total, log) => (
        getDateKey(log.date) === key ? total + log.durationMinutes : total
      ), 0);
      return { date, key, minutes };
    });
    const weeklyMinutes = days.reduce((total, day) => total + day.minutes, 0);
    elements.weeklyTotal.textContent = `${weeklyMinutes}分`;
    elements.weeklyChart.replaceChildren(...days.map(({ date, key, minutes }) => {
      const day = document.createElement('div');
      day.className = 'weekly-day';
      const bar = document.createElement('div');
      bar.className = 'weekly-day-track';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', `${date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}の勉強時間`);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(state.settings.dailyGoalMinutes));
      bar.setAttribute('aria-valuenow', String(Math.min(minutes, state.settings.dailyGoalMinutes)));
      const fill = document.createElement('span');
      fill.className = 'weekly-day-fill';
      fill.style.height = `${Math.min(100, (minutes / state.settings.dailyGoalMinutes) * 100)}%`;
      bar.append(fill);
      const total = document.createElement('span');
      total.className = 'weekly-day-minutes';
      total.textContent = `${minutes}分`;
      const label = document.createElement('span');
      label.className = 'weekly-day-label';
      label.textContent = date.toLocaleDateString('ja-JP', { weekday: 'short' });
      if (key === getDateKey()) day.classList.add('is-today');
      day.append(bar, total, label);
      return day;
    }));

    const recentLogs = logs.slice(-5).reverse();
    elements.studyHistoryEmpty.hidden = recentLogs.length > 0;
    elements.studyLogList.replaceChildren(...recentLogs.map((log) => {
      const item = document.createElement('li');
      item.className = 'study-log-item';
      const date = document.createElement('time');
      date.dateTime = log.date;
      date.textContent = new Date(log.date).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const details = document.createElement('span');
      details.className = 'study-log-details';
      const stars = Number.isInteger(log.stars) && log.stars >= 1 && log.stars <= 3
        ? '★'.repeat(log.stars) + '☆'.repeat(3 - log.stars)
        : '勉強';
      details.textContent = `${stars} · ${log.durationMinutes}分`;
      const reward = document.createElement('span');
      reward.className = 'study-log-reward';
      reward.textContent = `+${Number(log.exp) || 0} EXP · +${Number(log.gold) || 0} G`;
      item.append(date, details, reward);
      return item;
    }));
  }

  function applyFurniture() {
    document.body.dataset.room = state.selectedFurniture;
  }

  function addTicketLog(itemName, action) {
    state.ticketLog.push({ date: new Date().toISOString(), item: itemName, action });
    state.ticketLog = state.ticketLog.slice(-50);
  }

  function renderShop() {
    elements.shopGold.textContent = `${state.player.gold} G`;
    elements.shopDiamonds.textContent = `${state.player.diamonds} 💎`;
    elements.shopItems.replaceChildren(...SHOP_ITEMS.map((item) => {
      const card = document.createElement('article');
      card.className = 'shop-item';
      const heading = document.createElement('h2');
      heading.textContent = item.name;
      const description = document.createElement('p');
      description.textContent = item.description;
      const price = document.createElement('strong');
      price.textContent = item.currency === 'gold' ? `${item.price} G` : `${item.price} 💎`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tool-button';
      const locked = item.minLevel && state.player.level < item.minLevel;
      const owned = item.type === 'furniture' && state.ownedFurniture.includes(item.id);
      const selected = owned && state.selectedFurniture === item.theme;
      button.textContent = locked ? `🔒 Lv.${item.minLevel}で解放` : selected ? '使用中' : owned ? '模様替えする' : '購入する';
      button.disabled = Boolean(locked || selected || (!owned && (
        item.currency === 'gold' ? state.player.gold < item.price : state.player.diamonds < item.price
      )));
      button.addEventListener('click', () => buyShopItem(item));
      card.append(heading, description, price, button);
      return card;
    }));

    const inventoryEntries = Object.entries(state.inventory).filter(([, quantity]) => quantity > 0);
    const activeBuff = state.buffExpiresAt > Date.now();
    elements.inventoryEmpty.hidden = inventoryEntries.length > 0 || activeBuff;
    elements.inventoryList.replaceChildren(...inventoryEntries.map(([id, quantity]) => {
      const item = SHOP_ITEMS.find((entry) => entry.id === id);
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${item.name} × ${quantity}`;
      const use = document.createElement('button');
      use.type = 'button';
      use.className = 'tool-button';
      use.textContent = id === 'evolution-stone' ? '使用する' : '使う';
      use.addEventListener('click', () => useInventoryItem(id));
      row.append(name, use);
      return row;
    }));

    if (activeBuff) {
      const buff = document.createElement('li');
      buff.className = 'active-buff';
      buff.textContent = `効率バフ薬 有効中（残り${Math.ceil((state.buffExpiresAt - Date.now()) / 60000)}分）`;
      elements.inventoryList.prepend(buff);
    }
    elements.ticketLogEmpty.hidden = state.ticketLog.length > 0;
    elements.ticketLogList.replaceChildren(...state.ticketLog.slice().reverse().map((entry) => {
      const row = document.createElement('li');
      const time = document.createElement('time');
      time.dateTime = entry.date;
      time.textContent = new Date(entry.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const action = document.createElement('span');
      action.textContent = `${entry.item}：${entry.action}`;
      row.append(time, action);
      return row;
    }));
  }

  function renderChurch() {
    const today = getDateKey();
    if (state.player.hasColdDebuff) {
      elements.debuffStatus.textContent = '風邪デバフ適用中：獲得ゴールドが半分になっています。';
    } else if (state.player.lastMissedDate === addDays(today, -1)) {
      elements.debuffStatus.textContent = `昨日の勉強を休みました。週間ライフが ${state.player.weeklyLife} 個残っています。`;
    } else {
      elements.debuffStatus.textContent = '現在、デバフはありません。';
    }
    elements.healButton.disabled = !state.player.hasColdDebuff || state.player.gold < GAME_RULES.treatmentCost;
    elements.healButton.textContent = state.player.hasColdDebuff
      ? `${GAME_RULES.treatmentCost} G で風邪を治療する`
      : '風邪デバフはありません';
    const enabled = state.insuranceEnabledDate === today;
    const used = state.insuranceUsedDate === today;
    elements.insuranceToggle.disabled = used;
    elements.insuranceToggle.textContent = enabled ? '今日の保険を無効にする' : '今日の保険を有効にする';
    elements.insuranceUse.disabled = !enabled || used;
    elements.insuranceStatus.textContent = used
      ? '今日のミニマム行動を完了しました。生存扱いです。'
      : enabled
        ? '1ページ開いたら「ミニマム行動を完了」を押してください。'
        : '保険は1日1回有効にできます。';
  }

  function levelUpPlayer() {
    while (state.player.level < 100 && state.player.currentExp >= requiredTotalExp(state.player.level + 1)) {
      state.player.level += 1;
    }
  }

  function finishDailyTasks() {
    processElapsedDays();
    const today = getDateKey();
    if (!state.tasks.length || state.dailyTaskDates.includes(today) || !state.tasks.every((task) => task.completedDate === today)) return;
    const taskBonusGold = Math.floor(GAME_RULES.dailyGoalBonusGold * (state.player.hasColdDebuff ? 0.5 : 1));
    state.dailyTaskDates.push(today);
    state.dailyTaskDates = state.dailyTaskDates.slice(-60);
    state.player.currentExp += GAME_RULES.dailyGoalBonusExp;
    state.player.gold += taskBonusGold;
    const { weeklyBonus } = recordDailyClear(today);
    levelUpPlayer();
    saveState();
    renderStatus();
    elements.dailyTaskReward.textContent = `タスク達成！ +${GAME_RULES.dailyGoalBonusExp} EXP / +${taskBonusGold} G${weeklyBonus ? ' · 7日連続達成！ +1 💎' : ''}`;
  }

  function addDailyTask(title) {
    const cleanedTitle = title.trim().slice(0, 60);
    if (!cleanedTitle) return;
    if (state.tasks.some((task) => task.title.toLocaleLowerCase() === cleanedTitle.toLocaleLowerCase())) {
      elements.dailyTaskInput.setCustomValidity('同じ名前のタスクがすでにあります。');
      elements.dailyTaskInput.reportValidity();
      return;
    }
    elements.dailyTaskInput.setCustomValidity('');
    state.tasks.push({ id: `task-${Date.now().toString(36)}`, title: cleanedTitle, completedDate: null });
    saveState();
    renderStatus();
    elements.dailyTaskInput.value = '';
  }

  function buyShopItem(item) {
    if (item.minLevel && state.player.level < item.minLevel) return;
    if (item.currency === 'gold' && state.player.gold < item.price) {
      window.alert('ゴールドが足りません。');
      return;
    }
    if (item.currency === 'diamonds' && state.player.diamonds < item.price) {
      window.alert('ダイヤが足りません。');
      return;
    }
    if (item.type === 'furniture' && state.ownedFurniture.includes(item.id)) {
      state.selectedFurniture = item.theme;
      saveState();
      renderStatus();
      return;
    }
    if (item.currency === 'gold') state.player.gold -= item.price;
    else state.player.diamonds -= item.price;
    if (item.type === 'buff') {
      state.buffExpiresAt = Math.max(Date.now(), state.buffExpiresAt || 0) + 60 * 60 * 1000;
      addTicketLog(item.name, '購入・1時間のバフを開始');
      window.alert('効率バフ薬を使いました。次の1時間、獲得ゴールドが1.5倍になります。');
      scheduleBuffExpiration();
    } else if (item.type === 'furniture') {
      state.ownedFurniture.push(item.id);
      state.selectedFurniture = item.theme;
    } else {
      state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
    }
    saveState();
    renderStatus();
  }

  function useInventoryItem(id) {
    if (!state.inventory[id]) return;
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    if (!window.confirm(`${item.name}を使いますか？`)) return;
    state.inventory[id] -= 1;
    const action = id === 'reading-voucher'
      ? '読書の時間に使用'
      : id === 'goro-goro-voucher'
        ? '1時間の休息に使用'
        : '進化の副素材として使用';
    addTicketLog(item.name, action);
    saveState();
    renderStatus();
  }

  function healDragon() {
    if (!state.player.hasColdDebuff) return;
    if (state.player.gold < GAME_RULES.treatmentCost) {
      window.alert('治療には300 G必要です。');
      return;
    }
    if (!window.confirm('300 Gを支払って、風邪デバフを治療しますか？')) return;
    state.player.gold -= GAME_RULES.treatmentCost;
    state.player.hasColdDebuff = false;
    saveState();
    renderStatus();
  }

  function useInsurance() {
    processElapsedDays();
    const today = getDateKey();
    if (state.insuranceEnabledDate !== today || state.insuranceUsedDate === today) return;
    if (!window.confirm('1ページ開くなどのミニマム行動を終えましたか？今日を生存扱いにします。')) return;
    state.insuranceUsedDate = today;
    const { weeklyBonus } = recordDailyClear(today);
    saveState();
    renderStatus();
    elements.insuranceStatus.textContent = `今日を生存扱いにしました。${weeklyBonus ? '7日連続達成！ +1 💎' : ''}`;
  }

  function triggerTabooPenalty() {
    if (!window.confirm(`禁忌を破ったとして、所持ゴールド ${state.player.gold} G を半分にしますか？`)) return;
    state.player.gold = Math.floor(state.player.gold / 2);
    saveState();
    renderStatus();
  }

  function getComboStats() {
    const lastGoalDate = state.player.lastGoalDate;
    if (!lastGoalDate) return { days: 0, multiplier: 1 };
    const daysSinceGoal = getDateDifference(lastGoalDate, getDateKey());
    if (daysSinceGoal < 0 || daysSinceGoal > 1) return { days: 0, multiplier: 1 };
    const days = state.player.comboDays;
    return {
      days,
      multiplier: Math.min(GAME_RULES.maxComboMultiplier, 1 + Math.max(0, days - 1) * GAME_RULES.comboMultiplierPerDay)
    };
  }

  function getDragonStage(level) {
    if (level >= 100) return { stage: 5, name: '神竜エンシェントドラゴン', image: 'images/神竜エンシェントドラゴン.png' };
    if (level >= 70) return { stage: 4, name: '成竜ワイバーン', image: 'images/成竜ワイバーン.png' };
    if (level >= 30) return { stage: 3, name: 'つばさドラ', image: 'images/つばさドラゴン.png' };
    if (level >= 10) return { stage: 2, name: 'ツノドラ', image: 'images/つのドラゴン.png' };
    return { stage: 1, name: 'ちびドラ', image: 'images/ベビードラゴン.png' };
  }

  function getArea(level) {
    if (level >= 91) return { name: 'ラスト魔王城', range: 'Lv. 91-100' };
    if (level >= 61) return { name: '天空の塔', range: 'Lv. 61-90' };
    if (level >= 31) return { name: '試練の荒野', range: 'Lv. 31-60' };
    return { name: '習慣の森', range: 'Lv. 1-30' };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Study RPGのデータを保存できませんでした。', error);
    }
  }

  function renderStatus() {
    processElapsedDays();
    const level = state.player.level;
    const currentThreshold = level === 1 ? 0 : requiredTotalExp(level);
    const nextThreshold = requiredTotalExp(level + 1);
    const levelProgress = Math.max(0, state.player.currentExp - currentThreshold);
    const levelSpan = Math.max(1, nextThreshold - currentThreshold);
    const percent = level >= 100 ? 100 : Math.min(100, (levelProgress / levelSpan) * 100);

    elements.levelLabel.textContent = `LEVEL ${level}`;
    elements.expFill.style.width = `${percent}%`;
    elements.expTrack.setAttribute('aria-valuemax', String(levelSpan));
    elements.expTrack.setAttribute('aria-valuenow', String(Math.min(levelSpan, levelProgress)));
    elements.expCaption.textContent = `${Math.floor(levelProgress)} / ${levelSpan} EXP`;
    elements.goldCount.textContent = String(state.player.gold);
    elements.diamondCount.textContent = String(state.player.diamonds);
    elements.weeklyLife.textContent = `${'❤️'.repeat(state.player.weeklyLife)}${'♡'.repeat(GAME_RULES.weeklyLifeCount - state.player.weeklyLife)}`;
    const condition = state.player.hasColdDebuff
      ? '寝込み'
      : state.player.lastMissedDate === addDays(getDateKey(), -1) ? '空腹' : '正常';
    elements.dragonStatus.textContent = condition;
    elements.dragonCondition.textContent = condition === '寝込み'
      ? '風邪デバフ中 · G獲得 0.5倍'
      : condition === '空腹' ? '昨日はおやすみ · 今日はまた一歩' : '調子良好';
    const dragon = getDragonStage(level);
    const area = getArea(level);
    elements.dragonVisual.src = dragon.image;
    elements.dragonVisual.alt = dragon.name;
    elements.timerDragon.src = dragon.image;
    elements.dragonVisual.dataset.stage = String(dragon.stage);
    elements.dragonName.textContent = dragon.name;
    elements.dragonLevel.textContent = String(level);
    elements.dragonStageCaption.textContent = `Stage ${dragon.stage} · 相棒がここで待っている`;
    elements.questDragonCaption.textContent = `${dragon.name}と一緒に、目の前の一問から。`;
    elements.currentArea.textContent = area.name;
    elements.areaLevelRange.textContent = area.range;
    if (state.player.areaName !== area.name) {
      state.player.areaName = area.name;
      state.player.areaDays = 0;
      saveState();
    }
    elements.areaProgress.textContent = level === 100
      ? '最終エンディング到達！'
      : `エリア達成 ${state.player.areaDays} / 30日`;

    const dailyGoal = state.settings.dailyGoalMinutes;
    const todayMinutes = getTodayMinutes();
    const goalProgress = Math.min(dailyGoal, todayMinutes);
    const combo = getComboStats();
    elements.dailyGoalInput.value = String(dailyGoal);
    elements.dailyGoalFill.style.width = `${(goalProgress / dailyGoal) * 100}%`;
    elements.dailyGoalTrack.setAttribute('aria-valuemax', String(dailyGoal));
    elements.dailyGoalTrack.setAttribute('aria-valuenow', String(goalProgress));
    elements.dailyGoalCaption.textContent = `${todayMinutes} / ${dailyGoal}分`;
    const goldMultiplier = getCurrentGoldMultiplier();
    elements.comboStatus.textContent = `連続達成 ${combo.days}日 / G ${goldMultiplier.total.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}倍${goldMultiplier.potionMultiplier > 1 ? ' · 薬' : ''}`;
    renderDailyTasks();
    renderStudyHistory();
    renderShop();
    renderChurch();
    applyFurniture();
  }

  function showScreen(screenId) {
    elements.homeScreen.hidden = screenId !== 'home-screen';
    elements.shopScreen.hidden = screenId !== 'shop-screen';
    elements.churchScreen.hidden = screenId !== 'church-screen';
    elements.questScreen.hidden = screenId !== 'quest-screen';
    document.querySelectorAll('.nav-button').forEach((button) => {
      const active = button.dataset.screen === screenId;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.querySelector('.screen-nav').hidden = screenId === 'quest-screen';
    renderStatus();
  }

  function showHome() {
    elements.ratingModal.hidden = true;
    elements.resultModal.hidden = true;
    showScreen('home-screen');
  }

  function showQuest() {
    elements.durationInput.value = String(state.settings.defaultTimerMinutes);
    showScreen('quest-screen');
    resetTimer();
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  }

  function getDuration() {
    const minutes = Number(elements.durationInput.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 999) return null;
    return minutes;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    sessionMinutes = getDuration() || 25;
    remainingSeconds = sessionMinutes * 60;
    elements.durationInput.value = String(sessionMinutes);
    elements.durationInput.disabled = false;
    elements.timerDisplay.textContent = formatTime(remainingSeconds);
    elements.timerState.textContent = '準備ができたらスタート';
    elements.startButton.querySelector('span').textContent = 'スタート';
    elements.startButton.querySelector('.button-arrow').textContent = '▶';
    elements.pauseButton.disabled = true;
    elements.pauseButton.textContent = '一時停止';
    elements.timerPanel.classList.remove('is-running');
  }

  function tick() {
    remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    elements.timerDisplay.textContent = formatTime(remainingSeconds);
    if (remainingSeconds === 0) completeSession();
  }

  function startTimer() {
    if (isRunning) return;
    if (!elements.durationInput.disabled) {
      const duration = getDuration();
      if (!duration) {
        elements.durationInput.setCustomValidity('1〜999分で設定してください。');
        elements.durationInput.reportValidity();
        return;
      }
      elements.durationInput.setCustomValidity('');
      sessionMinutes = duration;
      remainingSeconds = duration * 60;
      elements.durationInput.disabled = true;
    }
    isRunning = true;
    deadline = Date.now() + remainingSeconds * 1000;
    elements.timerState.textContent = '集中タイム進行中';
    elements.startButton.querySelector('span').textContent = '勉強中';
    elements.startButton.querySelector('.button-arrow').textContent = '●';
    elements.pauseButton.disabled = false;
    elements.timerPanel.classList.add('is-running');
    timerInterval = window.setInterval(tick, 250);
    tick();
  }

  function pauseTimer() {
    if (!isRunning) return;
    remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    elements.timerDisplay.textContent = formatTime(remainingSeconds);
    elements.timerState.textContent = '一時停止中';
    elements.startButton.querySelector('span').textContent = '再開';
    elements.startButton.querySelector('.button-arrow').textContent = '▶';
    elements.pauseButton.disabled = true;
    elements.timerPanel.classList.remove('is-running');
    if (remainingSeconds === 0) completeSession();
  }

  function completeSession() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    elements.timerPanel.classList.remove('is-running');
    showRatingDialog();
  }

  function showRatingDialog() {
    elements.completedMinutes.textContent = String(sessionMinutes);
    elements.testSessionNote.hidden = !isTestSession;
    elements.ratingModal.hidden = false;
    elements.ratingModal.querySelector('.rating-button').focus();
  }

  function awardSession(multiplier, stars) {
    processElapsedDays();
    const today = getDateKey();
    const currentTodayMinutes = getTodayMinutes();
    const hasCompletedGoalToday = state.studyLogs.some((log) => !log.test && getDateKey(log.date) === today && log.dailyGoalCompleted === true);
    const dailyGoalCompleted = !isTestSession && !hasCompletedGoalToday && currentTodayMinutes + sessionMinutes >= state.settings.dailyGoalMinutes;
    const exp = Math.floor(sessionMinutes * GAME_RULES.expPerMinute * multiplier);
    const goldMultipliers = getCurrentGoldMultiplier();
    const gold = Math.floor(sessionMinutes * GAME_RULES.goldPerMinute * multiplier * goldMultipliers.total);
    const goalBonusExp = dailyGoalCompleted ? GAME_RULES.dailyGoalBonusExp : 0;
    const goalBonusGold = dailyGoalCompleted
      ? Math.floor(GAME_RULES.dailyGoalBonusGold * goldMultipliers.coldMultiplier)
      : 0;
    const previousLevel = state.player.level;

    state.player.currentExp += exp + goalBonusExp;
    state.player.gold += gold + goalBonusGold;
    const { weeklyBonus } = dailyGoalCompleted
      ? recordDailyClear(today)
      : { weeklyBonus: false };
    levelUpPlayer();
    state.studyLogs.push({
      date: new Date().toISOString(),
      durationMinutes: sessionMinutes,
      stars,
      multiplier,
      comboMultiplier: goldMultipliers.comboMultiplier,
      buffMultiplier: goldMultipliers.potionMultiplier,
      coldMultiplier: goldMultipliers.coldMultiplier,
      exp,
      gold,
      goalBonusExp,
      goalBonusGold,
      dailyGoalCompleted,
      test: isTestSession
    });
    saveState();
    renderStatus();

    elements.rewardExp.textContent = String(exp + goalBonusExp);
    elements.rewardGold.textContent = String(gold + goalBonusGold);
    elements.goalBonusRow.hidden = !dailyGoalCompleted;
    elements.goalBonusRow.querySelector('b').textContent = `+${GAME_RULES.dailyGoalBonusExp} EXP / +${goalBonusGold} G`;
    elements.taskBonusRow.hidden = true;
    elements.weeklyBonusRow.hidden = !weeklyBonus;
    elements.resultRating.textContent = RATING_LABELS[stars];
    elements.levelUpMessage.hidden = state.player.level === previousLevel;
    if (state.player.level !== previousLevel) {
      elements.levelUpDetail.textContent = `Lv.${previousLevel} → Lv.${state.player.level}`;
    }
    elements.ratingModal.hidden = true;
    elements.resultModal.hidden = false;
    isTestSession = false;
    elements.resultHomeButton.focus();
  }

  function completeTestSession() {
    const minutes = Number(elements.testDuration.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 999) {
      elements.testDuration.setCustomValidity('1〜999分で設定してください。');
      elements.testDuration.reportValidity();
      return;
    }
    elements.testDuration.setCustomValidity('');
    sessionMinutes = minutes;
    remainingSeconds = 0;
    isTestSession = true;
    showRatingDialog();
  }

  function setTestLevel() {
    const level = Number(elements.testLevel.value);
    if (!Number.isInteger(level) || level < 1 || level > 100) {
      elements.testLevel.setCustomValidity('1〜100の整数を入力してください。');
      elements.testLevel.reportValidity();
      return;
    }
    elements.testLevel.setCustomValidity('');
    state.player.level = level;
    state.player.currentExp = level === 1 ? 0 : requiredTotalExp(level);
    saveState();
    renderStatus();
  }

  function resetTestData() {
    if (!window.confirm('プレイヤー情報と勉強ログを初期化します。この操作は取り消せません。')) return;
    state = structuredClone(DEFAULT_STATE);
    state.player.lastProcessedDate = getDateKey();
    isTestSession = false;
    saveState();
    elements.testLevel.value = '1';
    showHome();
  }

  function abortSession() {
    const confirmed = window.confirm('クエストを中断しますか？この勉強の報酬は獲得できません。');
    if (!confirmed) return;
    resetTimer();
    showHome();
  }

  document.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.screen));
  });
  elements.departButton.addEventListener('click', showQuest);
  elements.backButton.addEventListener('click', () => {
    if (elements.durationInput.disabled) {
      const confirmed = window.confirm('クエストを終了してホームへ戻りますか？報酬は獲得できません。');
      if (!confirmed) return;
      resetTimer();
    }
    showHome();
  });
  elements.durationInput.addEventListener('input', () => {
    const duration = getDuration();
    if (duration && !isRunning && !timerInterval) {
      remainingSeconds = duration * 60;
      elements.timerDisplay.textContent = formatTime(remainingSeconds);
      elements.timerState.textContent = '準備ができたらスタート';
    }
  });
  elements.durationInput.addEventListener('change', () => {
    const duration = getDuration();
    if (!duration) return;
    state.settings.defaultTimerMinutes = duration;
    saveState();
  });
  elements.startButton.addEventListener('click', startTimer);
  elements.pauseButton.addEventListener('click', pauseTimer);
  elements.abortButton.addEventListener('click', abortSession);
  elements.ratingModal.querySelectorAll('.rating-button').forEach((button) => {
    button.addEventListener('click', () => {
      awardSession(Number(button.dataset.multiplier), Number(button.dataset.stars));
    });
  });
  elements.resultHomeButton.addEventListener('click', showHome);
  elements.testCompleteButton.addEventListener('click', completeTestSession);
  elements.testLevelButton.addEventListener('click', setTestLevel);
  elements.testResetButton.addEventListener('click', resetTestData);
  elements.dailyGoalInput.addEventListener('change', () => {
    const dailyGoal = Number(elements.dailyGoalInput.value);
    if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 1440) {
      elements.dailyGoalInput.setCustomValidity('1〜1440分で設定してください。');
      elements.dailyGoalInput.reportValidity();
      elements.dailyGoalInput.value = String(state.settings.dailyGoalMinutes);
      return;
    }
    elements.dailyGoalInput.setCustomValidity('');
    state.settings.dailyGoalMinutes = dailyGoal;
    saveState();
    renderStatus();
  });

  elements.dailyTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addDailyTask(elements.dailyTaskInput.value);
  });
  elements.dailyTaskList.addEventListener('change', (event) => {
    const taskId = event.target.dataset.taskId;
    if (!taskId || state.dailyTaskDates.includes(getDateKey())) return;
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task) return;
    task.completedDate = event.target.checked ? getDateKey() : null;
    saveState();
    finishDailyTasks();
    renderStatus();
  });
  elements.dailyTaskList.addEventListener('click', (event) => {
    const taskId = event.target.dataset.removeTaskId;
    if (!taskId || state.dailyTaskDates.includes(getDateKey())) return;
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
    saveState();
    renderStatus();
  });
  elements.healButton.addEventListener('click', healDragon);
  elements.insuranceToggle.addEventListener('click', () => {
    const today = getDateKey();
    if (state.insuranceUsedDate === today) return;
    state.insuranceEnabledDate = state.insuranceEnabledDate === today ? null : today;
    saveState();
    renderStatus();
  });
  elements.insuranceUse.addEventListener('click', useInsurance);
  elements.tabooButton.addEventListener('click', triggerTabooPenalty);

  if (!state.player.lastProcessedDate) state.player.lastProcessedDate = getDateKey();
  if (state.buffExpiresAt && state.buffExpiresAt <= Date.now()) state.buffExpiresAt = null;
  scheduleBuffExpiration();
  document.querySelector('.screen-nav').hidden = false;
  renderStatus();
})();
