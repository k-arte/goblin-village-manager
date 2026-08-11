GVM.getBonusCost = function getBonusCost(data) {
  if (Array.isArray(data.cost)) {
    const first = data.cost[0] || {};
    return {
      stat: first.stat || "treasury",
      value: Math.abs(Number(first.value) || 0)
    };
  }

  if (data.cost && typeof data.cost === "object") {
    return {
      stat: data.cost.stat || "treasury",
      value: Math.abs(Number(data.cost.value) || 0)
    };
  }

  return {
    stat: "treasury",
    value: 0
  };
};

GVM.canPayBonus = function canPayBonus(actor, data) {
  const cost = GVM.getBonusCost(data);
  const resources = GVM.getResources(actor);
  return Number(resources[cost.stat] || 0) >= Number(cost.value || 0);
};

GVM.payBonusCost = async function payBonusCost(actor, data) {
  const cost = GVM.getBonusCost(data);
  const resources = GVM.getResources(actor);

  if (resources[cost.stat] === undefined) resources[cost.stat] = 0;
  resources[cost.stat] -= Number(cost.value || 0);

  await GVM.setResources(actor, resources);
};

GVM.resolveRewardItem = async function resolveRewardItem(reward) {
  if (!reward) return null;

  const uuid = reward.uuid || reward.id || "";
  if (!uuid) return null;

  let document = null;

  try {
    if (uuid.includes(".")) {
      document = await fromUuid(uuid);
    } else {
      document = game.items.get(uuid) || game.items.getName(uuid);
    }
  } catch (err) {
    console.warn(`${GVM.MODULE_ID} | Failed to resolve reward item`, err);
  }

  if (!document || document.documentName !== "Item") return null;
  return document;
};

GVM.createRewardItemOnActor = async function createRewardItemOnActor(actor, rewardDocument, reward) {
  const itemData = rewardDocument.toObject();
  delete itemData._id;

  const quantity = Math.max(1, Number(reward?.quantity || 1));

  if (itemData.system && Object.prototype.hasOwnProperty.call(itemData.system, "quantity")) {
    itemData.system.quantity = quantity;
  }

  const created = await actor.createEmbeddedDocuments("Item", [itemData]);
  return created?.[0] || null;
};

GVM.activateBonus = async function activateBonus(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));

  if (!data.reward || !data.reward.uuid) {
    ui.notifications.warn("У бонуса не назначена награда. Откройте настройку бонуса и перетащите Item-награду.");
    GVM.openConfigForItem(actor, item);
    return;
  }

  if (!GVM.canPayBonus(actor, data)) {
    const cost = GVM.getBonusCost(data);
    ui.notifications.warn(`Недостаточно ресурса: ${GVM.STAT_LABELS[cost.stat] || cost.stat}. Нужно ${cost.value}.`);
    return;
  }

  const rewardDocument = await GVM.resolveRewardItem(data.reward);

  if (!rewardDocument) {
    ui.notifications.warn("Не удалось найти Item-награду. Проверьте Reward UUID / ID в настройке бонуса.");
    GVM.openConfigForItem(actor, item);
    return;
  }

  await GVM.payBonusCost(actor, data);

  const created = await GVM.createRewardItemOnActor(actor, rewardDocument, data.reward);

  data.lastRedeemedAt = Date.now();
  data.lastRewardName = rewardDocument.name;
  data.active = false;
  data.remaining = 0;

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: actor.name }),
    content: `
      <h2>${GVM.escapeHtml(item.name)}</h2>
      <p>Поселение получило награду: <b>${GVM.escapeHtml(rewardDocument.name)}</b>.</p>
      ${created ? `<p>Предмет добавлен в Group Actor.</p>` : ""}
    `
  });

  ui.notifications.info(`Бонус активирован: ${rewardDocument.name} добавлен в ${actor.name}.`);
  GVM.queueRefresh(actor);
};
