GVM.getSettlementTier = function getSettlementTier(actor) {
  const settings = GVM.getSettings(actor);
  const level = Number(settings.playerCharacterLevel || 5);
  return Math.max(1, 1 + Math.floor(level / 4));
};

GVM.rollLootDie = function rollLootDie() {
  return GVM.d(6);
};

GVM.pushJournalEntry = function pushJournalEntry(settings, entry) {
  const journal = Array.isArray(settings.journal) ? settings.journal : [];

  const normalized = {
    cycle: Number(settings.cycle || 0),
    type: entry.type || "note",
    title: entry.title || "Событие поселения",
    entries: Array.isArray(entry.entries) ? entry.entries : [],
    changes: entry.changes || {},
    time: Date.now()
  };

  journal.unshift(normalized);
  settings.journal = journal.slice(0, 14);
};

GVM.describeChange = function describeChange(label, value) {
  const number = Number(value || 0);
  if (!number) return null;
  return `${label}: ${GVM.signed(number)}`;
};

GVM.getMilitaryDamage = function getMilitaryDamage(actor) {
  const resources = GVM.getResources(actor);
  return Number(resources.militaryDamage || 0);
};

GVM.originalCalculateDerivedV06Stage3 = GVM.originalCalculateDerivedV06Stage3 || GVM.calculateDerived;

GVM.calculateDerived = function calculateDerivedWithMilitaryDamage(actor) {
  const derived = GVM.originalCalculateDerivedV06Stage3(actor);
  const resources = GVM.getResources(actor);
  const damage = Number(resources.militaryDamage || 0);

  derived.rawMilitary = Number(derived.military || 0);
  derived.militaryDamage = damage;
  derived.military = Math.max(0, Number(derived.military || 0) - damage);

  return derived;
};

GVM.calculateSuccessfulDefenseLoot = function calculateSuccessfulDefenseLoot(actor, threatPower) {
  const tier = GVM.getSettlementTier(actor);
  return Math.ceil(Number(threatPower || 0) * 0.6 + GVM.rollLootDie() * tier);
};

GVM.calculateSuccessfulDefenseLosses = function calculateSuccessfulDefenseLosses(threatPower, defensePower) {
  const overwhelming = Number(defensePower || 0) >= Number(threatPower || 0) * 1.5;

  const populationLoss = overwhelming
    ? 0
    : Math.max(0, Math.floor(Math.max(0, Number(threatPower || 0) - Number(defensePower || 0) * 0.75) / 6));

  const militaryLoss = Number(threatPower || 0) <= 0
    ? 0
    : overwhelming
      ? Math.max(0, Math.floor(Number(threatPower || 0) / 12))
      : Math.max(1, Math.floor(Number(threatPower || 0) / 8));

  return {
    populationLoss,
    militaryLoss
  };
};

GVM.calculateFailedDefenseLosses = function calculateFailedDefenseLosses(threatPower, defensePower) {
  const gap = Math.max(1, Number(threatPower || 0) - Number(defensePower || 0));

  return {
    gap,
    populationLoss: Math.ceil(gap / 4),
    militaryLoss: Math.ceil(gap / 3),
    treasuryLoss: Math.ceil(gap * 4),
    loyaltyLoss: Math.min(25, 5 + gap)
  };
};

