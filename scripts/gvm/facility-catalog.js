GVM.FACILITY_CATEGORY = {
  BASIC: "basic",
  SPECIAL: "special"
};

GVM.REQUIREMENT_TYPES = {
  LEVEL: "level",
  NPC: "npc",
  BUILDING: "building",
  REFORM: "reform",
  STORY: "story"
};

GVM.getFacilityCatalog = function getFacilityCatalog() {
  return [
    {
      id: "basic-living-room",
      name: "Гостиная",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "social",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Общее помещение для встреч, приёма гостей и отдыха жителей.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Обустроить гостиную",
          description: "Поселение получает уютное общее помещение, где можно принимать гостей и снижать бытовое напряжение.",
          cost: [{ stat: "treasury", value: -60 }],
          duration: 1,
          workersRequired: 2,
          upkeep: [{ stat: "treasury", value: -1, timing: "perCycle" }],
          effects: [{ stat: "loyalty", value: 1, timing: "passive" }],
          services: ["Приём гостей", "Место переговоров"]
        },
        {
          level: 2,
          title: "Расширить гостиную до зала собраний",
          description: "Гостиная становится полноценным залом для встреч и обсуждений.",
          cost: [{ stat: "treasury", value: -130 }],
          duration: 2,
          workersRequired: 3,
          upkeep: [{ stat: "treasury", value: -2, timing: "perCycle" }],
          effects: [{ stat: "loyalty", value: 2, timing: "passive" }],
          services: ["Приём важных гостей", "Малые собрания"]
        }
      ]
    },
    {
      id: "basic-bedroom",
      name: "Личная комната",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "social",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Жилая комната для важных жителей, гостей или доверенных помощников.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Обустроить личную комнату",
          description: "Комната повышает комфорт важных жителей и гостей.",
          cost: [{ stat: "treasury", value: -50 }],
          duration: 1,
          workersRequired: 1,
          upkeep: [],
          effects: [{ stat: "loyalty", value: 1, timing: "passive" }],
          services: ["Безопасный отдых", "Место для NPC-гостя"]
        }
      ]
    },
    {
      id: "basic-kitchen",
      name: "Кухня",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "food",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Бытовая кухня, которая помогает эффективнее расходовать припасы.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Построить кухню",
          description: "Кухня снижает потери еды и улучшает быт жителей.",
          cost: [{ stat: "treasury", value: -70 }],
          duration: 1,
          workersRequired: 2,
          upkeep: [{ stat: "treasury", value: -1, timing: "perCycle" }],
          effects: [
            { stat: "food", value: 4, timing: "perCycle" },
            { stat: "loyalty", value: 1, timing: "passive" }
          ],
          services: ["Питание жителей", "Приготовление дорожных припасов"]
        }
      ]
    },
    {
      id: "basic-store-room",
      name: "Склад",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "storage",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Обычный склад для еды, инструментов и бытовых запасов.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Построить склад",
          description: "Поселение получает место для хранения запасов.",
          cost: [{ stat: "treasury", value: -80 }],
          duration: 1,
          workersRequired: 2,
          upkeep: [{ stat: "treasury", value: -1, timing: "perCycle" }],
          effects: [
            { stat: "foodCapacity", value: 100, timing: "passive" },
            { stat: "treasuryCapacity", value: 300, timing: "passive" }
          ],
          services: ["Хранение припасов"]
        }
      ]
    },
    {
      id: "basic-baths",
      name: "Бани",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "social",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Бани повышают гигиену, здоровье и довольство жителей.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Построить бани",
          description: "Жители получают место для мытья, отдыха и восстановления.",
          cost: [{ stat: "treasury", value: -100 }],
          duration: 1,
          workersRequired: 3,
          upkeep: [
            { stat: "treasury", value: -2, timing: "perCycle" },
            { stat: "food", value: -1, timing: "perCycle" }
          ],
          effects: [
            { stat: "loyalty", value: 2, timing: "passive" },
            { stat: "attractiveness", value: 1, timing: "passive" }
          ],
          services: ["Гигиена", "Отдых после похода"]
        }
      ]
    },
    {
      id: "basic-prison",
      name: "Тюремные помещения",
      category: GVM.FACILITY_CATEGORY.BASIC,
      type: "governance",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Простые камеры для удержания пленников и нарушителей порядка.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Обустроить камеры",
          description: "Поселение получает возможность удерживать пленных и нарушителей.",
          cost: [{ stat: "treasury", value: -90 }],
          duration: 1,
          workersRequired: 2,
          upkeep: [
            { stat: "treasury", value: -2, timing: "perCycle" },
            { stat: "food", value: -1, timing: "perCycle" }
          ],
          effects: [
            { stat: "military", value: 2, timing: "passive" },
            { stat: "loyalty", value: -1, timing: "passive" }
          ],
          services: ["Удержание пленников"]
        }
      ]
    },
    {
      id: "special-senate-room",
      name: "Комната сената",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "governance",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Административное сердце поселения. Чем выше уровень сената, тем больше активных проектов можно вести.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Создать комнату сената",
          description: "Появляется место для решений, приказов и управления поселением.",
          cost: [{ stat: "treasury", value: -100 }],
          duration: 1,
          workersRequired: 8,
          upkeep: [{ stat: "treasury", value: -3, timing: "perCycle" }],
          effects: [
            { stat: "projectCapacity", value: 1, timing: "passive" },
            { stat: "loyalty", value: 1, timing: "passive" }
          ],
          services: ["1 активный проект"]
        },
        {
          level: 2,
          title: "Расширить стол заседаний и нанять писцов",
          description: "Сенат получает писцов и может вести больше проектов одновременно.",
          cost: [{ stat: "treasury", value: -140 }],
          duration: 2,
          workersRequired: 10,
          upkeep: [{ stat: "treasury", value: -5, timing: "perCycle" }],
          effects: [
            { stat: "projectCapacity", value: 2, timing: "passive" },
            { stat: "loyalty", value: 2, timing: "passive" }
          ],
          services: ["2 активных проекта"]
        },
        {
          level: 3,
          title: "Создать административный архив",
          description: "Сенат ведёт учёт приказов, долгов и договоров.",
          cost: [{ stat: "treasury", value: -250 }],
          duration: 3,
          workersRequired: 12,
          upkeep: [{ stat: "treasury", value: -8, timing: "perCycle" }],
          effects: [
            { stat: "projectCapacity", value: 3, timing: "passive" },
            { stat: "attractiveness", value: 1, timing: "passive" }
          ],
          services: ["3 активных проекта", "Административная память"]
        }
      ]
    },
    {
      id: "special-goblin-barracks",
      name: "Казармы гоблинов",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "military",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Военная постройка для гарнизона, патрулей и защиты поселения.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Построить казармы гоблинов",
          description: "Гарнизон получает место для сна, тренировок и хранения оружия.",
          cost: [{ stat: "treasury", value: -120 }],
          duration: 2,
          workersRequired: 16,
          upkeep: [
            { stat: "treasury", value: -6, timing: "perCycle" },
            { stat: "food", value: -8, timing: "perCycle" }
          ],
          effects: [
            { stat: "military", value: 18, timing: "passive" },
            { stat: "food", value: 4, timing: "perCycle" }
          ],
          services: ["Патрули", "Фуражировка", "Защита поселения"]
        },
        {
          level: 2,
          title: "Раздать нормальное оружие ополчению",
          description: "Гарнизон получает копья, щиты и простую броню.",
          cost: [{ stat: "treasury", value: -160 }],
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
          services: ["Патрули", "Охрана каравана", "Фуражировка"]
        }
      ]
    },
    {
      id: "special-spider-barracks",
      name: "Казармы наездных пауков",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "military",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Военная постройка для мобильных патрулей и паучьей кавалерии.",
      requirements: [
        { type: GVM.REQUIREMENT_TYPES.BUILDING, value: "special-goblin-barracks", label: "Казармы гоблинов" }
      ],
      levels: [
        {
          level: 1,
          title: "Построить стойла наездных пауков",
          description: "Пауки получают загоны, корм и места для дрессировки.",
          cost: [{ stat: "treasury", value: -180 }],
          duration: 2,
          workersRequired: 16,
          upkeep: [
            { stat: "treasury", value: -8, timing: "perCycle" },
            { stat: "food", value: -10, timing: "perCycle" }
          ],
          effects: [
            { stat: "military", value: 22, timing: "passive" },
            { stat: "food", value: 3, timing: "perCycle" }
          ],
          services: ["Быстрые патрули", "Паучий эскорт"]
        }
      ]
    },
    {
      id: "special-gaming-hall",
      name: "Игральный дом",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "economy",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Игральный дом приносит доход и посетителей, но может снижать порядок.",
      requirements: [
        { type: GVM.REQUIREMENT_TYPES.LEVEL, value: 9, label: "Уровень партии 9+" }
      ],
      levels: [
        {
          level: 1,
          title: "Открыть игральный дом",
          description: "Посетители несут деньги, но азарт создаёт напряжение.",
          cost: [{ stat: "treasury", value: -250 }],
          duration: 2,
          workersRequired: 8,
          upkeep: [{ stat: "treasury", value: -4, timing: "perCycle" }],
          effects: [
            { stat: "treasury", value: 18, timing: "perCycle" },
            { stat: "attractiveness", value: 2, timing: "passive" },
            { stat: "loyalty", value: -1, timing: "passive" }
          ],
          services: ["Азартные игры", "Слухи посетителей"]
        }
      ],
      random: "casino"
    },
    {
      id: "special-greenhouse",
      name: "Теплица",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "food",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Стабильный источник еды, грибов, трав и алхимических растений.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Построить теплицу",
          description: "Теплица выращивает пищу и простые травы.",
          cost: [{ stat: "treasury", value: -100 }],
          duration: 1,
          workersRequired: 6,
          upkeep: [{ stat: "treasury", value: -2, timing: "perCycle" }],
          effects: [{ stat: "food", value: 18, timing: "perCycle" }],
          services: ["Пища", "Травы", "Грибные грядки"]
        },
        {
          level: 2,
          title: "Поставить новые грибные грядки",
          description: "Теплица расширяется под подземные культуры.",
          cost: [{ stat: "treasury", value: -120 }],
          duration: 1,
          workersRequired: 8,
          upkeep: [{ stat: "treasury", value: -3, timing: "perCycle" }],
          effects: [{ stat: "food", value: 28, timing: "perCycle" }],
          services: ["Пища", "Редкие грибы", "Травы"]
        }
      ]
    },
    {
      id: "special-smithy",
      name: "Кузня",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "crafting",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Кузня даёт поселению ремонт, ремесло, вооружение и позднее крафт брони.",
      requirements: [
        { type: "profession", value: "smith", label: "Кузнец или мастер-ремесленник" }
      ],
      levels: [
        {
          level: 1,
          title: "Нанять мастера-дварфа из Глубоководья",
          description: "В деревню приезжает мастер, способный организовать настоящую кузню.",
          cost: [{ stat: "treasury", value: -150 }],
          duration: 1,
          workersRequired: 4,
          upkeep: [{ stat: "treasury", value: -2, timing: "perCycle" }],
          effects: [{ stat: "treasury", value: 8, timing: "perCycle" }],
          services: ["Ремонт металлических предметов", "Создание простых металлических предметов"]
        },
        {
          level: 2,
          title: "Улучшить снаряжение кузни",
          description: "Закупить новые инструменты, меха, наковальни и формы.",
          cost: [{ stat: "treasury", value: -300 }],
          duration: 2,
          workersRequired: 6,
          upkeep: [{ stat: "treasury", value: -5, timing: "perCycle" }],
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
          upkeep: [{ stat: "treasury", value: -8, timing: "perCycle" }],
          effects: [{ stat: "treasury", value: 22, timing: "perCycle" }],
          services: ["Улучшенный крафт оружия", "Стабильное посеребрение"]
        }
      ]
    },
    {
      id: "special-temple-torm",
      name: "Храм Торма",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "religion",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Храм укрепляет лояльность, принимает клятвы и даёт религиозные услуги.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Освятить храм Торма",
          description: "В поселении появляется место для молитв, клятв и благословений.",
          cost: [{ stat: "treasury", value: -150 }],
          duration: 2,
          workersRequired: 6,
          upkeep: [{ stat: "treasury", value: -4, timing: "perCycle" }],
          effects: [
            { stat: "loyalty", value: 4, timing: "passive" },
            { stat: "attractiveness", value: 1, timing: "passive" }
          ],
          services: ["Благословение", "Клятвы Торма", "Отпевание"]
        }
      ]
    },
    {
      id: "special-market",
      name: "Рынок",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "economy",
      img: GVM.SAFE_ICON,
      defaultStarting: true,
      description: "Рынок создаёт регулярный доход и позволяет продавать трофеи.",
      requirements: [],
      levels: [
        {
          level: 1,
          title: "Открыть рынок",
          description: "Торговцы и жители получают место для обмена товарами.",
          cost: [{ stat: "treasury", value: -100 }],
          duration: 1,
          workersRequired: 8,
          upkeep: [{ stat: "treasury", value: -2, timing: "perCycle" }],
          effects: [
            { stat: "treasury", value: 14, timing: "perCycle" },
            { stat: "attractiveness", value: 1, timing: "passive" }
          ],
          services: ["Покупка обычных товаров", "Продажа трофеев"]
        }
      ]
    },
    {
      id: "special-artifact-workshop",
      name: "Мастерская артефактов",
      category: GVM.FACILITY_CATEGORY.SPECIAL,
      type: "special",
      img: GVM.SAFE_ICON,
      defaultStarting: false,
      description: "Сильная редкая постройка для магических предметов и временных зачарований.",
      requirements: [
        { type: GVM.REQUIREMENT_TYPES.LEVEL, value: 9, label: "Уровень партии 9+" },
        { type: "profession", value: "artificer", label: "Артифисер" }
      ],
      levels: [
        {
          level: 1,
          title: "Нанять арканиста-ремесленника",
          description: "В поселении появляется специалист по магическим предметам.",
          cost: [{ stat: "treasury", value: -500 }],
          duration: 3,
          workersRequired: 12,
          upkeep: [
            { stat: "treasury", value: -15, timing: "perCycle" },
            { stat: "food", value: -6, timing: "perCycle" }
          ],
          effects: [
            { stat: "treasury", value: 30, timing: "perCycle" },
            { stat: "threat", value: 2, timing: "passive" }
          ],
          services: ["Временное зачарование", "Обереги поселения"]
        }
      ]
    }
  ];
};

