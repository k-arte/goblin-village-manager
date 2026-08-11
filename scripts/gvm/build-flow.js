GVM.requirementIsMet = function requirementIsMet(actor, requirement) {
  const settings = GVM.getSettings(actor);
  const type = requirement.type;
  const value = requirement.value;

  if (type === GVM.REQUIREMENT_TYPES.LEVEL) {
    return Number(settings.playerCharacterLevel || 1) >= Number(value || 1);
  }

  if (type === GVM.REQUIREMENT_TYPES.BUILDING) {
    return GVM.buildings(actor).some(item => {
      const data = GVM.gvmData(item);
      return (data.facilityId === value || data.catalogId === value || item.name === value) && data.status === "built";
    });
  }

  if (type === GVM.REQUIREMENT_TYPES.REFORM) {
    return GVM.reforms(actor).some(item => {
      const data = GVM.gvmData(item);
      return (data.reformId === value || data.catalogId === value || item.name === value) && data.active;
    });
  }

  if (type === GVM.REQUIREMENT_TYPES.NPC) {
    const npcs = settings.npcs || settings.availableNpcs || [];
    return Array.isArray(npcs) && npcs.some(npc => {
      if (typeof npc === "string") return npc.toLowerCase() === String(value).toLowerCase();
      return String(npc.id || npc.value || npc.name || "").toLowerCase() === String(value).toLowerCase();
    });
  }

  if (type === GVM.REQUIREMENT_TYPES.STORY) {
    const flags = settings.storyFlags || {};
    return !!flags[value];
  }

  return false;
};

GVM.requirementLabel = function requirementLabel(requirement) {
  return requirement.label || `${requirement.type}: ${requirement.value}`;
};

GVM.getRequirementStatus = function getRequirementStatus(actor, requirements = []) {
  const checks = requirements.map(requirement => {
    const met = GVM.requirementIsMet(actor, requirement);
    return {
      requirement,
      met,
      label: GVM.requirementLabel(requirement)
    };
  });

  return {
    checks,
    allMet: checks.every(check => check.met)
  };
};

GVM.firstLevelOfTemplate = function firstLevelOfTemplate(template) {
  return template.levels?.[0] || {
    level: 1,
    title: `Построить: ${template.name}`,
    description: template.description || "",
    cost: [],
    duration: 1,
    workersRequired: 0,
    upkeep: [],
    effects: [],
    services: []
  };
};

GVM.renderRequirementList = function renderRequirementList(status) {
  if (!status.checks.length) {
    return `<p class="gvm-build-requirement ok">Условия: нет.</p>`;
  }

  return `
    <ul class="gvm-build-requirements">
      ${status.checks.map(check => `
        <li class="${check.met ? "ok" : "missing"}">
          <i class="fas ${check.met ? "fa-check" : "fa-times"}"></i>
          ${GVM.escapeHtml(check.label)}
        </li>
      `).join("")}
    </ul>
  `;
};

GVM.renderBuildFacilityCandidate = function renderBuildFacilityCandidate(actor, template) {
  const level = GVM.firstLevelOfTemplate(template);
  const requirementStatus = GVM.getRequirementStatus(actor, template.buildRequirements || []);
  const operationRequirementStatus = GVM.getRequirementStatus(actor, template.operationRequirements || template.requirements || []);

  const cost = GVM.effectsLabel(level.cost || []);
  const effects = GVM.effectsLabel(level.effects || []);
  const upkeep = GVM.effectsLabel(level.upkeep || []);
  const services = (level.services || []).join(", ") || "—";

  return `
    <article class="gvm-build-candidate ${requirementStatus.allMet ? "available" : "locked"}" data-facility-template-id="${GVM.escapeHtml(template.id)}">
      <header>
        <div>
          <h3>${GVM.escapeHtml(template.name)}</h3>
          <span>${template.category === GVM.FACILITY_CATEGORY.SPECIAL ? "Особая постройка" : "Обычная постройка"} · ${GVM.escapeHtml(GVM.BUILDING_TYPES[template.type] || template.type || "Постройка")}</span>
        </div>
        <button type="button" class="gvm-control primary" data-gvm-build-template="${GVM.escapeHtml(template.id)}">
          Построить
        </button>
      </header>

      <p class="gvm-build-description">${GVM.escapeHtml(template.description || "")}</p>

      <div class="gvm-build-grid">
        <div><strong>Стоимость</strong><span>${GVM.escapeHtml(cost)}</span></div>
        <div><strong>Время</strong><span>${Number(level.duration || 1)} цикл(а)</span></div>
        <div><strong>Рабочие</strong><span>${Number(level.workersRequired || 0)}</span></div>
        <div><strong>Профит L1</strong><span>${GVM.escapeHtml(effects)}</span></div>
        <div><strong>Содержание</strong><span>${GVM.escapeHtml(upkeep)}</span></div>
        <div><strong>Сервисы</strong><span>${GVM.escapeHtml(services)}</span></div>
      </div>

      <div class="gvm-build-operation-req"><strong>Для работы здания:</strong>${GVM.renderRequirementList(operationRequirementStatus)}</div>${template.buildRequirements?.length ? GVM.renderRequirementList(requirementStatus) : ""}
    </article>
  `;
};

