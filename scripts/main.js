(() => {
  const MODULE_ID = "goblin-village-manager";
  const FLAG_SCOPE = MODULE_ID;

  const KIND = {
    BUILDING: "building",
    REFORM: "reform",
    ORDER: "order",
    BONUS: "bonus"
  };

  const STATS = {
    population: "Население",
    food: "Еда",
    treasury: "Казна",
    military: "Военная сила",
    loyalty: "Лояльность",
    attractiveness: "Привлекательность",
    threat: "Угроза",
    projectCapacity: "Лимит проектов",
    foodCapacity: "Вместимость еды",
    treasuryCapacity: "Вместимость казны"
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

  const DEFAULT_RESOURCES = {
    population: 40,
    food: 120,
    treasury: 500,
    loyalty: 60,
    threat: 18
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    cycle: 0,
    hiddenFromPlayers: false,
    playerCharacterLevel: 5,
    attack: {
      nextInCycles: 3,
      baseGrowth: 2
    },
    scouting: {
      known: false,
      threatMin: null,
      threatMax: null,
      cyclesRemainingVisible: null,
      expiresCycle: 0
    },
    reports: []
  };

  const DEFAULT_BUILDINGS = [
    {
      name: "Комната сената",
      img: "icons/sundries/documents/document-sealed-red-white.webp",
      data: {
        kind: KIND.BUILDING,
        type: "governance",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 4,
        upkeep: [{ stat: "treasury", value: -3 }],
        effects: [
          { stat: "attractiveness", value: 1, timing: "passive" },
          { stat: "loyalty", value: 1, timing: "passive" },
          { stat: "projectCapacity", value: 1, timing: "passive" }
        ],
        levels: [
          {
            level: 2,
            title: "Расширить стол заседаний и нанять писцов",
            description: "Сенат получает больше места и постоянный учёт решений поселения.",
            cost: [{ stat: "treasury", value: -140 }],
            duration: 2,
            workersRequired: 10,
            effects: [
              { stat: "projectCapacity", value: 2, timing: "passive" },
              { stat: "loyalty", value: 2, timing: "passive" }
            ],
            services: ["Дополнительный активный проект"]
          },
          {
            level: 3,
            title: "Создать административный архив",
            description: "Поселение получает устойчивую бюрократическую память.",
            cost: [{ stat: "treasury", value: -250 }],
            duration: 3,
            workersRequired: 12,
            effects: [
              { stat: "projectCapacity", value: 3, timing: "passive" },
              { stat: "attractiveness", value: 2, timing: "passive" }
            ],
            services: ["Три активных проекта"]
          }
        ],
        services: ["Лимит проектов равен уровню Сената"],
        note: "Уровень Сената определяет максимальное количество активных проектов."
      }
    },
    {
      name: "Теплица",
      img: "icons/environment/wilderness/terrain-grass.webp",
      data: {
        kind: KIND.BUILDING,
        type: "food",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 6,
        upkeep: [{ stat: "treasury", value: -2 }],
        effects: [{ stat: "food", value: 18, timing: "perCycle" }],
        levels: [
          {
            level: 2,
            title: "Поставить новые грибные грядки",
            description: "Теплица расширяется под подземные культуры.",
            cost: [{ stat: "treasury", value: -80 }],
            duration: 1,
            workersRequired: 8,
            upkeep: [{ stat: "treasury", value: -3 }],
            effects: [{ stat: "food", value: 26, timing: "perCycle" }]
          }
        ],
        services: [],
        note: "Основной источник еды."
      }
    },
    {
      name: "Казармы гоблинов",
      img: "icons/equipment/shield/heater-steel-boss-red.webp",
      data: {
        kind: KIND.BUILDING,
        type: "military",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 16,
        upkeep: [
          { stat: "treasury", value: -6 },
          { stat: "food", value: -8 }
        ],
        effects: [
          { stat: "military", value: 18, timing: "passive" },
          { stat: "food", value: 4, timing: "perCycle" }
        ],
        levels: [
          {
            level: 2,
            title: "Раздать нормальное оружие ополчению",
            description: "Гарнизон получает копья, щиты и простую броню.",
            cost: [{ stat: "treasury", value: -120 }],
            duration: 2,
            workersRequired: 18,
            upkeep: [
              { stat: "treasury", value: -9 },
              { stat: "food", value: -10 }
            ],
            effects: [
              { stat: "military", value: 28, timing: "passive" },
              { stat: "food", value: 5, timing: "perCycle" }
            ],
            services: ["Выдать охрану каравану"]
          }
        ],
        services: ["Патрули", "Фуражировка в округе"],
        note: "Военная сила и добыча еды в округе."
      }
    },
    {
      name: "Казармы наездных пауков",
      img: "icons/creatures/invertebrates/spider-pink-purple.webp",
      data: {
        kind: KIND.BUILDING,
        type: "military",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 10,
        upkeep: [
          { stat: "treasury", value: -8 },
          { stat: "food", value: -10 }
        ],
        effects: [
          { stat: "military", value: 22, timing: "passive" },
          { stat: "food", value: 3, timing: "perCycle" }
        ],
        levels: [
          {
            level: 2,
            title: "Расширить стойла пауков",
            description: "Паукам строят отдельные загоны и места дрессировки.",
            cost: [{ stat: "treasury", value: -160 }],
            duration: 2,
            workersRequired: 20,
            upkeep: [
              { stat: "treasury", value: -12 },
              { stat: "food", value: -14 }
            ],
            effects: [
              { stat: "military", value: 35, timing: "passive" },
              { stat: "food", value: 4, timing: "perCycle" }
            ],
            services: ["Паучий эскорт"]
          }
        ],
        services: ["Быстрые патрули", "Паучий эскорт"],
        note: "Сильная оборона, но дорогое содержание."
      }
    },
    {
      name: "Рынок",
      img: "icons/commodities/currency/coins-plain-stack-gold-yellow.webp",
      data: {
        kind: KIND.BUILDING,
        type: "economy",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 8,
        upkeep: [{ stat: "treasury", value: -2 }],
        effects: [
          { stat: "treasury", value: 14, timing: "perCycle" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [
          {
            level: 2,
            title: "Поставить постоянные торговые ряды",
            description: "Рынок перестаёт быть стихийным и получает постоянные лавки.",
            cost: [{ stat: "treasury", value: -100 }],
            duration: 2,
            workersRequired: 12,
            upkeep: [{ stat: "treasury", value: -4 }],
            effects: [
              { stat: "treasury", value: 24, timing: "perCycle" },
              { stat: "attractiveness", value: 2, timing: "passive" }
            ],
            services: ["Покупка обычных товаров"]
          }
        ],
        services: ["Покупка обычных товаров", "Продажа трофеев"],
        note: "Главная регулярная экономика."
      }
    },
    {
      name: "Гостиница",
      img: "icons/environment/settlement/house-two-stories-brown.webp",
      data: {
        kind: KIND.BUILDING,
        type: "economy",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 4,
        upkeep: [
          { stat: "treasury", value: -2 },
          { stat: "food", value: -2 }
        ],
        effects: [
          { stat: "treasury", value: 8, timing: "perCycle" },
          { stat: "attractiveness", value: 1, timing: "passive" },
          { stat: "loyalty", value: 1, timing: "passive" }
        ],
        levels: [],
        services: ["Ночлег", "Слухи"],
        note: "Доход и привлекательность."
      }
    },
    {
      name: "Бордель",
      img: "icons/environment/settlement/tavern.webp",
      data: {
        kind: KIND.BUILDING,
        type: "social",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 4,
        upkeep: [
          { stat: "treasury", value: -3 },
          { stat: "food", value: -2 }
        ],
        effects: [
          { stat: "treasury", value: 10, timing: "perCycle" },
          { stat: "loyalty", value: 2, timing: "passive" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [],
        services: ["Снижение напряжения"],
        note: "Социальная стабильность и доход."
      }
    },
    {
      name: "Казино",
      img: "icons/sundries/gaming/dice-runed-brown.webp",
      data: {
        kind: KIND.BUILDING,
        type: "economy",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 4,
        upkeep: [{ stat: "treasury", value: -4 }],
        effects: [
          { stat: "treasury", value: 12, timing: "perCycle" },
          { stat: "loyalty", value: -1, timing: "passive" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        random: "casino",
        levels: [],
        services: ["Азартные игры"],
        note: "Высокий доход с риском."
      }
    },
    {
      name: "Малый аукцион",
      img: "icons/sundries/scrolls/scroll-bound-gold-red.webp",
      data: {
        kind: KIND.BUILDING,
        type: "economy",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 4,
        workersAssigned: 2,
        upkeep: [{ stat: "treasury", value: -2 }],
        effects: [
          { stat: "treasury", value: 7, timing: "perCycle" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        random: "auction",
        levels: [],
        services: ["Продажа редких лотов"],
        note: "Иногда даёт всплеск дохода."
      }
    },
    {
      name: "Средние склады",
      img: "icons/containers/chest/chest-reinforced-stone.webp",
      data: {
        kind: KIND.BUILDING,
        type: "storage",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 4,
        workersAssigned: 2,
        upkeep: [{ stat: "treasury", value: -1 }],
        effects: [
          { stat: "foodCapacity", value: 100, timing: "passive" },
          { stat: "treasuryCapacity", value: 500, timing: "passive" }
        ],
        levels: [],
        services: ["Хранение припасов"],
        note: "Вместимость запасов."
      }
    },
    {
      name: "Малый сторожевой пункт",
      img: "icons/environment/settlement/watchtower-stone.webp",
      data: {
        kind: KIND.BUILDING,
        type: "military",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 4,
        upkeep: [
          { stat: "treasury", value: -3 },
          { stat: "food", value: -3 }
        ],
        effects: [{ stat: "military", value: 10, timing: "passive" }],
        levels: [],
        services: ["Дозор"],
        note: "Дешёвая оборона."
      }
    },
    {
      name: "Средние бани",
      img: "icons/environment/settlement/well-stone.webp",
      data: {
        kind: KIND.BUILDING,
        type: "social",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 2,
        upkeep: [
          { stat: "treasury", value: -3 },
          { stat: "food", value: -1 }
        ],
        effects: [
          { stat: "loyalty", value: 3, timing: "passive" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [],
        services: ["Гигиена", "Лечение усталости"],
        note: "Лояльность и привлекательность."
      }
    },
    {
      name: "Средние тюремные помещения",
      img: "icons/environment/settlement/gate.webp",
      data: {
        kind: KIND.BUILDING,
        type: "governance",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 2,
        upkeep: [
          { stat: "treasury", value: -3 },
          { stat: "food", value: -2 }
        ],
        effects: [
          { stat: "military", value: 4, timing: "passive" },
          { stat: "loyalty", value: -1, timing: "passive" }
        ],
        levels: [],
        services: ["Удержание пленников"],
        note: "Порядок через контроль."
      }
    },
    {
      name: "Храм Торма",
      img: "icons/magic/holy/prayer-hands-glowing-yellow.webp",
      data: {
        kind: KIND.BUILDING,
        type: "religion",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 3,
        upkeep: [{ stat: "treasury", value: -4 }],
        effects: [
          { stat: "loyalty", value: 4, timing: "passive" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [],
        services: ["Благословение", "Отпевание", "Клятвы Торма"],
        note: "Лояльность, привлекательность и бонусы."
      }
    },
    {
      name: "Кузня",
      img: "icons/tools/smithing/anvil.webp",
      data: {
        kind: KIND.BUILDING,
        type: "crafting",
        status: "available",
        level: 0,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 0,
        workersAssigned: 0,
        upkeep: [],
        effects: [],
        levels: [
          {
            level: 1,
            title: "Нанять мастера-дварфа из Глубоководья",
            description: "В деревню приезжает мастер, способный организовать настоящую кузню.",
            cost: [{ stat: "treasury", value: -150 }],
            duration: 1,
            workersRequired: 4,
            upkeep: [{ stat: "treasury", value: -2 }],
            effects: [{ stat: "treasury", value: 8, timing: "perCycle" }],
            services: ["Ремонт металлических предметов", "Создание простых металлических предметов"]
          },
          {
            level: 2,
            title: "Улучшить снаряжение кузни",
            description: "Закупаются новые инструменты, меха, наковальни и формы.",
            cost: [{ stat: "treasury", value: -300 }],
            duration: 2,
            workersRequired: 6,
            upkeep: [{ stat: "treasury", value: -5 }],
            effects: [{ stat: "treasury", value: 14, timing: "perCycle" }],
            services: ["Крафт брони", "Посеребрение оружия"]
          },
          {
            level: 3,
            title: "Поставить печь для посеребрения",
            description: "Кузня получает отдельную печь для тонкой обработки металлов.",
            cost: [{ stat: "treasury", value: -500 }],
            duration: 3,
            workersRequired: 8,
            upkeep: [{ stat: "treasury", value: -8 }],
            effects: [{ stat: "treasury", value: 22, timing: "perCycle" }],
            services: ["Улучшенный крафт оружия", "Стабильное посеребрение"]
          }
        ],
        services: [],
        note: "Здание с сервисами для игроков."
      }
    },
    {
      name: "Мастерская артефактов",
      img: "icons/magic/symbols/runes-star-pentagon-blue.webp",
      data: {
        kind: KIND.BUILDING,
        type: "special",
        status: "available",
        level: 0,
        maxLevel: 5,
        unlockLevel: 9,
        workersRequired: 0,
        workersAssigned: 0,
        upkeep: [],
        effects: [],
        levels: [
          {
            level: 1,
            title: "Нанять арканиста-ремесленника",
            description: "В поселении появляется специалист по магическим предметам.",
            cost: [{ stat: "treasury", value: -500 }],
            duration: 3,
            workersRequired: 12,
            upkeep: [
              { stat: "treasury", value: -15 },
              { stat: "food", value: -6 }
            ],
            effects: [
              { stat: "treasury", value: 30, timing: "perCycle" },
              { stat: "threat", value: 2, timing: "passive" }
            ],
            services: ["Временное зачарование", "Обереги поселения"]
          }
        ],
        services: [],
        note: "Сильное специальное здание. Большая цена, содержание и рост угрозы."
      }
    }
  ];

  const DEFAULT_REFORMS = [
    {
      name: "Вербовка жителей с округи",
      img: "icons/sundries/flags/banner-symbol-white-red.webp",
      data: {
        kind: KIND.REFORM,
        active: false,
        interval: 1,
        tick: 0,
        description: "Посланники убеждают жителей соседних мест переселиться в деревню.",
        effects: [
          { target: "settlement", stat: "attractiveness", value: 3, timing: "passive" },
          { target: "settlement", stat: "treasury", value: -1, timing: "everyInterval" }
        ]
      }
    },
    {
      name: "Мобилизация",
      img: "icons/equipment/shield/kite-wooden-boss-steel.webp",
      data: {
        kind: KIND.REFORM,
        active: false,
        interval: 1,
        tick: 0,
        description: "Часть жителей переводится в постоянную оборонную готовность.",
        effects: [
          { target: "settlement", stat: "military", value: 10, timing: "passive" },
          { target: "settlement", stat: "loyalty", value: -5, timing: "passive" },
          { target: "settlement", stat: "treasury", value: -3, timing: "everyInterval" }
        ]
      }
    }
  ];

  const DEFAULT_BONUSES = [
    {
      name: "Благословение Торма",
      img: "icons/magic/holy/barrier-shield-winged-blue.webp",
      data: {
        kind: KIND.BONUS,
        source: "Храм Торма",
        active: false,
        remaining: 0,
        duration: 1,
        cost: [{ stat: "treasury", value: -50 }],
        effects: [
          { stat: "military", value: 10, timing: "passive" },
          { stat: "loyalty", value: 5, timing: "passive" }
        ],
        description: "Один активный бастионный бонус на 1 цикл."
      }
    },
    {
      name: "Зачарованное оружие",
      img: "icons/weapons/swords/sword-runed-glowing.webp",
      data: {
        kind: KIND.BONUS,
        source: "Мастерская артефактов",
        active: false,
        remaining: 0,
        duration: 1,
        cost: [{ stat: "treasury", value: -100 }],
        effects: [{ stat: "military", value: 20, timing: "passive" }],
        description: "Временный военный рывок на 1 цикл."
      }
    }
  ];

  function clone(x) {
    return foundry.utils.deepClone(x);
  }

  function isGM() {
    return game.user?.isGM;
  }

  function rnd(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function randomId() {
    return foundry.utils.randomID();
  }

  function signed(n) {
    n = Number(n) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  }

  function effectText(e) {
    const stat = STATS[e.stat] || e.stat;
    return `${stat} ${signed(e.value)}${e.timing ? ` (${e.timing})` : ""}`;
  }

  function effectsText(effects = []) {
    if (!effects.length) return "—";
    return effects.map(effectText).join(", ");
  }

  function resourceText(effects = []) {
    if (!effects.length) return "—";
    return effects.map(e => `${STATS[e.stat] || e.stat}: ${signed(e.value)}`).join(", ");
  }

  async function ensureSettlementFlags(actor) {
    const current = actor.getFlag(FLAG_SCOPE, "settings");
    if (!current) await actor.setFlag(FLAG_SCOPE, "settings", clone(DEFAULT_SETTINGS));

    const resources = actor.getFlag(FLAG_SCOPE, "resources");
    if (!resources) await actor.setFlag(FLAG_SCOPE, "resources", clone(DEFAULT_RESOURCES));
  }

  function isGroupActor(actor) {
    if (!actor) return false;
    if (actor.type === "group") return true;
    if (actor.type === "party") return true;
    if (actor.getFlag(FLAG_SCOPE, "isSettlement")) return true;
    return false;
  }

  function gvmData(item) {
    return item?.getFlag(FLAG_SCOPE, "data") || {};
  }

  function itemKind(item) {
    return gvmData(item).kind;
  }

  function gvmItems(actor, kind = null) {
    return actor.items.filter(i => {
      const k = itemKind(i);
      return kind ? k === kind : !!k;
    });
  }

  function buildingItems(actor) {
    return gvmItems(actor, KIND.BUILDING);
  }

  function reformItems(actor) {
    return gvmItems(actor, KIND.REFORM);
  }

  function orderItems(actor) {
    return gvmItems(actor, KIND.ORDER);
  }

  function bonusItems(actor) {
    return gvmItems(actor, KIND.BONUS);
  }

  function getResources(actor) {
    return foundry.utils.mergeObject(clone(DEFAULT_RESOURCES), actor.getFlag(FLAG_SCOPE, "resources") || {}, {
      inplace: false,
      insertKeys: true,
      insertValues: true,
      overwrite: true
    });
  }

  function getSettings(actor) {
    return foundry.utils.mergeObject(clone(DEFAULT_SETTINGS), actor.getFlag(FLAG_SCOPE, "settings") || {}, {
      inplace: false,
      insertKeys: true,
      insertValues: true,
      overwrite: true
    });
  }

  async function setResources(actor, resources) {
    await actor.setFlag(FLAG_SCOPE, "resources", resources);
  }

  async function setSettings(actor, settings) {
    await actor.setFlag(FLAG_SCOPE, "settings", settings);
  }

  function getResourceValue(actor, stat, derived = null) {
    const resources = getResources(actor);
    if (resources[stat] !== undefined) return resources[stat];
    if (derived && derived[stat] !== undefined) return derived[stat];
    return 0;
  }

  function addResource(resources, stat, value) {
    value = Number(value) || 0;
    if (resources[stat] === undefined) resources[stat] = 0;
    resources[stat] += value;
  }

  function buildingEfficiency(data) {
    if (!["built", "damaged"].includes(data.status)) return 0;
    if (data.status === "damaged") return 0.5;
    const required = Math.max(1, Number(data.workersRequired) || 1);
    const assigned = Math.max(0, Math.min(required, Number(data.workersAssigned) || 0));
    return assigned / required;
  }

  function calculateDerived(actor) {
    const resources = getResources(actor);
    const settings = getSettings(actor);

    let military = 0;
    let attractiveness = 0;
    let foodCapacity = 250;
    let treasuryCapacity = 2000;
    let loyaltyPassive = 0;
    let threatPassive = 0;
    let assignedWorkers = 0;
    let projectCapacity = 1;

    for (const item of buildingItems(actor)) {
      const data = gvmData(item);
      const e = buildingEfficiency(data);

      if (["built", "damaged"].includes(data.status)) {
        assignedWorkers += Math.min(Number(data.workersAssigned) || 0, Number(data.workersRequired) || 0);
      }

      for (const effect of data.effects || []) {
        if (effect.timing !== "passive") continue;
        const val = Math.round((Number(effect.value) || 0) * e);
        if (effect.stat === "military") military += val;
        else if (effect.stat === "attractiveness") attractiveness += val;
        else if (effect.stat === "loyalty") loyaltyPassive += val;
        else if (effect.stat === "threat") threatPassive += val;
        else if (effect.stat === "foodCapacity") foodCapacity += val;
        else if (effect.stat === "treasuryCapacity") treasuryCapacity += val;
        else if (effect.stat === "projectCapacity") projectCapacity += val;
      }
    }

    for (const item of reformItems(actor)) {
      const data = gvmData(item);
      if (!data.active) continue;

      for (const effect of data.effects || []) {
        if (effect.timing !== "passive") continue;
        const val = Number(effect.value) || 0;
        if (effect.stat === "military") military += val;
        else if (effect.stat === "attractiveness") attractiveness += val;
        else if (effect.stat === "loyalty") loyaltyPassive += val;
        else if (effect.stat === "threat") threatPassive += val;
        else if (effect.stat === "projectCapacity") projectCapacity += val;
        else if (effect.stat === "foodCapacity") foodCapacity += val;
        else if (effect.stat === "treasuryCapacity") treasuryCapacity += val;
      }
    }

    for (const item of bonusItems(actor)) {
      const data = gvmData(item);
      if (!data.active) continue;

      for (const effect of data.effects || []) {
        if (effect.timing !== "passive") continue;
        const val = Number(effect.value) || 0;
        if (effect.stat === "military") military += val;
        else if (effect.stat === "attractiveness") attractiveness += val;
        else if (effect.stat === "loyalty") loyaltyPassive += val;
        else if (effect.stat === "threat") threatPassive += val;
      }
    }

    const senate = buildingItems(actor).find(i => i.name.toLowerCase().includes("сенат") || i.name.toLowerCase().includes("senate"));
    if (senate) {
      const s = gvmData(senate);
      if (s.status === "built") projectCapacity = Math.max(projectCapacity, Number(s.level) || 1);
    }

    return {
      military: Math.round(military),
      attractiveness: Math.round(attractiveness),
      foodCapacity,
      treasuryCapacity,
      loyaltyPassive,
      threatPassive,
      assignedWorkers,
      freeWorkers: Math.max(0, (Number(resources.population) || 0) - assignedWorkers),
      projectCapacity: Math.max(1, Math.round(projectCapacity)),
      activeProjects: orderItems(actor).filter(i => {
        const d = gvmData(i);
        return ["active", "building", "upgrade"].includes(d.status);
      }).length,
      settings
    };
  }

  function canPay(actor, cost, derived = null) {
    const resources = getResources(actor);
    for (const e of cost || []) {
      if (Number(e.value) >= 0) continue;
      const need = Math.abs(Number(e.value) || 0);
      const have = resources[e.stat] ?? derived?.[e.stat] ?? 0;
      if (have < need) return false;
    }
    return true;
  }

  async function payCost(actor, cost) {
    const resources = getResources(actor);
    for (const e of cost || []) {
      addResource(resources, e.stat, Number(e.value) || 0);
    }
    await setResources(actor, resources);
  }

  async function createGvmItem(actor, name, img, data) {
    const itemData = {
      name,
      type: "loot",
      img: img || "icons/svg/item-bag.svg",
      system: {},
      flags: {
        {
          data
        }
      }
    };
    const created = await actor.createEmbeddedDocuments("Item", [itemData]);
    return created?.[0];
  }

  async function initializeDefaults(actor) {
    await ensureSettlementFlags(actor);

    const existing = gvmItems(actor);
    if (existing.length) {
      ui.notifications.warn("В этом Group Actor уже есть элементы поселения.");
      return;
    }

    const docs = [];

    for (const b of DEFAULT_BUILDINGS) {
      docs.push({
        name: b.name,
        type: "loot",
        img: b.img,
        system: {},
        flags: { { data: clone(b.data) } }
      });
    }

    for (const r of DEFAULT_REFORMS) {
      docs.push({
        name: r.name,
        type: "loot",
        img: r.img,
        system: {},
        flags: { { data: clone(r.data) } }
      });
    }

    for (const b of DEFAULT_BONUSES) {
      docs.push({
        name: b.name,
        type: "loot",
        img: b.img,
        system: {},
        flags: { { data: clone(b.data) } }
      });
    }

    await actor.createEmbeddedDocuments("Item", docs);
    ui.notifications.info("Стартовые здания, реформы и бонусы поселения созданы как Items.");
  }

  function activeOrders(actor) {
    return orderItems(actor).filter(i => {
      const dta = gvmData(i);
      return dta.status === "active" || dta.status === "upgrade" || dta.status === "building";
    });
  }

  async function createOrder(actor, options = {}) {
    const derived = calculateDerived(actor);

    if (activeOrders(actor).length >= derived.projectCapacity) {
      ui.notifications.warn(`Лимит проектов: ${activeOrders(actor).length} / ${derived.projectCapacity}. Улучшите Сенат или завершите проекты.`);
      return;
    }

    const data = {
      kind: KIND.ORDER,
      status: "active",
      duration: Number(options.duration) || 1,
      progress: 0,
      description: options.description || "",
      cost: options.cost || [],
      effectsOnComplete: options.effectsOnComplete || [],
      targetItemId: options.targetItemId || null,
      action: options.action || "custom"
    };

    if (!canPay(actor, data.cost, derived)) {
      ui.notifications.warn("Недостаточно ресурсов для приказа.");
      return;
    }

    await payCost(actor, data.cost);
    await createGvmItem(actor, options.name || "Новый приказ", options.img || "icons/sundries/documents/document-sealed-red.webp", data);
  }

  async function upgradeBuilding(actor, item) {
    const data = clone(gvmData(item));
    const next = Number(data.level || 0) + 1;

    if (next > Number(data.maxLevel || 5)) {
      ui.notifications.warn("Максимальный уровень здания.");
      return;
    }

    const levelData = (data.levels || []).find(l => Number(l.level) === next);

    if (!levelData) {
      ui.notifications.warn("Для следующего уровня не описано улучшение. Откройте Item и добавьте уровень в flags.");
      return;
    }

    const derived = calculateDerived(actor);

    if (activeOrders(actor).length >= derived.projectCapacity) {
      ui.notifications.warn(`Лимит проектов: ${activeOrders(actor).length} / ${derived.projectCapacity}.`);
      return;
    }

    if (!canPay(actor, levelData.cost || [], derived)) {
      ui.notifications.warn("Недостаточно ресурсов для улучшения.");
      return;
    }

    const ok = await confirmDialog(
      `${item.name}: улучшение до L${next}`,
      `
        <h2>${levelData.title || `Улучшить до L${next}`}</h2>
        <p>${levelData.description || ""}</p>
        <p><b>Стоимость:</b> ${resourceText(levelData.cost || [])}</p>
        <p><b>Длительность:</b> ${levelData.duration || 1} цикл(а)</p>
        <p><b>Рабочие после улучшения:</b> ${levelData.workersRequired ?? data.workersRequired}</p>
        <p><b>Эффекты после улучшения:</b> ${effectsText(levelData.effects || [])}</p>
        <p><b>Сервисы после улучшения:</b> ${(levelData.services || []).join(", ") || "—"}</p>
      `
    );

    if (!ok) return;

    await createOrder(actor, {
      name: levelData.title || `Улучшить ${item.name} до L${next}`,
      img: item.img,
      duration: Number(levelData.duration) || 1,
      description: levelData.description || "",
      cost: levelData.cost || [],
      targetItemId: item.id,
      action: "upgrade-building",
      effectsOnComplete: []
    });
  }

  async function completeUpgrade(actor, orderItem) {
    const order = clone(gvmData(orderItem));
    const building = actor.items.get(order.targetItemId);
    if (!building) return;

    const data = clone(gvmData(building));
    const next = Number(data.level || 0) + 1;
    const levelData = (data.levels || []).find(l => Number(l.level) === next);
    if (!levelData) return;

    data.level = next;
    data.status = "built";
    data.workersRequired = Number(levelData.workersRequired ?? data.workersRequired ?? 0);
    data.upkeep = clone(levelData.upkeep || data.upkeep || []);
    data.effects = clone(levelData.effects || data.effects || []);
    data.services = Array.from(new Set([...(data.services || []), ...(levelData.services || [])]));

    await building.setFlag(FLAG_SCOPE, "data", data);
  }

  async function advanceCycle(actor) {
    if (!isGM()) {
      ui.notifications.warn("Только GM может запускать цикл.");
      return;
    }

    await ensureSettlementFlags(actor);

    const settings = getSettings(actor);
    const resources = getResources(actor);
    const before = clone(resources);
    const derivedBefore = calculateDerived(actor);
    const report = [];

    settings.cycle += 1;

    const totals = {};

    for (const item of buildingItems(actor)) {
      const data = gvmData(item);
      const e = buildingEfficiency(data);

      if (!["built", "damaged"].includes(data.status)) continue;

      for (const up of data.upkeep || []) {
        if (up.timing && up.timing !== "perCycle") continue;
        totals[up.stat] = (totals[up.stat] || 0) + Math.round((Number(up.value) || 0) * Math.max(0.25, e));
      }

      for (const effect of data.effects || []) {
        if (effect.timing !== "perCycle") continue;
        totals[effect.stat] = (totals[effect.stat] || 0) + Math.round((Number(effect.value) || 0) * e);
      }

      if (data.random === "casino") {
        const roll = rnd(100);
        let delta = 0;
        if (roll <= 20) delta = -8;
        else if (roll <= 80) delta = rnd(8);
        else delta = 10 + rnd(20);
        totals.treasury = (totals.treasury || 0) + Math.round(delta * e * Math.max(1, data.level || 1));
      }

      if (data.random === "auction") {
        const roll = rnd(100);
        const delta = roll >= 85 ? 20 + rnd(20) : rnd(6);
        totals.treasury = (totals.treasury || 0) + Math.round(delta * e);
      }
    }

    for (const item of reformItems(actor)) {
      const data = clone(gvmData(item));
      if (!data.active) continue;

      data.tick = Number(data.tick || 0) + 1;
      const interval = Math.max(1, Number(data.interval || 1));

      if (data.tick >= interval) {
        data.tick = 0;

        for (const effect of data.effects || []) {
          if (!["everyInterval", "perCycle"].includes(effect.timing)) continue;
          totals[effect.stat] = (totals[effect.stat] || 0) + (Number(effect.value) || 0);
        }
      }

      await item.setFlag(FLAG_SCOPE, "data", data);
    }

    totals.food = (totals.food || 0) - (Number(resources.population) || 0);

    for (const [stat, value] of Object.entries(totals)) {
      addResource(resources, stat, value);
    }

    for (const item of activeOrders(actor)) {
      const data = clone(gvmData(item));
      data.progress = Number(data.progress || 0) + 1;

      if (data.progress >= Number(data.duration || 1)) {
        if (data.action === "upgrade-building") {
          await completeUpgrade(actor, item);
        }

        for (const effect of data.effectsOnComplete || []) {
          addResource(resources, effect.stat, Number(effect.value) || 0);
        }

        data.status = "completed";
        report.push(`Завершён приказ: ${item.name}.`);
      }

      await item.setFlag(FLAG_SCOPE, "data", data);
    }

    for (const item of bonusItems(actor)) {
      const data = clone(gvmData(item));
      if (!data.active) continue;

      data.remaining = Number(data.remaining || 0) - 1;
      if (data.remaining <= 0) {
        data.active = false;
        data.remaining = 0;
        report.push(`Бонус истёк: ${item.name}.`);
      }

      await item.setFlag(FLAG_SCOPE, "data", data);
    }

    let derived = calculateDerived(actor);

    const threatGrowth = Math.max(1, Number(settings.attack.baseGrowth || 2) + rnd(3) - 1 + (derived.threatPassive || 0));
    resources.threat += threatGrowth;
    settings.attack.nextInCycles = Number(settings.attack.nextInCycles || 1) - 1;
    report.push(`Скрыто для игроков: угроза выросла на ${threatGrowth}.`);

    if (resources.food < 0) {
      const shortage = Math.abs(resources.food);
      const loss = Math.ceil(shortage / 10);
      resources.population = Math.max(0, Number(resources.population || 0) - loss);
      resources.loyalty = Math.max(0, Math.min(100, Number(resources.loyalty || 0) - 10 - Math.ceil(shortage / 20)));
      resources.food = 0;
      report.push(`Голод: потеряно жителей ${loss}.`);
    }

    derived = calculateDerived(actor);

    if (settings.attack.nextInCycles <= 0) {
      const gap = Number(resources.threat || 0) - Number(derived.military || 0);

      if (gap <= 0) {
        resources.loyalty = Math.min(100, Number(resources.loyalty || 0) + 3);
        resources.threat = Math.max(5, Math.round(Number(resources.threat || 0) * 0.55));
        report.push("Нападение отражено. Лояльность +3. Угроза временно снижена.");
      } else {
        const popLoss = Math.ceil(gap / 4);
        const goldLoss = Math.ceil(gap * 5);
        resources.population = Math.max(0, Number(resources.population || 0) - popLoss);
        resources.treasury = Math.max(0, Number(resources.treasury || 0) - goldLoss);
        resources.loyalty = Math.max(0, Math.min(100, Number(resources.loyalty || 0) - Math.min(25, 5 + gap)));
        resources.threat = Math.max(5, Math.round(Number(resources.threat || 0) * 0.75));
        report.push(`Кризис обороны: угроза превысила военную силу на ${gap}. Потери: ${popLoss} жителей, ${goldLoss} gp.`);
      }

      settings.attack.nextInCycles = 2 + rnd(3);
      settings.scouting.known = false;
    }

    derived = calculateDerived(actor);

    resources.loyalty = Math.max(0, Math.min(100, Number(resources.loyalty || 0) + Number(derived.loyaltyPassive || 0)));

    const loyaltyMigration = resources.loyalty >= 70 ? 2 : resources.loyalty >= 50 ? 0 : resources.loyalty >= 30 ? -2 : -5;
    const threatPenalty = resources.threat > derived.military ? -2 : 0;
    const migration = Math.round(Number(derived.attractiveness || 0) + loyaltyMigration + threatPenalty);

    resources.population = Math.max(0, Number(resources.population || 0) + migration);
    report.push(`Миграция: ${signed(migration)} жителей.`);

    derived = calculateDerived(actor);
    resources.food = Math.min(Number(resources.food || 0), Number(derived.foodCapacity || 250));
    resources.treasury = Math.min(Number(resources.treasury || 0), Number(derived.treasuryCapacity || 2000));

    const after = clone(resources);
    const derivedAfter = calculateDerived(actor);

    const summary = [
      `Цикл ${settings.cycle}`,
      `Население: ${before.population} → ${after.population}`,
      `Еда: ${before.food} → ${after.food}`,
      `Казна: ${before.treasury} → ${after.treasury}`,
      `Военная сила: ${derivedBefore.military} → ${derivedAfter.military}`,
      `Лояльность: ${before.loyalty} → ${after.loyalty}`,
      `Привлекательность: ${derivedBefore.attractiveness} → ${derivedAfter.attractiveness}`,
      `Проекты: ${derivedAfter.activeProjects} / ${derivedAfter.projectCapacity}`,
      ...report
    ];

    settings.reports.unshift({
      cycle: settings.cycle,
      title: `Отчёт за цикл ${settings.cycle}`,
      items: summary,
      time: Date.now()
    });

    settings.reports = settings.reports.slice(0, 40);

    await setResources(actor, resources);
    await setSettings(actor, settings);

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: actor.name }),
      content: `<h2>${actor.name}: цикл ${settings.cycle}</h2><ul>${summary.filter(x => isGM() || !String(x).startsWith("Скрыто")).map(x => `<li>${x}</li>`).join("")}</ul>`
    });

    ui.notifications.info(`Поселение пересчитано: цикл ${settings.cycle}.`);
    forceRenderActor(actor);
  }

  function forceRenderActor(actor) {
    for (const app of Object.values(ui.windows || {})) {
      if ((app.actor || app.document)?.id === actor.id) app.render(false);
    }

    document.querySelectorAll(`[data-gvm-actor-id="${actor.id}"]`).forEach(panel => {
      renderSettlementPanel(actor, panel);
    });
  }

  async function scout(actor) {
    const settings = getSettings(actor);
    const resources = getResources(actor);
    const cost = [{ stat: "treasury", value: -10 }];

    if (!canPay(actor, cost)) {
      ui.notifications.warn("Недостаточно казны.");
      return;
    }

    await createOrder(actor, {
      name: "Разведка региона",
      img: "icons/tools/navigation/spyglass-telescope-brass.webp",
      duration: 1,
      cost,
      action: "scout",
      description: "Отряд разведки оценивает угрозу региона.",
      effectsOnComplete: []
    });

    const orders = orderItems(actor);
    const last = orders[orders.length - 1];
    if (last) {
      const data = clone(gvmData(last));
      data.action = "custom-scout";
      data.effectsOnComplete = [];
      await last.setFlag(FLAG_SCOPE, "data", data);
    }
  }

  async function resolveSpecialCompletedOrders(actor) {
    const settings = getSettings(actor);
    const resources = getResources(actor);

    for (const item of orderItems(actor)) {
      const data = clone(gvmData(item));
      if (data.status !== "completed") continue;
      if (data._resolvedSpecial) continue;

      if (data.action === "custom-scout") {
        const t = Number(resources.threat || 0);
        settings.scouting = {
          known: true,
          threatMin: Math.max(0, t - rnd(4)),
          threatMax: t + rnd(6),
          cyclesRemainingVisible: settings.attack.nextInCycles,
          expiresCycle: settings.cycle + 2
        };
        data._resolvedSpecial = true;
        await item.setFlag(FLAG_SCOPE, "data", data);
      }
    }

    await setSettings(actor, settings);
  }

  async function confirmDialog(title, content) {
    return new Promise(resolve => {
      new Dialog({
        title,
        content,
        buttons: {
          ok: { label: "OK", callback: () => resolve(true) },
          cancel: { label: "Отмена", callback: () => resolve(false) }
        },
        default: "ok"
      }).render(true);
    });
  }

  function jsonEditorDialog(title, data, onSave) {
    new Dialog({
      title,
      content: `
        <form>
          <p>Редактируйте JSON flags.${FLAG_SCOPE}.data. Осторожно: невалидный JSON не сохранится.</p>
          <textarea name="json" style="width:100%;height:420px;font-family:monospace;">${foundry.utils.escapeHTML(JSON.stringify(data, null, 2))}</textarea>
        </form>
      `,
      buttons: {
        save: {
          label: "Сохранить",
          callback: async html => {
            try {
              const parsed = JSON.parse(html.find("[name=json]").val());
              await onSave(parsed);
            } catch (err) {
              ui.notifications.error(`JSON ошибка: ${err.message}`);
            }
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "save",
      width: 720
    }).render(true);
  }

  function createEffectBuilderHtml(prefix = "") {
    return `
      <div class="form-group">
        <label>${prefix}Стат</label>
        <select name="${prefix}stat">
          ${Object.entries(STATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>${prefix}Значение</label>
        <input type="number" name="${prefix}value" value="0"/>
      </div>
      <div class="form-group">
        <label>${prefix}Timing</label>
        <select name="${prefix}timing">
          <option value="passive">passive</option>
          <option value="perCycle">perCycle</option>
          <option value="everyInterval">everyInterval</option>
          <option value="onComplete">onComplete</option>
        </select>
      </div>
    `;
  }

  async function createBuildingDialog(actor) {
    new Dialog({
      title: "Создать здание",
      content: `
        <form>
          <div class="form-group"><label>Название</label><input name="name" value="Новое здание"/></div>
          <div class="form-group">
            <label>Тип</label>
            <select name="type">
              ${Object.entries(BUILDING_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
            </select>
          </div>
          <div class="form-group"><label>Статус</label><select name="status"><option value="available">available</option><option value="built">built</option><option value="locked">locked</option></select></div>
          <div class="form-group"><label>Уровень</label><input type="number" name="level" value="0"/></div>
          <div class="form-group"><label>Макс. уровень</label><input type="number" name="maxLevel" value="5"/></div>
          <div class="form-group"><label>Рабочие требуются</label><input type="number" name="workersRequired" value="0"/></div>
          <div class="form-group"><label>Рабочие назначены</label><input type="number" name="workersAssigned" value="0"/></div>
          <hr/>
          <h3>Первый эффект</h3>
          ${createEffectBuilderHtml("e_")}
          <div class="form-group"><label>Описание</label><textarea name="note"></textarea></div>
        </form>
      `,
      buttons: {
        create: {
          label: "Создать",
          callback: async html => {
            const effectValue = Number(html.find("[name=e_value]").val()) || 0;
            const effects = effectValue ? [{
              stat: String(html.find("[name=e_stat]").val()),
              value: effectValue,
              timing: String(html.find("[name=e_timing]").val())
            }] : [];

            await createGvmItem(actor, String(html.find("[name=name]").val()), "icons/svg/item-bag.svg", {
              kind: KIND.BUILDING,
              type: String(html.find("[name=type]").val()),
              status: String(html.find("[name=status]").val()),
              level: Number(html.find("[name=level]").val()) || 0,
              maxLevel: Number(html.find("[name=maxLevel]").val()) || 5,
              unlockLevel: 5,
              workersRequired: Number(html.find("[name=workersRequired]").val()) || 0,
              workersAssigned: Number(html.find("[name=workersAssigned]").val()) || 0,
              upkeep: [],
              effects,
              levels: [],
              services: [],
              note: String(html.find("[name=note]").val())
            });

            forceRenderActor(actor);
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "create",
      width: 620
    }).render(true);
  }

  async function createReformDialog(actor) {
    new Dialog({
      title: "Создать реформу",
      content: `
        <form>
          <div class="form-group"><label>Название</label><input name="name" value="Новая реформа"/></div>
          <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
          <div class="form-group"><label>Активна</label><input type="checkbox" name="active"/></div>
          <div class="form-group"><label>Интервал</label><input type="number" name="interval" value="1"/></div>
          <hr/>
          <h3>Пассивный эффект</h3>
          ${createEffectBuilderHtml("p_")}
          <hr/>
          <h3>Периодический эффект</h3>
          ${createEffectBuilderHtml("t_")}
        </form>
      `,
      buttons: {
        create: {
          label: "Создать",
          callback: async html => {
            const effects = [];
            const pv = Number(html.find("[name=p_value]").val()) || 0;
            const tv = Number(html.find("[name=t_value]").val()) || 0;

            if (pv) effects.push({
              target: "settlement",
              stat: String(html.find("[name=p_stat]").val()),
              value: pv,
              timing: "passive"
            });

            if (tv) effects.push({
              target: "settlement",
              stat: String(html.find("[name=t_stat]").val()),
              value: tv,
              timing: "everyInterval"
            });

            await createGvmItem(actor, String(html.find("[name=name]").val()), "icons/sundries/flags/banner-symbol-white-red.webp", {
              kind: KIND.REFORM,
              active: !!html.find("[name=active]").prop("checked"),
              interval: Math.max(1, Number(html.find("[name=interval]").val()) || 1),
              tick: 0,
              description: String(html.find("[name=description]").val()),
              effects
            });

            forceRenderActor(actor);
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "create",
      width: 620
    }).render(true);
  }

  async function createOrderDialog(actor) {
    new Dialog({
      title: "Создать приказ",
      content: `
        <form>
          <div class="form-group"><label>Название</label><input name="name" value="Новый приказ"/></div>
          <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
          <div class="form-group"><label>Длительность в циклах</label><input type="number" name="duration" value="1"/></div>
          <hr/>
          <h3>Стоимость</h3>
          ${createEffectBuilderHtml("c_")}
          <hr/>
          <h3>Эффект при завершении</h3>
          ${createEffectBuilderHtml("e_")}
        </form>
      `,
      buttons: {
        create: {
          label: "Создать",
          callback: async html => {
            const costValue = Number(html.find("[name=c_value]").val()) || 0;
            const effectValue = Number(html.find("[name=e_value]").val()) || 0;

            const cost = costValue ? [{
              stat: String(html.find("[name=c_stat]").val()),
              value: costValue
            }] : [];

            const effectsOnComplete = effectValue ? [{
              stat: String(html.find("[name=e_stat]").val()),
              value: effectValue
            }] : [];

            await createOrder(actor, {
              name: String(html.find("[name=name]").val()),
              description: String(html.find("[name=description]").val()),
              duration: Math.max(1, Number(html.find("[name=duration]").val()) || 1),
              cost,
              effectsOnComplete
            });

            forceRenderActor(actor);
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "create",
      width: 620
    }).render(true);
  }

  async function createBonusDialog(actor) {
    new Dialog({
      title: "Создать бонус",
      content: `
        <form>
          <div class="form-group"><label>Название</label><input name="name" value="Новый бонус"/></div>
          <div class="form-group"><label>Источник</label><input name="source" value=""/></div>
          <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
          <div class="form-group"><label>Длительность</label><input type="number" name="duration" value="1"/></div>
          <hr/>
          <h3>Стоимость</h3>
          ${createEffectBuilderHtml("c_")}
          <hr/>
          <h3>Эффект</h3>
          ${createEffectBuilderHtml("e_")}
        </form>
      `,
      buttons: {
        create: {
          label: "Создать",
          callback: async html => {
            const costValue = Number(html.find("[name=c_value]").val()) || 0;
            const effectValue = Number(html.find("[name=e_value]").val()) || 0;

            const cost = costValue ? [{
              stat: String(html.find("[name=c_stat]").val()),
              value: costValue
            }] : [];

            const effects = effectValue ? [{
              stat: String(html.find("[name=e_stat]").val()),
              value: effectValue,
              timing: "passive"
            }] : [];

            await createGvmItem(actor, String(html.find("[name=name]").val()), "icons/magic/symbols/runes-star-pentagon-blue.webp", {
              kind: KIND.BONUS,
              source: String(html.find("[name=source]").val()),
              active: false,
              remaining: 0,
              duration: Math.max(1, Number(html.find("[name=duration]").val()) || 1),
              cost,
              effects,
              description: String(html.find("[name=description]").val())
            });

            forceRenderActor(actor);
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "create",
      width: 620
    }).render(true);
  }

  async function assignWorkersDialog(actor, item) {
    const data = clone(gvmData(item));
    const derived = calculateDerived(actor);

    const otherAssigned = buildingItems(actor)
      .filter(i => i.id !== item.id)
      .reduce((sum, i) => {
        const dta = gvmData(i);
        if (!["built", "damaged"].includes(dta.status)) return sum;
        return sum + Math.min(Number(dta.workersAssigned) || 0, Number(dta.workersRequired) || 0);
      }, 0);

    const maxPossible = Math.min(Number(data.workersRequired) || 0, Math.max(0, Number(getResources(actor).population || 0) - otherAssigned));

    new Dialog({
      title: `Рабочие: ${item.name}`,
      content: `
        <form>
          <p>Максимум доступно для этого здания: <b>${maxPossible}</b></p>
          <div class="form-group">
            <label>Назначить рабочих</label>
            <input name="workers" type="number" value="${data.workersAssigned || 0}"/>
          </div>
        </form>
      `,
      buttons: {
        save: {
          label: "Сохранить",
          callback: async html => {
            data.workersAssigned = Math.max(0, Math.min(maxPossible, Number(html.find("[name=workers]").val()) || 0));
            await item.setFlag(FLAG_SCOPE, "data", data);
            forceRenderActor(actor);
          }
        },
        cancel: { label: "Отмена" }
      },
      default: "save"
    }).render(true);
  }

  async function toggleBuilding(actor, item) {
    const data = clone(gvmData(item));
    if (data.status === "built") data.status = "disabled";
    else if (data.status === "disabled") data.status = "built";
    else {
      ui.notifications.warn("Можно включать/отключать только построенные здания.");
      return;
    }
    await item.setFlag(FLAG_SCOPE, "data", data);
    forceRenderActor(actor);
  }

  async function toggleReform(actor, item) {
    const data = clone(gvmData(item));
    data.active = !data.active;
    await item.setFlag(FLAG_SCOPE, "data", data);
    forceRenderActor(actor);
  }

  async function activateBonus(actor, item) {
    const data = clone(gvmData(item));

    if (data.active) {
      data.active = false;
      data.remaining = 0;
      await item.setFlag(FLAG_SCOPE, "data", data);
      forceRenderActor(actor);
      return;
    }

    const active = bonusItems(actor).find(i => gvmData(i).active);
    if (active) {
      ui.notifications.warn(`Уже активен бонус: ${active.name}`);
      return;
    }

    if (!canPay(actor, data.cost || [])) {
      ui.notifications.warn("Недостаточно ресурсов для бонуса.");
      return;
    }

    await payCost(actor, data.cost || []);
    data.active = true;
    data.remaining = Number(data.duration || 1);
    await item.setFlag(FLAG_SCOPE, "data", data);
    forceRenderActor(actor);
  }

  function openItem(item) {
    item.sheet?.render(true);
  }

  function editGvmData(actor, item) {
    jsonEditorDialog(`${item.name}: GVM data`, gvmData(item), async parsed => {
      await item.setFlag(FLAG_SCOPE, "data", parsed);
      forceRenderActor(actor);
    });
  }

  function getActorSheetRoot(app, html) {
    if (html?.jquery) return html[0];
    if (html instanceof HTMLElement) return html;
    if (app?.element?.jquery) return app.element[0];
    if (app?.element instanceof HTMLElement) return app.element;
    return null;
  }

  function findActorPrimaryTabs(root) {
    return root.querySelector(
      'nav.sheet-tabs[data-group="primary"], nav.tabs[data-group="primary"], .sheet-tabs[data-group="primary"], nav.sheet-tabs, nav.tabs, .sheet-tabs'
    );
  }

  function findActorTabBody(root) {
    return root.querySelector(".sheet-body, .window-content form, form, .window-content");
  }

  function hideOtherTabs(root, panel, button) {
    const body = findActorTabBody(root) || root;

    for (const el of body.querySelectorAll(".tab[data-tab], section[data-tab], div[data-tab]")) {
      if (el === panel) continue;
      if (!el.classList.contains("gvm-settlement-panel")) {
        el.classList.remove("active");
        el.style.display = "none";
      }
    }

    for (const b of root.querySelectorAll("[data-tab]")) {
      if (b === button) continue;
      b.classList.remove("active");
    }

    panel.classList.add("active");
    panel.style.display = "";
    button.classList.add("active");
  }

  function restoreSettlementPanel(panel) {
    if (!panel) return;
    panel.classList.remove("active");
    panel.style.display = "none";
  }

  async function injectSettlementTab(app, html) {
    try {
      const actor = app.actor || app.document;
      if (!isGroupActor(actor)) return;
      if (!actor.testUserPermission(game.user, "OBSERVER")) return;

      const root = getActorSheetRoot(app, html);
      if (!root) return;
      if (root.querySelector(".gvm-settlement-tab-button")) return;

      const tabs = findActorPrimaryTabs(root);
      const body = findActorTabBody(root);

      if (!tabs || !body) {
        console.warn(`${MODULE_ID} | Could not find Group Actor tabs/body.`);
        return;
      }

      const button = document.createElement("a");
      button.classList.add("item", "gvm-settlement-tab-button");
      button.dataset.tab = "gvm-settlement";
      button.dataset.group = "primary";
      button.innerHTML = `<i class="fas fa-fort-awesome"></i> Поселение`;

      const panel = document.createElement("section");
      panel.classList.add("tab", "gvm-settlement-panel");
      panel.dataset.tab = "gvm-settlement";
      panel.dataset.group = "primary";
      panel.dataset.gvmActorId = actor.id;
      panel.style.display = "none";
      panel.innerHTML = `<p>Загрузка поселения...</p>`;

      tabs.appendChild(button);
      body.appendChild(panel);

      button.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        hideOtherTabs(root, panel, button);
        await ensureSettlementFlags(actor);
        await renderSettlementPanel(actor, panel);
      });

      for (const other of tabs.querySelectorAll("[data-tab]")) {
        if (other === button) continue;
        other.addEventListener("click", () => restoreSettlementPanel(panel));
      }

      console.log(`${MODULE_ID} | Settlement tab injected into Group Actor ${actor.name}.`);
    } catch (err) {
      console.warn(`${MODULE_ID} | Failed to inject settlement tab`, err);
    }
  }

  function resourceCard(label, value, hint = "") {
    return `
      <article class="gvm-card">
        <h4>${label}</h4>
        <strong>${value}</strong>
        ${hint ? `<small>${hint}</small>` : ""}
      </article>
    `;
  }

  function itemCard(actor, item) {
    const data = gvmData(item);
    const kind = data.kind;

    if (kind === KIND.BUILDING) {
      return buildingCard(actor, item, data);
    }

    if (kind === KIND.REFORM) {
      return `
        <article class="gvm-item-card" data-item-id="${item.id}" data-kind="${kind}">
          <header>
            ${item.img}
            <div>
              <h4 class="gvm-open-item">${item.name}</h4>
              <small>Реформа · ${data.active ? "активна" : "выключена"} · интервал ${data.interval || 1}</small>
            </div>
          </header>
          <p>${data.description || ""}</p>
          <p><b>Эффекты:</b> ${effectsText(data.effects || [])}</p>
          ${isGM() ? `
            <div class="gvm-actions">
              toggle-reform${data.active ? "Отключить" : "Включить"}</button>
              edit-jsonGVM JSON</button>
            </div>
          ` : ""}
        </article>
      `;
    }

    if (kind === KIND.ORDER) {
      return `
        <article class="gvm-item-card" data-item-id="${item.id}" data-kind="${kind}">
          <header>
            ${item.img}
            <div>
              <h4 class="gvm-open-item">${item.name}</h4>
              <small>Приказ · ${data.status} · ${data.progress || 0}/${data.duration || 1}</small>
            </div>
          </header>
          <p>${data.description || ""}</p>
          <p><b>Стоимость:</b> ${resourceText(data.cost || [])}</p>
          <p><b>При завершении:</b> ${resourceText(data.effectsOnComplete || [])}</p>
          ${isGM() ? `<div class="gvm-actions">edit-jsonGVM JSON</button></div>` : ""}
        </article>
      `;
    }

    if (kind === KIND.BONUS) {
      return `
        <article class="gvm-item-card" data-item-id="${item.id}" data-kind="${kind}">
          <header>
            ${item.img}
            <div>
              <h4 class="gvm-open-item">${item.name}</h4>
              <small>Бонус · ${data.active ? `активен, осталось ${data.remaining}` : "неактивен"}</small>
            </div>
          </header>
          <p>${data.description || ""}</p>
          <p><b>Источник:</b> ${data.source || "—"}</p>
          <p><b>Цена:</b> ${resourceText(data.cost || [])}</p>
          <p><b>Эффект:</b> ${effectsText(data.effects || [])}</p>
          ${isGM() ? `
            <div class="gvm-actions">
              activate-bonus${data.active ? "Снять" : "Активировать"}</button>
              edit-jsonGVM JSON</button>
            </div>
          ` : ""}
        </article>
      `;
    }

    return "";
  }

  function buildingCard(actor, item, data) {
    const e = Math.round(buildingEfficiency(data) * 100);
    const services = (data.services || []).length ? `<p><b>Сервисы игрокам:</b> ${data.services.join(", ")}</p>` : "";

    return `
      <article class="gvm-item-card gvm-building-card ${data.status}" data-item-id="${item.id}" data-kind="${data.kind}">
        <header>
          ${item.img}
          <div>
            <h4 class="gvm-open-item">${item.name}</h4>
            <small>${BUILDING_TYPES[data.type] || data.type || "Здание"} · ${data.status} · L${data.level || 0}/${data.maxLevel || 5} · ${e}%</small>
          </div>
        </header>
        <p><b>Рабочие:</b> ${data.workersAssigned || 0}/${data.workersRequired || 0}</p>
        <p><b>Содержание:</b> ${resourceText(data.upkeep || [])}</p>
        <p><b>Эффекты:</b> ${effectsText(data.effects || [])}</p>
        ${services}
        <p class="gvm-note">${data.note || ""}</p>
        ${isGM() ? `
          <div class="gvm-actions">
            assign-workersРабочие</button>
            upgrade-building${Number(data.level || 0) === 0 ? "Построить" : "Улучшить"}</button>
            toggle-building${data.status === "disabled" ? "Включить" : "Отключить"}</button>
            edit-jsonGVM JSON</button>
          </div>
        ` : ""}
      </article>
    `;
  }

  async function renderSettlementPanel(actor, panel) {
    await resolveSpecialCompletedOrders(actor);
    await ensureSettlementFlags(actor);

    const resources = getResources(actor);
    const settings = getSettings(actor);
    const derived = calculateDerived(actor);
    const hidden = settings.hiddenFromPlayers && !isGM();

    const threatText = isGM()
      ? resources.threat
      : settings.scouting.known
        ? `${settings.scouting.threatMin}-${settings.scouting.threatMax}`
        : "неизвестно";

    panel.innerHTML = `
      <section class="gvm-root" data-gvm-actor-id="${actor.id}">
        <header class="gvm-header">
          <div>
            <h2>${actor.name}: Поселение</h2>
            <p>Цикл ${settings.cycle} · Проекты ${hidden ? "скрыто" : `${derived.activeProjects} / ${derived.projectCapacity}`}</p>
          </div>
          <div class="gvm-actions">
            ${isGM() ? `next-cycleСледующий цикл</button>` : ""}
            ${isGM() ? `toggle-hidden${settings.hiddenFromPlayers ? "Показать игрокам" : "Скрыть от игроков"}</button>` : ""}
            ${isGM() ? `init-defaultsСоздать стартовые Items</button>` : ""}
          </div>
        </header>

        <section class="gvm-cards">
          ${resourceCard("Население", hidden ? "примерно" : resources.population, "рабочая сила")}
          ${resourceCard("Еда", hidden ? "скрыто" : resources.food, `лимит ${derived.foodCapacity}`)}
          ${resourceCard("Казна", hidden ? "скрыто" : resources.treasury, `лимит ${derived.treasuryCapacity}`)}
          ${resourceCard("Военная сила", hidden ? "скрыто" : derived.military, "оборона")}
          ${resourceCard("Лояльность", hidden ? "примерно" : resources.loyalty, "0-100")}
          ${resourceCard("Привлекательность", hidden ? "скрыто" : derived.attractiveness, "миграция")}
          ${resourceCard("Угроза", threatText, "разведка / GM")}
        </section>

        ${isGM() ? `
          <section class="gvm-toolbar">
            create-buildingСоздать здание</button>
            create-reformСоздать реформу</button>
            create-orderСоздать приказ</button>
            create-bonusСоздать бонус</button>
            scoutОтправить разведку</button>
          </section>
        ` : ""}

        <section class="gvm-section gvm-drop-zone" data-gvm-drop-kind="building">
          <h3>Здания</h3>
          <p class="gvm-hint">Перетащите Item-здание сюда, чтобы добавить его в поселение. ЛКМ по названию открывает Item Sheet, ПКМ по карточке открывает JSON-редактор.</p>
          ${hidden ? `<p>Данные зданий скрыты.</p>` : `<div class="gvm-grid">${buildingItems(actor).map(i => itemCard(actor, i)).join("") || "<p>Зданий пока нет.</p>"}</div>`}
        </section>

        <section class="gvm-section gvm-drop-zone" data-gvm-drop-kind="reform">
          <h3>Реформы</h3>
          ${hidden ? `<p>Реформы скрыты.</p>` : `<div class="gvm-grid">${reformItems(actor).map(i => itemCard(actor, i)).join("") || "<p>Реформ пока нет.</p>"}</div>`}
        </section>

        <section class="gvm-section gvm-drop-zone" data-gvm-drop-kind="order">
          <h3>Приказы / проекты</h3>
          ${hidden ? `<p>Приказы скрыты.</p>` : `<div class="gvm-grid">${orderItems(actor).map(i => itemCard(actor, i)).join("") || "<p>Приказов пока нет.</p>"}</div>`}
        </section>

        <section class="gvm-section gvm-drop-zone" data-gvm-drop-kind="bonus">
          <h3>Бонусы</h3>
          ${hidden ? `<p>Бонусы скрыты.</p>` : `<div class="gvm-grid">${bonusItems(actor).map(i => itemCard(actor, i)).join("") || "<p>Бонусов пока нет.</p>"}</div>`}
        </section>

        <section class="gvm-section">
          <h3>Отчёты</h3>
          ${
            settings.reports?.length
              ? settings.reports.map(r => `<article class="gvm-report"><h4>${r.title}</h4><ul>${(r.items || []).filter(x => isGM() || !String(x).startsWith("Скрыто")).map(x => `<li>${x}</li>`).join("")}</ul></article>`).join("")
              : "<p>Отчётов пока нет.</p>"
          }
        </section>

        ${isGM() ? `
          <section class="gvm-section">
            <h3>GM настройки</h3>
            <div class="gvm-form-grid">
              <label>Население <input data-gvm-resource="population" type="number" value="${resources.population}"/></label>
              <label>Еда <input data-gvm-resource="food" type="number" value="${resources.food}"/></label>
              <label>Казна <input data-gvm-resource="treasury" type="number" value="${resources.treasury}"/></label>
              <label>Лояльность <input data-gvm-resource="loyalty" type="number" value="${resources.loyalty}"/></label>
              <label>Угроза <input data-gvm-resource="threat" type="number" value="${resources.threat}"/></label>
              <label>Уровень персонажей <input data-gvm-setting="playerCharacterLevel" type="number" value="${settings.playerCharacterLevel}"/></label>
              <label>Нападение через циклов <input data-gvm-setting="attack.nextInCycles" type="number" value="${settings.attack.nextInCycles}"/></label>
              <label>Базовый рост угрозы <input data-gvm-setting="attack.baseGrowth" type="number" value="${settings.attack.baseGrowth}"/></label>
            </div>
          </section>
        ` : ""}
      </section>
    `;

    activateSettlementPanelListeners(actor, panel);
  }

  function activateSettlementPanelListeners(actor, panel) {
    panel.querySelectorAll("[data-gvm-action]").forEach(el => {
      el.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();

        const action = el.dataset.gvmAction;
        const itemId = el.dataset.itemId;
        const item = itemId ? actor.items.get(itemId) : null;

        if (action === "next-cycle") await advanceCycle(actor);

        if (action === "toggle-hidden") {
          const settings = getSettings(actor);
          settings.hiddenFromPlayers = !settings.hiddenFromPlayers;
          await setSettings(actor, settings);
          await renderSettlementPanel(actor, panel);
        }

        if (action === "init-defaults") {
          await initializeDefaults(actor);
          await renderSettlementPanel(actor, panel);
        }

        if (action === "create-building") await createBuildingDialog(actor);
        if (action === "create-reform") await createReformDialog(actor);
        if (action === "create-order") await createOrderDialog(actor);
        if (action === "create-bonus") await createBonusDialog(actor);
        if (action === "scout") await scout(actor);

        if (action === "assign-workers" && item) await assignWorkersDialog(actor, item);
        if (action === "upgrade-building" && item) await upgradeBuilding(actor, item);
        if (action === "toggle-building" && item) await toggleBuilding(actor, item);
        if (action === "toggle-reform" && item) await toggleReform(actor, item);
        if (action === "activate-bonus" && item) await activateBonus(actor, item);
        if (action === "edit-json" && item) editGvmData(actor, item);
      });
    });

    panel.querySelectorAll(".gvm-open-item").forEach(el => {
      el.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const card = el.closest("[data-item-id]");
        const item = card ? actor.items.get(card.dataset.itemId) : null;
        if (item) openItem(item);
      });
    });

    panel.querySelectorAll("[data-item-id]").forEach(card => {
      card.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        const item = actor.items.get(card.dataset.itemId);
        if (item) editGvmData(actor, item);
      });
    });

    panel.querySelectorAll("[data-gvm-resource]").forEach(input => {
      input.addEventListener("change", async ev => {
        if (!isGM()) return;
        const resources = getResources(actor);
        resources[input.dataset.gvmResource] = Number(input.value) || 0;
        await setResources(actor, resources);
        await renderSettlementPanel(actor, panel);
      });
    });

    panel.querySelectorAll("[data-gvm-setting]").forEach(input => {
      input.addEventListener("change", async ev => {
        if (!isGM()) return;
        const settings = getSettings(actor);
        foundry.utils.setProperty(settings, input.dataset.gvmSetting, Number(input.value) || 0);
        await setSettings(actor, settings);
        await renderSettlementPanel(actor, panel);
      });
    });

    panel.querySelectorAll(".gvm-drop-zone").forEach(zone => {
      zone.addEventListener("dragover", ev => {
        ev.preventDefault();
        zone.classList.add("dragover");
      });

      zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));

      zone.addEventListener("drop", async ev => {
        ev.preventDefault();
        zone.classList.remove("dragover");

        if (!isGM()) return;

        try {
          const data = TextEditor.getDragEventData(ev);
          let dropped = null;

          if (data.uuid) dropped = await fromUuid(data.uuid);
          else if (data.type === "Item" && data.id) dropped = game.items.get(data.id);

          if (!dropped || dropped.documentName !== "Item") {
            ui.notifications.warn("Можно перетаскивать только Items.");
            return;
          }

          const dta = gvmData(dropped);
          if (!dta.kind) {
            ui.notifications.warn("Этот Item не содержит flags Goblin Village Manager. Откройте его JSON или создайте через вкладку поселения.");
            return;
          }

          const wanted = zone.dataset.gvmDropKind;
          if (wanted && dta.kind !== wanted) {
            ui.notifications.warn(`Этот Item имеет тип ${dta.kind}, а зона ожидает ${wanted}.`);
            return;
          }

          const itemData = dropped.toObject();
          delete itemData._id;
          await actor.createEmbeddedDocuments("Item", [itemData]);

          ui.notifications.info(`${dropped.name} добавлен в поселение.`);
          await renderSettlementPanel(actor, panel);
        } catch (err) {
          console.error(err);
          ui.notifications.error(`Drop error: ${err.message}`);
        }
      });
    });
  }

  class GvmSettlementWindow extends Application {
    constructor(actor, options = {}) {
      super(options);
      this.actor = actor;
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "gvm-settlement-window",
        title: "Поселение",
        width: 1050,
        height: 800,
        resizable: true,
        classes: ["gvm-window"]
      });
    }

    async _renderInner() {
      const wrapper = document.createElement("section");
      wrapper.classList.add("gvm-window-body");
      wrapper.dataset.gvmActorId = this.actor.id;
      await renderSettlementPanel(this.actor, wrapper);
      return $(wrapper);
    }
  }

  function findFirstSettlementActor() {
    return game.actors.find(a => isGroupActor(a)) || null;
  }

  async function openSettlement(actor = null) {
    actor = actor || findFirstSettlementActor();

    if (!actor) {
      ui.notifications.warn("Не найден Group Actor. Создайте Group Actor или поставьте актеру flag goblin-village-manager.isSettlement.");
      return;
    }

    await ensureSettlementFlags(actor);
    new GvmSettlementWindow(actor).render(true);
  }

  function registerApi() {
    game.goblinVillage = {
      open: openSettlement,
      initializeDefaults,
      advanceCycle,
      getResources,
      getSettings,
      calculateDerived,
      createBuildingDialog,
      createReformDialog,
      createOrderDialog,
      createBonusDialog
    };
  }

  Hooks.once("ready", () => {
    registerApi();
    console.log(`${MODULE_ID} | v0.3.0 ready. Use game.goblinVillage.open()`);
  });

  Hooks.on("renderActorSheet", injectSettlementTab);
  Hooks.on("renderActorSheetV2", injectSettlementTab);

  Hooks.on("renderApplication", (app, html) => {
    try {
      const actor = app.actor || app.document;
      if (!isGroupActor(actor)) return;
      injectSettlementTab(app, html);
    } catch (err) {
      // ignore non-actor applications
    }
  });

  Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
    try {
      const actor = app.actor || app.document;
      if (!isGroupActor(actor)) return;

      buttons.unshift({
        label: "Поселение",
        class: "gvm-open-settlement",
        icon: "fas fa-fort-awesome",
        onclick: () => openSettlement(actor)
      });
    } catch (err) {
      console.warn(`${MODULE_ID} | Header button failed`, err);
    }
  });
})();