GVM.resolveAttackIfDue = function resolveAttackIfDue(actor, resources, settings, report) {
  settings.attack = settings.attack || {};
  settings.scouting = settings.scouting || {};

  if (Number(settings.attack.nextInCycles || 0) > 0) return;

  const derived = GVM.calculateDerived(actor);
  const threatPower = Number(resources.threat || 0);
  const defensePower = Number(derived.military || 0);

  if (threatPower <= 0) {
    settings.attack.nextInCycles = 2 + GVM.d(3);
    return;
  }

  if (defensePower >= threatPower) {
    const lootValue = GVM.calculateSuccessfulDefenseLoot(actor, threatPower);
    const losses = GVM.calculateSuccessfulDefenseLosses(threatPower, defensePower);
    const threatReduction = Math.max(5, Math.ceil(threatPower * 0.45));

    resources.treasury = Number(resources.treasury || 0) + lootValue;
    resources.population = Math.max(0, Number(resources.population || 0) - losses.populationLoss);
    resources.militaryDamage = Math.max(0, Number(resources.militaryDamage || 0) + losses.militaryLoss);
    resources.loyalty = Math.min(100, Number(resources.loyalty || 0) + 3);
    resources.threat = Math.max(5, Number(resources.threat || 0) - threatReduction);

    const attackLines = [
      "Произошло нападение. Поселение отбилось.",
      losses.populationLoss > 0
        ? `Погибло ${losses.populationLoss} жителей.`
        : "Жители не погибли.",
      losses.militaryLoss > 0
        ? `Военная мощь упала на ${losses.militaryLoss}.`
        : "Военная мощь не понесла заметных потерь.",
      `Продажа добычи с нападавших принесла ${lootValue} казны.`,
      `Угроза снижена на ${threatReduction}.`
    ];

    report.push(...attackLines);

    GVM.pushJournalEntry(settings, {
      type: "attack",
      title: "Нападение отбито",
      entries: attackLines,
      changes: {
        population: -losses.populationLoss,
        militaryDamage: losses.militaryLoss,
        treasury: lootValue,
        loyalty: 3,
        threat: -threatReduction
      }
    });
  }

  else {
    const losses = GVM.calculateFailedDefenseLosses(threatPower, defensePower);
    const threatReduction = Math.max(5, Math.ceil(threatPower * 0.25));

    resources.population = Math.max(0, Number(resources.population || 0) - losses.populationLoss);
    resources.militaryDamage = Math.max(0, Number(resources.militaryDamage || 0) + losses.militaryLoss);
    resources.treasury = Math.max(0, Number(resources.treasury || 0) - losses.treasuryLoss);
    resources.loyalty = Math.max(0, Number(resources.loyalty || 0) - losses.loyaltyLoss);
    resources.threat = Math.max(5, Number(resources.threat || 0) - threatReduction);

    const attackLines = [
      "Произошло нападение. Оборона не выдержала.",
      `Угроза превысила оборону на ${losses.gap}.`,
      `Погибло ${losses.populationLoss} жителей.`,
      `Военная мощь упала на ${losses.militaryLoss}.`,
      `Поселение потеряло ${losses.treasuryLoss} казны.`,
      `Лояльность снизилась на ${losses.loyaltyLoss}.`,
      `Угроза снижена на ${threatReduction}, но опасность остаётся.`
    ];

    report.push(...attackLines);

    GVM.pushJournalEntry(settings, {
      type: "attack",
      title: "Нападение нанесло ущерб",
      entries: attackLines,
      changes: {
        population: -losses.populationLoss,
        militaryDamage: losses.militaryLoss,
        treasury: -losses.treasuryLoss,
        loyalty: -losses.loyaltyLoss,
        threat: -threatReduction
      }
    });
  }

  settings.attack.nextInCycles = 2 + GVM.d(3);
  settings.scouting.known = false;
};

