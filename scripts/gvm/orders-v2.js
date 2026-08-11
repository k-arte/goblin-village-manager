GVM.getOrderRefundRatio = function getOrderRefundRatio(orderData) {
  const duration = Math.max(1, Number(orderData.duration || 1));
  const progress = Math.max(0, Math.min(duration, Number(orderData.progress || 0)));
  return Math.max(0, Math.min(1, 1 - progress / duration));
};

GVM.getOrderRefunds = function getOrderRefunds(orderData) {
  const ratio = GVM.getOrderRefundRatio(orderData);

  return (orderData.cost || [])
    .filter(effect => Number(effect.value || 0) < 0)
    .map(effect => ({
      stat: effect.stat,
      value: Math.floor(Math.abs(Number(effect.value || 0)) * ratio)
    }))
    .filter(effect => effect.value > 0);
};

GVM.cancelOrder = async function cancelOrder(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));

  if (!["active", "upgrade", "building"].includes(data.status)) {
    ui.notifications.warn("Можно отменить только активный приказ.");
    return;
  }

  const refunds = GVM.getOrderRefunds(data);
  const resources = GVM.getResources(actor);

  for (const refund of refunds) {
    resources[refund.stat] = Number(resources[refund.stat] || 0) + Number(refund.value || 0);
  }

  data.status = "cancelled";
  await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  await GVM.setResources(actor, resources);

  const refundText = refunds.length
    ? refunds.map(item => `${GVM.STAT_LABELS[item.stat] || item.stat} +${item.value}`).join(", ")
    : "ресурсы не возвращены";

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "order",
      title: `Приказ отменён: ${item.name}`,
      entries: [
        `Прогресс: ${Number(data.progress || 0)}/${Number(data.duration || 1)}.`,
        `Возврат: ${refundText}.`
      ],
      changes: Object.fromEntries(refunds.map(refund => [refund.stat, refund.value]))
    });
  }

  ui.notifications.info(`Приказ отменён: ${item.name}.`);
  GVM.queueRefresh(actor);
};

GVM.estimateBuildingTotalCost = function estimateBuildingTotalCost(item) {
  const data = GVM.gvmData(item);
  const level = Number(data.level || 0);
  let total = 0;

  for (const levelData of data.levels || []) {
    if (Number(levelData.level || 0) > level) continue;

    for (const cost of levelData.cost || []) {
      if (cost.stat === "treasury") total += Math.abs(Number(cost.value || 0));
    }
  }

  return total;
};

GVM.getRepairCost = function getRepairCost(item) {
  const data = GVM.gvmData(item);
  const total = GVM.estimateBuildingTotalCost(item);
  const ratio = data.status === "destroyed" ? 0.5 : 0.2;
  return Math.max(10, Math.ceil(total * ratio));
};

GVM.getRepairDuration = function getRepairDuration(item) {
  const data = GVM.gvmData(item);
  return data.status === "destroyed" ? 2 : 1;
};

GVM.startRepairBuildingOrder = async function startRepairBuildingOrder(actor, item) {
  const data = GVM.gvmData(item);

  if (!["damaged", "destroyed"].includes(data.status)) {
    ui.notifications.warn("Починка доступна только для повреждённого или разрушенного здания.");
    return;
  }

  const cost = GVM.getRepairCost(item);
  const duration = GVM.getRepairDuration(item);

  await GVM.createOrder(actor, {
    name: `Починить: ${item.name}`,
    description: `Починка здания "${item.name}".`,
    duration,
    cost: [{ stat: "treasury", value: -cost }],
    targetItemId: item.id,
    action: "repair-building"
  });
};

GVM.startDemolishBuildingOrder = async function startDemolishBuildingOrder(actor, item) {
  const data = GVM.gvmData(item);

  if (!["built", "damaged", "disabled"].includes(data.status)) {
    ui.notifications.warn("Снос доступен только построенному, повреждённому или отключённому зданию.");
    return;
  }

  await GVM.createOrder(actor, {
    name: `Снести: ${item.name}`,
    description: `Снос здания "${item.name}".`,
    duration: 1,
    cost: [],
    targetItemId: item.id,
    action: "demolish-building"
  });
};

GVM.completeRepairBuilding = async function completeRepairBuilding(actor, orderData, report) {
  const building = actor.items.get(orderData.targetItemId);
  if (!building) return;

  const data = GVM.clone(GVM.gvmData(building));
  data.status = "built";

  await building.setFlag(GVM.FLAG_SCOPE, "data", data);

  const line = `Здание "${building.name}" было починено.`;
  report.push(line);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "building",
      title: `Здание починено: ${building.name}`,
      entries: [line]
    });
  }
};

