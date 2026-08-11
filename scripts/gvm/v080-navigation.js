/**
 * Goblin Village Manager v0.8
 * Unified Navigation Layer
 *
 * This layer does not rewrite the whole settlement renderer yet.
 * It creates a native-feeling tab navigation on top of the current layout,
 * classifies existing sections, hides legacy noise, and prepares the UI for
 * the full v0.8 redesign.
 */

window.GVM = window.GVM || {};
GVM.V080 = GVM.V080 || {};

GVM.V080.NAV_TABS = [
  {
    id: "overview",
    label: "Обзор",
    icon: "fas fa-map",
    aliases: ["обзор", "управление", "resources", "ресурсы", "summary"]
  },
  {
    id: "buildings",
    label: "Здания",
    icon: "fas fa-dungeon",
    aliases: ["здания", "постройки", "buildings", "facilities", "обычные постройки", "особые постройки"]
  },
  {
    id: "residents",
    label: "НИПы",
    icon: "fas fa-user-friends",
    aliases: ["нипы", "ключевые нип", "ключевые жители", "residents", "key residents", "жители"]
  },
  {
    id: "orders",
    label: "Приказы",
    icon: "fas fa-scroll",
    aliases: ["приказы", "orders", "городские приказы", "личные приказы"]
  },
  {
    id: "abilities",
    label: "Бонусы и услуги",
    icon: "fas fa-wand-magic-sparkles",
    aliases: ["бонусы и услуги", "abilities", "services", "услуги", "бонусы", "богусы"]
  },
  {
    id: "journal",
    label: "Журнал",
    icon: "fas fa-book-open",
    aliases: ["журнал", "journal", "reports", "отчёты", "события"]
  }
];

GVM.v080GetActiveNavTab = function v080GetActiveNavTab(actor) {
  const settings = GVM.getSettings ? GVM.getSettings(actor) : {};
  const tab = settings?.ui?.activeTab || settings?.activeTab || "overview";
  return GVM.V080.NAV_TABS.some(item => item.id === tab) ? tab : "overview";
};

GVM.v080SetActiveNavTab = async function v080SetActiveNavTab(actor, tabId) {
  if (!actor || !GVM.getSettings || !GVM.setSettings) return;

  const settings = GVM.getSettings(actor);
  settings.ui = settings.ui || {};
  settings.ui.activeTab = tabId;

  await GVM.setSettings(actor, settings);

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.v080FindBoardRoot = function v080FindBoardRoot(root = document) {
  return (
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root.querySelector("[data-gvm-settlement-panel]") ||
    root
  );
};

GVM.v080RenderNav = function v080RenderNav(activeTab = "overview") {
  return `
    <nav class="gvm-v080-nav" data-gvm-v080-nav>
      ${GVM.V080.NAV_TABS.map(tab => `
        <button type="button"
          class="gvm-v080-nav-button ${tab.id === activeTab ? "active" : ""}"
          data-gvm-v080-tab="${GVM.escapeHtml(tab.id)}">
          <i class="${GVM.escapeHtml(tab.icon)}"></i>
          <span>${GVM.escapeHtml(tab.label)}</span>
        </button>
      `).join("")}
    </nav>
  `;
};

GVM.v080EnsureNavigation = function v080EnsureNavigation(actor, root = document) {
  const board = GVM.v080FindBoardRoot(root);
  if (!board) return;

  const active = GVM.v080GetActiveNavTab(actor);
  let nav = board.querySelector("[data-gvm-v080-nav]");

  if (!nav) {
    const html = GVM.v080RenderNav(active);

    const insertionPoint =
      board.querySelector(".gvm-resource-ribbon") ||
      board.querySelector(".gvm-resources") ||
      board.querySelector(".gvm-v080-nav-hint") ||
      board.querySelector("header") ||
      board.firstElementChild;

    if (insertionPoint && insertionPoint.insertAdjacentHTML) {
      insertionPoint.insertAdjacentHTML("afterend", html);
    } else {
      board.insertAdjacentHTML("afterbegin", html);
    }

    nav = board.querySelector("[data-gvm-v080-nav]");
  }

  nav.querySelectorAll("[data-gvm-v080-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.gvmV080Tab === active);

    if (button.dataset.gvmV080Bound) return;
    button.dataset.gvmV080Bound = "1";

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      await GVM.v080SetActiveNavTab(actor, button.dataset.gvmV080Tab);
    });
  });
};

