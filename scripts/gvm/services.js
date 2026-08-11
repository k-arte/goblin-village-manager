GVM.getBuildingActions = function getBuildingActions(item) {
  const data = GVM.gvmData(item);
  const level = Number(data.level || 0);
  const actions = [];

  for (const levelData of data.levels || []) {
    if (Number(levelData.level || 0) > level) continue;

    for (const action of levelData.actions || []) {
      actions.push({
        ...action,
        source: action.source || {
          type: "building",
          buildingItemId: item.id,
          buildingName: item.name,
          requiredLevel: Number(levelData.level || 1)
        }
      });
    }

    for (const service of levelData.services || []) {
      actions.push({
        id: foundry.utils.randomID(),
        label: service,
        type: "service",
        orderType: "instant",
        cost: { stat: "treasury", value: 0 },
        description: service,
        source: {
          type: "building",
          buildingItemId: item.id,
          buildingName: item.name,
          requiredLevel: Number(levelData.level || 1)
        }
      });
    }
  }

  return actions;
};

GVM.getResidentServicesForBuilding = function getResidentServicesForBuilding(actor, item) {
  const assigned = GVM.getAssignedResidents ? GVM.getAssignedResidents(actor, item.id) : [];
  const allResidents = GVM.getActiveResidents ? GVM.getActiveResidents(actor) : [];
  const services = [];

  for (const resident of allResidents) {
    for (const service of resident.services || []) {
      const requiresAssigned = service.requiresAssignedBuilding === true;
      if (requiresAssigned && !assigned.some(x => x.id === resident.id)) continue;

      services.push({
        ...service,
        source: {
          ...(service.source || {}),
          type: service.source?.type || "resident",
          residentId: resident.id,
          residentName: GVM.getResidentActorSync(resident)?.name || resident.professionLabel || resident.professionId || "Ключевой житель",
          actorUuid: resident.actorUuid,
          assignedBuildingId: resident.assignedBuildingId || null,
          buildingItemId: item.id,
          buildingName: item.name
        }
      });
    }
  }

  return services;
};

GVM.getAvailableActionsForBuilding = function getAvailableActionsForBuilding(actor, item) {
  const data = GVM.gvmData(item);
  const operation = GVM.getBuildingOperationStatus ? GVM.getBuildingOperationStatus(actor, item) : { online: true };

  if (!operation.online && data.status === "built") return [];

  return [
    ...GVM.getBuildingActions(item),
    ...GVM.getResidentServicesForBuilding(actor, item)
  ];
};

GVM.payServiceCost = async function payServiceCost(actor, service) {
  const cost = service.cost || {};
  const stat = cost.stat || "treasury";
  const value = Number(cost.value || 0);

  if (!value) return true;

  const resources = GVM.getResources(actor);

  if (Number(resources[stat] || 0) < value) {
    ui.notifications.warn(`Недостаточно ресурса: ${GVM.STAT_LABELS[stat] || stat}. Нужно ${value}.`);
    return false;
  }

  resources[stat] = Number(resources[stat] || 0) - value;
  await GVM.setResources(actor, resources);
  return true;
};

GVM.getBuildingMinorOrders = function getBuildingMinorOrders(item) {
  const data = GVM.gvmData(item);
  return Array.isArray(data.activeMinorOrders) ? data.activeMinorOrders : [];
};

GVM.getMinorOrderCapacity = function getMinorOrderCapacity(item) {
  const data = GVM.gvmData(item);
  return Math.max(0, Number(data.minorOrderCapacity || data.level || 0));
};

GVM.startMinorOrder = async function startMinorOrder(actor, item, service) {
  const data = GVM.clone(GVM.gvmData(item));
  data.activeMinorOrders = Array.isArray(data.activeMinorOrders) ? data.activeMinorOrders : [];

  const capacity = GVM.getMinorOrderCapacity(item);

  if (data.activeMinorOrders.length >= capacity) {
    ui.notifications.warn(`Лимит малых приказов здания достигнут: ${data.activeMinorOrders.length}/${capacity}.`);
    return;
  }

  const paid = await GVM.payServiceCost(actor, service);
  if (!paid) return;

  data.activeMinorOrders.push({
    id: foundry.utils.randomID(),
    label: service.label || "Малый приказ",
    serviceId: service.id || null,
    progress: 0,
    duration: Math.max(1, Number(service.duration || 1)),
    source: service.source || {},
    result: service.result || null,
    createdAt: Date.now()
  });

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "order",
      title: `Малый приказ: ${service.label}`,
      entries: [
        `Здание: ${item.name}.`,
        `Длительность: ${Math.max(1, Number(service.duration || 1))} цикл(а).`
      ]
    });
  }

  ui.notifications.info(`Малый приказ создан: ${service.label}.`);
  GVM.queueRefresh(actor);
};

GVM.executeInstantService = async function executeInstantService(actor, item, service) {
  const paid = await GVM.payServiceCost(actor, service);
  if (!paid) return;

  const source = service.source?.residentName
    ? `${service.source.residentName}${service.source.buildingName ? ` в ${service.source.buildingName}` : ""}`
    : service.source?.buildingName || item.name;

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "service",
      title: `Услуга: ${service.label}`,
      entries: [
        `Источник: ${source}.`,
        service.description || "Услуга выполнена."
      ]
    });
  }

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: actor.name }),
    content: `
      <h2>${GVM.escapeHtml(service.label || "Услуга поселения")}</h2>
      <p><b>Источник:</b> ${GVM.escapeHtml(source)}</p>
      <p>${GVM.escapeHtml(service.description || "Услуга выполнена.")}</p>
    `
  });

  ui.notifications.info(`Услуга выполнена: ${service.label}.`);
  GVM.queueRefresh(actor);
};

GVM.executeBuildingService = async function executeBuildingService(actor, item, serviceId) {
  const services = GVM.getAvailableActionsForBuilding(actor, item);
  const service = services.find(x => String(x.id) === String(serviceId) || String(x.label) === String(serviceId));

  if (!service) {
    ui.notifications.warn("Услуга не найдена или недоступна.");
    return;
  }

  const orderType = service.orderType || "instant";

  if (orderType === "minor") {
    await GVM.startMinorOrder(actor, item, service);
    return;
  }

  if (orderType === "city") {
    await GVM.createOrder(actor, {
      name: service.label || "Городской приказ",
      description: service.description || "",
      duration: Math.max(1, Number(service.duration || 1)),
      cost: service.cost ? [{ stat: service.cost.stat || "treasury", value: -Math.abs(Number(service.cost.value || 0)) }] : [],
      effectsOnComplete: service.effectsOnComplete || [],
      targetItemId: item.id,
      action: service.action || "custom"
    });
    return;
  }

  await GVM.executeInstantService(actor, item, service);
};
