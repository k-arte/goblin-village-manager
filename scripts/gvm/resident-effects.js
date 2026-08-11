GVM.getActiveResidents = function getActiveResidents(actor) {
  return (GVM.getKeyResidents ? GVM.getKeyResidents(actor) : [])
    .filter(resident => resident.active !== false && resident.status !== "absent");
};

GVM.getAssignedResidents = function getAssignedResidents(actor, buildingItemId) {
  return GVM.getActiveResidents(actor)
    .filter(resident => resident.assignedBuildingId === buildingItemId);
};

GVM.getResidentSalaryEffects = function getResidentSalaryEffects(actor) {
  return GVM.getActiveResidents(actor)
    .filter(resident => resident.salary && Number(resident.salary.value || 0) !== 0)
    .map(resident => ({
      resident,
      stat: resident.salary.stat || "treasury",
      value: Number(resident.salary.value || 0),
      timing: resident.salary.timing || "perCycle",
      label: `Жалование: ${resident.professionLabel || resident.professionId || "ключевой житель"}`
    }));
};

GVM.getResidentModifiers = function getResidentModifiers(actor, buildingItem = null) {
  const residents = buildingItem
    ? GVM.getAssignedResidents(actor, buildingItem.id)
    : GVM.getActiveResidents(actor);

  return residents.flatMap(resident => {
    return (resident.modifiers || []).map(modifier => ({
      resident,
      id: modifier.id || foundry.utils.randomID(),
      label: modifier.label || "Модификатор",
      target: modifier.target || "settlement",
      stat: modifier.stat || "treasury",
      mode: modifier.mode || "add",
      value: Number(modifier.value || 0),
      timing: modifier.timing || "perCycle"
    }));
  });
};

GVM.applyModifierToValue = function applyModifierToValue(baseValue, modifier) {
  const mode = modifier.mode || "add";
  const value = Number(modifier.value || 0);

  if (mode === "multiply") return baseValue * value;
  if (mode === "subtract") return baseValue - value;
  if (mode === "set") return value;

  return baseValue + value;
};

GVM.applyResidentModifiersToEffectValue = function applyResidentModifiersToEffectValue(actor, buildingItem, stat, timing, baseValue) {
  let value = Number(baseValue || 0);
  const modifiers = GVM.getResidentModifiers(actor, buildingItem)
    .filter(modifier => {
      const targetOk = modifier.target === "assignedBuilding" || modifier.target === "specificBuilding";
      const statOk = modifier.stat === stat;
      const timingOk = modifier.timing === timing || modifier.timing === "any";
      return targetOk && statOk && timingOk;
    });

  for (const modifier of modifiers) {
    value = GVM.applyModifierToValue(value, modifier);
  }

  return value;
};

GVM.applySettlementResidentModifiersToDerived = function applySettlementResidentModifiersToDerived(actor, derived) {
  const modifiers = GVM.getResidentModifiers(actor)
    .filter(modifier => modifier.target === "settlement" && modifier.timing === "passive");

  for (const modifier of modifiers) {
    if (modifier.stat === "military") derived.military = GVM.applyModifierToValue(Number(derived.military || 0), modifier);
    else if (modifier.stat === "attractiveness") derived.attractiveness = GVM.applyModifierToValue(Number(derived.attractiveness || 0), modifier);
    else if (modifier.stat === "loyalty") derived.loyaltyPassive = GVM.applyModifierToValue(Number(derived.loyaltyPassive || 0), modifier);
    else if (modifier.stat === "threat") derived.threatPassive = GVM.applyModifierToValue(Number(derived.threatPassive || 0), modifier);
    else if (modifier.stat === "projectCapacity") derived.projectCapacity = GVM.applyModifierToValue(Number(derived.projectCapacity || 1), modifier);
    else if (modifier.stat === "foodCapacity") derived.foodCapacity = GVM.applyModifierToValue(Number(derived.foodCapacity || 250), modifier);
    else if (modifier.stat === "treasuryCapacity") derived.treasuryCapacity = GVM.applyModifierToValue(Number(derived.treasuryCapacity || 2000), modifier);
  }

  derived.military = Math.max(0, Math.round(Number(derived.military || 0)));
  derived.attractiveness = Math.round(Number(derived.attractiveness || 0));
  derived.loyaltyPassive = Math.round(Number(derived.loyaltyPassive || 0));
  derived.threatPassive = Math.round(Number(derived.threatPassive || 0));
  derived.projectCapacity = Math.max(1, Math.round(Number(derived.projectCapacity || 1)));
  derived.foodCapacity = Math.max(0, Math.round(Number(derived.foodCapacity || 250)));
  derived.treasuryCapacity = Math.max(0, Math.round(Number(derived.treasuryCapacity || 2000)));

  return derived;
};

GVM.originalCalculateDerivedV062Stage4 = GVM.originalCalculateDerivedV062Stage4 || GVM.calculateDerived;

