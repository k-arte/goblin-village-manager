GVM.getActiveSettlementEffects = function getActiveSettlementEffects(actor) {
  const settings = GVM.getSettings(actor);
  return Array.isArray(settings.activeEffects) ? settings.activeEffects : [];
};

GVM.setActiveSettlementEffects = async function setActiveSettlementEffects(actor, effects) {
  const settings = GVM.getSettings(actor);
  settings.activeEffects = effects;
  await GVM.setSettings(actor, settings);
};

GVM.getDefaultTargetActor = function getDefaultTargetActor(actor) {
  const controlled = canvas?.tokens?.controlled?.[0]?.actor;
  if (controlled) return controlled;

  if (game.user?.character) return game.user.character;

  return actor;
};

GVM.addSettlementActiveEffect = async function addSettlementActiveEffect(actor, effect) {
  const settings = GVM.getSettings(actor);
  const effects = Array.isArray(settings.activeEffects) ? settings.activeEffects : [];

  effects.push({
    id: effect.id || foundry.utils.randomID(),
    label: effect.label || "Активный эффект",
    source: effect.source || {},
    targetActorUuid: effect.targetActorUuid || null,
    targetName: effect.targetName || "Поселение",
    remainingCycles: Math.max(1, Number(effect.remainingCycles || effect.durationCycles || 1)),
    description: effect.description || "",
    createdAt: Date.now()
  });

  settings.activeEffects = effects;
  await GVM.setSettings(actor, settings);
};

GVM.tickSettlementActiveEffects = async function tickSettlementActiveEffects(actor) {
  const settings = GVM.getSettings(actor);
  const effects = Array.isArray(settings.activeEffects) ? settings.activeEffects : [];

  const next = [];
  const expired = [];

  for (const effect of effects) {
    effect.remainingCycles = Number(effect.remainingCycles || 0) - 1;

    if (effect.remainingCycles > 0) next.push(effect);
    else expired.push(effect);
  }

  settings.activeEffects = next;
  await GVM.setSettings(actor, settings);

  if (expired.length && GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "service",
      title: "Истекли активные эффекты",
      entries: expired.map(effect => `${effect.label} на ${effect.targetName || "цели"} истёк.`)
    });
  }

  return {
    active: next,
    expired
  };
};

GVM.reportActiveSettlementEffects = function reportActiveSettlementEffects(actor) {
  const effects = GVM.getActiveSettlementEffects(actor);

  if (!effects.length) return;

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name }),
    content: `
      <h2>Активные эффекты поселения</h2>
      <ul>
        ${effects.map(effect => `
          <li>
            <b>${GVM.escapeHtml(effect.label)}</b>
            ${effect.targetName ? `на ${GVM.escapeHtml(effect.targetName)}` : ""}
            — осталось ${Number(effect.remainingCycles || 0)} цикл(а).
          </li>
        `).join("")}
      </ul>
    `
  });
};

GVM.grantRewardItem = async function grantRewardItem(actor, reward) {
  if (!reward?.uuid) {
    ui.notifications.warn("Reward Item не назначен.");
    return null;
  }

  let document = null;

  try {
    document = await fromUuid(reward.uuid);
  } catch (err) {
    console.warn(`${GVM.MODULE_ID} | Failed to resolve reward`, err);
  }

  if (!document || document.documentName !== "Item") {
    ui.notifications.warn("Не удалось найти Reward Item.");
    return null;
  }

  const target = GVM.getDefaultTargetActor(actor);
  const data = document.toObject();
  delete data._id;

  if (data.system && Object.prototype.hasOwnProperty.call(data.system, "quantity")) {
    data.system.quantity = Math.max(1, Number(reward.quantity || 1));
  }

  const created = await target.createEmbeddedDocuments("Item", [data]);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name }),
    content: `<p>Выдан предмет: <b>${GVM.escapeHtml(document.name)}</b> → ${GVM.escapeHtml(target.name)}.</p>`
  });

  return created?.[0] || null;
};

GVM.completeAbilityResult = async function completeAbilityResult(actor, ability, result = null) {
  const finalResult = result || ability.result || {};

  if (finalResult.reward) {
    await GVM.grantRewardItem(actor, finalResult.reward);
  }

  if (finalResult.type === "activeEffect" || finalResult.effect) {
    const target = GVM.getDefaultTargetActor(actor);
    const effect = finalResult.effect || {};

    await GVM.addSettlementActiveEffect(actor, {
      label: effect.label || ability.label,
      source: ability.source,
      targetActorUuid: target.uuid,
      targetName: target.name,
      durationCycles: effect.durationCycles || ability.action?.durationCycles || 1,
      description: effect.description || ability.description || ""
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name }),
      content: `<p>Активный эффект: <b>${GVM.escapeHtml(effect.label || ability.label)}</b> на ${GVM.escapeHtml(target.name)}.</p>`
    });
  }
};

