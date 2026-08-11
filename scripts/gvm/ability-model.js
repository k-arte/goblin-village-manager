GVM.ABILITY_MODE = {
  ADD: "add",
  REPLACE: "replace",
  UPGRADE: "upgrade",
  DISABLE: "disable"
};

GVM.ABILITY_ACTION_TYPE = {
  INSTANT: "instant",
  MINOR: "minor",
  CITY: "city",
  REWARD: "rewardItem",
  ACTIVE_EFFECT: "activeEffect",
  MANUAL: "manual"
};

GVM.slugify = function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || foundry.utils.randomID();
};

GVM.normalizeAbility = function normalizeAbility(raw = {}, source = {}) {
  const label = raw.label || raw.name || "Способность";

  return {
    id: raw.id || `${GVM.slugify(label)}-${foundry.utils.randomID(5)}`,
    label,
    description: raw.description || raw.text || "",
    mode: raw.mode || raw.abilityMode || GVM.ABILITY_MODE.ADD,
    replacesAbilityId: raw.replacesAbilityId || raw.replaceAbilityId || null,
    upgradesAbilityId: raw.upgradesAbilityId || raw.upgradeAbilityId || null,
    disablesAbilityId: raw.disablesAbilityId || raw.disableAbilityId || null,

    source: {
      type: source.type || raw.source?.type || "unknown",
      buildingItemId: source.buildingItemId || raw.source?.buildingItemId || null,
      buildingName: source.buildingName || raw.source?.buildingName || null,
      residentId: source.residentId || raw.source?.residentId || null,
      residentName: source.residentName || raw.source?.residentName || null,
      actorUuid: source.actorUuid || raw.source?.actorUuid || null,
      requiredLevel: source.requiredLevel ?? raw.source?.requiredLevel ?? null,
      img: source.img || raw.source?.img || null
    },

    action: {
      type: raw.action?.type || raw.type || raw.orderType || GVM.ABILITY_ACTION_TYPE.INSTANT,
      orderType: raw.action?.orderType || raw.orderType || raw.type || GVM.ABILITY_ACTION_TYPE.INSTANT,
      durationCycles: Number(raw.action?.durationCycles ?? raw.durationCycles ?? raw.duration ?? 0),
      cost: raw.action?.cost || raw.cost || { stat: "treasury", value: 0 }
    },

    result: raw.result || {
      type: raw.reward ? GVM.ABILITY_ACTION_TYPE.REWARD : GVM.ABILITY_ACTION_TYPE.MANUAL,
      reward: raw.reward || null,
      text: raw.resultText || raw.description || ""
    },

    requirements: raw.requirements || []
  };
};

GVM.mergeAbilityUpgrade = function mergeAbilityUpgrade(base, upgrade) {
  return foundry.utils.mergeObject(GVM.clone(base), {
    label: upgrade.label || base.label,
    description: upgrade.description || base.description,
    source: upgrade.source || base.source,
    action: foundry.utils.mergeObject(base.action || {}, upgrade.action || {}, { inplace: false }),
    result: foundry.utils.mergeObject(base.result || {}, upgrade.result || {}, { inplace: false }),
    requirements: upgrade.requirements?.length ? upgrade.requirements : base.requirements
  }, {
    inplace: false,
    insertKeys: true,
    overwrite: true
  });
};

GVM.applyAbilityMode = function applyAbilityMode(map, ability) {
  const mode = ability.mode || GVM.ABILITY_MODE.ADD;

  if (mode === GVM.ABILITY_MODE.DISABLE) {
    const id = ability.disablesAbilityId || ability.replacesAbilityId || ability.upgradesAbilityId;
    if (id) map.delete(id);
    return;
  }

  if (mode === GVM.ABILITY_MODE.REPLACE) {
    const id = ability.replacesAbilityId;
    if (id) map.delete(id);
    map.set(ability.id, ability);
    return;
  }

  if (mode === GVM.ABILITY_MODE.UPGRADE) {
    const id = ability.upgradesAbilityId;
    if (id && map.has(id)) {
      map.set(id, GVM.mergeAbilityUpgrade(map.get(id), ability));
    } else {
      map.set(ability.id, ability);
    }
    return;
  }

  map.set(ability.id, ability);
};