GVM.getFacilityTemplateById = function getFacilityTemplateById(id) {
  return GVM.getFacilityCatalog().find(template => template.id === id) || null;
};

GVM.getKnownFacilityIds = function getKnownFacilityIds(actor) {
  return new Set(GVM.buildings(actor).map(item => {
    const data = GVM.gvmData(item);
    return data.facilityId || data.catalogId || item.name;
  }));
};

GVM.getBuildableFacilities = function getBuildableFacilities(actor, category) {
  const known = GVM.getKnownFacilityIds(actor);

  return GVM.getFacilityCatalog().filter(template => {
    if (category && template.category !== category) return false;
    if (known.has(template.id)) return false;
    return true;
  });
};

GVM.facilityTemplateToBuildingData = function facilityTemplateToBuildingData(template, options = {}) {
  const startBuilt = !!options.built;
  const levelData = template.levels?.[0] || {};

  const data = {
    kind: GVM.KIND.BUILDING,
    facilityId: template.id,
    catalogId: template.id,
    facilityCategory: template.category,
    isSpecialFacility: template.category === GVM.FACILITY_CATEGORY.SPECIAL,
    type: template.type || "special",
    status: startBuilt ? "built" : "available",
    level: startBuilt ? 1 : 0,
    maxLevel: Math.max(1, template.levels?.length || 1),
    unlockLevel: Number(template.unlockLevel || 5),
    workersRequired: startBuilt ? Number(levelData.workersRequired || 0) : 0,
    workersAssigned: startBuilt ? Number(levelData.workersRequired || 0) : 0,
    requirements: GVM.clone(template.requirements || []),
    upkeep: startBuilt ? GVM.clone(levelData.upkeep || []) : [],
    effects: startBuilt ? GVM.clone(levelData.effects || []) : [],
    levels: GVM.clone(template.levels || []),
    services: startBuilt ? GVM.clone(levelData.services || []) : [],
    actions: [],
    boons: [],
    note: template.description || ""
  };

  if (template.random) data.random = template.random;

  return data;
};

GVM.defaultBuildingTemplates = function defaultBuildingTemplates() {
  return GVM.getFacilityCatalog()
    .filter(template => template.defaultStarting)
    .map(template => ({
      name: template.name,
      data: GVM.facilityTemplateToBuildingData(template, { built: true })
    }));
};
