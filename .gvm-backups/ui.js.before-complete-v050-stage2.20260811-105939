GVM.renderResourceCard = function renderResourceCard(label, value, hint) {
  return `
    <div class="gvm-resource">
      <h4>${GVM.escapeHtml(label)}</h4>
      <strong>${GVM.escapeHtml(value)}</strong>
      <span>${GVM.escapeHtml(hint || "")}</span>
    </div>
  `;
};

GVM.renderItemRow = function renderItemRow(item) {
  const data = GVM.gvmData(item);
  const kind = data.kind;
  const description = GVM.stripHtml(item.system?.description?.value || "");
  const img = item.img || GVM.SAFE_ICON;

  let subtitle = "";
  let meta = "";

  if (kind === GVM.KIND.BUILDING) {
    subtitle = `${GVM.BUILDING_TYPES[data.type] || data.type || "Здание"} · ${data.status || "unknown"} · L${Number(data.level || 0)}/${Number(data.maxLevel || 5)}`;
    meta = `Рабочие ${Number(data.workersAssigned || 0)}/${Number(data.workersRequired || 0)} · ${GVM.effectsLabel(data.effects || [])}`;
  } else if (kind === GVM.KIND.REFORM) {
    subtitle = `Реформа · ${data.active ? "активна" : "выключена"} · интервал ${Number(data.interval || 1)}`;
    meta = GVM.effectsLabel(data.effects || []);
  } else if (kind === GVM.KIND.ORDER) {
    subtitle = `Приказ · ${data.status || "unknown"} · ${Number(data.progress || 0)}/${Number(data.duration || 1)}`;
    meta = `Стоимость: ${GVM.effectsLabel(data.cost || [])} · Итог: ${GVM.effectsLabel(data.effectsOnComplete || [])}`;
  } else if (kind === GVM.KIND.BONUS) {
    subtitle = `Бонус · ${data.active ? `активен, осталось ${Number(data.remaining || 0)}` : "неактивен"}`;
    meta = `Цена: ${GVM.effectsLabel(data.cost || [])} · ${GVM.effectsLabel(data.effects || [])}`;
  }

  return `
    <li class="gvm-item-row" data-item-id="${item.id}">
      " alt="">
      <div class="gvm-item-main">
        <div class="gvm-item-title">${GVM.escapeHtml(item.name)}</div>
        <div class="gvm-item-subtitle">${GVM.escapeHtml(subtitle)}</div>
        ${description ? `<div class="gvm-item-desc">${GVM.escapeHtml(description).slice(0, 180)}</div>` : ""}
        <div class="gvm-item-meta">${GVM.escapeHtml(meta)}</div>
      </div>
      <div class="gvm-item-controls">
        <button type="button" class="gvm-icon" data-gvm-control="sheet" title="Item Sheet">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="gvm-icon" data-gvm-control="json" title="GVM JSON">
          <i class="fas fa-code"></i>
        </button>
      </div>
    </li>
  `;
};

GVM.renderSection = function renderSection(title, kind, items) {
  return `
    <section class="gvm-section gvm-drop-zone" data-gvm-drop-kind="${kind}">
      <header class="gvm-section-header">
        <h3>${GVM.escapeHtml(title)}</h3>
        <span>${items.length}</span>
      </header>
      <ol class="gvm-item-list">
        ${items.length ? items.map(GVM.renderItemRow).join("") : `<li class="gvm-empty">Перетащите Item сюда или создайте новый.</li>`}
      </ol>
    </section>
  `;
};

GVM.renderReports = function renderReports(settings) {
  const reports = settings.reports || [];

  if (!reports.length) {
    return `<li class="gvm-empty">Отчётов пока нет.</li>`;
  }

  return reports.map(report => {
    const lines = (report.items || []).filter(line => GVM.isGM() || !String(line).startsWith("Скрыто"));
    return `
      <li>
        <strong>${GVM.escapeHtml(report.title)}</strong>
        <ul>
          ${lines.map(line => `<li>${GVM.escapeHtml(line)}</li>`).join("")}
        </ul>
      </li>
    `;
  }).join("");
};

