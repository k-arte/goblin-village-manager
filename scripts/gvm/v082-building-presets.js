
/**
 * GVM v0.8.2
 * D&D 2024 Facility Types + Building Presets Foundation
 *
 * Goals:
 * - Register all D&D 2024 Bastion facility types as type presets.
 * - Register campaign building presets.
 * - Remove prison/cell building preset from the active preset list.
 * - Add developmentSubtype as the room development path.
 * - Attach levels with stats and abilities.
 * - Add sheet buttons:
 *   - Building presets
 *   - Adapt buildings to v0.8.2
 *   - Reset settlement settings
 */

window.GVM = window.GVM || {};
GVM.V082 = GVM.V082 || {};

GVM.V082.FACILITY_TYPES_2024 = [
  {
    facilityType: "basic",
    officialName: "Basic Facility",
    ruName: "Базовое помещение",
    unlockLevel: 5,
    category: "basic",
    developmentSubtypes: ["quarters", "storage", "common-room"],
    levelThemes: ["Жильё", "Удобство", "Опора поселения"]
  },
  {
    facilityType: "arcane-study",
    officialName: "Arcane Study",
    ruName: "Арканный кабинет",
    unlockLevel: 5,
    category: "arcane",
    developmentSubtypes: ["spellwork", "identification", "rituals"],
    levelThemes: ["Фокусы", "Ритуалы", "Арканная поддержка"]
  },
  {
    facilityType: "archive",
    officialName: "Archive",
    ruName: "Архив",
    unlockLevel: 13,
    category: "knowledge",
    developmentSubtypes: ["records", "secrets", "history"],
    levelThemes: ["Записи", "Досье", "Знание прошлого"]
  },
  {
    facilityType: "armory",
    officialName: "Armory",
    ruName: "Оружейная",
    unlockLevel: 5,
    category: "military",
    developmentSubtypes: ["weapons", "armor", "militia"],
    levelThemes: ["Снаряжение", "Вооружение", "Боеготовность"]
  },
  {
    facilityType: "barrack",
    officialName: "Barrack",
    ruName: "Казармы",
    unlockLevel: 5,
    category: "military",
    developmentSubtypes: ["infantry", "guards", "watch"],
    levelThemes: ["Рекруты", "Гарнизон", "Элита"]
  },
  {
    facilityType: "demiplane",
    officialName: "Demiplane",
    ruName: "Демиплан",
    unlockLevel: 17,
    category: "arcane",
    developmentSubtypes: ["storage", "sanctuary", "experiment"],
    levelThemes: ["Карманное пространство", "Укрытие", "Иной домен"]
  },
  {
    facilityType: "gaming-hall",
    officialName: "Gaming Hall",
    ruName: "Игровой зал",
    unlockLevel: 9,
    category: "trade",
    developmentSubtypes: ["casino", "wagers", "rumors"],
    levelThemes: ["Игры", "Риск", "Большие ставки"]
  },
  {
    facilityType: "garden",
    officialName: "Garden",
    ruName: "Сад",
    unlockLevel: 5,
    category: "growth",
    developmentSubtypes: ["herbs", "food", "comfort"],
    levelThemes: ["Травы", "Урожай", "Целебные растения"]
  },
  {
    facilityType: "greenhouse",
    officialName: "Greenhouse",
    ruName: "Теплица",
    unlockLevel: 9,
    category: "growth",
    developmentSubtypes: ["rare-plants", "food", "alchemy"],
    levelThemes: ["Посадки", "Редкие культуры", "Экзотика"]
  },
  {
    facilityType: "guildhall",
    officialName: "Guildhall",
    ruName: "Гильдейский зал",
    unlockLevel: 17,
    category: "trade",
    developmentSubtypes: ["market", "auction", "contracts"],
    levelThemes: ["Сделки", "Контракты", "Гильдейская сеть"]
  },
  {
    facilityType: "laboratory",
    officialName: "Laboratory",
    ruName: "Лаборатория",
    unlockLevel: 9,
    category: "craft",
    developmentSubtypes: ["alchemy", "experiments", "analysis"],
    levelThemes: ["Опыты", "Реактивы", "Исследования"]
  },
  {
    facilityType: "library",
    officialName: "Library",
    ruName: "Библиотека",
    unlockLevel: 5,
    category: "knowledge",
    developmentSubtypes: ["research", "lore", "plans"],
    levelThemes: ["Книги", "Исследования", "Редкие труды"]
  },
  {
    facilityType: "meditation-chamber",
    officialName: "Meditation Chamber",
    ruName: "Зал медитации",
    unlockLevel: 13,
    category: "spiritual",
    developmentSubtypes: ["focus", "training", "discipline"],
    levelThemes: ["Сосредоточение", "Дисциплина", "Внутренняя сила"]
  },
  {
    facilityType: "menagerie",
    officialName: "Menagerie",
    ruName: "Зверинец",
    unlockLevel: 13,
    category: "creatures",
    developmentSubtypes: ["beasts", "mounts", "spider-riders", "guard-creatures"],
    levelThemes: ["Содержание", "Дрессировка", "Боевые существа"]
  },
  {
    facilityType: "observatory",
    officialName: "Observatory",
    ruName: "Обсерватория",
    unlockLevel: 13,
    category: "knowledge",
    developmentSubtypes: ["stars", "omens", "navigation"],
    levelThemes: ["Наблюдения", "Знамения", "Предсказания"]
  },
  {
    facilityType: "pub",
    officialName: "Pub",
    ruName: "Таверна",
    unlockLevel: 13,
    category: "social",
    developmentSubtypes: ["inn", "bathhouse", "visitors"],
    levelThemes: ["Гости", "Отдых", "Слухи"]
  },
  {
    facilityType: "reliquary",
    officialName: "Reliquary",
    ruName: "Реликварий",
    unlockLevel: 13,
    category: "spiritual",
    developmentSubtypes: ["holy-relics", "protection", "faith"],
    levelThemes: ["Реликвии", "Почитание", "Чудеса"]
  },
  {
    facilityType: "sacristy",
    officialName: "Sacristy",
    ruName: "Ризница",
    unlockLevel: 9,
    category: "spiritual",
    developmentSubtypes: ["rites", "vestments", "offerings"],
    levelThemes: ["Обряды", "Святыни", "Служение"]
  },
  {
    facilityType: "sanctuary",
    officialName: "Sanctuary",
    ruName: "Святилище",
    unlockLevel: 5,
    category: "spiritual",
    developmentSubtypes: ["torm", "blessing", "protection"],
    levelThemes: ["Молитва", "Благословение", "Защита"]
  },
  {
    facilityType: "sanctum",
    officialName: "Sanctum",
    ruName: "Санктум",
    unlockLevel: 17,
    category: "arcane",
    developmentSubtypes: ["mastery", "warding", "secret-place"],
    levelThemes: ["Тайное место", "Защита", "Высшая сила"]
  },
  {
    facilityType: "scriptorium",
    officialName: "Scriptorium",
    ruName: "Скрипторий",
    unlockLevel: 9,
    category: "craft",
    developmentSubtypes: ["scrolls", "documents", "contracts"],
    levelThemes: ["Письмо", "Свитки", "Документы"]
  },
  {
    facilityType: "smithy",
    officialName: "Smithy",
    ruName: "Кузня",
    unlockLevel: 5,
    category: "craft",
    developmentSubtypes: ["weapons", "tools", "repairs"],
    levelThemes: ["Ремонт", "Ковка", "Мастерская работа"]
  },
  {
    facilityType: "stable",
    officialName: "Stable",
    ruName: "Конюшня",
    unlockLevel: 9,
    category: "creatures",
    developmentSubtypes: ["mounts", "travel", "messengers"],
    levelThemes: ["Ездовые животные", "Поездки", "Курьеры"]
  },
  {
    facilityType: "storehouse",
    officialName: "Storehouse",
    ruName: "Склад",
    unlockLevel: 5,
    category: "resources",
    developmentSubtypes: ["food", "treasury", "supplies"],
    levelThemes: ["Запасы", "Хранилище", "Логистика"]
  },
  {
    facilityType: "teleportation-circle",
    officialName: "Teleportation Circle",
    ruName: "Круг телепортации",
    unlockLevel: 9,
    category: "arcane",
    developmentSubtypes: ["travel", "network", "escape"],
    levelThemes: ["Переход", "Связь", "Сеть кругов"]
  },
  {
    facilityType: "theater",
    officialName: "Theater",
    ruName: "Театр",
    unlockLevel: 9,
    category: "social",
    developmentSubtypes: ["entertainment", "loyalty", "rumors"],
    levelThemes: ["Представления", "Репутация", "Большая сцена"]
  },
  {
    facilityType: "training-area",
    officialName: "Training Area",
    ruName: "Тренировочная площадка",
    unlockLevel: 9,
    category: "military",
    developmentSubtypes: ["drills", "discipline", "martial-training"],
    levelThemes: ["Тренировки", "Дисциплина", "Боевые навыки"]
  },
  {
    facilityType: "trophy-room",
    officialName: "Trophy Room",
    ruName: "Зал трофеев",
    unlockLevel: 9,
    category: "social",
    developmentSubtypes: ["prestige", "fear", "stories"],
    levelThemes: ["Трофеи", "Слава", "Легенда"]
  },
  {
    facilityType: "war-room",
    officialName: "War Room",
    ruName: "Военный зал",
    unlockLevel: 17,
    category: "command",
    developmentSubtypes: ["senate", "strategy", "orders"],
    levelThemes: ["Совет", "Стратегия", "Городское командование"]
  },
  {
    facilityType: "workshop",
    officialName: "Workshop",
    ruName: "Мастерская",
    unlockLevel: 5,
    category: "craft",
    developmentSubtypes: ["tools", "crafting", "repairs"],
    levelThemes: ["Инструменты", "Производство", "Особые работы"]
  }
];

