GVM.BASIC_FACILITY_NAME_HINTS = [
  "bedroom",
  "kitchen",
  "parlor",
  "parlour",
  "dining",
  "sitting",
  "storage",
  "store room",
  "pantry",
  "bath",
  "quarters",
  "гостиная",
  "спальня",
  "личная комната",
  "кухня",
  "кладовая",
  "бытов",
  "комната отдыха"
];

GVM.SPECIAL_FACILITY_NAME_HINTS = [
  "barrack",
  "barracks",
  "gaming hall",
  "casino",
  "greenhouse",
  "smithy",
  "forge",
  "temple",
  "sanctuary",
  "sacristy",
  "war room",
  "laboratory",
  "library",
  "arcane",
  "stable",
  "workshop",
  "theater",
  "trophy",
  "pub",
  "guildhall",
  "observatory",
  "training",
  "menagerie",
  "кaзарм",
  "казарм",
  "играль",
  "казино",
  "теплиц",
  "кузн",
  "храм",
  "святилищ",
  "военная комната",
  "лаборатор",
  "библиотек",
  "стабильн",
  "мастерск",
  "театр",
  "трофейн",
  "паб",
  "обсерватор"
];

GVM.STATUS_LABELS = GVM.STATUS_LABELS || {
  locked: "Закрыто",
  available: "Доступно",
  underConstruction: "Строится",
  built: "Построено",
  disabled: "Отключено",
  damaged: "Повреждено",
  destroyed: "Разрушено",
  active: "Активно",
  inactive: "Неактивно",
  completed: "Завершено",
  failed: "Провалено",
  cancelled: "Отменено"
};

