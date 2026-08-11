GVM.defaultBuildingTemplates = function defaultBuildingTemplates() {
  return [
    {
      name: "Комната сената",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "governance",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 4,
        upkeep: [
          { stat: "treasury", value: -3, timing: "perCycle" }
        ],
        effects: [
          { stat: "projectCapacity", value: 1, timing: "passive" },
          { stat: "loyalty", value: 1, timing: "passive" }
        ],
        levels: [
          {
            level: 2,
            title: "Расширить стол заседаний и нанять писцов",
            description: "Сенат получает больше места, писцов и управленческую память.",
            cost: [
              { stat: "treasury", value: -140 }
            ],
            duration: 2,
            workersRequired: 10,
            upkeep: [
              { stat: "treasury", value: -5, timing: "perCycle" }
            ],
            effects: [
              { stat: "projectCapacity", value: 2, timing: "passive" },
              { stat: "loyalty", value: 2, timing: "passive" }
            ],
            services: [
              "Дополнительный активный проект"
            ]
          }
        ],
        services: [
          "Лимит проектов равен уровню Сената"
        ],
        actions: [],
        note: "Уровень Сената определяет лимит активных проектов."
      }
    },
    {
      name: "Теплица",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "food",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 6,
        upkeep: [
          { stat: "treasury", value: -2, timing: "perCycle" }
        ],
        effects: [
          { stat: "food", value: 18, timing: "perCycle" }
        ],
        levels: [
          {
            level: 2,
            title: "Поставить новые грибные грядки",
            description: "Теплица расширяется под подземные культуры.",
            cost: [
              { stat: "treasury", value: -80 }
            ],
            duration: 1,
            workersRequired: 8,
            upkeep: [
              { stat: "treasury", value: -3, timing: "perCycle" }
            ],
            effects: [
              { stat: "food", value: 26, timing: "perCycle" }
            ],
            services: []
          }
        ],
        services: [],
        actions: [],
        note: "Основной источник еды."
      }
    },
    {
      name: "Казармы гоблинов",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "military",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 16,
        upkeep: [
          { stat: "treasury", value: -6, timing: "perCycle" },
          { stat: "food", value: -8, timing: "perCycle" }
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
            cost: [
              { stat: "treasury", value: -120 }
            ],
            duration: 2,
            workersRequired: 18,
            upkeep: [
              { stat: "treasury", value: -9, timing: "perCycle" },
              { stat: "food", value: -10, timing: "perCycle" }
            ],
            effects: [
              { stat: "military", value: 28, timing: "passive" },
              { stat: "food", value: 5, timing: "perCycle" }
            ],
            services: [
              "Выдать охрану каравану"
            ]
          }
        ],
        services: [
          "Патрули",
          "Фуражировка"
        ],
        actions: [],
        note: "Военная сила и добыча еды в округе."
      }
    },
    {
      name: "Казармы наездных пауков",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "military",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 16,
        workersAssigned: 10,
        upkeep: [
          { stat: "treasury", value: -8, timing: "perCycle" },
          { stat: "food", value: -10, timing: "perCycle" }
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
            cost: [
              { stat: "treasury", value: -160 }
            ],
            duration: 2,
            workersRequired: 20,
            upkeep: [
              { stat: "treasury", value: -12, timing: "perCycle" },
              { stat: "food", value: -14, timing: "perCycle" }
            ],
            effects: [
              { stat: "military", value: 35, timing: "passive" },
              { stat: "food", value: 4, timing: "perCycle" }
            ],
            services: [
              "Паучий эскорт"
            ]
          }
        ],
        services: [
          "Быстрые патрули",
          "Паучий эскорт"
        ],
        actions: [],
        note: "Сильная оборона, но дорогое содержание."
      }
    },
    {
      name: "Рынок",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "economy",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 8,
        workersAssigned: 8,
        upkeep: [
          { stat: "treasury", value: -2, timing: "perCycle" }
        ],
        effects: [
          { stat: "treasury", value: 14, timing: "perCycle" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [
          {
            level: 2,
            title: "Поставить постоянные торговые ряды",
            description: "Рынок перестаёт быть стихийным и получает постоянные лавки.",
            cost: [
              { stat: "treasury", value: -100 }
            ],
            duration: 2,
            workersRequired: 12,
            upkeep: [
              { stat: "treasury", value: -4, timing: "perCycle" }
            ],
            effects: [
              { stat: "treasury", value: 24, timing: "perCycle" },
              { stat: "attractiveness", value: 2, timing: "passive" }
            ],
            services: [
              "Покупка обычных товаров"
            ]
          }
        ],
        services: [
          "Покупка обычных товаров",
          "Продажа трофеев"
        ],
        actions: [],
        note: "Главная регулярная экономика."
      }
    },
    {
      name: "Храм Торма",
      data: {
        kind: GVM.KIND.BUILDING,
        type: "religion",
        status: "built",
        level: 1,
        maxLevel: 5,
        unlockLevel: 5,
        workersRequired: 6,
        workersAssigned: 3,
        upkeep: [
          { stat: "treasury", value: -4, timing: "perCycle" }
        ],
        effects: [
          { stat: "loyalty", value: 4, timing: "passive" },
          { stat: "attractiveness", value: 1, timing: "passive" }
        ],
        levels: [],
        services: [
          "Благословение",
          "Клятвы Торма"
        ],
        actions: [],
        note: "Лояльность, привлекательность и бонусы."
      }
    },
    {
      name: "Кузня",
      data: {
        kind: GVM.KIND.BUILDING,
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
            cost: [
              { stat: "treasury", value: -150 }
            ],
            duration: 1,
            workersRequired: 4,
            upkeep: [
              { stat: "treasury", value: -2, timing: "perCycle" }
            ],
            effects: [
              { stat: "treasury", value: 8, timing: "perCycle" }
            ],
            services: [
              "Ремонт металлических предметов",
              "Создание простых металлических предметов"
            ]
          },
          {
            level: 2,
            title: "Улучшить снаряжение кузни",
            description: "Закупить новые инструменты, меха, наковальни и формы.",
            cost: [
              { stat: "treasury", value: -300 }
            ],
            duration: 2,
            workersRequired: 6,
            upkeep: [
              { stat: "treasury", value: -5, timing: "perCycle" }
            ],
            effects: [
              { stat: "treasury", value: 14, timing: "perCycle" }
            ],
            services: [
              "Крафт брони",
              "Посеребрение оружия"
            ]
          }
        ],
        services: [],
        actions: [],
        note: "Здание с сервисами для игроков."
      }
    }
  ];
};

