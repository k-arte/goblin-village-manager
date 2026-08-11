/**
 * Goblin Village Manager v0.8
 * Settlement Settings, Export / Import, Reset
 *
 * Goals:
 * - GM-facing settlement settings panel.
 * - Manual resource/settings editing.
 * - Threat and attack tuning foundation.
 * - Export settlement state to JSON.
 * - Import settlement state from JSON.
 * - Reset settlement with confirmation.
 */

window.GVM = window.GVM || {};
GVM.V080 = GVM.V080 || {};

GVM.V080_DEFAULT_ADVANCED_SETTINGS = {
  threat: {
    baseGrowth: 2,
    randomGrowthFormula: "1d3",
    showThreatToPlayers: false,
    showThreatGrowthToPlayers: false
  },
  attacks: {
    minCycles: 2,
    maxCycles: 5,
    nextAttackFormula: "2 + 1d3",
    buildingDamageChance: 50,
    damagedBuildingDestroyChance: 35,
    allowUniqueBuildingDamage: false,
    allowConstructionDamage: false
  },
  ui: {
    compactMode: false,
    showUnavailableAbilities: "gm",
    showDebugFields: false,
    showLegacySections: false
  }
};

GVM.v080MergeDefaults = function v080MergeDefaults(value = {}) {
  return foundry.utils.mergeObject(
    foundry.utils.deepClone(GVM.V080_DEFAULT_ADVANCED_SETTINGS),
    value || {},
    {
      inplace: false,
      insertKeys: true,
      overwrite: True
    }
  );
};

// Fix Python-style accidental token if copied through tools.
GVM.v080MergeDefaults = function v080MergeDefaults(value = {}) {
  return foundry.utils.mergeObject(
    foundry.utils.deepClone(GVM.V080_DEFAULT_ADVANCED_SETTINGS),
    value || {},
    {
      inplace: false,
      insertKeys: true,
      overwrite: true
    }
  );
};

GVM.v080GetAdvancedSettings = function v080GetAdvancedSettings(actor) {
  const settings = GVM.getSettings ? GVM.getSettings(actor) : {};
  return GVM.v080MergeDefaults(settings.v080 || {});
};

GVM.v080SetAdvancedSettings = async function v080SetAdvancedSettings(actor, advanced) {
  const settings = GVM.getSettings(actor);
  settings.v080 = GVM.v080MergeDefaults(advanced);
  await GVM.setSettings(actor, settings);
};

GVM.v080BoolChecked = function v080BoolChecked(value) {
  return value ? "checked" : "";
};

GVM.v080DownloadJson = function v080DownloadJson(filename, data) {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
};

GVM.v080CollectExportData = function v080CollectExportData(actor) {
  const resources = GVM.getResources ? GVM.getResources(actor) : {};
  const settings = GVM.getSettings ? GVM.getSettings(actor) : {};

  const itemData = actor.items
    .filter(item => GVM.gvmData && GVM.gvmData(item)?.kind)
    .map(item => {
      return {
        name: item.name,
        type: item.type,
        img: item.img,
        system: item.system,
        flags: {
          [GVM.FLAG_SCOPE]: item.getFlag(GVM.FLAG_SCOPE, "data")
        }
      };
    });

  return {
    schema: "gvm-settlement-export",
    schemaVersion: 1,
    moduleVersion: game.modules.get(GVM.MODULE_ID)?.version || "unknown",
    exportedAt: new Date().toISOString(),
    actor: {
      id: actor.id,
      uuid: actor.uuid,
      name: actor.name
    },
    resources,
    settings,
    items: itemData
  };
};

GVM.v080ExportSettlement = function v080ExportSettlement(actor) {
  const name = (GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name)
    .replace(/[^\wа-яА-ЯёЁ-]+/g, "_");

  const data = GVM.v080CollectExportData(actor);
  GVM.v080DownloadJson(`gvm-${name}-export.json`, data);

  ui.notifications.info("Экспорт поселения создан.");

  if (GVM.addJournalEntry) {
    GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Экспорт поселения",
      entries: ["GM экспортировал состояние поселения в JSON."]
    });
  }
};

