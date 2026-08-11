GVM.getResidentsAssignedToBuilding = function getResidentsAssignedToBuilding(actor, buildingItemId) {
  const residents = GVM.getKeyResidents ? GVM.getKeyResidents(actor) : [];

  return residents.filter(resident => {
    return resident.active !== false && resident.assignedBuildingId === buildingItemId;
  });
};

GVM.getResidentWorkerSlots = function getResidentWorkerSlots(actor, buildingItemId) {
  return GVM.getResidentsAssignedToBuilding(actor, buildingItemId)
    .reduce((sum, resident) => sum + Math.max(0, Number(resident.workerSlotsUsed || 1)), 0);
};

GVM.getCommonWorkerSlots = function getCommonWorkerSlots(item) {
  const data = GVM.gvmData(item);
  return Math.max(0, Number(data.workersAssigned || 0));
};

GVM.getBuildingWorkerSummary = function getBuildingWorkerSummary(actor, item) {
  const data = GVM.gvmData(item);
  const required = Math.max(0, Number(data.workersRequired || 0));
  const common = GVM.getCommonWorkerSlots(item);
  const residentSlots = GVM.getResidentWorkerSlots(actor, item.id);
  const residents = GVM.getResidentsAssignedToBuilding(actor, item.id);
  const total = Math.min(required, common + residentSlots);

  return {
    required,
    common,
    residentSlots,
    total,
    residents,
    freeRequired: Math.max(0, required - residentSlots),
    isFull: total >= required
  };
};

GVM.getAssignedWorkerTotalForBuilding = function getAssignedWorkerTotalForBuilding(actor, item) {
  return GVM.getBuildingWorkerSummary(actor, item).total;
};

GVM.getAssignedWorkerTotalAllBuildings = function getAssignedWorkerTotalAllBuildings(actor, exceptItemId = null) {
  return GVM.buildings(actor).reduce((sum, item) => {
    if (exceptItemId && item.id === exceptItemId) return sum;

    const data = GVM.gvmData(item);
    if (!["built", "damaged"].includes(data.status)) return sum;

    return sum + GVM.getAssignedWorkerTotalForBuilding(actor, item);
  }, 0);
};

GVM.originalBuildingEfficiencyV062Stage2 = GVM.originalBuildingEfficiencyV062Stage2 || GVM.buildingEfficiency;

GVM.buildingEfficiency = function buildingEfficiencyWithResidents(data, item = null) {
  if (!data) return 0;
  if (!["built", "damaged"].includes(data.status)) return 0;
  if (data.status === "damaged") return 0.5;

  const required = Math.max(1, Number(data.workersRequired) || 1);

  if (item?.parent) {
    const summary = GVM.getBuildingWorkerSummary(item.parent, item);
    return Math.max(0, Math.min(1, summary.total / required));
  }

  const assigned = Math.max(0, Math.min(required, Number(data.workersAssigned) || 0));
  return assigned / required;
};

GVM.originalCalculateDerivedV062Stage2 = GVM.originalCalculateDerivedV062Stage2 || GVM.calculateDerived;