GVM.originalExecuteAbilityV07 = GVM.originalExecuteAbilityV07 || GVM.executeAbility;

GVM.executeAbility = async function executeAbilityV07(actor, abilityId) {
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

  const cost = ability.action?.cost || {};
  const costValue = Number(cost.value || 0);

  if (costValue > 0) {
    const resources = GVM.getResources(actor);
    const stat = cost.stat || "treasury";

    if (Number(resources[stat] || 0) < costValue) {
      ui.notifications.warn(`Недостаточно ресурса: ${GVM.STAT_LABELS[stat] || stat}. Нужно ${costValue}.`);
      return;
    }

    resources[stat] = Number(resources[stat] || 0) - costValue;
    await GVM.setResources(actor, resources);
  }

  const building = ability.source?.buildingItemId ? actor.items.get(ability.source.buildingItemId) : null;
  const orderType = ability.action?.orderType || ability.action?.type || "instant";

  if (building && orderType === "minor" && GVM.startMinorOrder) {
    await GVM.startMinorOrder(actor, building, {
      id: ability.id,
      label: ability.label,
      description: ability.description,
      orderType: "minor",
      duration: Math.max(1, Number(ability.action?.durationCycles || 1)),
      cost: { stat: "treasury", value: 0 },
      source: ability.source,
      result: ability.result
    });
    return;
  }

  if (building && orderType === "city") {
    await GVM.createOrder(actor, {
      name: ability.label,
      description: ability.description || "",
      duration: Math.max(1, Number(ability.action?.durationCycles || 1)),
      cost: [],
      effectsOnComplete: [],
      targetItemId: building.id,
      action: "ability-city-order",
      result: ability.result
    });
    return;
  }

  await GVM.completeAbilityResult(actor, ability);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "service",
      title: `Способность активирована: ${ability.label}`,
      entries: [
        `Источник: ${GVM.abilitySourceLabel ? GVM.abilitySourceLabel(ability) : "неизвестно"}.`,
        ability.description || "Описание не задано."
      ]
    });
  }

  GVM.queueRefresh(actor);
};

GVM.originalStartMinorOrderV07 = GVM.originalStartMinorOrderV07 || GVM.startMinorOrder;

GVM.startMinorOrder = async function startMinorOrderV07(actor, item, service) {
  const data = GVM.clone(GVM.gvmData(item));
  data.activeMinorOrders = Array.isArray(data.activeMinorOrders) ? data.activeMinorOrders : [];

  const capacity = GVM.getMinorOrderCapacity(item);

  if (data.activeMinorOrders.length >= capacity) {
    ui.notifications.warn(`Лимит личных приказов здания достигнут: ${data.activeMinorOrders.length}/${capacity}.`);
    return;
  }

  data.activeMinorOrders.push({
    id: foundry.utils.randomID(),
    label: service.label || "Личный приказ",
    serviceId: service.id || null,
    progress: 0,
    duration: Math.max(1, Number(service.duration || service.action?.durationCycles || 1)),
    source: service.source || {},
    result: service.result || null,
    ability: service,
    createdAt: Date.now()
  });

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "order",
      title: `Личный приказ: ${service.label}`,
      entries: [
        `Здание: ${item.name}.`,
        `Длительность: ${Math.max(1, Number(service.duration || service.action?.durationCycles || 1))} цикл(а).`
      ]
    });
  }

  ui.notifications.info(`Личный приказ создан: ${service.label}.`);
  GVM.queueRefresh(actor);
};

GVM.processMinorOrders = async function processMinorOrders(actor) {
  for (const item of GVM.buildings(actor)) {
    const data = GVM.clone(GVM.gvmData(item));

    if (!Array.isArray(data.activeMinorOrders) || !data.activeMinorOrders.length) continue;

    const remaining = [];

    for (const order of data.activeMinorOrders) {
      order.progress = Number(order.progress || 0) + 1;

      if (order.progress >= Number(order.duration || 1)) {
        if (order.ability) {
          await GVM.completeAbilityResult(actor, order.ability, order.result);
        }

        if (GVM.addJournalEntry) {
          await GVM.addJournalEntry(actor, {
            type: "order",
            title: `Личный приказ завершён: ${order.label}`,
            entries: [`Здание: ${item.name}.`]
          });
        }
      } else {
        remaining.push(order);
      }
    }

    data.activeMinorOrders = remaining;
    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.originalAdvanceCycleV07Effects = GVM.originalAdvanceCycleV07Effects || GVM.advanceCycle;

GVM.advanceCycle = async function advanceCycleWithEffectsV07(actor) {
  await GVM.originalAdvanceCycleV07Effects(actor);

  if (!GVM.isGM()) return;

  await GVM.processMinorOrders(actor);
  await GVM.tickSettlementActiveEffects(actor);
  GVM.reportActiveSettlementEffects(actor);

  GVM.queueRefresh(actor);
};
