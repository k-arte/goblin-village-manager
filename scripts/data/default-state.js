import { BUILDING_STATUS } from "../core/constants.js";

export const DEFAULT_STATE = {
  version: 2,
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
    projectCapacity: 1
  },
  buildings: [],
  reforms: [],
  orders: [],
  projects: [],
  activeBonus: null,
  reports: [],
  scouting: {
    known: false,
    expiresCycle: 0
  },
  attack: {
    nextInCycles: 3,
    baseGrowth: 2
  }
};

export const EXAMPLE_BUILDING = {
  id: "smithy",
  name: "Кузня",
  status: BUILDING_STATUS.AVAILABLE,
  level: 0,
  maxLevel: 5,
  unlockLevel: 5,
  type: "crafting",
  workersRequired: 0,
  workersAssigned: 0,
  levels: [
    {
      level: 1,
      title: "Нанять мастера-дварфа из Глубоководья",
      cost: [{ stat: "treasury", mode: "add", value: -150 }],
      duration: 1,
      workersRequired: 4,
      effects: [
        { stat: "treasury", mode: "add", value: 8, timing: "perCycle" }
      ],
      services: ["repair-metal-items", "craft-simple-metal-items"]
    },
    {
      level: 2,
      title: "Улучшить снаряжение кузни",
      cost: [{ stat: "treasury", mode: "add", value: -300 }],
      duration: 2,
      workersRequired: 6,
      effects: [
        { stat: "treasury", mode: "add", value: 14, timing: "perCycle" }
      ],
      services: ["craft-armor", "silvering"]
    }
  ],
  modifiers: []
};