GVM.openBuildFacilityPicker = function openBuildFacilityPicker(actor, category) {
  const title = category === GVM.FACILITY_CATEGORY.SPECIAL ? "Возвести особую постройку" : "Возвести обычную постройку";
  const candidates = GVM.getBuildableFacilities(actor, category);

  const content = `
    <section class="gvm-build-picker">
      <p class="gvm-build-picker-hint">
        Выберите ещё не построенное здание. Строительство создаст проект-приказ и спишет стоимость из казны поселения.
      </p>

      ${candidates.length ? candidates.map(template => GVM.renderBuildFacilityCandidate(actor, template)).join("") : `
        <p class="gvm-empty">Нет доступных зданий этого типа.</p>
      `}
    </section>
  `;

  const dialog = new Dialog({
    title,
    content,
    buttons: {},
    render: html => {
      html.find("[data-gvm-build-template]").on("click", async event => {
        event.preventDefault();
        const templateId = event.currentTarget.dataset.gvmBuildTemplate;
        await GVM.startBuildFacilityProject(actor, templateId);
        dialog.close();
      });
    }
  }, {
    width: 820,
    height: "auto"
  });

  dialog.render(true);
};

GVM.startBuildFacilityProject = async function startBuildFacilityProject(actor, templateId) {
  const template = GVM.getFacilityTemplateById(templateId);

  if (!template) {
    ui.notifications.warn(`Не найден шаблон здания: ${templateId}`);
    return null;
  }

  await GVM.ensureSettlement(actor);

  const firstLevel = GVM.firstLevelOfTemplate(template);
  const requirementStatus = GVM.getRequirementStatus(actor, template.buildRequirements || []);
  const operationRequirementStatus = GVM.getRequirementStatus(actor, template.operationRequirements || template.requirements || []);

  if (!requirementStatus.allMet) {
    ui.notifications.warn("Не все условия выполнены. GM всё равно может начать строительство.");
  }

  const buildingData = GVM.facilityTemplateToBuildingData(template, { built: false });

  const building = await GVM.createGvmItem(actor, template.name, buildingData, {
    img: template.img || GVM.SAFE_ICON,
    description: template.description || ""
  });

  if (!building) {
    ui.notifications.error("Не удалось создать Item здания.");
    return null;
  }

  const order = await GVM.createOrder(actor, {
    name: firstLevel.title || `Построить: ${template.name}`,
    description: firstLevel.description || template.description || "",
    duration: Number(firstLevel.duration || 1),
    cost: firstLevel.cost || [],
    targetItemId: building.id,
    action: "upgrade-building"
  });

  if (!order) {
    await building.delete();
    ui.notifications.warn("Проект строительства не создан. Здание удалено.");
    return null;
  }

  await GVM.journalBuilding(actor, `Начато строительство: ${template.name}`, [
    `Создан проект: ${order.name}.`,
    `Стоимость: ${GVM.effectsLabel(firstLevel.cost || [])}.`,
    `Время: ${Number(firstLevel.duration || 1)} цикл(а).`
  ], {
    treasury: (firstLevel.cost || []).find(effect => effect.stat === "treasury")?.value || 0
  });

  ui.notifications.info(`Начато строительство: ${template.name}.`);
  GVM.queueRefresh(actor);

  return building;
};

GVM.estimateBuildingRefund = function estimateBuildingRefund(item) {
  const data = GVM.gvmData(item);
  const level = Number(data.level || 0);

  if (!level || !Array.isArray(data.levels)) return 0;

  let totalCost = 0;

  for (const levelData of data.levels) {
    if (Number(levelData.level || 0) > level) continue;

    for (const cost of levelData.cost || []) {
      if (cost.stat === "treasury") totalCost += Math.abs(Number(cost.value || 0));
    }
  }

  return Math.floor(totalCost * 0.25);
};

