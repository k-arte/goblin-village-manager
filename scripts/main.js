(() => {
  const MODULE_ID = "goblin-village-manager";
  const SETTING_KEY = "state";

  const clone = (obj) => foundry.utils.deepClone(obj);
  const merge = (a, b) => foundry.utils.mergeObject(a, b, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });

  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
  const d = (sides) => Math.floor(Math.random() * sides) + 1;
  const id = () => foundry.utils.randomID();

  const STAT_LABELS = {
    population: "Население",
    food: "Еда",
    treasury: "Казна",
    military: "Военная сила",
    loyalty: "Лояльность",
    attractiveness: "Привлекательность",
    threat: "Угроза",
    projectCapacity: "Лимит проектов"
  };

  const BUILDING_TYPES = {
    food: "Еда",
    economy: "Экономика",
    military: "Военное",
    social: "Социальное",
    religion: "Религиозное",
    governance: "Управление",
    storage: "Складское",
    special: "Специальное",
    crafting: "Крафт"
  };

  const DEFAULT_BUILDINGS = [
    {
      id: "senate",
      name: "Комната сената",
      type: "governance",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 8,
      workersAssigned: 4,
      upkeep: { treasury: 3 },
      production: {},
      modifiers: { attractiveness: 1, loyalty: 1, projectCapacity: 1 },
      upgradeBaseCost: 140,
      upgradeNames: [
        "Расширить стол заседаний и нанять писцов",
        "Создать административный архив",
        "Нанять постоянных советников",
        "Организовать канцелярию поселения",
        "Создать полноценный правящий совет"
      ],
      note: "Уровень Сената определяет количество активных проектов деревни."
    },
    {
      id: "greenhouse",
      name: "Теплица",
      type: "food",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 6,
      workersAssigned: 6,
      upkeep: { treasury: 2 },
      production: { food: 18 },
      modifiers: {},
      upgradeBaseCost: 80,
      upgradeNames: [
        "Поставить новые грибные грядки",
        "Расширить стеклянные секции",
        "Нанять садовника-алхимика",
        "Поставить систему подземного орошения",
        "Создать купольную теплицу"
      ],
      note: "Основной источник еды."
    },
    {
      id: "goblin_barracks",
      name: "Казармы гоблинов",
      type: "military",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 16,
      workersAssigned: 16,
      upkeep: { treasury: 6, food: 8 },
      production: { military: 18, food: 4 },
      modifiers: {},
      upgradeBaseCost: 120,
      upgradeNames: [
        "Раздать нормальное оружие ополчению",
        "Нанять ветерана-инструктора",
        "Построить тренировочный двор",
        "Укрепить казармы и склад оружия",
        "Создать постоянный гарнизон"
      ],
      note: "Военная сила и добыча еды в округе."
    },
    {
      id: "spider_barracks",
      name: "Казармы наездных пауков",
      type: "military",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 16,
      workersAssigned: 10,
      upkeep: { treasury: 8, food: 10 },
      production: { military: 22, food: 3 },
      modifiers: {},
      upgradeBaseCost: 160,
      upgradeNames: [
        "Расширить стойла пауков",
        "Нанять дрессировщика пауков",
        "Поставить седла и броню для пауков",
        "Создать паучьи патрули",
        "Организовать элитную кавалерию"
      ],
      note: "Сильная оборона, но дорогое содержание."
    },
    {
      id: "market",
      name: "Рынок",
      type: "economy",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 8,
      workersAssigned: 8,
      upkeep: { treasury: 2 },
      production: { treasury: 14 },
      modifiers: { attractiveness: 1 },
      upgradeBaseCost: 100,
      upgradeNames: [
        "Поставить постоянные торговые ряды",
        "Привлечь купцов из округи",
        "Создать торговую охрану",
        "Открыть караванную площадку",
        "Создать региональный торговый центр"
      ],
      note: "Главная регулярная экономика."
    },
    {
      id: "inn",
      name: "Гостиница",
      type: "economy",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 8,
      workersAssigned: 4,
      upkeep: { treasury: 2, food: 2 },
      production: { treasury: 8 },
      modifiers: { attractiveness: 1, loyalty: 1 },
      upgradeBaseCost: 90,
      upgradeNames: [
        "Починить комнаты и кровати",
        "Нанять повара",
        "Открыть общий зал для гостей",
        "Создать караванный двор",
        "Сделать известный трактир"
      ],
      note: "Доход и привлекательность."
    },
    {
      id: "brothel",
      name: "Бордель",
      type: "social",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 16,
      workersAssigned: 4,
      upkeep: { treasury: 3, food: 2 },
      production: { treasury: 10 },
      modifiers: { loyalty: 2, attractiveness: 1 },
      upgradeBaseCost: 110,
      upgradeNames: [
        "Обустроить приватные комнаты",
        "Нанять управляющего",
        "Добавить охрану и правила заведения",
        "Сделать заведение известным в округе",
        "Создать элитный дом развлечений"
      ],
      note: "Социальная стабильность и доход."
    },
    {
      id: "casino",
      name: "Казино",
      type: "economy",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 16,
      workersAssigned: 4,
      upkeep: { treasury: 4 },
      production: { treasury: 12 },
      modifiers: { loyalty: -1, attractiveness: 1 },
      random: "casino",
      upgradeBaseCost: 150,
      upgradeNames: [
        "Поставить новые игровые столы",
        "Нанять крупье",
        "Ввести охрану и долговые книги",
        "Привлечь богатых игроков",
        "Создать роскошный игорный дом"
      ],
      note: "Высокий доход с риском."
    },
    {
      id: "auction",
      name: "Малый аукцион",
      type: "economy",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 4,
      workersAssigned: 2,
      upkeep: { treasury: 2 },
      production: { treasury: 7 },
      modifiers: { attractiveness: 1 },
      random: "auction",
      upgradeBaseCost: 130,
      upgradeNames: [
        "Нанять оценщика",
        "Создать хранилище лотов",
        "Привлечь торговцев редкостями",
        "Организовать закрытые торги",
        "Создать престижный аукционный дом"
      ],
      note: "Иногда даёт всплеск дохода."
    },
    {
      id: "storehouse",
      name: "Средние склады",
      type: "storage",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 4,
      workersAssigned: 2,
      upkeep: { treasury: 1 },
      production: {},
      modifiers: { foodCapacity: 100, treasuryCapacity: 500 },
      upgradeBaseCost: 90,
      upgradeNames: [
        "Расширить кладовые",
        "Поставить охрану склада",
        "Организовать учёт запасов",
        "Построить сухие подвалы",
        "Создать центральный складской комплекс"
      ],
      note: "Вместимость запасов."
    },
    {
      id: "watchpost",
      name: "Малый сторожевой пункт",
      type: "military",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 8,
      workersAssigned: 4,
      upkeep: { treasury: 3, food: 3 },
      production: { military: 10 },
      modifiers: {},
      upgradeBaseCost: 75,
      upgradeNames: [
        "Поставить вышку",
        "Нанять дозорных",
        "Добавить сигнальные костры",
        "Построить укреплённый пост",
        "Создать сеть наблюдения"
      ],
      note: "Дешёвая оборона."
    },
    {
      id: "baths",
      name: "Средние бани",
      type: "social",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 6,
      workersAssigned: 2,
      upkeep: { treasury: 3, food: 1 },
      production: {},
      modifiers: { loyalty: 3, attractiveness: 1 },
      upgradeBaseCost: 100,
      upgradeNames: [
        "Починить печи и воду",
        "Нанять банщиков",
        "Добавить лечебные травы",
        "Построить горячие бассейны",
        "Создать общественные термы"
      ],
      note: "Лояльность и привлекательность."
    },
    {
      id: "prison",
      name: "Средние тюремные помещения",
      type: "governance",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 6,
      workersAssigned: 2,
      upkeep: { treasury: 3, food: 2 },
      production: { military: 4 },
      modifiers: { loyalty: -1 },
      upgradeBaseCost: 100,
      upgradeNames: [
        "Поставить крепкие двери",
        "Нанять тюремщиков",
        "Создать отдельные камеры",
        "Добавить допросную и караул",
        "Построить полноценную тюрьму"
      ],
      note: "Порядок через контроль."
    },
    {
      id: "temple_torm",
      name: "Храм Торма",
      type: "religion",
      status: "built",
      level: 1,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 6,
      workersAssigned: 3,
      upkeep: { treasury: 4 },
      production: {},
      modifiers: { loyalty: 4, attractiveness: 1 },
      upgradeBaseCost: 150,
      bonuses: ["torm_blessing", "healing_vigil"],
      upgradeNames: [
        "Освятить алтарь Торма",
        "Нанять постоянного жреца",
        "Создать зал клятв",
        "Построить часовню паладинов",
        "Возвести полноценный храмовый комплекс"
      ],
      note: "Лояльность, привлекательность и бонусы."
    },
    {
      id: "smithy",
      name: "Кузня",
      type: "crafting",
      status: "available",
      level: 0,
      maxLevel: 5,
      unlockLevel: 5,
      workersRequired: 0,
      workersAssigned: 0,
      upkeep: {},
      production: {},
      modifiers: {},
      upgradeBaseCost: 150,
      services: [],
      upgradeNames: [
        "Нанять мастера-дварфа из Глубоководья",
        "Улучшить снаряжение кузни",
        "Поставить печь для посеребрения",
        "Закупить редкие сплавы",
        "Создать мифрило-адамантиновую мастерскую"
      ],
      levelServices: {
        1: ["Ремонт металлических предметов", "Создание простых металлических предметов"],
        2: ["Крафт брони", "Посеребрение оружия"],
        3: ["Улучшенный крафт оружия"],
        4: ["Покрытие адамантием"],
        5: ["Работа с мифрилом и редкими сплавами"]
      },
      note: "Первый пример здания, которое даёт сервисы игрокам."
    },
    {
      id: "artifact_workshop",
      name: "Мастерская артефактов",
      type: "special",
      status: "available",
      level: 0,
      maxLevel: 5,
      unlockLevel: 9,
      workersRequired: 0,
      workersAssigned: 0,
      upkeep: {},
      production: {},
      modifiers: {},
      upgradeBaseCost: 500,
      bonuses: ["enchanted_weapons", "warding_charms"],
      upgradeNames: [
        "Нанять арканиста-ремесленника",
        "Установить зачаровательный верстак",
        "Создать хранилище реагентов",
        "Поставить защитные круги",
        "Открыть полноценную артефактную лабораторию"
      ],
      note: "Позднее специальное здание с высокой ценой и сильными бонусами."
    }
  ];

  const BONUS_TEMPLATES = {
    torm_blessing: {
      id: "torm_blessing",
      name: "Благословение Торма",
      source: "Храм Торма",
      cost: { treasury: 50 },
      duration: 1,
      modifiers: { military: 10, loyalty: 5 },
      description: "Один активный бастионный бонус на 1 цикл."
    },
    healing_vigil: {
      id: "healing_vigil",
      name: "Ночная служба исцеления",
      source: "Храм Торма",
      cost: { treasury: 35 },
      duration: 1,
      modifiers: { loyalty: 8 },
      description: "Повышает лояльность на 1 цикл."
    },
    enchanted_weapons: {
      id: "enchanted_weapons",
      name: "Зачарованное оружие",
      source: "Мастерская артефактов",
      cost: { treasury: 100 },
      duration: 1,
      modifiers: { military: 20 },
      description: "Временный военный рывок на 1 цикл."
    },
    warding_charms: {
      id: "warding_charms",
      name: "Обереги поселения",
      source: "Мастерская артефактов",
      cost: { treasury: 80 },
      duration: 1,
      modifiers: { military: 8, loyalty: 4 },
      description: "Защитный и моральный бонус."
    }
  };

  const DEFAULT_STATE = {
    version: 1,
    name: "Деревня гоблинов",
    cycle: 0,
    hiddenFromPlayers: false,
    playerCharacterLevel: 5,
    resources: {
      population: 40,
      food: 120,
      treasury: 500,
      loyalty: 60,
      threat: 18
    },
    derived: {
      military: 0,
      attractiveness: 0,
      freeWorkers: 0,
      assignedWorkers: 0,
      foodCapacity: 250,
      treasuryCapacity: 2000,
      projectCapacity: 1
    },
    scouting: {
      known: false,
      cyclesRemainingVisible: null,
      threatMin: null,
      threatMax: null,
      expiresCycle: 0
    },
    attack: {
      nextInCycles: 3,
      baseGrowth: 2
    },
    activeBonus: null,
    buildings: DEFAULT_BUILDINGS,
    reforms: [
      {
        id: "recruit_outsiders",
        name: "Вербовка жителей с округи",
        description: "Посланники убеждают жителей соседних мест переселиться в деревню.",
        active: false,
        interval: 1,
        tick: 0,
        effects: [
          { target: "settlement", stat: "attractiveness", mode: "add", value: 3, timing: "passive" },
          { target: "settlement", stat: "treasury", mode: "add", value: -1, timing: "everyInterval" }
        ]
      }
    ],
    orders: [],
    projects: [],
    reports: []
  };

  function isGM() {
    return game.user?.isGM;
  }

  function registerSettings() {
    const fullKey = `${MODULE_ID}.${SETTING_KEY}`;
    if (!game.settings.settings.has(fullKey)) {
      game.settings.register(MODULE_ID, SETTING_KEY, {
        name: "Goblin Village Manager State",
        scope: "world",
        config: false,
        type: Object,
        default: clone(DEFAULT_STATE)
      });
    }
  }

  async function getState() {
    const state = game.settings.get(MODULE_ID, SETTING_KEY);
    if (!state || !state.resources) return clone(DEFAULT_STATE);
    return merge(clone(DEFAULT_STATE), state);
  }

  async function saveState(state) {
    return game.settings.set(MODULE_ID, SETTING_KEY, state);
  }

  function signed(n) {
    n = Number(n) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  }

  function lines(obj = {}, invert = false) {
    const entries = Object.entries(obj);
    if (!entries.length) return "—";
    return entries.map(([k, v]) => `${STAT_LABELS[k] || k}: ${signed(invert ? -v : v)}`).join(", ");
  }

  function getValue(state, stat) {
    if (state.resources[stat] !== undefined) return state.resources[stat];
    if (state.derived[stat] !== undefined) return state.derived[stat];
    return 0;
  }

  function addValue(state, stat, value) {
    value = Number(value) || 0;
    if (state.resources[stat] !== undefined) state.resources[stat] += value;
    else if (state.derived[stat] !== undefined) state.derived[stat] += value;
  }

  function canAfford(state, cost = {}) {
    for (const [k, v] of Object.entries(cost)) {
      if (getValue(state, k) < Number(v || 0)) return false;
    }
    return true;
  }

  function pay(state, cost = {}) {
    for (const [k, v] of Object.entries(cost)) addValue(state, k, -Number(v || 0));
  }

  function eff(b) {
    if (!["built", "damaged"].includes(b.status)) return 0;
    if (b.status === "damaged") return 0.5;
    const req = Math.max(1, Number(b.workersRequired) || 1);
    const assigned = clamp(b.workersAssigned || 0, 0, req);
    return clamp(assigned / req, 0, 1);
  }

  function upgradeCost(b) {
    const next = (b.level || 0) + 1;
    return Math.round((b.upgradeBaseCost || 100) * Math.pow(1.7, Math.max(0, next - 1)));
  }

  function upgradeDuration(b) {
    return Math.max(1, (b.level || 0) + 1);
  }

  function upgradeTitle(b) {
    const next = (b.level || 0) + 1;
    return b.upgradeNames?.[next - 1] || `Улучшить ${b.name} до L${next}`;
  }

  function applyUpgrade(b) {
    const oldLevel = Math.max(0, b.level || 0);
    const newLevel = oldLevel + 1;
    b.level = newLevel;
    b.status = "built";

    if (oldLevel === 0) {
      if (b.id === "smithy") {
        b.workersRequired = 4;
        b.workersAssigned = 0;
        b.upkeep = { treasury: 2 };
        b.production = { treasury: 8 };
        b.modifiers = {};
      } else if (b.id === "artifact_workshop") {
        b.workersRequired = 12;
        b.workersAssigned = 0;
        b.upkeep = { treasury: 15, food: 6 };
        b.production = { treasury: 30 };
        b.modifiers = { threat: 2 };
      }
    } else {
      const ratio = 1.35;
      b.workersRequired = Math.ceil((b.workersRequired || 1) * ratio);
      for (const bucket of ["upkeep", "production", "modifiers"]) {
        b[bucket] ||= {};
        for (const key of Object.keys(b[bucket])) {
          b[bucket][key] = Math.round((Number(b[bucket][key]) || 0) * ratio);
        }
      }
    }

    if (b.levelServices?.[newLevel]) {
      b.services ||= [];
      for (const service of b.levelServices[newLevel]) {
        if (!b.services.includes(service)) b.services.push(service);
      }
    }
  }

  function calculateDerived(state) {
    let assigned = 0;
    let military = 0;
    let attractiveness = 0;
    let foodCapacity = 250;
    let treasuryCapacity = 2000;
    let loyaltyMod = 0;
    let threatMod = 0;
    let projectCapacity = 1;

    for (const b of state.buildings) {
      if (["built", "damaged"].includes(b.status)) assigned += Math.min(Number(b.workersAssigned) || 0, Number(b.workersRequired) || 0);
      const e = eff(b);

      for (const [k, v] of Object.entries(b.production || {})) {
        if (k === "military") military += Math.round(v * e);
      }

      for (const [k, v] of Object.entries(b.modifiers || {})) {
        const x = Math.round(v * e);
        if (k === "attractiveness") attractiveness += x;
        if (k === "loyalty") loyaltyMod += x;
        if (k === "foodCapacity") foodCapacity += x;
        if (k === "treasuryCapacity") treasuryCapacity += x;
        if (k === "threat") threatMod += x;
        if (k === "projectCapacity") projectCapacity += x;
      }
    }

    for (const r of state.reforms.filter(r => r.active)) {
      for (const ef of r.effects || []) {
        if (ef.timing !== "passive") continue;
        if (ef.target !== "settlement") continue;
        const v = Number(ef.value) || 0;
        if (ef.stat === "military") military += v;
        if (ef.stat === "attractiveness") attractiveness += v;
        if (ef.stat === "loyalty") loyaltyMod += v;
        if (ef.stat === "threat") threatMod += v;
        if (ef.stat === "projectCapacity") projectCapacity += v;
      }
    }

    if (state.activeBonus) {
      for (const [k, v] of Object.entries(state.activeBonus.modifiers || {})) {
        if (k === "military") military += v;
        if (k === "attractiveness") attractiveness += v;
        if (k === "loyalty") loyaltyMod += v;
        if (k === "threat") threatMod += v;
      }
    }

    const senate = state.buildings.find(b => b.id === "senate" && b.status === "built");
    if (senate) projectCapacity = Math.max(projectCapacity, senate.level || 1);

    state.derived = {
      military: Math.round(military),
      attractiveness: Math.round(attractiveness),
      freeWorkers: Math.max(0, (Number(state.resources.population) || 0) - assigned),
      assignedWorkers: assigned,
      foodCapacity,
      treasuryCapacity,
      loyaltyMod,
      threatMod,
      projectCapacity: Math.max(1, Math.round(projectCapacity))
    };

    return state.derived;
  }

  function activeProjectCount(state) {
    return state.projects.filter(p => p.status === "active").length;
  }

  function addReport(state, title, items) {
    state.reports.unshift({ cycle: state.cycle, title, items, time: Date.now() });
    state.reports = state.reports.slice(0, 30);
  }

  function casinoRandom(b, e) {
    const roll = d(100);
    let value = 0;
    if (roll <= 20) value = -8;
    else if (roll <= 80) value = d(8);
    else value = 10 + d(20);
    return Math.round(value * e * Math.max(1, b.level || 1));
  }

  function auctionRandom(e) {
    const roll = d(100);
    const value = roll >= 85 ? 20 + d(20) : d(6);
    return Math.round(value * e);
  }

  async function advanceCycle() {
    if (!isGM()) return ui.notifications.warn("Только GM может запускать цикл.");

    const state = await getState();
    state.cycle += 1;
    calculateDerived(state);

    const before = clone({ ...state.resources, ...state.derived });
    const report = [];

    const totals = {};

    for (const b of state.buildings) {
      if (!["built", "damaged"].includes(b.status)) continue;
      const e = eff(b);

      for (const [k, v] of Object.entries(b.production || {})) {
        totals[k] = (totals[k] || 0) + Math.round(v * e);
      }

      if (b.random === "casino") totals.treasury = (totals.treasury || 0) + casinoRandom(b, e);
      if (b.random === "auction") totals.treasury = (totals.treasury || 0) + auctionRandom(e);

      for (const [k, v] of Object.entries(b.upkeep || {})) {
        totals[k] = (totals[k] || 0) - Math.round(v * Math.max(0.25, e));
      }
    }

    for (const r of state.reforms.filter(r => r.active)) {
      r.tick = (r.tick || 0) + 1;
      const interval = Math.max(1, Number(r.interval) || 1);
      if (r.tick >= interval) {
        r.tick = 0;
        for (const ef of r.effects || []) {
          if (!["everyInterval", "perCycle"].includes(ef.timing)) continue;
          if (ef.target !== "settlement") continue;
          totals[ef.stat] = (totals[ef.stat] || 0) + (Number(ef.value) || 0);
        }
      }
    }

    totals.food = (totals.food || 0) - (Number(state.resources.population) || 0);

    for (const [k, v] of Object.entries(totals)) addValue(state, k, v);

    for (const p of state.projects.filter(p => p.status === "active")) {
      p.progress = (p.progress || 0) + 1;

      if (p.progress >= p.duration) {
        p.status = "completed";

        if (p.kind === "upgrade") {
          const b = state.buildings.find(x => x.id === p.buildingId);
          if (b) {
            applyUpgrade(b);
            report.push(`Проект завершён: ${p.name}. ${b.name} теперь L${b.level}.`);
          }
        }

        if (p.kind === "order") {
          for (const ef of p.effects || []) addValue(state, ef.stat, Number(ef.value) || 0);
          report.push(`Приказ завершён: ${p.name}.`);
        }

        if (p.kind === "scout") {
          const t = Number(state.resources.threat) || 0;
          state.scouting = {
            known: true,
            cyclesRemainingVisible: state.attack.nextInCycles,
            threatMin: Math.max(0, t - d(4)),
            threatMax: t + d(6),
            expiresCycle: state.cycle + 2
          };
          report.push(`Разведка завершена: угроза примерно ${state.scouting.threatMin}-${state.scouting.threatMax}, нападение примерно через ${state.scouting.cyclesRemainingVisible} цикл(а).`);
        }
      }
    }

    if (state.activeBonus) {
      state.activeBonus.remaining -= 1;
      if (state.activeBonus.remaining <= 0) {
        report.push(`Бастионный бонус истёк: ${state.activeBonus.name}.`);
        state.activeBonus = null;
      }
    }

    calculateDerived(state);

    const threatGrowth = Math.max(1, (state.attack.baseGrowth || 2) + d(3) - 1 + (state.derived.threatMod || 0));
    state.resources.threat += threatGrowth;
    state.attack.nextInCycles -= 1;
    report.push(`Скрыто для игроков: угроза выросла на ${threatGrowth}.`);

    if (state.resources.food < 0) {
      const shortage = Math.abs(state.resources.food);
      const loss = Math.ceil(shortage / 10);
      state.resources.population = Math.max(0, state.resources.population - loss);
      state.resources.loyalty = clamp(state.resources.loyalty - 10 - Math.ceil(shortage / 20), 0, 100);
      state.resources.food = 0;
      report.push(`Голод: потеряно жителей ${loss}, лояльность снижена.`);
    }

    calculateDerived(state);

    if (state.attack.nextInCycles <= 0) {
      const gap = state.resources.threat - state.derived.military;

      if (gap <= 0) {
        state.resources.loyalty = clamp(state.resources.loyalty + 3, 0, 100);
        state.resources.threat = Math.max(5, Math.round(state.resources.threat * 0.55));
        report.push("Нападение отражено. Лояльность +3. Угроза временно снижена.");
      } else {
        const popLoss = Math.ceil(gap / 4);
        const goldLoss = Math.ceil(gap * 5);
        state.resources.population = Math.max(0, state.resources.population - popLoss);
        state.resources.treasury = Math.max(0, state.resources.treasury - goldLoss);
        state.resources.loyalty = clamp(state.resources.loyalty - Math.min(25, 5 + gap), 0, 100);
        state.resources.threat = Math.max(5, Math.round(state.resources.threat * 0.75));
        report.push(`Кризис обороны: угроза превысила военную силу на ${gap}. Потери: ${popLoss} жителей, ${goldLoss} gp.`);
      }

      state.attack.nextInCycles = 2 + d(3);
      state.scouting.known = false;
    }

    calculateDerived(state);

    state.resources.loyalty = clamp(state.resources.loyalty + (state.derived.loyaltyMod || 0), 0, 100);

    const loyaltyMigration = state.resources.loyalty >= 70 ? 2 : state.resources.loyalty >= 50 ? 0 : state.resources.loyalty >= 30 ? -2 : -5;
    const threatPenalty = state.resources.threat > state.derived.military ? -2 : 0;
    const migration = Math.round((state.derived.attractiveness || 0) + loyaltyMigration + threatPenalty);

    state.resources.population = Math.max(0, state.resources.population + migration);

    report.push(`Миграция: ${signed(migration)} жителей.`);

    calculateDerived(state);

    state.resources.food = Math.min(state.resources.food, state.derived.foodCapacity);
    state.resources.treasury = Math.min(state.resources.treasury, state.derived.treasuryCapacity);

    const after = clone({ ...state.resources, ...state.derived });

    const summary = [
      `Цикл ${state.cycle}`,
      `Население: ${before.population} → ${after.population}`,
      `Еда: ${before.food} → ${after.food}`,
      `Казна: ${before.treasury} → ${after.treasury}`,
      `Военная сила: ${before.military} → ${after.military}`,
      `Лояльность: ${before.loyalty} → ${after.loyalty}`,
      `Привлекательность: ${before.attractiveness} → ${after.attractiveness}`,
      `Активные проекты: ${activeProjectCount(state)} / ${state.derived.projectCapacity}`,
      ...report
    ];

    addReport(state, `Отчёт за цикл ${state.cycle}`, summary);
    await saveState(state);

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: state.name }),
      content: `<h2>${state.name}: цикл ${state.cycle}</h2><ul>${summary.filter(x => isGM() || !x.startsWith("Скрыто")).map(x => `<li>${x}</li>`).join("")}</ul>`
    });

    ui.notifications.info(`Поселение пересчитано: цикл ${state.cycle}.`);

    for (const app of Object.values(ui.windows)) {
      if (app instanceof GoblinVillageApp) app.render(false);
    }
  }

  function promptNumber(title, label, initial = 0) {
    return new Promise(resolve => {
      new Dialog({
        title,
        content: `<form><div class="form-group"><label>${label}</label><input name="value" type="number" value="${initial}"/></div></form>`,
        buttons: {
          ok: {
            label: "OK",
            callback: html => resolve(Number(html.find("[name=value]").val()) || 0)
          },
          cancel: {
            label: "Отмена",
            callback: () => resolve(null)
          }
        },
        default: "ok"
      }).render(true);
    });
  }

  function promptUpgrade(b) {
    return new Promise(resolve => {
      const next = (b.level || 0) + 1;
      const cost = upgradeCost(b);
      const duration = upgradeDuration(b);
      const title = upgradeTitle(b);

      new Dialog({
        title: `${b.name}: улучшение до L${next}`,
        content: `
          <section>
            <h2>${title}</h2>
            <p><b>Стоимость:</b> ${cost} gp</p>
            <p><b>Длительность:</b> ${duration} цикл(а)</p>
            <p><b>Текущий уровень:</b> ${b.level}</p>
            <p><b>Текущее содержание:</b> ${lines(b.upkeep, true)}</p>
            <p><b>Текущее производство:</b> ${lines(b.production)}</p>
            <p><b>Сервисы игрокам:</b> ${(b.services || []).join(", ") || "—"}</p>
            <p><b>После завершения:</b> здание станет сильнее, но потребует больше рабочих и содержания. Точные значения будут пересчитаны системой.</p>
          </section>
        `,
        buttons: {
          ok: { label: "Создать проект", callback: () => resolve(true) },
          cancel: { label: "Отмена", callback: () => resolve(false) }
        },
        default: "ok"
      }).render(true);
    });
  }

  class GoblinVillageApp extends Application {
    constructor(options = {}) {
      super(options);
      this.activeTab = "overview";
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "goblin-village-app",
        title: "Поселение",
        width: 1000,
        height: 760,
        resizable: true,
        classes: ["gvm-app"]
      });
    }

    async getData() {
      const state = await getState();
      calculateDerived(state);
      return {
        state,
        playerHidden: state.hiddenFromPlayers && !isGM()
      };
    }

    async _renderInner(data) {
      return $(this._buildHtml(data.state, data.playerHidden));
    }

    activateListeners(html) {
      super.activateListeners(html);

      html.find(".gvm-tab").on("click", ev => {
        this.activeTab = ev.currentTarget.dataset.tab;
        this.render(false);
      });

      html.find("[data-action]").on("click", ev => this._onAction(ev));

      html.find("input[data-edit]").on("change", async ev => {
        if (!isGM()) return ui.notifications.warn("Только GM.");
        const state = await getState();
        const path = ev.currentTarget.dataset.edit;
        let value = ev.currentTarget.value;
        if (ev.currentTarget.type === "number") value = Number(value) || 0;
        foundry.utils.setProperty(state, path, value);
        await saveState(state);
        this.render(false);
      });
    }

    async _onAction(ev) {
      const action = ev.currentTarget.dataset.action;
      const bid = ev.currentTarget.dataset.id;
      const state = await getState();

      if (!isGM()) return ui.notifications.warn("Действие пока доступно только GM.");

      if (action === "nextCycle") return advanceCycle();

      if (action === "toggleHidden") {
        state.hiddenFromPlayers = !state.hiddenFromPlayers;
        await saveState(state);
        return this.render(false);
      }

      if (action === "reset") {
        await saveState(clone(DEFAULT_STATE));
        ui.notifications.info("Данные сброшены.");
        return this.render(false);
      }

      if (action === "assignWorkers") {
        calculateDerived(state);
        const b = state.buildings.find(x => x.id === bid);
        if (!b) return;

        const current = Number(b.workersAssigned) || 0;
        const assignedOther = state.buildings
          .filter(x => x.id !== b.id && ["built", "damaged"].includes(x.status))
          .reduce((a, x) => a + Math.min(Number(x.workersAssigned) || 0, Number(x.workersRequired) || 0), 0);

        const maxPossible = Math.min(Number(b.workersRequired) || 0, Math.max(0, state.resources.population - assignedOther));
        const n = await promptNumber(`Рабочие: ${b.name}`, `Назначить рабочих. Максимум сейчас: ${maxPossible}`, current);

        if (n === null) return;
        b.workersAssigned = clamp(n, 0, maxPossible);
        await saveState(state);
        return this.render(false);
      }

      if (action === "toggleBuilding") {
        const b = state.buildings.find(x => x.id === bid);
        if (!b) return;
        if (b.status === "built") b.status = "disabled";
        else if (b.status === "disabled") b.status = "built";
        else return ui.notifications.warn("Это здание ещё не построено или недоступно.");
        await saveState(state);
        return this.render(false);
      }

      if (action === "upgrade") {
        calculateDerived(state);
        const b = state.buildings.find(x => x.id === bid);
        if (!b) return;

        if ((b.level || 0) >= (b.maxLevel || 5)) return ui.notifications.warn("Максимальный уровень здания.");
        if ((state.playerCharacterLevel || 1) < (b.unlockLevel || 1)) return ui.notifications.warn(`Откроется с уровня персонажей ${b.unlockLevel}.`);
        if (activeProjectCount(state) >= state.derived.projectCapacity) return ui.notifications.warn(`Лимит проектов: ${activeProjectCount(state)} / ${state.derived.projectCapacity}. Улучшите Сенат или завершите проекты.`);

        const cost = { treasury: upgradeCost(b) };
        if (!canAfford(state, cost)) return ui.notifications.warn("Недостаточно казны.");

        const ok = await promptUpgrade(b);
        if (!ok) return;

        pay(state, cost);
        state.projects.push({
          id: id(),
          kind: "upgrade",
          status: "active",
          buildingId: b.id,
          name: upgradeTitle(b),
          cost,
          duration: upgradeDuration(b),
          progress: 0
        });

        if (b.status === "available") b.status = "underConstruction";

        await saveState(state);
        ui.notifications.info("Проект улучшения создан.");
        return this.render(false);
      }

      if (action === "startScout") {
        calculateDerived(state);
        if (activeProjectCount(state) >= state.derived.projectCapacity) return ui.notifications.warn(`Лимит проектов: ${activeProjectCount(state)} / ${state.derived.projectCapacity}.`);
        const cost = { treasury: 10 };
        if (!canAfford(state, cost)) return ui.notifications.warn("Недостаточно казны.");
        pay(state, cost);
        state.projects.push({ id: id(), kind: "scout", status: "active", name: "Разведка региона", cost, duration: 1, progress: 0 });
        await saveState(state);
        return this.render(false);
      }

      if (action === "startMigration") {
        calculateDerived(state);
        if (activeProjectCount(state) >= state.derived.projectCapacity) return ui.notifications.warn(`Лимит проектов: ${activeProjectCount(state)} / ${state.derived.projectCapacity}.`);
        const cost = { treasury: 50 };
        if (!canAfford(state, cost)) return ui.notifications.warn("Недостаточно казны.");
        pay(state, cost);
        state.projects.push({
          id: id(),
          kind: "order",
          status: "active",
          name: "Раздать деньги в поселениях округи",
          cost,
          duration: 2,
          progress: 0,
          effects: [{ stat: "population", value: 50 }]
        });
        await saveState(state);
        return this.render(false);
      }

      if (action === "toggleReform") {
        const r = state.reforms.find(x => x.id === bid);
        if (r) r.active = !r.active;
        await saveState(state);
        return this.render(false);
      }

      if (action === "addReform") {
        new Dialog({
          title: "Создать реформу",
          content: `
            <form>
              <div class="form-group"><label>Название</label><input name="name" value="Новая реформа"/></div>
              <div class="form-group"><label>Описание</label><textarea name="desc"></textarea></div>
              <div class="form-group"><label>Интервал циклов</label><input name="interval" type="number" value="1"/></div>
              <div class="form-group"><label>Пассивный стат</label><select name="pstat"><option value="attractiveness">Привлекательность</option><option value="military">Военная сила</option><option value="loyalty">Лояльность</option><option value="threat">Угроза</option><option value="projectCapacity">Лимит проектов</option></select><input name="pval" type="number" value="0"/></div>
              <div class="form-group"><label>Периодический стат</label><select name="tstat"><option value="treasury">Казна</option><option value="food">Еда</option><option value="population">Население</option><option value="loyalty">Лояльность</option><option value="threat">Угроза</option></select><input name="tval" type="number" value="0"/></div>
            </form>
          `,
          buttons: {
            ok: {
              label: "Создать",
              callback: async html => {
                const name = String(html.find("[name=name]").val());
                const desc = String(html.find("[name=desc]").val());
                const interval = Math.max(1, Number(html.find("[name=interval]").val()) || 1);
                const pstat = String(html.find("[name=pstat]").val());
                const pval = Number(html.find("[name=pval]").val()) || 0;
                const tstat = String(html.find("[name=tstat]").val());
                const tval = Number(html.find("[name=tval]").val()) || 0;

                const fresh = await getState();
                fresh.reforms.push({
                  id: id(),
                  name,
                  description: desc,
                  active: true,
                  interval,
                  tick: 0,
                  effects: [
                    { target: "settlement", stat: pstat, mode: "add", value: pval, timing: "passive" },
                    { target: "settlement", stat: tstat, mode: "add", value: tval, timing: "everyInterval" }
                  ]
                });
                await saveState(fresh);
                this.render(false);
              }
            },
            cancel: { label: "Отмена" }
          },
          default: "ok"
        }).render(true);
      }

      if (action === "activateBonus") {
        if (state.activeBonus) return ui.notifications.warn("Уже активен один бастионный бонус.");
        const tpl = BONUS_TEMPLATES[bid];
        if (!tpl) return;
        if (!canAfford(state, tpl.cost)) return ui.notifications.warn("Недостаточно ресурсов.");
        pay(state, tpl.cost);
        state.activeBonus = { ...clone(tpl), remaining: tpl.duration };
        await saveState(state);
        return this.render(false);
      }

      if (action === "clearBonus") {
        state.activeBonus = null;
        await saveState(state);
        return this.render(false);
      }
    }

    visible(state, hidden, key) {
      if (!hidden) return state.resources[key] ?? state.derived[key] ?? 0;
      if (["population", "loyalty"].includes(key)) return "примерно известно";
      return "скрыто";
    }

    _buildHtml(state, hidden) {
      calculateDerived(state);

      const tabs = [
        ["overview", "Обзор"],
        ["buildings", "Здания"],
        ["projects", "Проекты"],
        ["reforms", "Реформы"],
        ["bonus", "Бонус"],
        ["scout", "Разведка"],
        ["reports", "Отчёты"],
        ["gm", "GM"]
      ];

      const nav = tabs
        .filter(t => t[0] !== "gm" || isGM())
        .map(([k, v]) => `<button class="gvm-tab ${this.activeTab === k ? "active" : ""}" data-tab="${k}">${v}</button>`)
        .join("");

      return `
        <section class="gvm-root">
          <header class="gvm-header">
            <div>
              <h1>${state.name}</h1>
              <p>Цикл: ${state.cycle} · Данные для игроков: ${state.hiddenFromPlayers ? "скрыты" : "открыты"}</p>
            </div>
            <div class="gvm-actions">
              ${isGM() ? `nextCycleСледующий цикл</button>toggleHidden${state.hiddenFromPlayers ? "Показать данные" : "Скрыть данные"}</button>` : ""}
            </div>
          </header>
          <nav class="gvm-tabs">${nav}</nav>
          <main>${this.tab(state, hidden)}</main>
        </section>
      `;
    }

    cards(state, hidden) {
      const data = [
        ["population", "Население", "Жители и рабочая сила"],
        ["food", "Еда", `Вместимость: ${state.derived.foodCapacity}`],
        ["treasury", "Казна", `Вместимость: ${state.derived.treasuryCapacity} gp`],
        ["military", "Военная сила", hidden ? "Оценка скрыта" : `Против угрозы: ${state.resources.threat}`],
        ["loyalty", "Лояльность", "0-100"],
        ["attractiveness", "Привлекательность", "Влияет на миграцию"],
        ["threat", "Угроза", state.scouting.known || isGM() ? "Разведка/GM" : "Неизвестно"]
      ];

      return `<div class="gvm-cards">${data.map(([k, l, h]) => {
        let val;
        if (k === "threat" && !isGM()) val = state.scouting.known ? `${state.scouting.threatMin}-${state.scouting.threatMax}` : "неизвестно";
        else val = this.visible(state, hidden, k);

        return `<article class="gvm-card"><h3>${l}</h3><strong>${val}</strong><small>${h}</small></article>`;
      }).join("")}</div>`;
    }

    tab(state, hidden) {
      if (this.activeTab === "overview") {
        return `
          ${this.cards(state, hidden)}
          <section class="gvm-panel">
            <h2>Сводка</h2>
            <p>Свободные рабочие: <b>${hidden ? "скрыто" : state.derived.freeWorkers}</b>. Назначено: <b>${hidden ? "скрыто" : state.derived.assignedWorkers}</b>.</p>
            <p>Активные проекты: <b>${hidden ? "скрыто" : `${activeProjectCount(state)} / ${state.derived.projectCapacity}`}</b>.</p>
            <p>Следующее нападение: ${
              isGM()
                ? `через <b>${state.attack.nextInCycles}</b> цикл(а)`
                : state.scouting.known
                  ? `примерно через <b>${state.scouting.cyclesRemainingVisible}</b> цикл(а)`
                  : "неизвестно"
            }.</p>
          </section>
        `;
      }

      if (this.activeTab === "buildings") {
        if (hidden) return `<p>Данные зданий скрыты.</p>`;

        return `<div class="gvm-grid">${state.buildings.map(b => {
          const locked = (state.playerCharacterLevel || 1) < (b.unlockLevel || 1);
          const e = Math.round(eff(b) * 100);
          const cls = locked ? "locked" : b.status === "disabled" ? "disabled" : "";
          const serviceText = (b.services || []).length ? `<p><b>Сервисы игрокам:</b> ${b.services.join(", ")}</p>` : "";

          return `
            <article class="gvm-building ${cls}">
              <h3>${b.name} ${locked ? "🔒" : ""}</h3>
              <p><b>${BUILDING_TYPES[b.type] || b.type}</b> · Статус: ${b.status} · Уровень ${b.level}/${b.maxLevel} · Эффективность ${e}%</p>
              <p>Рабочие: ${b.workersAssigned}/${b.workersRequired}</p>
              <p>Содержание: ${lines(b.upkeep, true)}</p>
              <p>Производство: ${lines(b.production)}</p>
              <p>Модификаторы: ${lines(b.modifiers)}</p>
              ${serviceText}
              <small>${b.note || ""}</small>
              ${isGM() ? `
                <div class="gvm-row">
                  assignWorkersРабочие</button>
                  upgrade${b.level > 0 ? "Улучшить" : "Построить"} (${upgradeCost(b)} gp, ${upgradeDuration(b)} ц.)</button>
                  toggleBuilding${b.status === "disabled" ? "Включить" : "Отключить"}</button>
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}</div>`;
      }

      if (this.activeTab === "projects") {
        if (hidden) return `<p>Проекты скрыты.</p>`;
        const active = state.projects.filter(p => p.status === "active");
        const done = state.projects.filter(p => p.status !== "active").slice(0, 10);

        return `
          <section class="gvm-panel">
            <h2>Активные проекты (${activeProjectCount(state)} / ${state.derived.projectCapacity})</h2>
            ${isGM() ? `startMigrationПриказ: раздать деньги и привлечь переселенцев (-50 gp, +50 населения через 2 цикла)</button>` : ""}
            ${active.length ? active.map(p => `<article class="gvm-line"><b>${p.name}</b><br/>Прогресс: ${p.progress}/${p.duration}. Стоимость: ${lines(p.cost, true)}.</article>`).join("") : "<p>Нет активных проектов.</p>"}
            <h2>Завершённые</h2>
            ${done.map(p => `<p>${p.name}</p>`).join("") || "—"}
          </section>
        `;
      }

      if (this.activeTab === "reforms") {
        if (hidden) return `<p>Реформы скрыты.</p>`;

        return `
          <section class="gvm-panel">
            <h2>Реформы</h2>
            ${isGM() ? `addReformСоздать реформу</button>` : ""}
            ${state.reforms.map(r => `
              <article class="gvm-line">
                <h3>${r.name} ${r.active ? "✅" : "⛔"}</h3>
                <p>${r.description || ""}</p>
                <p>Интервал: раз в ${r.interval || 1} цикл(а).</p>
                <p>Эффекты: ${(r.effects || []).map(e => `${e.timing}: ${STAT_LABELS[e.stat] || e.stat} ${signed(e.value)}`).join(", ") || "—"}</p>
                ${isGM() ? `toggleReform${r.active ? "Отключить" : "Включить"}</button>` : ""}
              </article>
            `).join("")}
          </section>
        `;
      }

      if (this.activeTab === "bonus") {
        if (hidden) return `<p>Бонусы скрыты.</p>`;

        return `
          <section class="gvm-panel">
            <h2>Активный бонус</h2>
            ${
              state.activeBonus
                ? `<p><b>${state.activeBonus.name}</b>, осталось ${state.activeBonus.remaining} цикл(а). Эффект: ${lines(state.activeBonus.modifiers)}.</p>${isGM() ? `clearBonusСнять бонус</button>` : ""}`
                : "<p>Нет активного бонуса.</p>"
            }
            <h2>Доступные бонусы</h2>
            ${Object.values(BONUS_TEMPLATES).map(b => `
              <article class="gvm-line">
                <h3>${b.name}</h3>
                <p>${b.description}</p>
                <p>Источник: ${b.source}. Цена: ${lines(b.cost, true)}. Эффект: ${lines(b.modifiers)}.</p>
                ${isGM() ? `activateBonusАктивировать</button>` : ""}
              </article>
            `).join("")}
          </section>
        `;
      }

      if (this.activeTab === "scout") {
        return `
          <section class="gvm-panel">
            <h2>Разведка</h2>
            ${
              state.scouting.known
                ? `<p>Оценочная угроза: <b>${state.scouting.threatMin}-${state.scouting.threatMax}</b>.</p><p>Ожидаемое нападение: через <b>${state.scouting.cyclesRemainingVisible}</b> цикл(а).</p>`
                : `<p>Угроза неизвестна. Отправьте разведку, чтобы получить прогноз.</p>`
            }
            ${isGM() ? `startScoutОтправить разведку (-10 gp, 1 цикл)</button>` : ""}
          </section>
        `;
      }

      if (this.activeTab === "reports") {
        return `
          <section class="gvm-panel">
            <h2>Отчёты</h2>
            ${
              state.reports.length
                ? state.reports.map(r => {
                  const reportItems = r.items || r.lines || [];
                  return `<article class="gvm-report"><h3>${r.title}</h3><ul>${reportItems.filter(x => isGM() || !String(x).startsWith("Скрыто")).map(x => `<li>${x}</li>`).join("")}</ul></article>`;
                }).join("")
                : "<p>Отчётов пока нет.</p>"
            }
          </section>
        `;
      }

      if (this.activeTab === "gm" && isGM()) {
        return `
          <section class="gvm-panel">
            <h2>GM настройки</h2>
            <div class="form-group"><label>Название</label><input data-edit="name" value="${state.name}"/></div>
            <div class="form-group"><label>Уровень персонажей</label><input data-edit="playerCharacterLevel" type="number" value="${state.playerCharacterLevel}"/></div>
            <div class="form-group"><label>Население</label><input data-edit="resources.population" type="number" value="${state.resources.population}"/></div>
            <div class="form-group"><label>Еда</label><input data-edit="resources.food" type="number" value="${state.resources.food}"/></div>
            <div class="form-group"><label>Казна</label><input data-edit="resources.treasury" type="number" value="${state.resources.treasury}"/></div>
            <div class="form-group"><label>Лояльность</label><input data-edit="resources.loyalty" type="number" value="${state.resources.loyalty}"/></div>
            <div class="form-group"><label>Угроза</label><input data-edit="resources.threat" type="number" value="${state.resources.threat}"/></div>
            <div class="form-group"><label>Нападение через циклов</label><input data-edit="attack.nextInCycles" type="number" value="${state.attack.nextInCycles}"/></div>
            <div class="form-group"><label>Базовый рост угрозы</label><input data-edit="attack.baseGrowth" type="number" value="${state.attack.baseGrowth}"/></div>
            <p>resetСбросить систему</button></p>
          </section>
        `;
      }

      return "";
    }
  }

  async function readySetup() {
    const state = await getState();
    await saveState(state);

    game.goblinVillage = {
      open: () => new GoblinVillageApp().render(true),
      getState,
      saveState,
      advanceCycle,
      reset: async () => saveState(clone(DEFAULT_STATE))
    };

    console.log(`${MODULE_ID} | Ready. Use game.goblinVillage.open()`);
  }

  Hooks.once("init", registerSettings);
  Hooks.once("ready", readySetup);

  Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
    try {
      const actor = app.actor || app.document;
      if (!actor) return;
      if (!actor.testUserPermission(game.user, "OBSERVER")) return;

      buttons.unshift({
        label: "Поселение",
        class: "gvm-open-settlement",
        icon: "fas fa-fort-awesome",
        onclick: () => new GoblinVillageApp().render(true)
      });
    } catch (err) {
      console.warn(`${MODULE_ID} | Failed to inject actor sheet button`, err);
    }
  });
})();