GVM.V082_STAT_LABELS = {
  population: "Население",
  food: "Еда",
  foodCapacity: "Вместимость еды",
  treasury: "Казна",
  treasuryCapacity: "Вместимость казны",
  loyalty: "Лояльность",
  threat: "Угроза",
  military: "Военная сила",
  attractiveness: "Привлекательность",
  projectCapacity: "Лимит проектов"
};

GVM.v082Ability = function v082Ability(id, label, type, stat, value, costStat, costValue, durationCycles) {
  return {
    id,
    label,
    description: label,
    mode: "add",
    action: {
      type,
      orderType: type,
      durationCycles: Number(durationCycles || 0),
      cost: {
        stat: costStat || "treasury",
        value: Number(costValue || 0)
      }
    },
    result: {
      type: "modifier",
      stat,
      value: Number(value || 0),
      text: label
    },
    requirements: []
  };
};

GVM.v082Level = function v082Level(level, title, stats, abilities, workersRequired, cost, durationCycles) {
  return {
    level,
    title,
    stats: stats || {},
    effects: Object.entries(stats || {}).map(([stat, value]) => ({
      stat,
      value,
      timing: "passive",
      mode: "add"
    })),
    abilities: abilities || [],
    services: [],
    workersRequired: Number(workersRequired || 0),
    cost: cost || {},
    durationCycles: Number(durationCycles || level)
  };
};