GVM.v080Text = function v080Text(element) {
  return String(element?.textContent || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

GVM.v080SectionTitle = function v080SectionTitle(section) {
  return String(
    section.querySelector("h1, h2, h3, h4, .gvm-section-title, .title")?.textContent ||
    section.getAttribute("aria-label") ||
    section.dataset?.gvmSection ||
    ""
  ).toLowerCase().trim();
};

GVM.v080ClassifySection = function v080ClassifySection(section) {
  if (!section) return null;

  if (section.closest("[data-gvm-v080-nav]")) return "nav";
  if (section.classList.contains("gvm-v080-nav")) return "nav";

  const title = GVM.v080SectionTitle(section);
  const text = GVM.v080Text(section);
  const cls = String(section.className || "").toLowerCase();

  const has = value => title.includes(value) || cls.includes(value) || text.startsWith(value);

  if (
    cls.includes("journal") ||
    has("журнал") ||
    has("отчёт") ||
    has("reports") ||
    has("journal")
  ) return "journal";

  if (
    cls.includes("abilit") ||
    cls.includes("service") ||
    has("бонусы и услуги") ||
    has("способности") ||
    has("услуги") ||
    has("бонусы") ||
    has("богусы")
  ) return "abilities";

  if (
    cls.includes("resident") ||
    cls.includes("npc") ||
    has("ключевые жители") ||
    has("ключевые нип") ||
    has("нипы") ||
    has("жители") ||
    has("residents")
  ) return "residents";

  if (
    cls.includes("order") ||
    has("приказы") ||
    has("городские приказы") ||
    has("личные приказы") ||
    has("orders")
  ) return "orders";

  if (
    cls.includes("facility") ||
    cls.includes("building") ||
    has("здания") ||
    has("постройки") ||
    has("обычные постройки") ||
    has("особые постройки") ||
    has("facilities") ||
    has("buildings")
  ) return "buildings";

  if (
    cls.includes("management") ||
    cls.includes("resource") ||
    has("управление") ||
    has("ресурсы") ||
    has("обзор") ||
    has("summary")
  ) return "overview";

  return null;
};

GVM.v080GetContentSections = function v080GetContentSections(root = document) {
  const board = GVM.v080FindBoardRoot(root);
  if (!board) return [];

  const sections = Array.from(board.children).filter(element => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.matches("[data-gvm-v080-nav]")) return false;
    if (element.classList.contains("gvm-v080-nav")) return false;
    if (element.tagName.toLowerCase() === "header") return false;
    return true;
  });

  const deeper = Array.from(board.querySelectorAll(
    ".gvm-management-area, .gvm-abilities-section, .gvm-journal-section, .gvm-residents-section, .gvm-buildings-section, .gvm-facility-section, section"
  ));

  return Array.from(new Set([...sections, ...deeper])).filter(section => {
    if (!section.isConnected) return false;
    if (section.closest("[data-gvm-v080-nav]")) return false;
    if (section.classList.contains("gvm-v080-nav")) return false;
    return true;
  });
};

