GVM.SPECIAL_BUILDING_TYPES = new Set([
  "religion",
  "military",
  "crafting",
  "special"
]);

GVM.STATUS_LABELS = {
  locked: "Закрыто",
  available: "Доступно",
  underConstruction: "Строится",
  built: "Построено",
  disabled: "Отключено",
  damaged: "Повреждено",
  destroyed: "Разрушено"
};

GVM.getFacilityCardArt = function getFacilityCardArt(item) {
  const data = GVM.gvmData(item);
  return data.art || item.img || GVM.SAFE_ICON;
};

GVM.getFacilityStatusLabel = function getFacilityStatusLabel(data) {
  return GVM.STATUS_LABELS[data.status] || data.status || "unknown";
};

GVM.getFacilityTypeLabel = function getFacilityTypeLabel(data) {
  return GVM.BUILDING_TYPES[data.type] || data.type || "Постройка";
};

GVM.getFacilityBoons = function getFacilityBoons(item) {
  const data = GVM.gvmData(item);
  return Array.isArray(data.boons) ? data.boons : [];
};

GVM.getFacilityServices = function getFacilityServices(item) {
  const data = GVM.gvmData(item);
  return Array.isArray(data.services) ? data.services : [];
};

GVM.getFacilitySlots = function getFacilitySlots(item) {
  const data = GVM.gvmData(item);

  if (Array.isArray(data.slots)) return data.slots;

  const slots = [];
  const workersRequired = Number(data.workersRequired || 0);
  const workersAssigned = Number(data.workersAssigned || 0);

  for (let i = 0; i < Math.min(workersRequired, 6); i++) {
    slots.push({
      type: "worker",
      filled: i < workersAssigned,
      icon: "fas fa-user"
    });
  }

  return slots;
};

GVM.getFacilitySummary = function getFacilitySummary(item) {
  const data = GVM.gvmData(item);
  const effects = data.effects || [];
  const upkeep = data.upkeep || [];

  return {
    title: item.name,
    img: item.img || GVM.SAFE_ICON,
    art: GVM.getFacilityCardArt(item),
    kind: data.kind,
    type: data.type,
    typeLabel: GVM.getFacilityTypeLabel(data),
    status: data.status || "unknown",
    statusLabel: GVM.getFacilityStatusLabel(data),
    level: Number(data.level || 0),
    maxLevel: Number(data.maxLevel || 5),
    workersAssigned: Number(data.workersAssigned || 0),
    workersRequired: Number(data.workersRequired || 0),
    effects,
    upkeep,
    effectsLabel: GVM.effectsLabel(effects),
    upkeepLabel: GVM.effectsLabel(upkeep),
    boons: GVM.getFacilityBoons(item),
    services: GVM.getFacilityServices(item),
    slots: GVM.getFacilitySlots(item),
    note: data.note || "",
    itemId: item.id,
    uuid: item.uuid
  };
};

GVM.groupFacilitiesForBoard = function groupFacilitiesForBoard(actor) {
  const allBuildings = GVM.buildings(actor);

  const common = [];
  const special = [];

  for (const item of allBuildings) {
    const data = GVM.gvmData(item);
    if (GVM.SPECIAL_BUILDING_TYPES.has(data.type)) special.push(item);
    else common.push(item);
  }

  return {
    common,
    special
  };
};

GVM.prepareSettlementBoardContext = function prepareSettlementBoardContext(actor) {
  const resources = GVM.getResources(actor);
  const settings = GVM.getSettings(actor);
  const derived = GVM.calculateDerived(actor);
  const groups = GVM.groupFacilitiesForBoard(actor);

  return {
    actor,
    actorId: actor.id,
    settlementName: actor.name,
    resources,
    settings,
    derived,
    commonBuildings: groups.common.map(GVM.getFacilitySummary),
    specialBuildings: groups.special.map(GVM.getFacilitySummary),
    limits: {
      specialUsed: groups.special.length,
      specialMax: Number(settings.specialBuildingLimit || 14)
    },
    isGM: GVM.isGM()
  };
};