GVM.demolishBuilding = async function demolishBuilding(actor, item, mode = "destroyed") {
  const data = GVM.clone(GVM.gvmData(item));

  if (data.kind !== GVM.KIND.BUILDING) {
    ui.notifications.warn("Сносить можно только здания.");
    return;
  }

  if (mode === "delete") {
    const name = item.name;
    await item.delete();

    await GVM.journalBuilding(actor, `Здание удалено: ${name}`, [
      `Item здания был полностью удалён из поселения.`
    ]);

    ui.notifications.info(`Здание удалено: ${name}.`);
    GVM.queueRefresh(actor);
    return;
  }

  const refund = GVM.estimateBuildingRefund(item);
  const resources = GVM.getResources(actor);

  if (refund > 0) {
    resources.treasury = Number(resources.treasury || 0) + refund;
    await GVM.setResources(actor, resources);
  }

  data.status = "destroyed";
  data.workersAssigned = 0;

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);

  await GVM.journalBuilding(actor, `Здание снесено: ${item.name}`, [
    refund > 0 ? `Разбор материалов вернул ${refund} казны.` : "Разбор материалов не принёс значимой казны.",
    "Здание больше не даёт эффектов."
  ], {
    treasury: refund
  });

  ui.notifications.info(`Здание снесено: ${item.name}.`);
  GVM.queueRefresh(actor);
};

GVM.confirmDemolishBuilding = function confirmDemolishBuilding(actor, item) {
  const refund = GVM.estimateBuildingRefund(item);

  new Dialog({
    title: `Снести здание: ${item.name}`,
    content: `
      <section class="gvm-dialog">
        <p>Снос переведёт здание в статус <b>destroyed</b>, снимет рабочих и отключит эффекты.</p>
        <p>Оценка возврата материалов: <b>${refund}</b> казны.</p>
        <p>Полное удаление Item доступно отдельной кнопкой.</p>
      </section>
    `,
    buttons: {
      demolish: {
        label: "Снести",
        callback: () => GVM.demolishBuilding(actor, item, "destroyed")
      },
      deleteItem: {
        label: "Удалить Item",
        callback: () => GVM.demolishBuilding(actor, item, "delete")
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
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

  await GVM.journalBuilding(actor, `Здание успешно расширено: ${building.name}`, [
    `Здание достигло уровня ${data.level}.`,
    `Новые эффекты: ${GVM.effectsLabel(data.effects || [])}.`,
    `Сервисы: ${(data.services || []).join(", ") || "—"}.`
  ]);
};

GVM.originalBuildingDialogV06 = GVM.buildingDialog;

GVM.buildingDialog = function buildingDialog(actor, item) {
  const data = GVM.gvmData(item);
  const services = (data.services || []).length
    ? data.services.map(service => `<li>${GVM.escapeHtml(service)}</li>`).join("")
    : "<li>Нет сервисов</li>";

  new Dialog({
    title: `${item.name}: функции здания`,
    content: `
      <section class="gvm-dialog">
        <p><b>Тип:</b> ${GVM.escapeHtml(GVM.BUILDING_TYPES[data.type] || data.type || "Здание")}</p>
        <p><b>Статус:</b> ${GVM.escapeHtml(data.status || "unknown")} · <b>Уровень:</b> ${Number(data.level || 0)}/${Number(data.maxLevel || 5)}</p>
        <p><b>Рабочие:</b> ${Number(data.workersAssigned || 0)}/${Number(data.workersRequired || 0)}</p>
        <p><b>Эффекты:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.effects || []))}</p>
        <h3>Сервисы</h3>
        <ul>${services}</ul>
      </section>
    `,
    buttons: {
      upgrade: {
        label: Number(data.level || 0) === 0 ? "Построить" : "Расширить",
        callback: () => GVM.upgradeBuilding(actor, item)
      },
      workers: {
        label: "Рабочие",
        callback: () => GVM.assignWorkers(actor, item)
      },
      toggle: {
        label: data.status === "disabled" ? "Включить" : "Отключить",
        callback: () => GVM.toggleBuilding(actor, item)
      },
      configure: {
        label: "Настроить",
        callback: () => GVM.openConfigForItem(actor, item)
      },
      sheet: {
        label: "Item Sheet",
        callback: () => item.sheet?.render(true)
      },
      demolish: {
        label: "Снести",
        callback: () => GVM.confirmDemolishBuilding(actor, item)
      }
    }
  }).render(true);
};