GVM.V082_BUILDING_PRESETS = [
  {
    presetId: "senate-room",
    displayName: "Комната сената",
    facilityType: "war-room",
    officialTypeLabel: "War Room / Военный зал",
    developmentSubtype: "senate",
    category: "command",
    img: "icons/sundries/documents/document-sealed-signatures-red.webp",
    description: "Центр управления поселением, городских постановлений и стратегических решений.",
    levels: [
      GVM.v082Level(1, "Малый совет", { loyalty: 2, projectCapacity: 1 }, [
        GVM.v082Ability("senate-public-hearing", "Публичное слушание", "city", "loyalty", 2, "treasury", 25, 1)
      ], 2, { treasury: 180 }, 2),
      GVM.v082Level(2, "Комната сената", { loyalty: 4, projectCapacity: 1, threat: -1 }, [
        GVM.v082Ability("senate-emergency-decree", "Чрезвычайный указ", "city", "projectCapacity", 1, "loyalty", 2, 1)
      ], 4, { treasury: 360 }, 3),
      GVM.v082Level(3, "Большой сенат", { loyalty: 6, projectCapacity: 2, threat: -2 }, [
        GVM.v082Ability("senate-grand-strategy", "Большая стратегия", "city", "military", 6, "treasury", 80, 1)
      ], 6, { treasury: 720 }, 4)
    ]
  },
  {
    presetId: "goblin-barracks",
    displayName: "Казармы гоблинов",
    facilityType: "barrack",
    officialTypeLabel: "Barrack / Казармы",
    developmentSubtype: "goblin-infantry",
    category: "military",
    img: "icons/environment/settlement/watchtower-silhouette.webp",
    description: "Казармы для гоблинского гарнизона, охраны и базовой обороны.",
    levels: [
      GVM.v082Level(1, "Гоблинский караул", { military: 5, threat: 1 }, [
        GVM.v082Ability("goblin-drill", "Гоблинская муштра", "personal", "military", 2, "treasury", 10, 1)
      ], 4, { treasury: 120 }, 1),
      GVM.v082Level(2, "Укреплённые казармы", { military: 11, threat: 1 }, [
        GVM.v082Ability("goblin-patrol", "Гоблинский патруль", "personal", "threat", -2, "treasury", 20, 1)
      ], 8, { treasury: 260 }, 2),
      GVM.v082Level(3, "Главные казармы", { military: 20, threat: 2, loyalty: 1 }, [
        GVM.v082Ability("goblin-mobilization", "Мобилизация гоблинов", "city", "military", 8, "treasury", 60, 1)
      ], 12, { treasury: 520 }, 3)
    ]
  },
  {
    presetId: "spider-rider-menagerie",
    displayName: "Казармы наездных пауков",
    facilityType: "menagerie",
    officialTypeLabel: "Menagerie / Зверинец",
    developmentSubtype: "spider-riders",
    category: "creatures",
    img: "icons/creatures/invertebrates/spider-web-black.webp",
    description: "Зверинец и манеж для содержания боевых пауков и обучения наездников.",
    levels: [
      GVM.v082Level(1, "Паучий загон", { military: 4, threat: 1, attractiveness: -1 }, [
        GVM.v082Ability("spider-patrol", "Паучий дозор", "personal", "threat", -2, "treasury", 15, 1)
      ], 3, { treasury: 180, food: 20 }, 2),
      GVM.v082Level(2, "Манеж наездников", { military: 10, threat: 1, attractiveness: -1 }, [
        GVM.v082Ability("web-ambush", "Паутинная засада", "personal", "military", 4, "treasury", 35, 1)
      ], 6, { treasury: 360, food: 40 }, 3),
      GVM.v082Level(3, "Гнездо боевых пауков", { military: 18, threat: 2, attractiveness: -2 }, [
        GVM.v082Ability("spider-rider-mobilization", "Мобилизация наездников", "city", "military", 10, "treasury", 80, 1)
      ], 9, { treasury: 760, food: 80 }, 4)
    ]
  },
  {
    presetId: "inn",
    displayName: "Гостиница",
    facilityType: "pub",
    officialTypeLabel: "Pub / Таверна",
    developmentSubtype: "inn",
    category: "social",
    img: "icons/environment/settlement/house-wood.webp",
    description: "Место отдыха гостей, слухов, временного жилья и мягкого дохода.",
    levels: [
      GVM.v082Level(1, "Общий зал", { treasury: 10, attractiveness: 1 }, [
        GVM.v082Ability("inn-rumors", "Собрать слухи", "personal", "threat", -1, "treasury", 10, 1)
      ], 3, { treasury: 140 }, 1),
      GVM.v082Level(2, "Гостевые комнаты", { treasury: 24, attractiveness: 3, loyalty: 1 }, [
        GVM.v082Ability("inn-host-visitors", "Принять важных гостей", "personal", "attractiveness", 2, "treasury", 25, 1)
      ], 5, { treasury: 300 }, 2),
      GVM.v082Level(3, "Известная гостиница", { treasury: 45, attractiveness: 6, loyalty: 2 }, [
        GVM.v082Ability("inn-caravan-stop", "Караванная остановка", "city", "treasury", 60, "food", 20, 1)
      ], 7, { treasury: 620 }, 3)
    ]
  },
  {
    presetId: "entertainment-house",
    displayName: "Дом развлечений",
    facilityType: "theater",
    officialTypeLabel: "Theater / Театр",
    developmentSubtype: "entertainment",
    category: "social",
    img: "icons/environment/settlement/tent.webp",
    description: "Нейтральное развлекательное заведение для выступлений, слухов и лояльности.",
    levels: [
      GVM.v082Level(1, "Малая сцена", { loyalty: 2, attractiveness: 1 }, [
        GVM.v082Ability("small-performance", "Малое представление", "personal", "loyalty", 2, "treasury", 15, 1)
      ], 2, { treasury: 160 }, 1),
      GVM.v082Level(2, "Дом представлений", { loyalty: 4, attractiveness: 3, treasury: 8 }, [
        GVM.v082Ability("public-festival", "Публичное представление", "city", "loyalty", 4, "treasury", 45, 1)
      ], 4, { treasury: 340 }, 2),
      GVM.v082Level(3, "Большая сцена", { loyalty: 7, attractiveness: 6, treasury: 18 }, [
        GVM.v082Ability("grand-show", "Большое выступление", "city", "attractiveness", 5, "treasury", 90, 1)
      ], 6, { treasury: 700 }, 3)
    ]
  },
  {
    presetId: "casino",
    displayName: "Казино",
    facilityType: "gaming-hall",
    officialTypeLabel: "Gaming Hall / Игровой зал",
    developmentSubtype: "casino",
    category: "trade",
    img: "icons/sundries/gaming/dice-runed-brown.webp",
    description: "Игровой зал, повышающий доход, риск и поток посетителей.",
    levels: [
      GVM.v082Level(1, "Игровые столы", { treasury: 20, threat: 1 }, [
        GVM.v082Ability("small-wager", "Малая ставка", "personal", "treasury", 25, "treasury", 10, 1)
      ], 3, { treasury: 220 }, 2),
      GVM.v082Level(2, "Зал ставок", { treasury: 45, threat: 2, attractiveness: 2 }, [
        GVM.v082Ability("high-stakes-night", "Ночь высоких ставок", "city", "treasury", 80, "loyalty", 2, 1)
      ], 5, { treasury: 480 }, 3),
      GVM.v082Level(3, "Большой игровой дом", { treasury: 90, threat: 3, attractiveness: 4 }, [
        GVM.v082Ability("rigged-fortune", "Удачная серия", "city", "treasury", 140, "threat", 2, 1)
      ], 7, { treasury: 960 }, 4)
    ]
  },
  {
    presetId: "market",
    displayName: "Рынок",
    facilityType: "guildhall",
    officialTypeLabel: "Guildhall / Гильдейский зал",
    developmentSubtype: "open-market",
    category: "trade",
    img: "icons/containers/bags/sack-cloth-brown.webp",
    description: "Торговая площадь поселения, сделки и доступ к товарам.",
    levels: [
      GVM.v082Level(1, "Торговые ряды", { treasury: 18, attractiveness: 1 }, [
        GVM.v082Ability("market-bargain", "Торговая сделка", "personal", "treasury", 30, "food", 10, 1)
      ], 4, { treasury: 200 }, 2),
      GVM.v082Level(2, "Большой рынок", { treasury: 40, attractiveness: 3, food: 8 }, [
        GVM.v082Ability("market-supply-run", "Закупка припасов", "personal", "food", 50, "treasury", 35, 1)
      ], 6, { treasury: 420 }, 3),
      GVM.v082Level(3, "Гильдейский рынок", { treasury: 75, attractiveness: 6, projectCapacity: 1 }, [
        GVM.v082Ability("merchant-contract", "Купеческий контракт", "city", "treasury", 120, "treasury", 50, 1)
      ], 8, { treasury: 860 }, 4)
    ]
  },
  {
    presetId: "personal-quarters",
    displayName: "Личная комната персонажей",
    facilityType: "basic",
    officialTypeLabel: "Basic Facility / Базовое помещение",
    developmentSubtype: "quarters",
    category: "basic",
    img: "icons/environment/settlement/bed.webp",
    description: "Личная комната персонажей, место отдыха и приватного хранения.",
    levels: [
      GVM.v082Level(1, "Простая комната", { loyalty: 1 }, [], 0, { treasury: 60 }, 1),
      GVM.v082Level(2, "Удобная комната", { loyalty: 2, attractiveness: 1 }, [
        GVM.v082Ability("private-rest", "Приватный отдых", "personal", "loyalty", 1, "treasury", 5, 1)
      ], 0, { treasury: 140 }, 1),
      GVM.v082Level(3, "Уютные покои", { loyalty: 3, attractiveness: 2 }, [
        GVM.v082Ability("personal-preparation", "Личная подготовка", "personal", "projectCapacity", 1, "treasury", 20, 1)
      ], 0, { treasury: 280 }, 2)
    ]
  },
  {
    presetId: "auction-house",
    displayName: "Аукцион",
    facilityType: "guildhall",
    officialTypeLabel: "Guildhall / Гильдейский зал",
    developmentSubtype: "auction",
    category: "trade",
    img: "icons/sundries/documents/document-sealed-brown.webp",
    description: "Место продажи редких вещей, лотов, контрактов и трофеев.",
    levels: [
      GVM.v082Level(1, "Малый аукцион", { treasury: 15, attractiveness: 1 }, [
        GVM.v082Ability("sell-lot", "Продать лот", "personal", "treasury", 35, "treasury", 5, 1)
      ], 2, { treasury: 220 }, 2),
      GVM.v082Level(2, "Дом торгов", { treasury: 38, attractiveness: 3 }, [
        GVM.v082Ability("rare-lot", "Редкий лот", "personal", "treasury", 80, "treasury", 25, 1)
      ], 4, { treasury: 460 }, 3),
      GVM.v082Level(3, "Большой аукционный дом", { treasury: 80, attractiveness: 5, threat: 1 }, [
        GVM.v082Ability("exclusive-auction", "Закрытый аукцион", "city", "treasury", 150, "loyalty", 2, 1)
      ], 6, { treasury: 900 }, 4)
    ]
  },
  {
    presetId: "storehouse",
    displayName: "Склад",
    facilityType: "storehouse",
    officialTypeLabel: "Storehouse / Склад",
    developmentSubtype: "supplies",
    category: "resources",
    img: "icons/containers/chest/chest-reinforced-stone.webp",
    description: "Хранилище запасов, еды, казны и материалов.",
    levels: [
      GVM.v082Level(1, "Малый склад", { foodCapacity: 100, treasuryCapacity: 200 }, [
        GVM.v082Ability("inventory-check", "Пересчёт запасов", "personal", "food", 10, "treasury", 5, 1)
      ], 2, { treasury: 120 }, 1),
      GVM.v082Level(2, "Большой склад", { foodCapacity: 250, treasuryCapacity: 500 }, [
        GVM.v082Ability("redistribute-supplies", "Перераспределить запасы", "personal", "loyalty", 2, "food", 20, 1)
      ], 4, { treasury: 260 }, 2),
      GVM.v082Level(3, "Укреплённое хранилище", { foodCapacity: 500, treasuryCapacity: 1000, threat: -1 }, [
        GVM.v082Ability("emergency-reserves", "Чрезвычайные резервы", "city", "food", 120, "treasury", 40, 1)
      ], 6, { treasury: 520 }, 3)
    ]
  },
  {
    presetId: "watch-post",
    displayName: "Сторожевой пункт",
    facilityType: "barrack",
    officialTypeLabel: "Barrack / Казармы",
    developmentSubtype: "watch",
    category: "military",
    img: "icons/environment/settlement/watchtower.webp",
    description: "Передовой пост охраны, дозора и предупреждения атак.",
    levels: [
      GVM.v082Level(1, "Пост дозора", { military: 3, threat: -1 }, [
        GVM.v082Ability("watch-duty", "Дозор", "personal", "threat", -2, "treasury", 10, 1)
      ], 2, { treasury: 100 }, 1),
      GVM.v082Level(2, "Сторожевая башня", { military: 7, threat: -2 }, [
        GVM.v082Ability("early-warning", "Раннее предупреждение", "personal", "military", 3, "treasury", 25, 1)
      ], 4, { treasury: 240 }, 2),
      GVM.v082Level(3, "Опорный пункт", { military: 12, threat: -3 }, [
        GVM.v082Ability("raise-alarm", "Поднять тревогу", "city", "military", 7, "treasury", 55, 1)
      ], 6, { treasury: 500 }, 3)
    ]
  },
  {
    presetId: "bathhouse",
    displayName: "Бани",
    facilityType: "pub",
    officialTypeLabel: "Pub / Таверна",
    developmentSubtype: "bathhouse",
    category: "social",
    img: "icons/environment/settlement/well-stone.webp",
    description: "Место отдыха, восстановления, разговоров и улучшения настроения жителей.",
    levels: [
      GVM.v082Level(1, "Простые бани", { loyalty: 2, attractiveness: 1 }, [
        GVM.v082Ability("hot-bath", "Горячая баня", "personal", "loyalty", 2, "treasury", 10, 1)
      ], 2, { treasury: 140 }, 1),
      GVM.v082Level(2, "Общие купальни", { loyalty: 4, attractiveness: 2 }, [
        GVM.v082Ability("public-wash", "День отдыха", "city", "loyalty", 4, "treasury", 35, 1)
      ], 4, { treasury: 320 }, 2),
      GVM.v082Level(3, "Знаменитые бани", { loyalty: 7, attractiveness: 4, threat: -1 }, [
        GVM.v082Ability("restorative-ritual", "Восстановительный ритуал", "city", "loyalty", 6, "treasury", 70, 1)
      ], 6, { treasury: 680 }, 3)
    ]
  },
  {
    presetId: "temple-of-torm",
    displayName: "Храм Торма",
    facilityType: "sanctuary",
    officialTypeLabel: "Sanctuary / Святилище",
    developmentSubtype: "torm",
    category: "spiritual",
    img: "icons/magic/holy/barrier-shield-winged-blue.webp",
    description: "Святилище Торма, поддерживающее порядок, верность и защиту поселения.",
    levels: [
      GVM.v082Level(1, "Святилище Торма", { loyalty: 3, threat: -1 }, [
        GVM.v082Ability("torm-blessing", "Благословение Торма", "personal", "loyalty", 2, "treasury", 15, 1)
      ], 2, { treasury: 200 }, 2),
      GVM.v082Level(2, "Храм Торма", { loyalty: 6, threat: -2, military: 2 }, [
        GVM.v082Ability("oath-of-duty", "Клятва долга", "city", "military", 5, "loyalty", 2, 1)
      ], 4, { treasury: 440 }, 3),
      GVM.v082Level(3, "Большой храм Торма", { loyalty: 10, threat: -3, military: 5 }, [
        GVM.v082Ability("torms-ward", "Оберег Торма", "city", "threat", -6, "treasury", 90, 1)
      ], 6, { treasury: 920 }, 4)
    ]
  }
];