GVM.getSafeArtUrl = function getSafeArtUrl(value) {
  const raw = String(value || GVM.SAFE_ICON);
  return raw.replace(/["'()\\]/g, "");
};

GVM.getFacilityStatusLabel = function getFacilityStatusLabel(data) {
  return GVM.STATUS_LABELS[data.status] || data.status || "unknown";
};

GVM.getFacilityTypeLabel = function getFacilityTypeLabel(data) {
  return GVM.BUILDING_TYPES[data.type] || data.type || "Постройка";
};

GVM.isSpecialFacility = function isSpecialFacility(item) {
  const data = GVM.gvmData(item);

  if (data.facilityCategory === "special") return true;
  if (data.facilityCategory === "basic") return false;
  if (data.isSpecialFacility === true) return true;
  if (data.isSpecialFacility === false) return false;

  const name = String(item.name || "").toLowerCase();
  const type = String(data.type || "").toLowerCase();

  if (GVM.SPECIAL_FACILITY_NAME_HINTS.some(hint => name.includes(hint))) return true;
  if (GVM.BASIC_FACILITY_NAME_HINTS.some(hint => name.includes(hint))) return false;

  const specialTypes = new Set(["military", "crafting", "religion", "arcane", "laboratory", "special"]);
  if (specialTypes.has(type)) return true;

  return false;
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

GVM.sectionIsCollapsed = function sectionIsCollapsed(actor, key) {
  return localStorage.getItem(`gvm.${actor.id}.collapsed.${key}`) === "true";
};

GVM.setSectionCollapsed = function setSectionCollapsed(actor, key, collapsed) {
  localStorage.setItem(`gvm.${actor.id}.collapsed.${key}`, collapsed ? "true" : "false");
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
      ${services.slice(0, 7).map(service => `<span>${GVM.escapeHtml(service)}</span>`).join("")}
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

        <button type="button" class="gvm-facility-action action-primary" data-gvm-control="facility-actions" title="Функции">
          <i class="fas fa-hammer"></i>
        </button>
      </header>

      ${GVM.renderFacilitySlots(facility.slots)}
      
      ${GVM.renderFacilityServices(facility.services)}
    </article>
  `;
};

GVM.renderFacilityColumn = function renderFacilityColumn(actor, key, title, icon, facilities, counterText) {
  const collapsed = GVM.sectionIsCollapsed(actor, key);

  return `
    <section class="gvm-bastion-column" data-gvm-section="${GVM.escapeHtml(key)}">
      <header class="gvm-column-header">
        <button type="button" class="gvm-collapse-button" data-gvm-control="toggle-section" data-gvm-section-key="${GVM.escapeHtml(key)}">
          <i class="fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}"></i>
        </button>
        <h3><i class="${GVM.escapeHtml(icon)}"></i> ${GVM.escapeHtml(title)}</h3>
        ${counterText ? `<span>${GVM.escapeHtml(counterText)}</span>` : ""}
      </header>

      ${collapsed ? "" : `
        <div class="gvm-facility-list gvm-drop-zone" data-gvm-drop-kind="${GVM.KIND.BUILDING}">
          ${facilities.length ? facilities.map(GVM.renderFacilityCard).join("") : `<div class="gvm-empty-card">Нет построек.</div>`}

          ${GVM.isGM() ? `
            <button type="button" class="gvm-build-placeholder" data-gvm-control="create-building">
              Возвести постройку
            </button>
          ` : ""}
        </div>
      `}
    </section>
  `;
};

GVM.orderIsTemplate = function orderIsTemplate(item) {
  const data = GVM.gvmData(item);
  return data.orderMode === "template" || data.template === true;
};

GVM.orderIsActive = function orderIsActive(item) {
  const data = GVM.gvmData(item);
  return data.status === "active" || data.status === "upgrade" || data.status === "building";
};

GVM.renderManagementCard = function renderManagementCard(actor, item, kind) {
  const data = GVM.gvmData(item);
  let statusClass = "neutral";
  let subtitle = "";
  let meta = "";

  if (kind === GVM.KIND.REFORM) {
    statusClass = data.active ? "active" : "inactive";
    subtitle = data.active ? "Активная реформа" : "Неактивная реформа";
    meta = GVM.effectsLabel(data.effects || []);
  }

  else if (kind === GVM.KIND.ORDER) {
    statusClass = GVM.orderIsActive(item) ? "active" : "template";
    subtitle = GVM.orderIsTemplate(item) ? "Шаблон приказа" : `${data.status || "unknown"} · ${Number(data.progress || 0)}/${Number(data.duration || 1)}`;
    meta = data.description || GVM.effectsLabel(data.effectsOnComplete || []);
  }

  else if (kind === GVM.KIND.BONUS) {
    statusClass = data.reward?.uuid ? "reward" : "inactive";
    subtitle = data.reward?.name ? `Награда: ${data.reward.name}` : "Награда не назначена";
    const cost = GVM.getBonusCost ? GVM.getBonusCost(data) : { stat: "treasury", value: 0 };
    meta = `Цена: ${GVM.STAT_LABELS[cost.stat] || cost.stat} ${Number(cost.value || 0)}`;
  }

  return `
    <article class="gvm-management-card ${statusClass}" data-item-id="${GVM.escapeHtml(item.id)}">
      <div class="gvm-management-card-main">
        <h4>${GVM.escapeHtml(item.name)}</h4>
        <span>${GVM.escapeHtml(subtitle)}</span>
        <p>${GVM.escapeHtml(meta || "—")}</p>
      </div>
      <div class="gvm-management-card-actions">
        ${kind === GVM.KIND.ORDER && GVM.orderIsTemplate(item) ? `
          <button type="button" class="gvm-mini-button primary" data-gvm-control="start-order-template">Запустить</button>
        ` : ""}
        ${kind === GVM.KIND.BONUS ? `
          <button type="button" class="gvm-mini-button primary" data-gvm-control="activate-bonus">Получить</button>
        ` : ""}
        <button type="button" class="gvm-mini-button secondary" data-gvm-control="configure-item">Настроить</button>
      </div>
    </article>
  `;
};

GVM.renderCollapsibleManagementSection = function renderCollapsibleManagementSection(actor, key, title, items, kind) {
  if (!items.length) return "";

  const collapsed = GVM.sectionIsCollapsed(actor, key);

  return `
    <section class="gvm-management-section ${kind}" data-gvm-section="${GVM.escapeHtml(key)}">
      <header class="gvm-management-section-header">
        <button type="button" class="gvm-collapse-button" data-gvm-control="toggle-section" data-gvm-section-key="${GVM.escapeHtml(key)}">
          <i class="fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}"></i>
        </button>
        <h3>${GVM.escapeHtml(title)}</h3>
        <span>${items.length}</span>
      </header>

      ${collapsed ? "" : `
        <div class="gvm-management-list">
          ${items.map(item => GVM.renderManagementCard(actor, item, kind)).join("")}
        </div>
      `}
    </section>
  `;
};

GVM.renderManagementArea = function renderManagementArea(actor) {
  const activeOrders = GVM.orders(actor).filter(GVM.orderIsActive);
  const orderTemplates = GVM.orders(actor).filter(GVM.orderIsTemplate);
  const reforms = GVM.reforms(actor);
  const bonuses = GVM.bonuses(actor);

  return `
    <section class="gvm-management-area">
      <header class="gvm-management-title">
        <h3>Управление поселением</h3>
      </header>

      ${GVM.isGM() ? `
        <div class="gvm-management-actions">
          <button type="button" class="gvm-control primary" data-gvm-control="next-cycle">Следующий цикл</button>
          <button type="button" class="gvm-control secondary" data-gvm-control="rename-settlement">Переименовать</button>
          <button type="button" class="gvm-control secondary" data-gvm-control="create-order">Создать приказ</button>
          <button type="button" class="gvm-control secondary" data-gvm-control="create-reform">Создать реформу</button>
          <button type="button" class="gvm-control secondary" data-gvm-control="create-bonus">Создать бонус</button>
          <button type="button" class="gvm-control muted" data-gvm-control="init-defaults">Стартовые Items</button>
          <button type="button" class="gvm-control muted" data-gvm-control="toggle-hidden">Скрытие: ${GVM.getSettings(actor).hiddenFromPlayers ? "вкл" : "выкл"}</button>
        </div>
      ` : ""}

      ${GVM.renderCollapsibleManagementSection(actor, "active-orders", "Активные приказы", activeOrders, GVM.KIND.ORDER)}
      ${GVM.renderCollapsibleManagementSection(actor, "order-templates", "Доступные приказы", orderTemplates, GVM.KIND.ORDER)}
      ${GVM.renderCollapsibleManagementSection(actor, "reforms", "Реформы", reforms, GVM.KIND.REFORM)}
      ${GVM.renderCollapsibleManagementSection(actor, "bonuses", "Бонусы", bonuses, GVM.KIND.BONUS)}
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
        <h1>${GVM.escapeHtml(GVM.getSettlementName(actor))}</h1>
      </header>

      ${GVM.renderKeyResidentsSection(actor)}

      <section class="gvm-resource-ribbon">
        <span>Население: ${GVM.escapeHtml(hidden ? "примерно" : resources.population)}</span>
        <span>Еда: ${GVM.escapeHtml(hidden ? "скрыто" : resources.food)}</span>
        <span>Казна: ${GVM.escapeHtml(hidden ? "скрыто" : resources.treasury)}</span>
        <span>Военная сила: ${GVM.escapeHtml(hidden ? "скрыто" : derived.military)}</span>
        <span>Лояльность: ${GVM.escapeHtml(hidden ? "примерно" : resources.loyalty)}</span>
        <span>Привлекательность: ${GVM.escapeHtml(hidden ? "скрыто" : derived.attractiveness)}</span>
        <span>Угроза: ${GVM.escapeHtml(threatText)}</span>
        <span>Цикл: ${Number(settings.cycle || 0)}</span>
      </section>

      ${GVM.renderManagementArea(actor)}

      <div class="gvm-bastion-columns">
        ${GVM.renderFacilityColumn(actor, "common-buildings", "Обычные постройки", "fas fa-chess-rook", commonBuildings, "")}
        ${GVM.renderFacilityColumn(actor, "special-buildings", "Особые постройки", "fas fa-landmark", specialBuildings, `${specialBuildings.length} / ${specialMax}`)}
      </div>
    </section>
  `;

  GVM.applyFacilityBackgrounds(panel);
  GVM.syncThemeAccent(panel);
  GVM.activateResidentsPanel(actor, panel);
  GVM.activatePanel(actor, panel);
};

GVM.applyFacilityBackgrounds = function applyFacilityBackgrounds(panel) {
  panel.querySelectorAll(".gvm-facility-card[data-item-id]").forEach(card => {
    const style = card.getAttribute("style") || "";
    if (style.includes("--gvm-card-art")) return;
  });
};

GVM.renameSettlement = function renameSettlement(actor) {
  new Dialog({
    title: "Переименовать поселение",
    content: `
      <form>
        <div class="form-group">
          <label>Название</label>
          <input type="text" name="name" value="${GVM.escapeHtml(actor.name)}">
        </div>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const name = String(html.find("[name=name]").val() || "").trim();
          if (!name) return;
          await actor.update({ name });
          GVM.queueRefresh(actor);
        }
      }
    }
  }).render(true);
};