GVM.getLevelEffectsMode = function getLevelEffectsMode(levelData) {
  return levelData.effectsMode || "replace";
};

GVM.getLevelAbilitiesMode = function getLevelAbilitiesMode(levelData) {
  return levelData.abilitiesMode || "add";
};

GVM.collectBuildingAbilities = function collectBuildingAbilities(actor, item) {
  const data = GVM.gvmData(item);
  const level = Number(data.level || 0);
  const map = new Map();

  for (const levelData of data.levels || []) {
    const levelNumber = Number(levelData.level || 0);
    if (levelNumber > level) continue;

    const source = {
      type: "building",
      buildingItemId: item.id,
      buildingName: item.name,
      requiredLevel: levelNumber,
      img: item.img || GVM.SAFE_ICON
    };

    const rawAbilities = [];

    for (const ability of levelData.abilities || []) {
      rawAbilities.push({
        ...ability,
        mode: ability.mode || ability.abilityMode || GVM.getLevelAbilitiesMode(levelData)
      });
    }

    for (const action of levelData.actions || []) {
      rawAbilities.push({
        ...action,
        mode: action.mode || action.abilityMode || GVM.getLevelAbilitiesMode(levelData)
      });
    }

    for (const service of levelData.services || []) {
      rawAbilities.push({
        id: `${GVM.slugify(item.name)}-${GVM.slugify(service)}-${levelNumber}`,
        label: service,
        description: service,
        type: GVM.ABILITY_ACTION_TYPE.INSTANT,
        orderType: GVM.ABILITY_ACTION_TYPE.INSTANT,
        cost: { stat: "treasury", value: 0 },
        mode: GVM.getLevelAbilitiesMode(levelData),
        result: {
          type: GVM.ABILITY_ACTION_TYPE.MANUAL,
          text: service
        }
      });
    }

    for (const raw of rawAbilities) {
      const ability = GVM.normalizeAbility(raw, source);
      GVM.applyAbilityMode(map, ability);
    }
  }

  return Array.from(map.values());
};

GVM.collectResidentAbilities = function collectResidentAbilities(actor) {
  const map = new Map();
  const residents = GVM.getActiveResidents ? GVM.getActiveResidents(actor) : [];

  for (const resident of residents) {
    const residentActor = GVM.getResidentActorSync(resident);
    const source = {
      type: resident.assignedBuildingId ? "residentInBuilding" : "resident",
      residentId: resident.id,
      residentName: residentActor?.name || resident.professionLabel || resident.professionId || "Ключевой житель",
      actorUuid: resident.actorUuid,
      buildingItemId: resident.assignedBuildingId || null,
      buildingName: resident.assignedBuildingId ? actor.items.get(resident.assignedBuildingId)?.name : null,
      img: residentActor?.img || GVM.SAFE_ICON
    };

    for (const raw of resident.abilities || resident.services || []) {
      const ability = GVM.normalizeAbility(raw, source);
      GVM.applyAbilityMode(map, ability);
    }
  }

  return Array.from(map.values());
};

GVM.checkAbilityRequirement = function checkAbilityRequirement(actor, ability, requirement) {
  if (GVM.checkOperationRequirement) {
    const fakeBuilding = ability.source?.buildingItemId ? actor.items.get(ability.source.buildingItemId) : null;
    return GVM.checkOperationRequirement(actor, fakeBuilding, requirement);
  }

  return true;
};

GVM.getAbilityAvailability = function getAbilityAvailability(actor, ability) {
  const checks = (ability.requirements || []).map(requirement => {
    const met = GVM.checkAbilityRequirement(actor, ability, requirement);
    return {
      requirement,
      met,
      label: GVM.getRequirementDisplayLabel ? GVM.getRequirementDisplayLabel(requirement) : requirement.label || requirement.value || requirement.type
    };
  });

  return {
    checks,
    allMet: checks.every(check => check.met),
    missing: checks.filter(check => !check.met)
  };
};