GVM.v082GetFacilityType = function v082GetFacilityType(facilityType) {
  return GVM.V082.FACILITY_TYPES_2024.find(type => type.facilityType === facilityType) || null;
};

GVM.v082GetBuildingPreset = function v082GetBuildingPreset(presetId) {
  return GVM.V082_BUILDING_PRESETS.find(preset => preset.presetId === presetId) || null;
};

GVM.v082FindPresetForBuilding = function v082FindPresetForBuilding(item) {
  const data = GVM.gvmData ? GVM.gvmData(item) : {};
  const name = String(item?.name || data.displayName || data.name || "").toLowerCase();

  if (data.presetId) {
    const byId = GVM.v082GetBuildingPreset(data.presetId);
    if (byId) return byId;
  }

  return GVM.V082_BUILDING_PRESETS.find(preset => {
    const display = preset.displayName.toLowerCase();
    return name === display || name.includes(display) || display.includes(name);
  }) || null;
};

GVM.v082PresetToBuildingData = function v082PresetToBuildingData(preset, existing = {}) {
  const currentLevel = Math.max(1, Number(existing.level || 1));
  const levelData = preset.levels.find(level => Number(level.level) === currentLevel) || preset.levels[0];

  return {
    ...existing,
    kind: GVM.KIND?.BUILDING || "building",
    presetId: preset.presetId,
    displayName: preset.displayName,
    facilityType: preset.facilityType,
    officialTypeLabel: preset.officialTypeLabel,
    developmentSubtype: preset.developmentSubtype,
    category: preset.category,
    description: preset.description,
    art: existing.art || preset.img,
    img: existing.img || preset.img,
    level: currentLevel,
    levels: foundry.utils.deepClone(preset.levels),
    workersRequired: Number(existing.workersRequired ?? levelData.workersRequired ?? 0),
    status: existing.status || "built",
    v082PresetVersion: 1,
    v082AdaptedAt: Date.now()
  };
};