GVM.calculateDerived = function calculateDerivedWithResidentWorkers(actor) {
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
    const efficiency = GVM.buildingEfficiency(data, item);

    if (["built", "damaged"].includes(data.status)) {
      assignedWorkers += GVM.getAssignedWorkerTotalForBuilding(actor, item);
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

  const militaryDamage = Number(resources.militaryDamage || 0);
  const rawMilitary = military;
  military = Math.max(0, military - militaryDamage);

  return {
    military,
    rawMilitary,
    militaryDamage,
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

GVM.originalApplyBuildingCycleV062Stage2 = GVM.originalApplyBuildingCycleV062Stage2 || GVM.applyBuildingCycle;

GVM.applyBuildingCycle = function applyBuildingCycleWithResidentWorkers(actor, totals) {
  for (const item of GVM.buildings(actor)) {
    const data = GVM.gvmData(item);

    if (!["built", "damaged"].includes(data.status)) continue;

    const efficiency = GVM.buildingEfficiency(data, item);

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

GVM.renderWorkerSlots = function renderWorkerSlots(actor, item) {
  const data = GVM.gvmData(item);
  const required = Math.max(0, Number(data.workersRequired || 0));
  const summary = GVM.getBuildingWorkerSummary(actor, item);

  if (!required) return "";

  const slots = [];

  for (const resident of summary.residents) {
    const residentActor = GVM.getResidentActorSync(resident);
    const label = residentActor?.name || resident.professionLabel || resident.professionId || "Ключевой житель";
    const count = Math.max(1, Number(resident.workerSlotsUsed || 1));

    for (let i = 0; i < count && slots.length < required; i++) {
      slots.push({
        cls: "resident filled",
        icon: "fas fa-user-tie",
        title: label
      });
    }
  }

  const commonFilled = Math.min(summary.common, Math.max(0, required - slots.length));

  for (let i = 0; i < commonFilled && slots.length < required; i++) {
    slots.push({
      cls: "filled",
      icon: "fas fa-user",
      title: "Обычный работник"
    });
  }

  while (slots.length < required) {
    slots.push({
      cls: "",
      icon: "far fa-circle",
      title: "Свободное рабочее место"
    });
  }

  return `
    <div class="gvm-facility-slots">
      ${slots.map(slot => `
        <span class="gvm-slot ${slot.cls}" title="${GVM.escapeHtml(slot.title)}">
          <i class="${GVM.escapeHtml(slot.icon)}"></i>
        </span>
      `).join("")}
    </div>
  `;
};

GVM.originalRenderFacilityCardV062Stage2 = GVM.originalRenderFacilityCardV062Stage2 || GVM.renderFacilityCard;

GVM.renderFacilityCard = function renderFacilityCardWithResidentWorkers(item) {
  const actor = item.parent;
  const facility = GVM.getFacilityRenderData(item);
  const summary = actor ? GVM.getBuildingWorkerSummary(actor, item) : null;

  const workerLine = summary
    ? `
      <div class="gvm-worker-breakdown">
        <span>Рабочие: ${summary.total}/${summary.required}</span>
        <span>Обычные: ${summary.common}</span>
        <span class="resident">Ключевые: ${summary.residentSlots}</span>
      </div>
    `
    : "";

  return `
    <article
      class="gvm-facility-card status-${GVM.escapeHtml(facility.status)} type-${GVM.escapeHtml(facility.type)}"
      data-item-id="${GVM.escapeHtml(facility.id)}"
      style="--gvm-card-art: url('${GVM.escapeHtml(facility.art)}');"
    >
      <div class="gvm-facility-shade"></div>

      <header class="gvm-facility-header">
        <div class="gvm-facility-title-block">
          <h4>${GVM.escapeHtml(facility.title)}</h4>
          <span>${GVM.escapeHtml(facility.typeLabel)} · ${GVM.escapeHtml(facility.statusLabel)} · L${facility.level}/${facility.maxLevel}</span>
        </div>

        <button type="button" class="gvm-facility-action action-primary" data-gvm-control="facility-actions" title="Функции">
          <i class="fas fa-hammer"></i>
        </button>
      </header>

      ${workerLine}
      ${actor ? GVM.renderWorkerSlots(actor, item) : ""}
      ${GVM.renderFacilityServices(facility.services)}
    </article>
  `;
};

GVM.assignWorkers = async function assignWorkersWithResidentSlots(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));
  const resources = GVM.getResources(actor);
  const summary = GVM.getBuildingWorkerSummary(actor, item);
  const otherAssigned = GVM.getAssignedWorkerTotalAllBuildings(actor, item.id);

  const required = Math.max(0, Number(data.workersRequired || 0));
  const residentSlots = summary.residentSlots;
  const maxCommonForBuilding = Math.max(0, required - residentSlots);
  const populationAvailable = Math.max(0, Number(resources.population || 0) - otherAssigned - residentSlots);
  const maxCommon = Math.min(maxCommonForBuilding, populationAvailable);

  new Dialog({
    title: `${item.name}: рабочие`,
    content: `
      <form class="gvm-worker-dialog">
        <p>Ключевые жители занимают: <b>${residentSlots}</b> рабочих мест.</p>
        <p>Обычных рабочих можно назначить: <b>${maxCommon}</b>.</p>

        <div class="form-group">
          <label>Обычные рабочие</label>
          <input type="number" name="workers" value="${Number(data.workersAssigned || 0)}">
        </div>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          data.workersAssigned = Math.max(0, Math.min(maxCommon, Number(html.find("[name=workers]").val()) || 0));
          await item.setFlag(GVM.FLAG_SCOPE, "data", data);
          GVM.refreshSettlement(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
};
