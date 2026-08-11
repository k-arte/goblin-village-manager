import { getSettlementState, saveSettlementState, resetSettlementState } from "../core/settings.js";

export class SettlementApp extends Application {
  constructor(options = {}) {
    super(options);
    this.activeTab = "overview";
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gvm-settlement-app",
      title: "Поселение",
      width: 1000,
      height: 760,
      resizable: true,
      classes: ["gvm-app"]
    });
  }

  async getData() {
    return { state: await getSettlementState(), isGM: game.user.isGM };
  }

  async _renderInner(data) {
    return $(this._buildHtml(data.state, data.isGM));
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-tab]").on("click", ev => {
      this.activeTab = ev.currentTarget.dataset.tab;
      this.render(false);
    });
    html.find("[data-action='reset']").on("click", async () => {
      if (!game.user.isGM) return ui.notifications.warn("Только GM.");
      await resetSettlementState();
      this.render(false);
    });
  }

  _buildHtml(state, isGM) {
    const tabs = ["overview", "buildings", "orders", "reforms", "bonuses", "reports", "gm"];
    return `
      <section class="gvm-root">
        <header class="gvm-header">
          <h1>${state.name}</h1>
          <div>Цикл: ${state.cycle}</div>
        </header>
        <nav class="gvm-tabs">
          ${tabs.filter(t => t !== "gm" || isGM).map(t => `<button data-tab="${t}" class="${this.activeTab === t ? "active" : ""}">${t}</button>`).join("")}
        </nav>
        <main class="gvm-panel">
          ${this._tab(state, isGM)}
        </main>
      </section>`;
  }

  _tab(state, isGM) {
    if (this.activeTab === "overview") return `
      <h2>Обзор</h2>
      <div class="gvm-cards">
        ${Object.entries(state.resources).map(([k, v]) => `<article><h3>${k}</h3><b>${v}</b></article>`).join("")}
      </div>`;
    if (this.activeTab === "gm") return `<h2>GM</h2><button data-action="reset">Сбросить</button>`;
    return `<h2>${this.activeTab}</h2><p>Раздел зарезервирован для версии 0.2.</p>`;
  }
}