GVM.v080BuildOverviewPanel = function v080BuildOverviewPanel(actor, root = document) {
  const board = GVM.v080FindBoardRoot(root);
  if (!board) return;

  let panel = board.querySelector("[data-gvm-v080-overview-panel]");

  const resources = GVM.getResources ? GVM.getResources(actor) : {};
  const derived = GVM.calculateDerived ? GVM.calculateDerived(actor) : {};
  const settings = GVM.getSettings ? GVM.getSettings(actor) : {};

  const activeOrders = GVM.activeOrders ? GVM.activeOrders(actor) : [];
  const abilities = GVM.collectAvailableAbilities ? GVM.collectAvailableAbilities(actor, { includeUnavailable: true }) : [];
  const availableAbilities = abilities.filter(item => item.available).length;

  const html = `
    <section class="gvm-v080-overview-panel" data-gvm-v080-overview-panel data-gvm-v080-section="overview">
      <header class="gvm-v080-section-header">
        <div>
          <h3>Обзор поселения</h3>
          <p>Короткая сводка без технического шума.</p>
        </div>
      </header>

      <div class="gvm-v080-overview-grid">
        <article>
          <strong>${Number(settings.cycle || 0)}</strong>
          <span>цикл</span>
        </article>
        <article>
          <strong>${Number(resources.population || 0)}</strong>
          <span>население</span>
        </article>
        <article>
          <strong>${Number(resources.food || 0)}</strong>
          <span>еда</span>
        </article>
        <article>
          <strong>${Number(resources.treasury || 0)}</strong>
          <span>казна</span>
        </article>
        <article>
          <strong>${Number(derived.military || 0)}</strong>
          <span>оборона</span>
        </article>
        <article>
          <strong>${activeOrders.length}</strong>
          <span>городские приказы</span>
        </article>
        <article>
          <strong>${availableAbilities} / ${abilities.length}</strong>
          <span>способности</span>
        </article>
      </div>

      <div class="gvm-v080-overview-actions">
        <button type="button" class="gvm-control primary" data-gvm-v080-tab-jump="buildings">
          Здания
        </button>
        <button type="button" class="gvm-control secondary" data-gvm-v080-tab-jump="residents">
          НИПы
        </button>
        <button type="button" class="gvm-control secondary" data-gvm-v080-tab-jump="orders">
          Приказы
        </button>
        <button type="button" class="gvm-control secondary" data-gvm-v080-tab-jump="abilities">
          Бонусы и услуги
        </button>
      </div>
    </section>
  `;

  if (!panel) {
    const nav = board.querySelector("[data-gvm-v080-nav]");
    if (nav) nav.insertAdjacentHTML("afterend", html);
    else board.insertAdjacentHTML("afterbegin", html);
    panel = board.querySelector("[data-gvm-v080-overview-panel]");
  } else {
    panel.outerHTML = html;
    panel = board.querySelector("[data-gvm-v080-overview-panel]");
  }

  panel.querySelectorAll("[data-gvm-v080-tab-jump]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await GVM.v080SetActiveNavTab(actor, button.dataset.gvmV080TabJump);
    });
  });
};

GVM.v080ApplyTabVisibility = function v080ApplyTabVisibility(actor, root = document) {
  const active = GVM.v080GetActiveNavTab(actor);
  const sections = GVM.v080GetContentSections(root);

  for (const section of sections) {
    if (section.matches("[data-gvm-v080-overview-panel]")) {
      section.classList.toggle("gvm-v080-tab-hidden", active !== "overview");
      continue;
    }

    const group = section.dataset.gvmV080Section || GVM.v080ClassifySection(section);

    if (!group || group === "nav") continue;

    section.dataset.gvmV080Section = group;

    const shouldShow =
      group === active ||
      (active === "overview" && group === "overview");

    section.classList.toggle("gvm-v080-tab-hidden", !shouldShow);
  }

  const board = GVM.v080FindBoardRoot(root);
  if (board) {
    board.dataset.gvmV080ActiveTab = active;
  }
};

GVM.v080PolishNavigation = function v080PolishNavigation(actor, root = document) {
  try {
    GVM.v080EnsureNavigation(actor, root);
    GVM.v080BuildOverviewPanel(actor, root);
    GVM.v080ApplyTabVisibility(actor, root);
  } catch (err) {
    console.warn("GVM v0.8 navigation polish failed", err);
  }
};

GVM.originalRefreshSettlementV080Navigation = GVM.originalRefreshSettlementV080Navigation || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080Navigation(actor) {
  const result = GVM.originalRefreshSettlementV080Navigation(actor);

  setTimeout(() => {
    GVM.v080PolishNavigation(actor, document);
  }, 120);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080Navigation) {
  GVM.originalRenderSettlementPanelV080Navigation = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080Navigation(actor, panel) {
    await GVM.originalRenderSettlementPanelV080Navigation(actor, panel);

    GVM.v080PolishNavigation(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8 Navigation Layer loaded");
});
