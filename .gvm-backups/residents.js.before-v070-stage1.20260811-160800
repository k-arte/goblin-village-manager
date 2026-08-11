GVM.getKeyResidents = function getKeyResidents(actor) {
  const settings = GVM.getSettings(actor);
  return Array.isArray(settings.keyResidents) ? settings.keyResidents : [];
};

GVM.setKeyResidents = async function setKeyResidents(actor, residents) {
  const settings = GVM.getSettings(actor);
  settings.keyResidents = residents;
  await GVM.setSettings(actor, settings);
};

GVM.makeResidentId = function makeResidentId(actorUuid) {
  return `resident-${String(actorUuid || foundry.utils.randomID()).replace(/[^a-zA-Z0-9]/g, "-")}`;
};

GVM.findResident = function findResident(actor, residentIdOrUuid) {
  const residents = GVM.getKeyResidents(actor);
  return residents.find(resident => {
    return resident.id === residentIdOrUuid || resident.actorUuid === residentIdOrUuid;
  }) || null;
};

GVM.getResidentActor = async function getResidentActor(resident) {
  if (!resident?.actorUuid) return null;

  try {
    const document = await fromUuid(resident.actorUuid);
    if (document?.documentName === "Actor") return document;
  } catch (err) {
    console.warn(`${GVM.MODULE_ID} | Failed to resolve resident actor`, err);
  }

  return null;
};

GVM.getResidentActorSync = function getResidentActorSync(resident) {
  if (!resident?.actorUuid) return null;

  const parts = String(resident.actorUuid).split(".");
  const id = parts.at(-1);

  return game.actors.get(id) || null;
};

GVM.getBuildingNameById = function getBuildingNameById(actor, itemId) {
  if (!itemId) return "Не назначен";
  return actor.items.get(itemId)?.name || "Неизвестное здание";
};

GVM.getResidentProfessionLabel = function getResidentProfessionLabel(resident) {
  return resident.professionLabel || resident.professionId || "Профессия не указана";
};

GVM.getResidentServicesLabel = function getResidentServicesLabel(resident) {
  const services = Array.isArray(resident.services) ? resident.services : [];
  if (!services.length) return "Услуги не настроены";
  return services.map(service => service.label || service.name || String(service)).join(", ");
};

GVM.getResidentModifiersLabel = function getResidentModifiersLabel(resident) {
  const modifiers = Array.isArray(resident.modifiers) ? resident.modifiers : [];
  if (!modifiers.length) return "Модификаторы не настроены";
  return modifiers.map(modifier => modifier.label || `${modifier.stat || "stat"} ${modifier.mode || "add"} ${modifier.value || 0}`).join(", ");
};

GVM.normalizeResident = function normalizeResident(actorDocument) {
  return {
    id: GVM.makeResidentId(actorDocument.uuid),
    actorUuid: actorDocument.uuid,
    professionId: "",
    professionLabel: "",
    assignedBuildingId: null,
    workerSlotsUsed: 1,
    active: true,
    status: "available",
    salary: null,
    modifiers: [],
    services: [],
    notes: ""
  };
};

GVM.addResidentFromActor = async function addResidentFromActor(settlementActor, residentActor) {
  const residents = GVM.getKeyResidents(settlementActor);

  if (residents.some(resident => resident.actorUuid === residentActor.uuid)) {
    ui.notifications.warn(`${residentActor.name} уже добавлен как ключевой житель.`);
    return null;
  }

  const resident = GVM.normalizeResident(residentActor);
  residents.push(resident);

  await GVM.setKeyResidents(settlementActor, residents);

  ui.notifications.info(`${residentActor.name} добавлен как ключевой житель.`);
  GVM.refreshSettlement(settlementActor);

  if (GVM.openResidentConfig) {
    GVM.openResidentConfig(settlementActor, resident.id);
  }

  return resident;
};

GVM.removeResident = async function removeResident(actor, residentId) {
  const before = GVM.getKeyResidents(actor);
  const after = before.filter(resident => resident.id !== residentId);

  await GVM.setKeyResidents(actor, after);
  GVM.refreshSettlement(actor);
};