GVM.isAbilitySourceAvailable = function isAbilitySourceAvailable(actor, ability) {
  if (ability.source?.type === "building" || ability.source?.type === "residentInBuilding") {
    const item = actor.items.get(ability.source.buildingItemId);
    if (!item) return false;

    const data = GVM.gvmData(item);
    if (data.status !== "built" && data.status !== "damaged") return false;

    if (ability.source.requiredLevel && Number(data.level || 0) < Number(ability.source.requiredLevel)) return false;

    if (GVM.getBuildingOperationStatus) {
      const operation = GVM.getBuildingOperationStatus(actor, item);
      if (!operation.online) return false;
    }
  }

  return true;
};

GVM.collectAvailableAbilities = function collectAvailableAbilities(actor, options = {}) {
  const includeUnavailable = options.includeUnavailable ?? GVM.isGM();
  const all = [];

  for (const item of GVM.buildings(actor)) {
    all.push(...GVM.collectBuildingAbilities(actor, item));
  }

  all.push(...GVM.collectResidentAbilities(actor));

  return all.map(ability => {
    const sourceOk = GVM.isAbilitySourceAvailable(actor, ability);
    const req = GVM.getAbilityAvailability(actor, ability);
    return {
      ...ability,
      available: sourceOk && req.allMet,
      missing: sourceOk ? req.missing : [{ label: "Источник недоступен" }]
    };
  }).filter(ability => includeUnavailable || ability.available);
};

GVM.abilityCostLabel = function abilityCostLabel(ability) {
  const cost = ability.action?.cost || {};
  const value = Number(cost.value || 0);
  if (!value) return "бесплатно";
  return `${GVM.STAT_LABELS[cost.stat] || cost.stat} ${value}`;
};

GVM.abilitySourceLabel = function abilitySourceLabel(ability) {
  const source = ability.source || {};

  if (source.type === "residentInBuilding") {
    return `${source.residentName || "НИП"} в ${source.buildingName || "здании"}`;
  }

  if (source.type === "resident") {
    return source.residentName || "Ключевой житель";
  }

  if (source.type === "building") {
    const level = source.requiredLevel ? ` L${source.requiredLevel}` : "";
    return `${source.buildingName || "Здание"}${level}`;
  }

  return "Источник неизвестен";
};

GVM.executeAbility = async function executeAbility(actor, abilityId) {
  const abilities = GVM.collectAvailableAbilities(actor, { includeUnavailable: true });
  const ability = abilities.find(item => item.id === abilityId);

  if (!ability) {
    ui.notifications.warn("Способность не найдена.");
    return;
  }

  if (!ability.available) {
    const missing = (ability.missing || []).map(item => item.label).join(", ");
    ui.notifications.warn(`Способность недоступна: ${missing || "условия не выполнены"}.`);
    return;
  }

  const building = ability.source?.buildingItemId ? actor.items.get(ability.source.buildingItemId) : null;

  if (building && GVM.executeBuildingService) {
    const service = {
      id: ability.id,
      label: ability.label,
      description: ability.description,
      orderType: ability.action?.orderType || ability.action?.type || "instant",
      duration: ability.action?.durationCycles || 0,
      cost: ability.action?.cost || { stat: "treasury", value: 0 },
      source: ability.source,
      result: ability.result
    };

    if (service.orderType === "minor" || service.orderType === "city" || service.orderType === "instant") {
      if (service.orderType === "minor") {
        await GVM.startMinorOrder(actor, building, service);
      } else if (service.orderType === "city") {
        await GVM.createOrder(actor, {
          name: service.label,
          description: service.description || "",
          duration: Math.max(1, Number(service.duration || 1)),
          cost: service.cost ? [{ stat: service.cost.stat || "treasury", value: -Math.abs(Number(service.cost.value || 0)) }] : [],
          effectsOnComplete: [],
          targetItemId: building.id,
          action: "ability-city-order"
        });
      } else {
        await GVM.executeInstantService(actor, building, service);
      }

      return;
    }
  }

  ui.notifications.info(`${ability.label}: ability execution foundation triggered.`);
};