GVM.calculateDerived = function calculateDerivedWithResidentModifiers(actor) {
  const resources = GVM.getResources(actor);

  let military = 0;
  let attractiveness = 0;
  let foodCapacity = 250;
  let treasuryCapacity = 2000;
  let loyaltyPassive = 0;
  let threatPassive = 0;
  let assignedWorkers = 0;
  let projectCapacity = 1;

  for (const item of GVM.buildings(actor)) {
    const data = GVM.gvmData(item);
    const operation = GVM.getBuildingOperationStatus ? GVM.getBuildingOperationStatus(actor, item) : { online: true };
    const efficiency = operation.online ? GVM.buildingEfficiency(data, item) : 0;

    if (["built", "damaged"].includes(data.status)) {
      assignedWorkers += GVM.getAssignedWorkerTotalForBuilding ? GVM.getAssignedWorkerTotalForBuilding(actor, item) : Number(data.workersAssigned || 0);
    }

    if (!operation.online) continue;

    for (const effect of data.effects || []) {
      if (effect.timing !== "passive") continue;

      let value = Math.round((Number(effect.value) || 0) * efficiency);
      value = Math.round(GVM.applyResidentModifiersToEffectValue(actor, item, effect.stat, "passive", value));

      if (effect.stat === "military") military += value;
      else if (effect.stat === "attractiveness") attractiveness += value;
      else if (effect.stat === "loyalty") loyaltyPassive += value;
      else if (effect.stat === "threat") threatPassive += value;
      else if (effect.stat === "foodCapacity") foodCapacity += value;
      else if (effect.stat === "treasuryCapacity") treasuryCapacity += value;
      else if (effect.stat === "projectCapacity") projectCapacity += value;
    }
  }

  for (const item of GVM.reforms(actor)) {
    const data = GVM.gvmData(item);
    if (!data.active) continue;

    for (const effect of data.effects || []) {
      if (effect.timing !== "passive") continue;

      const value = Number(effect.value) || 0;

      if (effect.stat === "military") military += value;
      else if (effect.stat === "attractiveness") attractiveness += value;
      else if (effect.stat === "loyalty") loyaltyPassive += value;
      else if (effect.stat === "threat") threatPassive += value;
      else if (effect.stat === "foodCapacity") foodCapacity += value;
      else if (effect.stat === "treasuryCapacity") treasuryCapacity += value;
      else if (effect.stat === "projectCapacity") projectCapacity += value;
    }
  }

  const senate = GVM.buildings(actor).find(item => {
    const itemName = item.name.toLowerCase();
    return itemName.includes("сенат") || itemName.includes("senate");
  });

  if (senate) {
    const senateData = GVM.gvmData(senate);
    if (senateData.status === "built") {
      projectCapacity = Math.max(projectCapacity, Number(senateData.level) || 1);
    }
  }

  let derived = {
    military,
    rawMilitary: military,
    militaryDamage: Number(resources.militaryDamage || 0),
    attractiveness,
    foodCapacity,
    treasuryCapacity,
    loyaltyPassive,
    threatPassive,
    assignedWorkers,
    freeWorkers: Math.max(0, Number(resources.population || 0) - assignedWorkers),
    projectCapacity: Math.max(1, projectCapacity),
    activeOrders: GVM.activeOrders(actor).length
  };

  derived = GVM.applySettlementResidentModifiersToDerived(actor, derived);
  derived.rawMilitary = Number(derived.military || 0);
  derived.military = Math.max(0, Number(derived.military || 0) - Number(resources.militaryDamage || 0));

  return derived;
};

GVM.originalApplyBuildingCycleV062Stage4 = GVM.originalApplyBuildingCycleV062Stage4 || GVM.applyBuildingCycle;

GVM.applyBuildingCycle = function applyBuildingCycleWithResidentModifiers(actor, totals) {
  for (const item of GVM.buildings(actor)) {
    const data = GVM.gvmData(item);

    if (!["built", "damaged"].includes(data.status)) continue;

    const operation = GVM.getBuildingOperationStatus ? GVM.getBuildingOperationStatus(actor, item) : { online: true };
    const efficiency = operation.online ? GVM.buildingEfficiency(data, item) : 0;

    for (const upkeep of data.upkeep || []) {
      const timing = upkeep.timing || "perCycle";
      if (timing !== "perCycle") continue;

      let value = Number(upkeep.value || 0);
      value = Math.round(GVM.applyResidentModifiersToEffectValue(actor, item, upkeep.stat, "upkeep", value));
      totals[upkeep.stat] = (totals[upkeep.stat] || 0) + value;
    }

    if (!operation.online) continue;

    for (const effect of data.effects || []) {
      if (effect.timing !== "perCycle") continue;

      let value = Math.round((Number(effect.value) || 0) * efficiency);
      value = Math.round(GVM.applyResidentModifiersToEffectValue(actor, item, effect.stat, "perCycle", value));

      totals[effect.stat] = (totals[effect.stat] || 0) + value;
    }

    if (data.random === "casino") {
      const roll = GVM.d(100);
      let value = 0;

      if (roll <= 20) value = -8;
      else if (roll <= 80) value = GVM.d(8);
      else value = 10 + GVM.d(20);

      value = Math.round(value * efficiency * Math.max(1, data.level || 1));
      value = Math.round(GVM.applyResidentModifiersToEffectValue(actor, item, "treasury", "perCycle", value));

      totals.treasury = (totals.treasury || 0) + value;
    }

    if (data.random === "auction") {
      const roll = GVM.d(100);
      let value = roll >= 85 ? 20 + GVM.d(20) : GVM.d(6);

      value = Math.round(value * efficiency);
      value = Math.round(GVM.applyResidentModifiersToEffectValue(actor, item, "treasury", "perCycle", value));

      totals.treasury = (totals.treasury || 0) + value;
    }
  }

  for (const salary of GVM.getResidentSalaryEffects(actor)) {
    if (salary.timing !== "perCycle") continue;
    totals[salary.stat] = (totals[salary.stat] || 0) + salary.value;
  }
};
