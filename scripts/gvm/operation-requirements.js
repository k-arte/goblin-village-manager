GVM.OPERATION_STATUS = {
  ONLINE: "online",
  UNDERSTAFFED: "understaffed",
  MISSING_REQUIREMENT: "missingRequirement",
  DISABLED: "disabled",
  DAMAGED: "damaged",
  DESTROYED: "destroyed"
};

GVM.OPERATION_STATUS_LABELS = {
  online: "Работает",
  understaffed: "Не хватает рабочих",
  missingRequirement: "Не хватает условий",
  disabled: "Отключено",
  damaged: "Повреждено",
  destroyed: "Разрушено"
};

GVM.getRequirementDisplayLabel = function getRequirementDisplayLabel(requirement) {
  return requirement.label || requirement.value || requirement.type || "Требование";
};

GVM.requirementItemMatches = function requirementItemMatches(item, requirement) {
  const value = String(requirement.value || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  const uuid = String(item.uuid || "").toLowerCase();
  const id = String(item.id || "").toLowerCase();

  if (!value) return false;
  if (uuid === value) return true;
  if (id === value) return true;
  if (name === value) return true;
  if (name.includes(value)) return true;

  const flags = item.getFlag?.(GVM.FLAG_SCOPE, "data") || {};
  const materialId = String(flags.materialId || flags.requirementId || flags.catalogId || "").toLowerCase();

  return materialId && materialId === value;
};

GVM.findRequirementItem = function findRequirementItem(actor, requirement) {
  if (!actor?.items) return null;
  return actor.items.find(item => GVM.requirementItemMatches(item, requirement)) || null;
};

GVM.hasProfession = function hasProfession(actor, professionId) {
  const value = String(professionId || "").toLowerCase();
  if (!value) return false;

  return GVM.getKeyResidents(actor).some(resident => {
    return resident.active !== false && String(resident.professionId || "").toLowerCase() === value;
  });
};

GVM.hasAssignedProfession = function hasAssignedProfession(actor, buildingItemId, professionId) {
  const value = String(professionId || "").toLowerCase();
  if (!value) return false;

  return GVM.getKeyResidents(actor).some(resident => {
    return resident.active !== false
      && resident.assignedBuildingId === buildingItemId
      && String(resident.professionId || "").toLowerCase() === value;
  });
};

GVM.checkOperationRequirement = function checkOperationRequirement(actor, buildingItem, requirement) {
  const settings = GVM.getSettings(actor);
  const resources = GVM.getResources(actor);
  const type = requirement.type;
  const value = requirement.value;

  if (type === "profession") {
    return GVM.hasProfession(actor, value);
  }

  if (type === "assignedProfession") {
    return GVM.hasAssignedProfession(actor, buildingItem?.id, value);
  }

  if (type === "item") {
    return !!GVM.findRequirementItem(actor, requirement);
  }

  if (type === "building") {
    return GVM.buildings(actor).some(item => {
      const data = GVM.gvmData(item);
      const idMatch = data.facilityId === value || data.catalogId === value || item.id === value || item.name === value;
      const levelOk = Number(data.level || 0) >= Number(requirement.minLevel || 1);
      return idMatch && data.status === "built" && levelOk;
    });
  }

  if (type === "level") {
    return Number(settings.playerCharacterLevel || 1) >= Number(value || 1);
  }

  if (type === "resource") {
    const stat = requirement.stat || value;
    return Number(resources[stat] || 0) >= Number(requirement.amount || requirement.value || 0);
  }

  if (type === "story") {
    const flags = settings.storyFlags || {};
    return !!flags[value];
  }

  return true;
};

GVM.getOperationRequirementStatus = function getOperationRequirementStatus(actor, buildingItem) {
  const data = GVM.gvmData(buildingItem);
  const requirements = data.operationRequirements || [];

  const checks = requirements.map(requirement => {
    const met = GVM.checkOperationRequirement(actor, buildingItem, requirement);
    return {
      requirement,
      met,
      label: GVM.getRequirementDisplayLabel(requirement)
    };
  });

  return {
    checks,
    allMet: checks.every(check => check.met),
    missing: checks.filter(check => !check.met)
  };
};

GVM.getBuildingOperationStatus = function getBuildingOperationStatus(actor, buildingItem) {
  const data = GVM.gvmData(buildingItem);

  if (data.status === "destroyed") {
    return {
      status: GVM.OPERATION_STATUS.DESTROYED,
      label: GVM.OPERATION_STATUS_LABELS.destroyed,
      online: false,
      missing: []
    };
  }

  if (data.status === "disabled") {
    return {
      status: GVM.OPERATION_STATUS.DISABLED,
      label: GVM.OPERATION_STATUS_LABELS.disabled,
      online: false,
      missing: []
    };
  }

  if (data.status === "damaged") {
    const req = GVM.getOperationRequirementStatus(actor, buildingItem);
    return {
      status: req.allMet ? GVM.OPERATION_STATUS.DAMAGED : GVM.OPERATION_STATUS.MISSING_REQUIREMENT,
      label: req.allMet ? GVM.OPERATION_STATUS_LABELS.damaged : GVM.OPERATION_STATUS_LABELS.missingRequirement,
      online: req.allMet,
      missing: req.missing
    };
  }

  if (data.status !== "built") {
    return {
      status: data.status || "inactive",
      label: "Не построено",
      online: false,
      missing: []
    };
  }

  const workerSummary = GVM.getBuildingWorkerSummary ? GVM.getBuildingWorkerSummary(actor, buildingItem) : null;

  if (workerSummary && !workerSummary.isFull) {
    return {
      status: GVM.OPERATION_STATUS.UNDERSTAFFED,
      label: GVM.OPERATION_STATUS_LABELS.understaffed,
      online: false,
      missing: []
    };
  }

  const requirementStatus = GVM.getOperationRequirementStatus(actor, buildingItem);

  if (!requirementStatus.allMet) {
    return {
      status: GVM.OPERATION_STATUS.MISSING_REQUIREMENT,
      label: GVM.OPERATION_STATUS_LABELS.missingRequirement,
      online: false,
      missing: requirementStatus.missing
    };
  }

  return {
    status: GVM.OPERATION_STATUS.ONLINE,
    label: GVM.OPERATION_STATUS_LABELS.online,
    online: true,
    missing: []
  };
};

GVM.operationStatusClass = function operationStatusClass(actor, buildingItem) {
  return GVM.getBuildingOperationStatus(actor, buildingItem).status;
};

GVM.renderOperationRequirementChips = function renderOperationRequirementChips(actor, buildingItem) {
  const data = GVM.gvmData(buildingItem);
  const requirements = data.operationRequirements || [];

  if (!requirements.length) return "";

  const status = GVM.getOperationRequirementStatus(actor, buildingItem);

  return `
    <div class="gvm-operation-requirements">
      ${status.checks.map(check => `
        <span class="${check.met ? "met" : "missing"}" title="${GVM.escapeHtml(check.label)}">
          <i class="fas ${check.met ? "fa-check" : "fa-times"}"></i>
          ${GVM.escapeHtml(check.label)}
        </span>
      `).join("")}
    </div>
  `;
};

GVM.consumeRequirementItem = async function consumeRequirementItem(actor, requirement) {
  const item = GVM.findRequirementItem(actor, requirement);
  if (!item) return false;

  const quantity = Number(item.system?.quantity || 1);

  if (quantity > 1) {
    await item.update({ "system.quantity": quantity - 1 });
  } else {
    await item.delete();
  }

  return true;
};

GVM.consumeRequirements = async function consumeRequirements(actor, requirements = []) {
  for (const requirement of requirements) {
    if (requirement.type === "item" && requirement.consume) {
      await GVM.consumeRequirementItem(actor, requirement);
    }

    if (requirement.type === "resource") {
      const resources = GVM.getResources(actor);
      const stat = requirement.stat || requirement.value;
      resources[stat] = Number(resources[stat] || 0) - Number(requirement.amount || requirement.value || 0);
      await GVM.setResources(actor, resources);
    }
  }
};

GVM.getLevelRequirements = function getLevelRequirements(levelData) {
  return levelData.requirements || levelData.upgradeRequirements || [];
};

GVM.canStartLevelProject = function canStartLevelProject(actor, buildingItem, levelData) {
  const requirements = GVM.getLevelRequirements(levelData);

  const checks = requirements.map(requirement => ({
    requirement,
    met: GVM.checkOperationRequirement(actor, buildingItem, requirement),
    label: GVM.getRequirementDisplayLabel(requirement)
  }));

  return {
    checks,
    allMet: checks.every(check => check.met),
    missing: checks.filter(check => !check.met)
  };
};

GVM.originalBuildingEfficiencyV062Stage3 = GVM.originalBuildingEfficiencyV062Stage3 || GVM.buildingEfficiency;

GVM.buildingEfficiency = function buildingEfficiencyWithOperationRequirements(data, item = null) {
  if (!data) return 0;
  if (!["built", "damaged"].includes(data.status)) return 0;

  if (item?.parent) {
    const operation = GVM.getBuildingOperationStatus(item.parent, item);
    if (!operation.online) return 0;
  }

  return GVM.originalBuildingEfficiencyV062Stage3(data, item);
};

GVM.originalApplyBuildingCycleV062Stage3 = GVM.originalApplyBuildingCycleV062Stage3 || GVM.applyBuildingCycle;

GVM.applyBuildingCycle = function applyBuildingCycleWithOperationRequirements(actor, totals) {
  for (const item of GVM.buildings(actor)) {
    const data = GVM.gvmData(item);

    if (!["built", "damaged"].includes(data.status)) continue;

    const operation = GVM.getBuildingOperationStatus(actor, item);
    const efficiency = operation.online ? GVM.buildingEfficiency(data, item) : 0;

    for (const upkeep of data.upkeep || []) {
      const timing = upkeep.timing || "perCycle";
      if (timing !== "perCycle") continue;

      totals[upkeep.stat] = (totals[upkeep.stat] || 0) + Number(upkeep.value || 0);
    }

    if (!operation.online) continue;

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

GVM.originalRenderFacilityCardV062Stage3 = GVM.originalRenderFacilityCardV062Stage3 || GVM.renderFacilityCard;

GVM.renderFacilityCard = function renderFacilityCardWithOperationStatus(item) {
  const actor = item.parent;
  const facility = GVM.getFacilityRenderData(item);
  const summary = actor && GVM.getBuildingWorkerSummary ? GVM.getBuildingWorkerSummary(actor, item) : null;
  const operation = actor ? GVM.getBuildingOperationStatus(actor, item) : null;

  const workerLine = summary
    ? `
      <div class="gvm-worker-breakdown">
        <span>Рабочие: ${summary.total}/${summary.required}</span>
        <span>Обычные: ${summary.common}</span>
        <span class="resident">Ключевые: ${summary.residentSlots}</span>
      </div>
    `
    : "";

  const operationLine = operation
    ? `
      <div class="gvm-operation-status ${GVM.escapeHtml(operation.status)}">
        <span>${GVM.escapeHtml(operation.label)}</span>
      </div>
    `
    : "";

  const missingLine = operation && operation.missing?.length
    ? `
      <div class="gvm-operation-missing">
        Не хватает:
        ${operation.missing.map(check => `<span>${GVM.escapeHtml(check.label)}</span>`).join("")}
      </div>
    `
    : "";

  return `
    <article
      class="gvm-facility-card status-${GVM.escapeHtml(facility.status)} type-${GVM.escapeHtml(facility.type)} operation-${operation ? GVM.escapeHtml(operation.status) : "unknown"}"
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

      ${operationLine}
      ${missingLine}
      ${workerLine}
      ${actor && GVM.renderWorkerSlots ? GVM.renderWorkerSlots(actor, item) : ""}
      ${actor ? GVM.renderOperationRequirementChips(actor, item) : ""}
      ${operation?.online ? GVM.renderFacilityServices(facility.services) : ""}
    </article>
  `;
};

GVM.originalUpgradeBuildingV062Stage3 = GVM.originalUpgradeBuildingV062Stage3 || GVM.upgradeBuilding;

GVM.upgradeBuilding = async function upgradeBuildingWithRequirements(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));
  const nextLevel = Number(data.level || 0) + 1;
  const levelData = (data.levels || []).find(level => Number(level.level) === nextLevel);

  if (!levelData) {
    ui.notifications.warn("Следующий уровень не описан.");
    return;
  }

  const req = GVM.canStartLevelProject(actor, item, levelData);

  if (!req.allMet) {
    const missing = req.missing.map(check => check.label).join(", ");
    ui.notifications.warn(`Не выполнены требования улучшения: ${missing}`);
    return;
  }

  await GVM.consumeRequirements(actor, GVM.getLevelRequirements(levelData));

  return GVM.originalUpgradeBuildingV062Stage3(actor, item);
};