GVM.completeDemolishBuilding = async function completeDemolishBuilding(actor, orderData, report) {
  const building = actor.items.get(orderData.targetItemId);
  if (!building) return;

  const data = GVM.clone(GVM.gvmData(building));
  data.status = "destroyed";
  data.workersAssigned = 0;

  await building.setFlag(GVM.FLAG_SCOPE, "data", data);

  const line = `Здание "${building.name}" было снесено.`;
  report.push(line);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "building",
      title: `Здание снесено: ${building.name}`,
      entries: [
        line,
        "Снос не вернул ресурсы и занимал слот городского приказа."
      ]
    });
  }
};

GVM.completeOrderAction = async function completeOrderAction(actor, orderItem, data, resources, settings, report) {
  if (data.action === "upgrade-building") {
    const target = actor.items.get(data.targetItemId);
    const targetName = target?.name || "неизвестное здание";
    await GVM.completeUpgrade(actor, orderItem);

    if (GVM.pushJournalEntry) {
      GVM.pushJournalEntry(settings, {
        type: "building",
        title: `Здание успешно расширено: ${targetName}`,
        entries: [
          `Проект "${orderItem.name}" завершён.`,
          `Здание "${targetName}" было успешно построено или расширено.`
        ]
      });
    }
  }

  else if (data.action === "repair-building") {
    await GVM.completeRepairBuilding(actor, data, report);
  }

  else if (data.action === "demolish-building") {
    await GVM.completeDemolishBuilding(actor, data, report);
  }

  for (const effect of data.effectsOnComplete || []) {
    GVM.addResource(resources, effect.stat, effect.value);
  }
};

GVM.applyOrderCycleWithJournal = async function applyOrderCycleWithJournalV07(actor, resources, settings, report) {
  for (const item of GVM.activeOrders(actor)) {
    const data = GVM.clone(GVM.gvmData(item));
    data.progress = Number(data.progress || 0) + 1;

    if (data.progress >= Number(data.duration || 1)) {
      await GVM.completeOrderAction(actor, item, data, resources, settings, report);

      data.status = "completed";

      const line = `Завершён приказ: ${item.name}.`;
      report.push(line);

      if (GVM.pushJournalEntry) {
        GVM.pushJournalEntry(settings, {
          type: "order",
          title: `Приказ завершён: ${item.name}`,
          entries: [line],
          changes: Object.fromEntries((data.effectsOnComplete || []).map(effect => [effect.stat, effect.value]))
        });
      }
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }
};

GVM.applyOrderCycle = async function applyOrderCycleV07(actor, resources, report) {
  const settings = GVM.getSettings(actor);

  for (const item of GVM.activeOrders(actor)) {
    const data = GVM.clone(GVM.gvmData(item));
    data.progress = Number(data.progress || 0) + 1;

    if (data.progress >= Number(data.duration || 1)) {
      await GVM.completeOrderAction(actor, item, data, resources, settings, report);
      data.status = "completed";
      report.push(`Завершён приказ: ${item.name}.`);
    }

    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  }

  await GVM.setSettings(actor, settings);
};

GVM.originalRenderManagementCardV07 = GVM.originalRenderManagementCardV07 || GVM.renderManagementCard;

GVM.renderManagementCard = function renderManagementCardV07(actor, item, kind) {
  const html = GVM.originalRenderManagementCardV07(actor, item, kind);
  const data = GVM.gvmData(item);

  if (kind !== GVM.KIND.ORDER) return html;
  if (!["active", "upgrade", "building"].includes(data.status)) return html;
  if (html.includes("cancel-order")) return html;

  return html.replace(
    '<button type="button" class="gvm-mini-button secondary" data-gvm-control="configure-item">Настроить</button>',
    '<button type="button" class="gvm-mini-button danger" data-gvm-control="cancel-order">Отменить</button><button type="button" class="gvm-mini-button secondary" data-gvm-control="configure-item">Настроить</button>'
  );
};

GVM.originalActivatePanelOrdersV07 = GVM.originalActivatePanelOrdersV07 || GVM.activatePanel;

GVM.activatePanel = function activatePanelOrdersV07(actor, panel) {
  GVM.originalActivatePanelOrdersV07(actor, panel);

  panel.querySelectorAll("[data-gvm-control='cancel-order']").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const root = button.closest("[data-item-id]");
      const item = root ? actor.items.get(root.dataset.itemId) : null;
      if (item) await GVM.cancelOrder(actor, item);
    });
  });
};