GVM.applyOrderCycleWithJournal = async function applyOrderCycleWithJournal(actor, resources, settings, report) {
  for (const item of GVM.activeOrders(actor)) {
    const data = GVM.clone(GVM.gvmData(item));
    data.progress = Number(data.progress || 0) + 1;

    if (data.progress >= Number(data.duration || 1)) {
      if (data.action === "upgrade-building") {
        const target = actor.items.get(data.targetItemId);
        const targetName = target?.name || "неизвестное здание";
        await GVM.completeUpgrade(actor, item);

        GVM.pushJournalEntry(settings, {
          type: "building",
          title: `Здание успешно расширено: ${targetName}`,
          entries: [
            `Проект "${item.name}" завершён.`,
            `Здание "${targetName}" было успешно построено или расширено.`
          ]
        });
      }

      for (const effect of data.effectsOnComplete || []) {
        GVM.addResource(resources, effect.stat, effect.value);
      }

      data.status = "completed";

      const line = `Завершён приказ: ${item.name}.`;
      report.push(line);

      GVM.pushJournalEntry(settings, {
        type: "order",
        title: `Приказ завершён: ${item.name}`,
        entries: [line],
        changes: Object.fromEntries((data.effectsOnComplete || []).map(effect => [effect.stat, effect.value]))
      });
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.advanceCycle = async function advanceCycleWithAttacksAndJournal(actor) {
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

  settings.cycle = Number(settings.cycle || 0) + 1;
  settings.attack = settings.attack || { nextInCycles: 3, baseGrowth: 2 };
  settings.journal = Array.isArray(settings.journal) ? settings.journal : [];

  GVM.applyBuildingCycle(actor, totals);
  await GVM.applyReformCycle(actor, totals);

  totals.food = (totals.food || 0) - Number(resources.population || 0);

  for (const [stat, value] of Object.entries(totals)) {
    GVM.addResource(resources, stat, value);
  }

  await GVM.applyOrderCycleWithJournal(actor, resources, settings, report);
  await GVM.applyBonusCycle(actor, report);

  let derived = GVM.calculateDerived(actor);

  const threatGrowth = Math.max(
    1,
    Number(settings.attack.baseGrowth || 2) + GVM.d(3) - 1 + Number(derived.threatPassive || 0)
  );

  resources.threat = Number(resources.threat || 0) + threatGrowth;
  settings.attack.nextInCycles = Number(settings.attack.nextInCycles || 1) - 1;

  report.push(`Скрыто для игроков: угроза выросла на ${threatGrowth}.`);

  if (resources.food < 0) {
    const shortage = Math.abs(Number(resources.food || 0));
    const loss = Math.ceil(shortage / 10);
    const loyaltyLoss = 10 + Math.ceil(shortage / 20);

    resources.population = Math.max(0, Number(resources.population || 0) - loss);
    resources.loyalty = Math.max(0, Math.min(100, Number(resources.loyalty || 0) - loyaltyLoss));
    resources.food = 0;

    const famineLines = [
      `Голод: потеряно жителей ${loss}.`,
      `Лояльность снизилась на ${loyaltyLoss}.`
    ];

    report.push(...famineLines);

    GVM.pushJournalEntry(settings, {
      type: "warning",
      title: "Голод в поселении",
      entries: famineLines,
      changes: {
        population: -loss,
        loyalty: -loyaltyLoss
      }
    });
  }

  GVM.resolveAttackIfDue(actor, resources, settings, report);

  derived = GVM.calculateDerived(actor);

  resources.loyalty = Math.max(
    0,
    Math.min(100, Number(resources.loyalty || 0) + Number(derived.loyaltyPassive || 0))
  );

  const loyaltyMigration = resources.loyalty >= 70 ? 2 : resources.loyalty >= 50 ? 0 : resources.loyalty >= 30 ? -2 : -5;
  const threatPenalty = Number(resources.threat || 0) > Number(derived.military || 0) ? -2 : 0;
  const migration = Math.round(Number(derived.attractiveness || 0) + loyaltyMigration + threatPenalty);

  resources.population = Math.max(0, Number(resources.population || 0) + migration);

  if (migration !== 0) {
    const migrationLine = migration > 0
      ? `Пришло ${migration} новых жителей.`
      : `Ушло ${Math.abs(migration)} жителей.`;

    report.push(migrationLine);

    GVM.pushJournalEntry(settings, {
      type: "migration",
      title: "Миграция жителей",
      entries: [migrationLine],
      changes: {
        population: migration
      }
    });
  } else {
    report.push("Миграция: новых жителей нет.");
  }

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
    `Угроза: ${before.threat} → ${after.threat}`,
    `Проекты: ${derivedAfter.activeOrders} / ${derivedAfter.projectCapacity}`,
    ...report
  ];

  settings.reports = Array.isArray(settings.reports) ? settings.reports : [];

  settings.reports.unshift({
    cycle: settings.cycle,
    title: `Отчёт за цикл ${settings.cycle}`,
    items: summary,
    time: Date.now()
  });

  settings.reports = settings.reports.slice(0, 40);
  settings.journal = (settings.journal || []).slice(0, 14);

  await GVM.setResources(actor, resources);
  await GVM.setSettings(actor, settings);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: actor.name }),
    content: `<h2>${GVM.escapeHtml(actor.name)}: цикл ${settings.cycle}</h2><ul>${summary.filter(line => GVM.isGM() || !String(line).startsWith("Скрыто")).map(line => `<li>${GVM.escapeHtml(line)}</li>`).join("")}</ul>`
  });

  ui.notifications.info(`Поселение пересчитано: цикл ${settings.cycle}.`);
  GVM.queueRefresh(actor);
};