GVM.renderSettlementPanel = async function renderSettlementPanel(actor, panel) {
  await GVM.ensureSettlement(actor);

  const resources = GVM.getResources(actor);
  const settings = GVM.getSettings(actor);
  const derived = GVM.calculateDerived(actor);
  const hidden = settings.hiddenFromPlayers && !GVM.isGM();

  const threatText = GVM.isGM()
    ? resources.threat
    : settings.scouting.known
      ? `${settings.scouting.threatMin}-${settings.scouting.threatMax}`
      : "неизвестно";

  panel.innerHTML = `
    <div class="gvm-root" data-gvm-actor-id="${actor.id}">
      <header class="gvm-top">
        <div>
          <h2>${GVM.escapeHtml(actor.name)}: Поселение</h2>
          <p>Цикл ${Number(settings.cycle || 0)} · Проекты ${Number(derived.activeOrders || 0)}/${Number(derived.projectCapacity || 1)}</p>
        </div>
        <div class="gvm-top-actions">
          ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="next-cycle">Следующий цикл</button>` : ""}
          ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="init-defaults">Создать стартовые Items</button>` : ""}
          ${GVM.isGM() ? `<button type="button" class="gvm-control" data-gvm-control="toggle-hidden">${settings.hiddenFromPlayers ? "Показать игрокам" : "Скрыть от игроков"}</button>` : ""}
        </div>
      </header>

      <div class="gvm-resources">
        ${GVM.renderResourceCard("Население", hidden ? "примерно" : resources.population, "рабочая сила")}
        ${GVM.renderResourceCard("Еда", hidden ? "скрыто" : resources.food, `лимит ${derived.foodCapacity}`)}
        ${GVM.renderResourceCard("Казна", hidden ? "скрыто" : resources.treasury, `лимит ${derived.treasuryCapacity}`)}
        ${GVM.renderResourceCard("Военная сила", hidden ? "скрыто" : derived.military, "оборона")}
        ${GVM.renderResourceCard("Лояльность", hidden ? "примерно" : resources.loyalty, "0-100")}
        ${GVM.renderResourceCard("Привлекательность", hidden ? "скрыто" : derived.attractiveness, "миграция")}
        ${GVM.renderResourceCard("Угроза", threatText, "разведка / GM")}
      </div>

      ${GVM.isGM() ? `
        <div class="gvm-create-bar">
          <button type="button" class="gvm-control" data-gvm-control="create-building">Создать здание</button>
          <button type="button" class="gvm-control" data-gvm-control="create-reform">Создать реформу</button>
          <button type="button" class="gvm-control" data-gvm-control="create-order">Создать приказ</button>
          <button type="button" class="gvm-control" data-gvm-control="create-bonus">Создать бонус</button>
        </div>
      ` : ""}

      ${GVM.renderSection("Здания", GVM.KIND.BUILDING, GVM.buildings(actor))}
      ${GVM.renderSection("Реформы", GVM.KIND.REFORM, GVM.reforms(actor))}
      ${GVM.renderSection("Приказы / проекты", GVM.KIND.ORDER, GVM.orders(actor))}
      ${GVM.renderSection("Бонусы", GVM.KIND.BONUS, GVM.bonuses(actor))}

      <section class="gvm-section">
        <header class="gvm-section-header">
          <h3>Отчёты</h3>
          <span>${settings.reports?.length || 0}</span>
        </header>
        <ol class="gvm-report-list">
          ${GVM.renderReports(settings)}
        </ol>
      </section>
    </div>
  `;

  GVM.activatePanel(actor, panel);
};

GVM.activatePanel = function activatePanel(actor, panel) {
  panel.querySelectorAll("[data-gvm-control]").forEach(element => {
    element.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const control = element.dataset.gvmControl;
      const row = element.closest("[data-item-id]");
      const item = row ? actor.items.get(row.dataset.itemId) : null;

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
      } else if (control === "sheet" && item) {
        item.sheet?.render(true);
      } else if (control === "json" && item) {
        GVM.editGvmData(actor, item);
      }
    });
  });

  panel.querySelectorAll(".gvm-item-row").forEach(row => {
    row.addEventListener("click", event => {
      if (event.target.closest("[data-gvm-control]")) return;
      const item = actor.items.get(row.dataset.itemId);
      if (item) GVM.itemActionDialog(actor, item);
    });

    row.addEventListener("contextmenu", event => {
      event.preventDefault();
      const item = actor.items.get(row.dataset.itemId);
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
