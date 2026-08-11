GVM.parseLines = function parseLines(value) {
  return String(value || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
};

GVM.parseEffectLines = function parseEffectLines(value, defaultTiming = "passive") {
  return GVM.parseLines(value).map(line => {
    const parts = line.split(",").map(part => part.trim());
    return {
      stat: parts[0] || "treasury",
      value: Number(parts[1]) || 0,
      timing: parts[2] || defaultTiming
    };
  });
};

GVM.effectLines = function effectLines(effects = []) {
  return (effects || []).map(effect => {
    return `${effect.stat || "treasury"}, ${Number(effect.value) || 0}, ${effect.timing || "passive"}`;
  }).join("\n");
};

GVM.simpleLines = function simpleLines(values = []) {
  return (values || []).map(value => {
    if (typeof value === "string") return value;
    return value.label || value.name || String(value);
  }).join("\n");
};

GVM.parseBoonLines = function parseBoonLines(value) {
  return GVM.parseLines(value).map(line => ({
    label: line
  }));
};

GVM.ConfigApp = class GVMConfigApp extends Application {
  constructor(actor, item, options = {}) {
    super(options);
    this.actor = actor;
    this.item = item;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gvm-config-app",
      title: "GVM Config",
      width: 720,
      height: "auto",
      resizable: true,
      classes: ["gvm-config-app"]
    });
  }

  get title() {
    return `${this.item.name}: настройка`;
  }

  async _renderInner() {
    const data = GVM.gvmData(this.item);
    const kind = data.kind;

    let content = "";

    if (kind === GVM.KIND.BUILDING) content = this._buildingForm(data);
    else if (kind === GVM.KIND.REFORM) content = this._reformForm(data);
    else if (kind === GVM.KIND.ORDER) content = this._orderForm(data);
    else if (kind === GVM.KIND.BONUS) content = this._bonusForm(data);
    else content = `<p>Этот предмет не является GVM Item.</p>`;

    return $(`
      <form class="gvm-config-form">
        <header class="gvm-config-header">
          " alt="">
          <div>
            <h2>${GVM.escapeHtml(this.item.name)}</h2>
            <p>${GVM.escapeHtml(kind || "unknown")}</p>
          </div>
        </header>

        ${content}

        <footer class="gvm-config-footer">
          <button type="submit" class="gvm-control">Сохранить</button>
          open-sheetОткрыть Item Sheet</button>
        </footer>
      </form>
    `);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("form.gvm-config-form").on("submit", async event => {
      event.preventDefault();
      await this._save(html);
    });

    html.find("[data-gvm-config-action='open-sheet']").on("click", event => {
      event.preventDefault();
      this.item.sheet?.render(true);
    });

    html.find("[data-gvm-config-action='drop-reward-clear']").on("click", async event => {
      event.preventDefault();
      const data = GVM.clone(GVM.gvmData(this.item));
      data.reward = null;
      await this.item.setFlag(GVM.FLAG_SCOPE, "data", data);
      this.render(false);
      GVM.refreshSettlement(this.actor);
    });

    html.find(".gvm-reward-drop").on("dragover", event => {
      event.preventDefault();
      html.find(".gvm-reward-drop").addClass("dragover");
    });

    html.find(".gvm-reward-drop").on("dragleave", () => {
      html.find(".gvm-reward-drop").removeClass("dragover");
    });

    html.find(".gvm-reward-drop").on("drop", async event => {
      event.preventDefault();
      html.find(".gvm-reward-drop").removeClass("dragover");
      await this._handleRewardDrop(event.originalEvent || event);
    });
  }

  _field(name, label, value, type = "text") {
    return `
      <label class="gvm-config-field">
        <span>${GVM.escapeHtml(label)}</span>
        <input type="${type}" name="${GVM.escapeHtml(name)}" value="${GVM.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  _select(name, label, value, options) {
    return `
      <label class="gvm-config-field">
        <span>${GVM.escapeHtml(label)}</span>
        <select name="${GVM.escapeHtml(name)}">
          ${options.map(option => {
            const selected = option.value === value ? "selected" : "";
            return `<option value="${GVM.escapeHtml(option.value)}" ${selected}>${GVM.escapeHtml(option.label)}</option>`;
          }).join("")}
        </select>
      </label>
    `;
  }

  _textarea(name, label, value, hint = "") {
    return `
      <label class="gvm-config-field gvm-config-wide">
        <span>${GVM.escapeHtml(label)}</span>
        ${hint ? `<small>${GVM.escapeHtml(hint)}</small>` : ""}
        <textarea name="${GVM.escapeHtml(name)}">${GVM.escapeHtml(value || "")}</textarea>
      </label>
    `;
  }

  _buildingForm(data) {
    const typeOptions = Object.entries(GVM.BUILDING_TYPES).map(([value, label]) => ({ value, label }));
    const statusOptions = [
      { value: "locked", label: "Закрыто" },
      { value: "available", label: "Доступно" },
      { value: "underConstruction", label: "Строится" },
      { value: "built", label: "Построено" },
      { value: "disabled", label: "Отключено" },
      { value: "damaged", label: "Повреждено" },
      { value: "destroyed", label: "Разрушено" }
    ];

    return `
      <section class="gvm-config-section">
        <h3>Основное</h3>
        <div class="gvm-config-grid">
          ${this._select("type", "Тип здания", data.type || "special", typeOptions)}
          ${this._select("status", "Статус", data.status || "available", statusOptions)}
          ${this._field("level", "Уровень", Number(data.level || 0), "number")}
          ${this._field("maxLevel", "Макс. уровень", Number(data.maxLevel || 5), "number")}
          ${this._field("unlockLevel", "Уровень открытия", Number(data.unlockLevel || 5), "number")}
          ${this._field("workersRequired", "Рабочие требуются", Number(data.workersRequired || 0), "number")}
          ${this._field("workersAssigned", "Рабочие назначены", Number(data.workersAssigned || 0), "number")}
          ${this._field("art", "Фоновая картинка карточки", data.art || "")}
        </div>
        ${this._textarea("note", "Описание / заметка", data.note || "")}
      </section>

      <section class="gvm-config-section">
        <h3>Эффекты и содержание</h3>
        ${this._textarea("effects", "Эффекты", GVM.effectLines(data.effects || []), "Формат: stat, value, timing. Например: treasury, 8, perCycle")}
        ${this._textarea("upkeep", "Содержание", GVM.effectLines(data.upkeep || []), "Формат: stat, value, timing. Например: treasury, -2, perCycle")}
      </section>

      <section class="gvm-config-section">
        <h3>Сервисы и Boons</h3>
        ${this._textarea("services", "Сервисы", GVM.simpleLines(data.services || []), "Один сервис на строку.")}
        ${this._textarea("boons", "Boons", GVM.simpleLines(data.boons || []), "Один boon на строку.")}
      </section>
    `;
  }

  _reformForm(data) {
    return `
      <section class="gvm-config-section">
        <h3>Реформа</h3>
        <div class="gvm-config-grid">
          <label class="gvm-config-field">
            <span>Активна</span>
            <input type="checkbox" name="active" ${data.active ? "checked" : ""}>
          </label>
          ${this._field("interval", "Интервал", Number(data.interval || 1), "number")}
          ${this._field("tick", "Текущий tick", Number(data.tick || 0), "number")}
        </div>
        ${this._textarea("description", "Описание", data.description || "")}
        ${this._textarea("effects", "Эффекты", GVM.effectLines(data.effects || []), "Формат: stat, value, timing.")}
      </section>
    `;
  }

  _orderForm(data) {
    const statusOptions = [
      { value: "active", label: "Активен" },
      { value: "completed", label: "Завершён" },
      { value: "failed", label: "Провален" },
      { value: "cancelled", label: "Отменён" }
    ];

    return `
      <section class="gvm-config-section">
        <h3>Приказ</h3>
        <div class="gvm-config-grid">
          ${this._select("status", "Статус", data.status || "active", statusOptions)}
          ${this._field("progress", "Прогресс", Number(data.progress || 0), "number")}
          ${this._field("duration", "Длительность", Number(data.duration || 1), "number")}
          ${this._field("action", "Action", data.action || "custom")}
          ${this._field("targetItemId", "Target Item ID", data.targetItemId || "")}
        </div>
        ${this._textarea("description", "Описание", data.description || "")}
        ${this._textarea("cost", "Стоимость", GVM.effectLines(data.cost || []), "Формат: stat, value, timing.")}
        ${this._textarea("effectsOnComplete", "Эффекты при завершении", GVM.effectLines(data.effectsOnComplete || []), "Формат: stat, value, timing.")}
      </section>
    `;
  }

  _bonusForm(data) {
    const reward = data.reward || {};
    const cost = data.cost || { stat: "treasury", value: 0 };

    return `
      <section class="gvm-config-section">
        <h3>Бонус: цена → награда</h3>
        <div class="gvm-config-grid">
          ${this._field("source", "Источник", data.source || "")}
          ${this._field("costStat", "Стат оплаты", cost.stat || "treasury")}
          ${this._field("costValue", "Цена", Number(cost.value || 0), "number")}
          ${this._field("rewardUuid", "Reward UUID / ID", reward.uuid || "")}
          ${this._field("rewardQuantity", "Количество", Number(reward.quantity || 1), "number")}
          ${this._field("rewardTarget", "Цель награды", reward.target || "group")}
        </div>

        <div class="gvm-reward-drop">
          <strong>Перетащите Item-награду сюда</strong>
          <p>${reward.name ? `${GVM.escapeHtml(reward.name)} (${GVM.escapeHtml(reward.uuid || "")})` : "Награда не назначена."}</p>
          drop-reward-clearОчистить награду</button>
        </div>

        ${this._textarea("description", "Описание", data.description || "")}
      </section>
    `;
  }

  async _handleRewardDrop(event) {
    const dragData = GVM.getDragData(event);
    let dropped = null;

    if (dragData.uuid) dropped = await fromUuid(dragData.uuid);
    else if (dragData.type === "Item" && dragData.id) dropped = game.items.get(dragData.id);

    if (!dropped || dropped.documentName !== "Item") {
      ui.notifications.warn("Можно назначить награду только из Item.");
      return;
    }

    const data = GVM.clone(GVM.gvmData(this.item));

    data.reward = {
      uuid: dropped.uuid,
      name: dropped.name,
      img: dropped.img || GVM.SAFE_ICON,
      quantity: Number(data.reward?.quantity || 1),
      target: data.reward?.target || "group"
    };

    await this.item.setFlag(GVM.FLAG_SCOPE, "data", data);
    this.render(false);
    GVM.refreshSettlement(this.actor);
  }

  async _save(html) {
    const form = html.find("form.gvm-config-form")[0];
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    const data = GVM.clone(GVM.gvmData(this.item));

    if (data.kind === GVM.KIND.BUILDING) {
      data.type = values.type || "special";
      data.status = values.status || "available";
      data.level = Number(values.level) || 0;
      data.maxLevel = Number(values.maxLevel) || 5;
      data.unlockLevel = Number(values.unlockLevel) || 5;
      data.workersRequired = Number(values.workersRequired) || 0;
      data.workersAssigned = Number(values.workersAssigned) || 0;
      data.art = values.art || "";
      data.note = values.note || "";
      data.effects = GVM.parseEffectLines(values.effects, "passive");
      data.upkeep = GVM.parseEffectLines(values.upkeep, "perCycle");
      data.services = GVM.parseLines(values.services);
      data.boons = GVM.parseBoonLines(values.boons);
    }

    else if (data.kind === GVM.KIND.REFORM) {
      data.active = values.active === "on";
      data.interval = Math.max(1, Number(values.interval) || 1);
      data.tick = Number(values.tick) || 0;
      data.description = values.description || "";
      data.effects = GVM.parseEffectLines(values.effects, "passive");
    }

    else if (data.kind === GVM.KIND.ORDER) {
      data.status = values.status || "active";
      data.progress = Number(values.progress) || 0;
      data.duration = Math.max(1, Number(values.duration) || 1);
      data.action = values.action || "custom";
      data.targetItemId = values.targetItemId || null;
      data.description = values.description || "";
      data.cost = GVM.parseEffectLines(values.cost, "perCycle");
      data.effectsOnComplete = GVM.parseEffectLines(values.effectsOnComplete, "onComplete");
    }

    else if (data.kind === GVM.KIND.BONUS) {
      data.source = values.source || "";
      data.description = values.description || "";
      data.cost = {
        stat: values.costStat || "treasury",
        value: Number(values.costValue) || 0
      };
      data.reward = data.reward || {};
      data.reward.uuid = values.rewardUuid || data.reward.uuid || "";
      data.reward.quantity = Math.max(1, Number(values.rewardQuantity) || 1);
      data.reward.target = values.rewardTarget || "group";
    }

    await this.item.setFlag(GVM.FLAG_SCOPE, "data", data);

    if (values.description !== undefined || values.note !== undefined) {
      const description = values.description || values.note || "";
      await this.item.update({
        "system.description.value": GVM.itemDescriptionHtml(this.item.name, description)
      });
    }

    ui.notifications.info(`${this.item.name}: настройки сохранены.`);
    GVM.refreshSettlement(this.actor);
    this.render(false);
  }
};

GVM.openConfigForItem = function openConfigForItem(actor, item) {
  new GVM.ConfigApp(actor, item).render(true);
};

GVM.editGvmData = function editGvmData(actor, item) {
  GVM.openConfigForItem(actor, item);
};