GVM.defaultReformTemplates = function defaultReformTemplates() {
  return [
    {
      name: "Вербовка жителей с округи",
      data: {
        kind: GVM.KIND.REFORM,
        active: false,
        interval: 1,
        tick: 0,
        description: "Посланники убеждают жителей соседних мест переселиться в деревню.",
        effects: [
          { stat: "attractiveness", value: 3, timing: "passive" },
          { stat: "treasury", value: -1, timing: "everyInterval" }
        ]
      }
    },
    {
      name: "Мобилизация",
      data: {
        kind: GVM.KIND.REFORM,
        active: false,
        interval: 1,
        tick: 0,
        description: "Часть жителей переводится в постоянную оборонную готовность.",
        effects: [
          { stat: "military", value: 10, timing: "passive" },
          { stat: "loyalty", value: -5, timing: "passive" },
          { stat: "treasury", value: -3, timing: "everyInterval" }
        ]
      }
    }
  ];
};

GVM.defaultBonusTemplates = function defaultBonusTemplates() {
  return [
    {
      name: "Благословение Торма",
      data: {
        kind: GVM.KIND.BONUS,
        source: "Храм Торма",
        active: false,
        remaining: 0,
        duration: 1,
        cost: [
          { stat: "treasury", value: -50 }
        ],
        effects: [
          { stat: "military", value: 10, timing: "passive" },
          { stat: "loyalty", value: 5, timing: "passive" }
        ],
        description: "Один активный бастионный бонус на 1 цикл."
      }
    }
  ];
};
