GVM.getSafeArtUrl = function getSafeArtUrl(value) {
  const raw = String(value || GVM.SAFE_ICON);
  return raw.replace(/["'()\\]/g, "");
};

GVM.getFacilityStatusLabel = function getFacilityStatusLabel(data) {
  const labels = GVM.STATUS_LABELS || {
    locked: "Закрыто",
    available: "Доступно",
    underConstruction: "Строится",
    built: "Построено",
    disabled: "Отключено",
    damaged: "Повреждено",
    destroyed: "Разрушено"
  };

  return labels[data.status] || data.status || "unknown";
};

GVM.getFacilityTypeLabel = function getFacilityTypeLabel(data) {
  return GVM.BUILDING_TYPES[data.type] || data.type || "Постройка";
};

GVM.isSpecialFacility = function isSpecialFacility(item) {
  const data = GVM.gvmData(item);
  const specialTypes = GVM.SPECIAL_BUILDING_TYPES || new Set(["religion", "military", "crafting", "special"]);
  return specialTypes.has(data.type);
};

GVM.getFacilityRenderData = function getFacilityRenderData(item) {
  const data = GVM.gvmData(item);
  const effects = data.effects || [];
  const upkeep = data.upkeep || [];
  const boons = Array.isArray(data.boons) ? data.boons : [];
  const services = Array.isArray(data.services) ? data.services : [];
  const workersRequired = Number(data.workersRequired || 0);
  const workersAssigned = Number(data.workersAssigned || 0);

  const slots = Array.isArray(data.slots)
    ? data.slots
    : Array.from({ length: Math.min(workersRequired, 6) }, (_value, index) => ({
        type: "worker",
        filled: index < workersAssigned,
        icon: "fas fa-user"
      }));

  return {
    id: item.id,
    title: item.name,
    type: data.type || "special",
    typeLabel: GVM.getFacilityTypeLabel(data),
    status: data.status || "unknown",
    statusLabel: GVM.getFacilityStatusLabel(data),
    level: Number(data.level || 0),
    maxLevel: Number(data.maxLevel || 5),
    workersRequired,
    workersAssigned,
    effects,
    upkeep,
    effectsLabel: GVM.effectsLabel(effects),
    upkeepLabel: GVM.effectsLabel(upkeep),
    boons,
    services,
    slots,
    art: GVM.getSafeArtUrl(data.art || item.img || GVM.SAFE_ICON)
  };
};

GVM.renderFacilitySlots = function renderFacilitySlots(slots) {
  if (!slots || !slots.length) return "";

  return `
    <div class="gvm-facility-slots">
      ${slots.map(slot => `
        <span class="gvm-slot ${slot.filled ? "filled" : ""}" title="${GVM.escapeHtml(slot.type || "slot")}">
          <i class="${GVM.escapeHtml(slot.icon || "fas fa-square")}"></i>
        </span>
      `).join("")}
    </div>
  `;
};

GVM.renderFacilityBoons = function renderFacilityBoons(boons) {
  if (!boons || !boons.length) {
    return `
      <section class="gvm-facility-boons">
        <strong>Boons</strong>
        <p>No boons configured.</p>
      </section>
    `;
  }

  return `
    <section class="gvm-facility-boons">
      <strong>Boons</strong>
      <ul>
        ${boons.map(boon => `<li>${GVM.escapeHtml(boon.label || boon.name || String(boon))}</li>`).join("")}
      </ul>
    </section>
  `;
};

GVM.renderFacilityServices = function renderFacilityServices(services) {
  if (!services || !services.length) return "";

  return `
    <section class="gvm-facility-services">
      ${services.slice(0, 6).map(service => `<span>${GVM.escapeHtml(service)}</span>`).join("")}
    </section>
  `;
};

GVM.renderFacilityCard = function renderFacilityCard(item) {
  const facility = GVM.getFacilityRenderData(item);

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

        <button type="button" class="gvm-facility-action" data-gvm-control="facility-actions" title="Функции">
          <i class="fas fa-hammer"></i>
        </button>
      </header>

      ${GVM.renderFacilitySlots(facility.slots)}
      ${GVM.renderFacilityBoons(facility.boons)}
      ${GVM.renderFacilityServices(facility.services)}
    </article>
  `;
};

GVM.renderFacilityColumn = function renderFacilityColumn(title, icon, facilities, counterText) {
  return `
    <section class="gvm-bastion-column">
      <header class="gvm-column-header">
        <h3><i class="${GVM.escapeHtml(icon)}"></i> ${GVM.escapeHtml(title)}</h3>
        ${counterText ? `<span>${GVM.escapeHtml(counterText)}</span>` : ""}
      </header>

      <div class="gvm-facility-list gvm-drop-zone" data-gvm-drop-kind="${GVM.KIND.BUILDING}">
        ${facilities.length ? facilities.map(GVM.renderFacilityCard).join("") : `<div class="gvm-empty-card">Нет построек.</div>`}

        ${GVM.isGM() ? `
          <button type="button" class="gvm-build-placeholder" data-gvm-control="create-building">
            Возвести постройку
          </button>
        ` : ""}
      </div>
    </section>
  `;
};

GVM.renderManagementStrip = function renderManagementStrip(actor) {
  const reforms = GVM.reforms(actor);
  const orders = GVM.orders(actor);
  const bonuses = GVM.bonuses(actor);

  return `
    <section class="gvm-management-strip">
      <header>
        <h3>Управление поселением</h3>
      </header>

      <div class="gvm-management-actions">
        ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="create-reform">Создать реформу</button>` : ""}
        ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="create-order">Создать приказ</button>` : ""}
        ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="create-bonus">Создать бонус</button>` : ""}
      </div>

      <div class="gvm-management-summary">
        <span>Реформы: ${reforms.length}</span>
        <span>Приказы: ${orders.length}</span>
        <span>Бонусы: ${bonuses.length}</span>
      </div>
    </section>
  `;
};

GVM.renderSettlementPanel = async function renderSettlementPanel(actor, panel) {
  await GVM.ensureSettlement(actor);

  const resources = GVM.getResources(actor);
  const settings = GVM.getSettings(actor);
  const derived = GVM.calculateDerived(actor);
  const hidden = settings.hiddenFromPlayers && !GVM.isGM();

  const allBuildings = GVM.buildings(actor);
  const commonBuildings = allBuildings.filter(item => !GVM.isSpecialFacility(item));
  const specialBuildings = allBuildings.filter(item => GVM.isSpecialFacility(item));
  const specialMax = Number(settings.specialBuildingLimit || 14);

  const threatText = GVM.isGM()
    ? resources.threat
    : settings.scouting.known
      ? `${settings.scouting.threatMin}-${settings.scouting.threatMax}`
      : "неизвестно";

  panel.innerHTML = `
    <section class="gvm-bastion-board" data-gvm-actor-id="${actor.id}">
      <header class="gvm-bastion-title">
        <h1>${GVM.escapeHtml(actor.name)}</h1>
      </header>

      <section class="gvm-defenders-strip">
        <h3><i class="fas fa-shield-alt"></i> Защитники</h3>
        <p>Бастион без защиты.</p>
      </section>

      <section class="gvm-resource-ribbon">
        <span>Население: ${GVM.escapeHtml(hidden ? "примерно" : resources.population)}</span>
        <span>Еда: ${GVM.escapeHtml(hidden ? "скрыто" : resources.food)}</span>
        <span>Казна: ${GVM.escapeHtml(hidden ? "скрыто" : resources.treasury)}</span>
        <span>Военная сила: ${GVM.escapeHtml(hidden ? "скрыто" : derived.military)}</span>
        <span>Угроза: ${GVM.escapeHtml(threatText)}</span>
        <span>Цикл: ${Number(settings.cycle || 0)}</span>
      </section>

      ${GVM.isGM() ? `
        <section class="gvm-bastion-controls">
          <button type="button" class="gvm-control" data-gvm-control="next-cycle">Следующий цикл</button>
          <button type="button" class="gvm-control" data-gvm-control="init-defaults">Создать стартовые Items</button>
          <button type="button" class="gvm-control" data-gvm-control="toggle-hidden">${settings.hiddenFromPlayers ? "Показать игрокам" : "Скрыть от игроков"}</button>
        </section>
      ` : ""}

      <div class="gvm-bastion-columns">
        ${GVM.renderFacilityColumn("Обычные постройки", "fas fa-chess-rook", commonBuildings, "")}
        ${GVM.renderFacilityColumn("Особые постройки", "fas fa-landmark", specialBuildings, `${specialBuildings.length} / ${specialMax}`)}
      </div>

      ${GVM.renderManagementStrip(actor)}
    </section>
  `;

  GVM.activatePanel(actor, panel);
};

GVM.activatePanel = function activatePanel(actor, panel) {
  panel.querySelectorAll("[data-gvm-control]").forEach(element => {
    element.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const control = element.dataset.gvmControl;
      const card = element.closest("[data-item-id]");
      const item = card ? actor.items.get(card.dataset.itemId) : null;

      if (control === "next-cycle") {
        await GVM.advanceCycle(actor);
      } else if (control === "init-defaults") {
        await GVM.initializeDefaults(actor);
      } else if (control === "toggle-hidden") {
        const settings = GVM.getSettings(actor);
        settings.hiddenFromPlayers = !settings.hiddenFromPlayers;
        await GVM.setSettings(actor, settings);
        GVM.refreshSettlement(actor);
      } else if (control === "create-building") {
        GVM.createBuildingDialog(actor);
      } else if (control === "create-reform") {
        GVM.createReformDialog(actor);
      } else if (control === "create-order") {
        GVM.createOrderDialog(actor);
      } else if (control === "create-bonus") {
        GVM.createBonusDialog(actor);
      } else if (control === "facility-actions" && item) {
        GVM.itemActionDialog(actor, item);
      }
    });
  });

  panel.querySelectorAll(".gvm-facility-card[data-item-id]").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-gvm-control]")) return;

      const item = actor.items.get(card.dataset.itemId);
      if (item) GVM.itemActionDialog(actor, item);
    });

    card.addEventListener("contextmenu", event => {
      event.preventDefault();

      const item = actor.items.get(card.dataset.itemId);
      if (item) item.sheet?.render(true);
    });
  });

  panel.querySelectorAll(".gvm-drop-zone").forEach(zone => {
    zone.addEventListener("dragover", event => {
      event.preventDefault();
      zone.classList.add("dragover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });

    zone.addEventListener("drop", async event => {
      zone.classList.remove("dragover");
      await GVM.handleDrop(actor, event, zone.dataset.gvmDropKind);
    });
  });
};

GVM.getRoot = function getRoot(app, html) {
  if (html?.jquery) return html[0];
  if (html instanceof HTMLElement) return html;
  if (app?.element?.jquery) return app.element[0];
  if (app?.element instanceof HTMLElement) return app.element;
  return null;
};

GVM.findTabs = function findTabs(root) {
  return root.querySelector(
    'nav.sheet-tabs[data-group="primary"], nav.tabs[data-group="primary"], .sheet-tabs[data-group="primary"], nav.sheet-tabs, nav.tabs, .sheet-tabs'
  );
};

GVM.findBody = function findBody(root) {
  return root.querySelector(".sheet-body, .window-content form, form, .window-content");
};

GVM.hideOtherTabs = function hideOtherTabs(root, panel, button) {
  const body = GVM.findBody(root) || root;

  for (const element of body.querySelectorAll(".tab[data-tab], section[data-tab], div[data-tab]")) {
    if (element === panel) continue;

    if (!element.classList.contains("gvm-settlement-panel")) {
      element.classList.remove("active");
      element.style.display = "none";
    }
  }

  for (const tab of root.querySelectorAll("[data-tab]")) {
    if (tab === button) continue;
    tab.classList.remove("active");
  }

  panel.classList.add("active");
  panel.style.display = "";
  button.classList.add("active");
};

GVM.restorePanel = function restorePanel(panel) {
  if (!panel) return;
  panel.classList.remove("active");
  panel.style.display = "none";
};

GVM.injectSettlementTab = async function injectSettlementTab(app, html) {
  try {
    const actor = app.actor || app.document;

    if (!GVM.isSettlementActor(actor)) return;
    if (!actor.testUserPermission(game.user, "OBSERVER")) return;

    const root = GVM.getRoot(app, html);
    if (!root) return;

    if (root.querySelector(".gvm-settlement-tab-button")) return;

    const tabs = GVM.findTabs(root);
    const body = GVM.findBody(root);

    if (!tabs || !body) {
      console.warn(`${GVM.MODULE_ID} | Could not find group sheet tabs/body`);
      return;
    }

    const button = document.createElement("a");
    button.classList.add("item", "gvm-settlement-tab-button");
    button.dataset.tab = "gvm-settlement";
    button.dataset.group = "primary";
    button.innerHTML = `<i class="fas fa-fort-awesome"></i> Поселение`;

    const panel = document.createElement("section");
    panel.classList.add("tab", "gvm-settlement-panel");
    panel.dataset.tab = "gvm-settlement";
    panel.dataset.group = "primary";
    panel.dataset.gvmActorId = actor.id;
    panel.style.display = "none";

    tabs.appendChild(button);
    body.appendChild(panel);

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.hideOtherTabs(root, panel, button);
      await GVM.renderSettlementPanel(actor, panel);
    });

    for (const other of tabs.querySelectorAll("[data-tab]")) {
      if (other === button) continue;
      other.addEventListener("click", () => GVM.restorePanel(panel));
    }

    console.log(`${GVM.MODULE_ID} | Settlement tab injected into Group Actor ${actor.name}.`);
  } catch (err) {
    console.warn(`${GVM.MODULE_ID} | Failed to inject settlement tab`, err);
  }
};