GVM.handleResidentDrop = async function handleResidentDrop(actor, event) {
  event.preventDefault();
  event.stopPropagation();

  if (!GVM.isGM()) return;

  const dragData = GVM.getDragData(event);
  let dropped = null;

  if (dragData.uuid) dropped = await fromUuid(dragData.uuid);
  else if (dragData.type === "Actor" && dragData.id) dropped = game.actors.get(dragData.id);

  if (!dropped || dropped.documentName !== "Actor") {
    ui.notifications.warn("В ключевые жители можно перетаскивать только Actors.");
    return;
  }

  await GVM.addResidentFromActor(actor, dropped);
};

GVM.renderResidentCard = function renderResidentCard(actor, resident) {
  const residentActor = GVM.getResidentActorSync(resident);
  const name = residentActor?.name || resident.actorName || "Неизвестный НИП";
  const img = residentActor?.img || GVM.SAFE_ICON;
  const assigned = GVM.getBuildingNameById(actor, resident.assignedBuildingId);
  const profession = GVM.getResidentProfessionLabel(resident);
  const services = GVM.getResidentServicesLabel(resident);
  const modifiers = GVM.getResidentModifiersLabel(resident);

  return `
    <article class="gvm-resident-card ${resident.active ? "active" : "inactive"}" data-resident-id="${GVM.escapeHtml(resident.id)}">
      " alt="">

      <div class="gvm-resident-main">
        <header>
          <h4>${GVM.escapeHtml(name)}</h4>
          <span class="gvm-resident-profession">${GVM.escapeHtml(profession)}</span>
        </header>

        <p><strong>Назначен:</strong> ${GVM.escapeHtml(assigned)}</p>
        <p><strong>Рабочих мест:</strong> ${Number(resident.workerSlotsUsed || 1)}</p>
        <p><strong>Услуги:</strong> ${GVM.escapeHtml(services)}</p>
        <p><strong>Модификаторы:</strong> ${GVM.escapeHtml(modifiers)}</p>
      </div>

      <div class="gvm-resident-actions">
        <button type="button" class="gvm-mini-button secondary" data-gvm-control="configure-resident">Настроить</button>
        <button type="button" class="gvm-mini-button danger" data-gvm-control="remove-resident">Убрать</button>
      </div>
    </article>
  `;
};

GVM.renderKeyResidentsSection = function renderKeyResidentsSection(actor) {
  const residents = GVM.getKeyResidents(actor);
  const collapsed = GVM.sectionIsCollapsed ? GVM.sectionIsCollapsed(actor, "key-residents") : false;

  return `
    <section class="gvm-key-residents-section gvm-resident-drop-zone" data-gvm-section="key-residents">
      <header class="gvm-key-residents-header">
        <button type="button" class="gvm-collapse-button" data-gvm-control="toggle-section" data-gvm-section-key="key-residents">
          <i class="fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}"></i>
        </button>
        <h3><i class="fas fa-users"></i> Ключевые жители</h3>
        <span>${residents.length}</span>
      </header>

      ${collapsed ? "" : `
        <div class="gvm-key-residents-list">
          ${residents.length ? residents.map(resident => GVM.renderResidentCard(actor, resident)).join("") : `
            <div class="gvm-empty-residents">
              <strong>Ключевых жителей нет.</strong>
              <p>Перетащите Actor сюда, чтобы добавить кузнеца, жреца, капитана, артифисера или другого специалиста.</p>
            </div>
          `}
        </div>
      `}
    </section>
  `;
};

GVM.activateResidentsPanel = function activateResidentsPanel(actor, panel) {
  panel.querySelectorAll(".gvm-resident-drop-zone").forEach(zone => {
    zone.addEventListener("dragover", event => {
      event.preventDefault();
      zone.classList.add("dragover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });

    zone.addEventListener("drop", async event => {
      zone.classList.remove("dragover");
      await GVM.handleResidentDrop(actor, event);
    });
  });

  panel.querySelectorAll(".gvm-resident-card[data-resident-id]").forEach(card => {
    card.addEventListener("contextmenu", async event => {
      event.preventDefault();

      const resident = GVM.findResident(actor, card.dataset.residentId);
      const residentActor = await GVM.getResidentActor(resident);

      if (residentActor) residentActor.sheet?.render(true);
    });
  });
};