GVM.v080ImportSettlementFromObject = async function v080ImportSettlementFromObject(actor, data, mode = "full") {
  if (!data || data.schema !== "gvm-settlement-export") {
    ui.notifications.warn("Это не похоже на экспорт Goblin Village Manager.");
    return;
  }

  const backup = GVM.v080CollectExportData(actor);
  const settings = GVM.getSettings(actor);

  settings.v080LastImportBackup = backup;
  settings.v080LastImportBackupAt = Date.now();

  await GVM.setSettings(actor, settings);

  if (mode === "resources" || mode === "full") {
    if (data.resources && GVM.setResources) {
      await GVM.setResources(actor, foundry.utils.deepClone(data.resources));
    }
  }

  if (mode === "settings" || mode === "full") {
    if (data.settings && GVM.setSettings) {
      const imported = foundry.utils.deepClone(data.settings);
      imported.v080LastImportBackup = backup;
      imported.v080LastImportBackupAt = Date.now();
      await GVM.setSettings(actor, imported);
    }
  }

  if (mode === "items" || mode === "full") {
    if (Array.isArray(data.items)) {
      const existing = actor.items.filter(item => GVM.gvmData && GVM.gvmData(item)?.kind);
      if (existing.length) await actor.deleteEmbeddedDocuments("Item", existing.map(item => item.id));

      const createData = data.items.map(item => {
        return {
          name: item.name,
          type: item.type || "loot",
          img: item.img || GVM.SAFE_ICON,
          system: item.system || {},
          flags: item.flags || {}
        };
      });

      if (createData.length) {
        await actor.createEmbeddedDocuments("Item", createData);
      }
    }
  }

  ui.notifications.info("Импорт поселения завершён.");

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Импорт поселения",
      entries: [`Режим импорта: ${mode}. Перед импортом создан автоматический backup.`]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.openV080ImportDialog = function openV080ImportDialog(actor) {
  new Dialog({
    title: "Импорт поселения",
    content: `
      <form class="gvm-v080-settings-form">
        <section class="gvm-v080-settings-hero">
          <h2>Импорт поселения</h2>
          <p>Вставь JSON, полученный через экспорт. Перед импортом текущие данные будут сохранены в backup внутри настроек поселения.</p>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Режим импорта</span>
          <select name="mode">
            <option value="full">Полный импорт</option>
            <option value="resources">Только ресурсы</option>
            <option value="settings">Только настройки</option>
            <option value="items">Только здания, реформы, приказы и бонусы</option>
          </select>
        </label>

        <label class="gvm-config-field gvm-config-wide">
          <span>JSON</span>
          <textarea name="json" class="gvm-v080-json-textarea" placeholder="Вставь экспортированный JSON сюда"></textarea>
        </label>
      </form>
    `,
    buttons: {
      import: {
        label: "Импортировать",
        callback: async html => {
          const mode = html.find("[name=mode]").val() || "full";
          const raw = html.find("[name=json]").val();

          try {
            const parsed = JSON.parse(raw);
            await GVM.v080ImportSettlementFromObject(actor, parsed, mode);
          } catch (err) {
            ui.notifications.error(`Ошибка импорта: ${err.message}`);
          }
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 820,
    height: "auto"
  }).render(true);
};

GVM.v080ResetSettlement = async function v080ResetSettlement(actor, mode = "resources") {
  const backup = GVM.v080CollectExportData(actor);

  const resources = foundry.utils.deepClone(GVM.DEFAULT_RESOURCES || {
    population: 40,
    food: 120,
    treasury: 500,
    loyalty: 60,
    threat: 18
  });

  const defaultSettings = foundry.utils.deepClone(GVM.DEFAULT_SETTINGS || {
    cycle: 0,
    hiddenFromPlayers: false,
    playerCharacterLevel: 5,
    attack: {
      nextInCycles: 3,
      baseGrowth: 2
    },
    scouting: {
      known: false,
      threatMin: null,
      threatMax: null,
      cyclesRemainingVisible: null,
      expiresCycle: 0
    },
    reports: []
  });

  defaultSettings.v080LastResetBackup = backup;
  defaultSettings.v080LastResetBackupAt = Date.now();
  defaultSettings.v080 = GVM.v080MergeDefaults({});

  if (mode === "resources") {
    const settings = GVM.getSettings(actor);
    settings.cycle = 0;
    settings.v080LastResetBackup = backup;
    settings.v080LastResetBackupAt = Date.now();

    await GVM.setResources(actor, resources);
    await GVM.setSettings(actor, settings);
  }

  else if (mode === "state") {
    defaultSettings.journal = [];
    defaultSettings.reports = [];
    defaultSettings.activeEffects = [];

    await GVM.setResources(actor, resources);
    await GVM.setSettings(actor, defaultSettings);
  }

  else if (mode === "full") {
    const gvmItems = actor.items.filter(item => GVM.gvmData && GVM.gvmData(item)?.kind);

    if (gvmItems.length) {
      await actor.deleteEmbeddedDocuments("Item", gvmItems.map(item => item.id));
    }

    await GVM.setResources(actor, resources);
    await GVM.setSettings(actor, defaultSettings);

    if (GVM.initializeDefaults) {
      await GVM.initializeDefaults(actor);
    }
  }

  ui.notifications.info("Поселение очищено.");

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Поселение очищено",
      entries: [`Режим сброса: ${mode}. Перед сбросом создан backup.`]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.openV080ResetDialog = function openV080ResetDialog(actor) {
  new Dialog({
    title: "Очистить поселение",
    content: `
      <form class="gvm-v080-settings-form">
        <section class="gvm-v080-danger-hero">
          <h2>Очистить поселение</h2>
          <p>Это действие изменит состояние поселения. Перед сбросом будет создан автоматический backup.</p>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Что сбросить?</span>
          <select name="mode">
            <option value="resources">Только ресурсы и цикл</option>
            <option value="state">Ресурсы, цикл, настройки, журнал и отчёты</option>
            <option value="full">Полный сброс и пересоздание дефолта</option>
          </select>
        </label>

        <label class="gvm-config-field gvm-config-wide">
          <span>Подтверждение</span>
          <input type="text" name="confirm" placeholder="Введите RESET">
        </label>

        <p class="gvm-v080-muted">Без слова RESET сброс не будет выполнен.</p>
      </form>
    `,
    buttons: {
      reset: {
        label: "Очистить поселение",
        callback: async html => {
          const confirm = String(html.find("[name=confirm]").val() || "").trim();
          const mode = html.find("[name=mode]").val() || "resources";

          if (confirm !== "RESET") {
            ui.notifications.warn("Сброс отменён: нужно ввести RESET.");
            return;
          }

          await GVM.v080ResetSettlement(actor, mode);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 680,
    height: "auto"
  }).render(true);
};

GVM.openV080Settings = function openV080Settings(actor) {
  const resources = GVM.getResources(actor);
  const settings = GVM.getSettings(actor);
  const advanced = GVM.v080GetAdvancedSettings(actor);

  const settlementName = GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name;

  new Dialog({
    title: "Настройки поселения",
    content: `
      <form class="gvm-v080-settings-form">
        <section class="gvm-v080-settings-hero">
          <h2>${GVM.escapeHtml(settlementName)}</h2>
          <p>Единая панель GM-настроек поселения: ресурсы, угроза, атаки, интерфейс, импорт и экспорт.</p>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Основное</h3>
          <div class="gvm-v080-settings-grid">
            <label>
              <span>Название поселения</span>
              <input type="text" name="settlementName" value="${GVM.escapeHtml(settlementName)}">
            </label>
            <label>
              <span>Цикл</span>
              <input type="number" name="cycle" value="${Number(settings.cycle || 0)}">
            </label>
            <label>
              <span>Уровень партии</span>
              <input type="number" name="playerCharacterLevel" value="${Number(settings.playerCharacterLevel || 5)}">
            </label>
          </div>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Ресурсы</h3>
          <div class="gvm-v080-settings-grid">
            <label><span>Население</span><input type="number" name="population" value="${Number(resources.population || 0)}"></label>
            <label><span>Еда</span><input type="number" name="food" value="${Number(resources.food || 0)}"></label>
            <label><span>Казна</span><input type="number" name="treasury" value="${Number(resources.treasury || 0)}"></label>
            <label><span>Лояльность</span><input type="number" name="loyalty" value="${Number(resources.loyalty || 0)}"></label>
            <label><span>Угроза</span><input type="number" name="threat" value="${Number(resources.threat || 0)}"></label>
            <label><span>Военный урон</span><input type="number" name="militaryDamage" value="${Number(resources.militaryDamage || 0)}"></label>
          </div>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Угроза</h3>
          <div class="gvm-v080-settings-grid">
            <label>
              <span>Базовый рост угрозы</span>
              <input type="number" name="threatBaseGrowth" value="${Number(advanced.threat.baseGrowth || 2)}">
            </label>
            <label>
              <span>Случайный рост угрозы</span>
              <input type="text" name="threatRandomGrowthFormula" value="${GVM.escapeHtml(advanced.threat.randomGrowthFormula || "1d3")}">
            </label>
            <label class="gvm-v080-checkbox-row">
              <span>Показывать угрозу игрокам</span>
              <input type="checkbox" name="showThreatToPlayers" ${GVM.v080BoolChecked(advanced.threat.showThreatToPlayers)}>
            </label>
          </div>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Атаки</h3>
          <div class="gvm-v080-settings-grid">
            <label><span>Мин. циклов до атаки</span><input type="number" name="attackMinCycles" value="${Number(advanced.attacks.minCycles || 2)}"></label>
            <label><span>Макс. циклов до атаки</span><input type="number" name="attackMaxCycles" value="${Number(advanced.attacks.maxCycles || 5)}"></label>
            <label><span>Формула следующей атаки</span><input type="text" name="nextAttackFormula" value="${GVM.escapeHtml(advanced.attacks.nextAttackFormula || "2 + 1d3")}"></label>
            <label><span>Шанс повредить здание, %</span><input type="number" name="buildingDamageChance" value="${Number(advanced.attacks.buildingDamageChance || 50)}"></label>
            <label><span>Шанс разрушить повреждённое, %</span><input type="number" name="damagedBuildingDestroyChance" value="${Number(advanced.attacks.damagedBuildingDestroyChance || 35)}"></label>
          </div>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Интерфейс</h3>
          <div class="gvm-v080-settings-grid">
            <label class="gvm-v080-checkbox-row">
              <span>Компактный режим</span>
              <input type="checkbox" name="compactMode" ${GVM.v080BoolChecked(advanced.ui.compactMode)}>
            </label>
            <label>
              <span>Недоступные способности</span>
              <select name="showUnavailableAbilities">
                <option value="gm" ${advanced.ui.showUnavailableAbilities === "gm" ? "selected" : ""}>Только GM</option>
                <option value="always" ${advanced.ui.showUnavailableAbilities === "always" ? "selected" : ""}>Всегда</option>
                <option value="never" ${advanced.ui.showUnavailableAbilities === "never" ? "selected" : ""}>Никогда</option>
              </select>
            </label>
            <label class="gvm-v080-checkbox-row">
              <span>Показывать debug-поля</span>
              <input type="checkbox" name="showDebugFields" ${GVM.v080BoolChecked(advanced.ui.showDebugFields)}>
            </label>
            <label class="gvm-v080-checkbox-row">
              <span>Показывать legacy-секции</span>
              <input type="checkbox" name="showLegacySections" ${GVM.v080BoolChecked(advanced.ui.showLegacySections)}>
            </label>
          </div>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Импорт / экспорт</h3>
          <div class="gvm-v080-button-row">
            exportЭкспорт JSON</button>
            importИмпорт JSON</button>
          </div>
        </section>

        <section class="gvm-v080-danger-zone">
          <h3>Опасная зона</h3>
          <p>Сброс создаёт backup, но всё равно может удалить текущие GVM Items при полном режиме.</p>
          resetОчистить поселение</button>
        </section>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const form = html.find("form")[0];
          const values = Object.fromEntries(new FormData(form).entries());

          const nextResources = foundry.utils.deepClone(resources);
          nextResources.population = Number(values.population || 0);
          nextResources.food = Number(values.food || 0);
          nextResources.treasury = Number(values.treasury || 0);
          nextResources.loyalty = Number(values.loyalty || 0);
          nextResources.threat = Number(values.threat || 0);
          nextResources.militaryDamage = Number(values.militaryDamage || 0);

          const nextSettings = foundry.utils.deepClone(settings);
          nextSettings.cycle = Number(values.cycle || 0);
          nextSettings.playerCharacterLevel = Number(values.playerCharacterLevel || 5);

          nextSettings.v080 = GVM.v080MergeDefaults({
            threat: {
              baseGrowth: Number(values.threatBaseGrowth || 2),
              randomGrowthFormula: values.threatRandomGrowthFormula || "1d3",
              showThreatToPlayers: values.showThreatToPlayers === "on"
            },
            attacks: {
              minCycles: Number(values.attackMinCycles || 2),
              maxCycles: Number(values.attackMaxCycles || 5),
              nextAttackFormula: values.nextAttackFormula || "2 + 1d3",
              buildingDamageChance: Number(values.buildingDamageChance || 50),
              damagedBuildingDestroyChance: Number(values.damagedBuildingDestroyChance || 35)
            },
            ui: {
              compactMode: values.compactMode === "on",
              showUnavailableAbilities: values.showUnavailableAbilities || "gm",
              showDebugFields: values.showDebugFields === "on",
              showLegacySections: values.showLegacySections === "on"
            }
          });

          if (GVM.setSettlementName) {
            await GVM.setSettlementName(actor, values.settlementName || actor.name);
          }

          await GVM.setResources(actor, nextResources);
          await GVM.setSettings(actor, nextSettings);

          ui.notifications.info("Настройки поселения сохранены.");

          if (GVM.addJournalEntry) {
            await GVM.addJournalEntry(actor, {
              type: "settings",
              title: "Настройки поселения обновлены",
              entries: ["GM изменил настройки поселения."]
            });
          }

          if (GVM.queueRefresh) GVM.queueRefresh(actor);
          else GVM.refreshSettlement(actor);
        }
      },
      close: {
        label: "Закрыть"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");

      html.find("[data-gvm-v080-settings-action='export']").on("click", event => {
        event.preventDefault();
        GVM.v080ExportSettlement(actor);
      });

      html.find("[data-gvm-v080-settings-action='import']").on("click", event => {
        event.preventDefault();
        GVM.openV080ImportDialog(actor);
      });

      html.find("[data-gvm-v080-settings-action='reset']").on("click", event => {
        event.preventDefault();
        GVM.openV080ResetDialog(actor);
      });
    }
  }, {
    width: 900,
    height: "auto"
  }).render(true);
};

GVM.v080InjectSettingsControls = function v080InjectSettingsControls(actor, root = document) {
  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  if (!board || board.querySelector("[data-gvm-v080-control='settings']")) return;

  const management =
    board.querySelector(".gvm-management-area") ||
    board.querySelector("[data-gvm-v080-overview-panel]") ||
    board.querySelector("header") ||
    board;

  const wrap = document.createElement("section");
  wrap.className = "gvm-v080-settings-entry";
  wrap.innerHTML = `
    <button type="button" class="gvm-control primary" data-gvm-v080-control="settings">
      ⚙ Настройки поселения
    </button>
    <button type="button" class="gvm-control secondary" data-gvm-v080-control="export">
      Экспорт
    </button>
    <button type="button" class="gvm-control secondary" data-gvm-v080-control="import">
      Импорт
    </button>
  `;

  if (management === board) board.prepend(wrap);
  else management.prepend(wrap);

  wrap.querySelector("[data-gvm-v080-control='settings']").addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    GVM.openV080Settings(actor);
  });

  wrap.querySelector("[data-gvm-v080-control='export']").addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    GVM.v080ExportSettlement(actor);
  });

  wrap.querySelector("[data-gvm-v080-control='import']").addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    GVM.openV080ImportDialog(actor);
  });
};

GVM.originalRefreshSettlementV080Settings = GVM.originalRefreshSettlementV080Settings || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080Settings(actor) {
  const result = GVM.originalRefreshSettlementV080Settings(actor);

  setTimeout(() => {
    GVM.v080InjectSettingsControls(actor, document);
  }, 140);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080Settings) {
  GVM.originalRenderSettlementPanelV080Settings = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080Settings(actor, panel) {
    await GVM.originalRenderSettlementPanelV080Settings(actor, panel);
    GVM.v080InjectSettingsControls(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8 Settings Layer loaded");
});
