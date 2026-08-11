GVM.buildingEfficiency = function buildingEfficiency(data) {
  if (!data) return 0;
  if (!["built", "damaged"].includes(data.status)) return 0;
  if (data.status === "damaged") return 0.5;

  const required = Math.max(1, Number(data.workersRequired) || 1);
  const assigned = Math.max(0, Math.min(required, Number(data.workersAssigned) || 0));

  return assigned / required;
};

GVM.activeOrders = function activeOrders(actor) {
  return GVM.orders(actor).filter(item => {
    const data = GVM.gvmData(item);
    return data.status === "active" || data.status === "upgrade" || data.status === "building";
  });
};

GVM.calculateDerived = function calculateDerived(actor) {
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
    const efficiency = GVM.buildingEfficiency(data);

    if (["built", "damaged"].includes(data.status)) {
      assignedWorkers += Math.min(Number(data.workersAssigned) || 0, Number(data.workersRequired) || 0);
    }

    for (const effect of data.effects || []) {
      if (effect.timing !== "passive") continue;

      const value = Math.round((Number(effect.value) || 0) * efficiency);

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

  for (const item of GVM.bonuses(actor)) {
    const data = GVM.gvmData(item);
    if (!data.active) continue;

    for (const effect of data.effects || []) {
      if (effect.timing !== "passive") continue;

      const value = Number(effect.value) || 0;

      if (effect.stat === "military") military += value;
      else if (effect.stat === "attractiveness") attractiveness += value;
      else if (effect.stat === "loyalty") loyaltyPassive += value;
      else if (effect.stat === "threat") threatPassive += value;
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

  return {
    military,
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
};

GVM.canPay = function canPay(actor, cost = []) {
  const resources = GVM.getResources(actor);

  for (const effect of cost) {
    const value = Number(effect.value) || 0;
    if (value >= 0) continue;

    const have = Number(resources[effect.stat] || 0);
    if (have < Math.abs(value)) return false;
  }

  return true;
};

GVM.payCost = async function payCost(actor, cost = []) {
  const resources = GVM.getResources(actor);

  for (const effect of cost) {
    GVM.addResource(resources, effect.stat, effect.value);
  }

  await GVM.setResources(actor, resources);
};

GVM.createOrder = async function createOrder(actor, options = {}) {
  const derived = GVM.calculateDerived(actor);

  if (GVM.activeOrders(actor).length >= derived.projectCapacity) {
    ui.notifications.warn(`Лимит проектов: ${GVM.activeOrders(actor).length} / ${derived.projectCapacity}.`);
    return null;
  }

  const data = {
    kind: GVM.KIND.ORDER,
    status: "active",
    duration: Math.max(1, Number(options.duration) || 1),
    progress: 0,
    description: options.description || "",
    cost: options.cost || [],
    effectsOnComplete: options.effectsOnComplete || [],
    targetItemId: options.targetItemId || null,
    action: options.action || "custom"
  };

  if (!GVM.canPay(actor, data.cost)) {
    ui.notifications.warn("Недостаточно ресурсов.");
    return null;
  }

  await GVM.payCost(actor, data.cost);

  const created = await GVM.createGvmItem(actor, options.name || "Новый приказ", data, {
    description: data.description
  });

  GVM.queueRefresh(actor);
  return created;
};

GVM.completeUpgrade = async function completeUpgrade(actor, orderItem) {
  const orderData = GVM.clone(GVM.gvmData(orderItem));
  const building = actor.items.get(orderData.targetItemId);

  if (!building) return;

  const data = GVM.clone(GVM.gvmData(building));
  const next = Number(data.level || 0) + 1;
  const levelData = (data.levels || []).find(level => Number(level.level) === next);

  if (!levelData) return;

  data.level = next;
  data.status = "built";
  data.workersRequired = Number(levelData.workersRequired ?? data.workersRequired ?? 0);
  data.upkeep = GVM.clone(levelData.upkeep || data.upkeep || []);
  data.effects = GVM.clone(levelData.effects || data.effects || []);
  data.services = Array.from(new Set([...(data.services || []), ...(levelData.services || [])]));

  await building.setFlag(GVM.FLAG_SCOPE, "data", data);

  const description = GVM.itemDescriptionHtml(
    building.name,
    `${data.note || ""}\n\nСервисы: ${(data.services || []).join(", ") || "—"}`
  );

  await building.update({ "system.description.value": description });
};

GVM.applyBuildingCycle = function applyBuildingCycle(actor, totals) {
  for (const item of GVM.buildings(actor)) {
    const data = GVM.gvmData(item);

    if (!["built", "damaged"].includes(data.status)) continue;

    const efficiency = GVM.buildingEfficiency(data);

    for (const upkeep of data.upkeep || []) {
      const timing = upkeep.timing || "perCycle";
      if (timing !== "perCycle") continue;

      totals[upkeep.stat] = (totals[upkeep.stat] || 0) + Math.round((Number(upkeep.value) || 0) * Math.max(0.25, efficiency));
    }

    for (const effect of data.effects || []) {
      if (effect.timing !== "perCycle") continue;

      totals[effect.stat] = (totals[effect.stat] || 0) + Math.round((Number(effect.value) || 0) * efficiency);
    }

    if (data.random === "casino") {
      const roll = GVM.d(100);
      let value = 0;

      if (roll <= 20) value = -8;
      else if (roll <= 80) value = GVM.d(8);
      else value = 10 + GVM.d(20);

      totals.treasury = (totals.treasury || 0) + Math.round(value * efficiency * Math.max(1, data.level || 1));
    }

    if (data.random === "auction") {
      const roll = GVM.d(100);
      const value = roll >= 85 ? 20 + GVM.d(20) : GVM.d(6);
      totals.treasury = (totals.treasury || 0) + Math.round(value * efficiency);
    }
  }
};

GVM.applyReformCycle = async function applyReformCycle(actor, totals) {
  for (const item of GVM.reforms(actor)) {
    const data = GVM.clone(GVM.gvmData(item));
    if (!data.active) continue;

    data.tick = Number(data.tick || 0) + 1;
    const interval = Math.max(1, Number(data.interval || 1));

    if (data.tick >= interval) {
      data.tick = 0;

      for (const effect of data.effects || []) {
        if (effect.timing !== "everyInterval" && effect.timing !== "perCycle") continue;
        totals[effect.stat] = (totals[effect.stat] || 0) + (Number(effect.value) || 0);
      }
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.applyOrderCycle = async function applyOrderCycle(actor, resources, report) {
  for (const item of GVM.activeOrders(actor)) {
    const data = GVM.clone(GVM.gvmData(item));
    data.progress = Number(data.progress || 0) + 1;

    if (data.progress >= Number(data.duration || 1)) {
      if (data.action === "upgrade-building") {
        await GVM.completeUpgrade(actor, item);
      }

      for (const effect of data.effectsOnComplete || []) {
        GVM.addResource(resources, effect.stat, effect.value);
      }

      data.status = "completed";
      report.push(`Завершён приказ: ${item.name}.`);
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.applyBonusCycle = async function applyBonusCycle(actor, report) {
  for (const item of GVM.bonuses(actor)) {
    const data = GVM.clone(GVM.gvmData(item));

    if (!data.active) continue;

    data.remaining = Number(data.remaining || 0) - 1;

    if (data.remaining <= 0) {
      data.active = false;
      data.remaining = 0;
      report.push(`Бонус истёк: ${item.name}.`);
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.advanceCycle = async function advanceCycle(actor) {
  if (!GVM.isGM()) {
    ui.notifications.warn("Только GM может запускать цикл.");
    return;
  }

  await GVM.ensureSettlement(actor);

  const settings = GVM.getSettings(actor);
  const resources = GVM.getResources(actor);
  const before = GVM.clone(resources);
  const derivedBefore = GVM.calculateDerived(actor);
  const report = [];
  const totals = {};

  settings.cycle += 1;

  GVM.applyBuildingCycle(actor, totals);
  await GVM.applyReformCycle(actor, totals);

  totals.food = (totals.food || 0) - Number(resources.population || 0);

  for (const [stat, value] of Object.entries(totals)) {
    GVM.addResource(resources, stat, value);
  }

  await GVM.applyOrderCycle(actor, resources, report);
  await GVM.applyBonusCycle(actor, report);

  let derived = GVM.calculateDerived(actor);

  const threatGrowth = Math.max(1, Number(settings.attack.baseGrowth || 2) + GVM.d(3) - 1 + Number(derived.threatPassive || 0));
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

  derived = GVM.calculateDerived(actor);

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

    settings.attack.nextInCycles = 2 + GVM.d(3);
    settings.scouting.known = false;
  }

  derived = GVM.calculateDerived(actor);

  resources.loyalty = Math.max(0, Math.min(100, Number(resources.loyalty || 0) + Number(derived.loyaltyPassive || 0)));

  const loyaltyMigration = resources.loyalty >= 70 ? 2 : resources.loyalty >= 50 ? 0 : resources.loyalty >= 30 ? -2 : -5;
  const threatPenalty = resources.threat > derived.military ? -2 : 0;
  const migration = Math.round(Number(derived.attractiveness || 0) + loyaltyMigration + threatPenalty);

  resources.population = Math.max(0, Number(resources.population || 0) + migration);
  report.push(`Миграция: ${GVM.signed(migration)} жителей.`);

  derived = GVM.calculateDerived(actor);

  resources.food = Math.min(Number(resources.food || 0), Number(derived.foodCapacity || 250));
  resources.treasury = Math.min(Number(resources.treasury || 0), Number(derived.treasuryCapacity || 2000));

  const after = GVM.clone(resources);
  const derivedAfter = GVM.calculateDerived(actor);

  const summary = [
    `Цикл ${settings.cycle}`,
    `Население: ${before.population} → ${after.population}`,
    `Еда: ${before.food} → ${after.food}`,
    `Казна: ${before.treasury} → ${after.treasury}`,
    `Военная сила: ${derivedBefore.military} → ${derivedAfter.military}`,
    `Лояльность: ${before.loyalty} → ${after.loyalty}`,
    `Привлекательность: ${derivedBefore.attractiveness} → ${derivedAfter.attractiveness}`,
    `Проекты: ${derivedAfter.activeOrders} / ${derivedAfter.projectCapacity}`,
    ...report
  ];

  settings.reports.unshift({
    cycle: settings.cycle,
    title: `Отчёт за цикл ${settings.cycle}`,
    items: summary,
    time: Date.now()
  });

  settings.reports = settings.reports.slice(0, 40);

  await GVM.setResources(actor, resources);
  await GVM.setSettings(actor, settings);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: actor.name }),
    content: `<h2>${GVM.escapeHtml(actor.name)}: цикл ${settings.cycle}</h2><ul>${summary.filter(line => GVM.isGM() || !String(line).startsWith("Скрыто")).map(line => `<li>${GVM.escapeHtml(line)}</li>`).join("")}</ul>`
  });

  ui.notifications.info(`Поселение пересчитано: цикл ${settings.cycle}.`);
  GVM.queueRefresh(actor);
};