GVM.refreshSettlement = function refreshSettlement(actor) {
  document.querySelectorAll(`[data-gvm-actor-id="${actor.id}"]`).forEach(panel => {
    GVM.renderSettlementPanel(actor, panel);
  });

  for (const app of Object.values(ui.windows || {})) {
    const doc = app.actor || app.document;
    if (doc?.id === actor.id) app.render(false);
  }
};

GVM.SettlementWindow = class SettlementWindow extends Application {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gvm-settlement-window",
      title: "Поселение",
      width: 1100,
      height: 820,
      resizable: true,
      classes: ["gvm-window"]
    });
  }

  async _renderInner() {
    const wrapper = document.createElement("section");
    wrapper.classList.add("gvm-window-body");
    wrapper.dataset.gvmActorId = this.actor.id;
    await GVM.renderSettlementPanel(this.actor, wrapper);
    return $(wrapper);
  }
};

GVM.firstSettlementActor = function firstSettlementActor() {
  return game.actors.find(actor => GVM.isSettlementActor(actor)) || null;
};

GVM.openSettlement = async function openSettlement(actor = null) {
  actor = actor || GVM.firstSettlementActor();

  if (!actor) {
    ui.notifications.warn("Не найден Group/Party Actor.");
    return;
  }

  await GVM.ensureSettlement(actor);
  new GVM.SettlementWindow(actor).render(true);
};