GVM.startOrderTemplate = async function startOrderTemplate(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));

  await GVM.createOrder(actor, {
    name: item.name,
    description: data.description || "",
    duration: Number(data.duration || 1),
    cost: data.cost || [],
    effectsOnComplete: data.effectsOnComplete || [],
    action: data.action || "custom",
    targetItemId: data.targetItemId || null
  });
};

GVM.activatePanel = function activatePanel(actor, panel) {
  panel.querySelectorAll("[data-gvm-control]").forEach(element => {
    element.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const control = element.dataset.gvmControl;
      const itemRoot = element.closest("[data-item-id]");
      const item = itemRoot ? actor.items.get(itemRoot.dataset.itemId) : null;

      if (control === "next-cycle") {
        await GVM.advanceCycle(actor);
      } else if (control === "init-defaults") {
        await GVM.initializeDefaults(actor);
      } else if (control === "toggle-hidden") {
        const settings = GVM.getSettings(actor);
        settings.hiddenFromPlayers = !settings.hiddenFromPlayers;
        await GVM.setSettings(actor, settings);
        GVM.queueRefresh(actor);
      } else if (control === "rename-settlement") {
        GVM.renameSettlement(actor);
      } else if (control === "create-building") {
        const column = element.closest(".gvm-bastion-column");
        const title = column?.querySelector("h3")?.innerText || "";
        const category = /особ/i.test(title) ? GVM.FACILITY_CATEGORY.SPECIAL : GVM.FACILITY_CATEGORY.BASIC;
        GVM.openBuildFacilityPicker(actor, category);
      } else if (control === "create-reform") {
        GVM.createReformDialog(actor);
      } else if (control === "create-order") {
        GVM.createOrderDialog(actor);
      } else if (control === "create-bonus") {
        GVM.createBonusDialog(actor);
      } else if (control === "facility-actions" && item) {
        GVM.openActionPopover ? GVM.openActionPopover(actor, item, element || event.currentTarget) : GVM.itemActionDialog(actor, item);
      } else if (control === "configure-item" && item) {
        GVM.openConfigForItem(actor, item);
      } else if (control === "activate-bonus" && item) {
        await GVM.activateBonus(actor, item);
      } else if (control === "start-order-template" && item) {
        await GVM.startOrderTemplate(actor, item);
      } else if (control === "create-resident-ability") {
        const residentCard = element.closest("[data-resident-id]");
        if (residentCard) GVM.openAbilityBuilder(actor, { sourceType: "resident", residentId: residentCard.dataset.residentId });
      } else if (control === "configure-resident") {
        const residentCard = element.closest("[data-resident-id]");
        if (residentCard) GVM.openResidentConfig(actor, residentCard.dataset.residentId);
      } else if (control === "remove-resident") {
        const residentCard = element.closest("[data-resident-id]");
        if (residentCard) await GVM.removeResident(actor, residentCard.dataset.residentId);
      } else if (control === "toggle-section") {
        const key = element.dataset.gvmSectionKey;
        const collapsed = GVM.sectionIsCollapsed(actor, key);
        GVM.setSectionCollapsed(actor, key, !collapsed);
        GVM.queueRefresh(actor);
      }
    });
  });

  panel.querySelectorAll(".gvm-facility-card[data-item-id], .gvm-management-card[data-item-id]").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-gvm-control]")) return;

      const item = actor.items.get(card.dataset.itemId);
      if (item && card.classList.contains("gvm-facility-card")) GVM.toggleInlineActionDrawer ? GVM.toggleInlineActionDrawer(actor, item, card) : GVM.itemActionDialog(actor, item, card);
      else if (item) GVM.openConfigForItem(actor, item);
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

GVM.activateSettlementTabOnly = function activateSettlementTabOnly(root, panel, button) {
  const body = GVM.findBody(root) || root;

  for (const element of body.querySelectorAll(".tab[data-tab], section[data-tab], div[data-tab]")) {
    if (element === panel) continue;
    if (!element.classList.contains("gvm-settlement-panel")) element.classList.remove("active");
  }

  for (const tab of root.querySelectorAll("[data-tab]")) {
    if (tab === button) continue;
    tab.classList.remove("active");
  }

  panel.classList.add("active");
  panel.style.removeProperty("display");
  button.classList.add("active");
};

GVM.restorePanel = function restorePanel(panel) {
  if (!panel) return;
  panel.classList.remove("active");
  panel.style.removeProperty("display");
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

    tabs.appendChild(button);
    body.appendChild(panel);

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.activateSettlementTabOnly(root, panel, button);
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