GVM.v082AdaptBuildingsToPresets = async function v082AdaptBuildingsToPresets(actor) {
  if (!actor || !GVM.buildings || !GVM.gvmData) return;

  let checked = 0;
  let changed = 0;
  let skipped = 0;

  for (const item of GVM.buildings(actor)) {
    checked += 1;

    const data = foundry.utils.deepClone(GVM.gvmData(item));

    const oldName = String(item.name || data.displayName || "").toLowerCase();
    const oldPreset = String(data.presetId || "").toLowerCase();

    if (
      oldPreset === "prison-cells" ||
      oldName.includes("тюрем") ||
      oldName.includes("prison")
    ) {
      skipped += 1;
      data.archived = true;
      data.hidden = true;
      data.v082RemovedReason = "Removed from v0.8.2 building presets.";
      await item.setFlag(GVM.FLAG_SCOPE, "data", data);
      continue;
    }

    const preset = GVM.v082FindPresetForBuilding(item);

    if (!preset) {
      skipped += 1;
      continue;
    }

    const nextData = GVM.v082PresetToBuildingData(preset, data);
    await item.setFlag(GVM.FLAG_SCOPE, "data", nextData);

    if (item.name !== preset.displayName || item.img !== preset.img) {
      await item.update({
        name: preset.displayName,
        img: preset.img
      });
    }

    changed += 1;
  }

  ui.notifications.info(`Пресеты зданий v0.8.2: обновлено ${changed}, пропущено ${skipped}, проверено ${checked}.`);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Адаптация зданий v0.8.2",
      entries: [
        `Проверено зданий: ${checked}.`,
        `Обновлено по пресетам: ${changed}.`,
        `Пропущено или скрыто: ${skipped}.`,
        "Тюремные помещения исключены из актуального списка пресетов.",
        "Казармы наездных пауков теперь используют тип Menagerie / Зверинец."
      ]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.v082ResetSettlementSettings = async function v082ResetSettlementSettings(actor) {
  if (!actor) return;

  const backup = {
    settings: GVM.getSettings ? GVM.getSettings(actor) : {},
    resources: GVM.getResources ? GVM.getResources(actor) : {},
    at: Date.now()
  };

  const defaultSettings = foundry.utils.deepClone(GVM.DEFAULT_SETTINGS || {});
  const defaultResources = foundry.utils.deepClone(GVM.DEFAULT_RESOURCES || {});

  defaultSettings.cycle = 0;
  defaultSettings.journal = [];
  defaultSettings.reports = [];
  defaultSettings.v082LastSettingsResetBackup = backup;
  defaultSettings.v082LastSettingsResetBackupAt = Date.now();

  if (GVM.setSettings) await GVM.setSettings(actor, defaultSettings);
  if (GVM.setResources) await GVM.setResources(actor, defaultResources);

  ui.notifications.info("Настройки поселения сброшены до дефолтных значений.");

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Настройки поселения сброшены",
      entries: [
        "Цикл сброшен до 0.",
        "Ресурсы и настройки возвращены к дефолтным значениям.",
        "Перед сбросом создан backup в настройках поселения."
      ]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.v082OpenResetSettingsDialog = function v082OpenResetSettingsDialog(actor) {
  new Dialog({
    title: "Сбросить настройки поселения",
    content: `
      <form class="gvm-v082-dialog">
        <section class="gvm-v082-danger">
          <h2>Сбросить настройки поселения</h2>
          <p>Это сбросит настройки, ресурсы, цикл, журнал и отчёты до дефолтных значений. Здания и НИПы не будут удалены.</p>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Подтверждение</span>
          <input type="text" name="confirm" placeholder="Введите RESET">
        </label>
      </form>
    `,
    buttons: {
      reset: {
        label: "Сбросить",
        callback: async html => {
          const value = String(html.find("[name=confirm]").val() || "").trim();

          if (value !== "RESET") {
            ui.notifications.warn("Сброс отменён: нужно ввести RESET.");
            return;
          }

          await GVM.v082ResetSettlementSettings(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 660,
    height: "auto"
  }).render(true);
};

GVM.v082OpenBuildingPresetsDialog = function v082OpenBuildingPresetsDialog(actor) {
  const rows = GVM.V082_BUILDING_PRESETS.map(preset => {
    const type = GVM.v082GetFacilityType(preset.facilityType);
    return `
      <article class="gvm-v082-preset-row">
        <div>
          <strong>${GVM.escapeHtml(preset.displayName)}</strong>
          <span>${GVM.escapeHtml(preset.officialTypeLabel)} · ${GVM.escapeHtml(preset.developmentSubtype)}</span>
          <p>${GVM.escapeHtml(preset.description)}</p>
        </div>
        <div>
          <span class="gvm-v082-pill">${GVM.escapeHtml(type?.ruName || preset.facilityType)}</span>
          <span class="gvm-v082-pill">Уровни: ${preset.levels.length}</span>
        </div>
      </article>
    `;
  }).join("");

  const typeRows = GVM.V082.FACILITY_TYPES_2024.map(type => `
    <article class="gvm-v082-type-row">
      <strong>${GVM.escapeHtml(type.ruName)}</strong>
      <span>${GVM.escapeHtml(type.officialName)} · lvl ${type.unlockLevel}</span>
    </article>
  `).join("");

  new Dialog({
    title: "Пресеты зданий v0.8.2",
    content: `
      <form class="gvm-v082-dialog">
        <section class="gvm-v082-hero">
          <h2>Пресеты зданий</h2>
          <p>Комнаты используют официальный тип D&D 2024 как facilityType, а подтип помещения задаёт ветку развития.</p>
        </section>

        <section class="gvm-v082-section">
          <h3>Комнаты поселения</h3>
          <div class="gvm-v082-preset-list">${rows}</div>
        </section>

        <section class="gvm-v082-section">
          <h3>Типы помещений D&D 2024</h3>
          <div class="gvm-v082-type-grid">${typeRows}</div>
        </section>
      </form>
    `,
    buttons: {
      adapt: {
        label: "Адаптировать здания",
        callback: async () => {
          await GVM.v082AdaptBuildingsToPresets(actor);
        }
      },
      close: {
        label: "Закрыть"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 920,
    height: "auto"
  }).render(true);
};

GVM.v082InjectSheetButtons = function v082InjectSheetButtons(actor, root = document) {
  if (!actor) return;

  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  if (!board) return;

  let toolbar = board.querySelector("[data-gvm-v082-toolbar]");

  if (!toolbar) {
    toolbar = document.createElement("section");
    toolbar.className = "gvm-v082-toolbar";
    toolbar.dataset.gvmV082Toolbar = "1";

    const target =
      board.querySelector(".gvm-v080-settings-entry") ||
      board.querySelector("[data-gvm-v080-overview-panel]") ||
      board.querySelector("header") ||
      board.firstElementChild ||
      board;

    if (target && target.insertAdjacentElement) {
      target.insertAdjacentElement("afterend", toolbar);
    } else {
      board.prepend(toolbar);
    }
  }

  if (!toolbar.querySelector("[data-gvm-v082-action='presets']")) {
    const presets = document.createElement("button");
    presets.type = "button";
    presets.className = "gvm-control secondary";
    presets.dataset.gvmV082Action = "presets";
    presets.textContent = "Пресеты зданий";
    presets.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v082OpenBuildingPresetsDialog(actor);
    });
    toolbar.appendChild(presets);
  }

  if (!toolbar.querySelector("[data-gvm-v082-action='adapt']")) {
    const adapt = document.createElement("button");
    adapt.type = "button";
    adapt.className = "gvm-control secondary";
    adapt.dataset.gvmV082Action = "adapt";
    adapt.textContent = "Адаптировать здания v0.8.2";
    adapt.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await GVM.v082AdaptBuildingsToPresets(actor);
    });
    toolbar.appendChild(adapt);
  }

  if (!toolbar.querySelector("[data-gvm-v082-action='reset-settings']")) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "gvm-control danger";
    reset.dataset.gvmV082Action = "reset-settings";
    reset.textContent = "Сбросить настройки";
    reset.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v082OpenResetSettingsDialog(actor);
    });
    toolbar.appendChild(reset);
  }
};

GVM.originalRefreshSettlementV082BuildingPresets =
  GVM.originalRefreshSettlementV082BuildingPresets || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV082BuildingPresets(actor) {
  const result = GVM.originalRefreshSettlementV082BuildingPresets(actor);

  setTimeout(() => {
    GVM.v082InjectSheetButtons(actor, document);
  }, 360);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV082BuildingPresets) {
  GVM.originalRenderSettlementPanelV082BuildingPresets = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV082BuildingPresets(actor, panel) {
    await GVM.originalRenderSettlementPanelV082BuildingPresets(actor, panel);
    GVM.v082InjectSheetButtons(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8.2 Facility Types + Building Presets loaded");
});
