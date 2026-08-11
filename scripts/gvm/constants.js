window.GVM = window.GVM || {};

GVM.MODULE_ID = "goblin-village-manager";
GVM.FLAG_SCOPE = "goblin-village-manager";
GVM.SAFE_ICON = "icons/svg/item-bag.svg";

GVM.KIND = {
  BUILDING: "building",
  REFORM: "reform",
  ORDER: "order",
  BONUS: "bonus"
};

GVM.STAT_LABELS = {
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

GVM.BUILDING_TYPES = {
  food: "Еда",
  economy: "Экономика",
  military: "Военное",
  social: "Социальное",
  religion: "Религиозное",
  governance: "Управление",
  storage: "Складское",
  crafting: "Крафт",
  special: "Специальное"
};

GVM.DEFAULT_RESOURCES = {
  population: 40,
  food: 120,
  treasury: 500,
  loyalty: 60,
  threat: 18
};

GVM.DEFAULT_SETTINGS = {
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
