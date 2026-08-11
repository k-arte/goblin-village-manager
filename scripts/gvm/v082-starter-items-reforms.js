
/**
 * GVM v0.8.2
 * Starter Items + Reform Delete Bridge
 *
 * Purpose:
 * - Make the real "starter/default items" flow use v0.8.2 building presets.
 * - Avoid duplicate starter buildings.
 * - Add delete controls to Reform cards.
 * - Keep old initializeDefaults behavior, but extend it with v0.8.2 presets.
 */

window.GVM = window.GVM || {};
GVM.V082 = GVM.V082 || {};

GVM.v082BuildingPresetToItemData = function v082BuildingPresetToItemData(preset) {
  const level = 1;
  const levelData = preset.levels?.find(entry => Number(entry.level) === level) || preset.levels?.[0] || {};

  const data = GVM.v082PresetToBuildingData
    ? GVM.v082PresetToBuildingData(preset, {
        level,
        status: "built",
        workersAssigned: 0
      })
    : {
        kind: GVM.KIND?.BUILDING || "building",
        presetId: preset.presetId,
        displayName: preset.displayName,
        facilityType: preset.facilityType,
        officialTypeLabel: preset.officialTypeLabel,
        developmentSubtype: preset.developmentSubtype,
        category: preset.category,
        description: preset.description,
        art: preset.img,
        img: preset.img,
        level,
        levels: foundry.utils.deepClone(preset.levels || []),
        workersRequired: Number(levelData.workersRequired || 0),
        workersAssigned: 0,
        status: "built",
        v082PresetVersion: 1,
        v082StarterItem: true,
        v082CreatedAt: Date.now()
      };

  data.v082StarterItem = true;
  data.v082PresetVersion = 1;
  data.v082CreatedAt = data.v082CreatedAt || Date.now();

  return {
    name: preset.displayName,
    type: "loot",
    img: preset.img || GVM.SAFE_ICON || "icons/svg/item-bag.svg",
    system: {},
    flags: {
      [GVM.FLAG_SCOPE]: {
        data
      }
    }
  };
};

GVM.v082ExistingBuildingPresetIds = function v082ExistingBuildingPresetIds(actor) {
  const ids = new Set();

  for (const item of actor.items || []) {
    const data = GVM.gvmData ? GVM.gvmData(item) : item.getFlag(GVM.FLAG_SCOPE, "data");

    if (!data) continue;

    if (data.kind === (GVM.KIND?.BUILDING || "building") || data.kind === "building") {
      if (data.presetId) ids.add(data.presetId);
    }
  }

  return ids;
};

GVM.v082CreateStarterBuildingItems = async function v082CreateStarterBuildingItems(actor, options = {}) {
  if (!actor) return [];

  if (!Array.isArray(GVM.V082_BUILDING_PRESETS) || !GVM.V082_BUILDING_PRESETS.length) {
    ui.notifications.warn("v0.8.2 пресеты зданий не загружены.");
    return [];
  }

  const existingPresetIds = GVM.v082ExistingBuildingPresetIds(actor);
  const createData = [];

  for (const preset of GVM.V082_BUILDING_PRESETS) {
    if (!preset?.presetId) continue;

    if (preset.presetId === "prison-cells") continue;

    if (!options.force && existingPresetIds.has(preset.presetId)) {
      continue;
    }

    createData.push(GVM.v082BuildingPresetToItemData(preset));
  }

  if (!createData.length) {
    ui.notifications.info("Стартовые здания v0.8.2 уже существуют.");
    return [];
  }

  const created = await actor.createEmbeddedDocuments("Item", createData);

  ui.notifications.info(`Созданы стартовые здания v0.8.2: ${created.length}.`);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Стартовые здания v0.8.2",
      entries: [
        `Создано зданий: ${created.length}.`,
        "Здания созданы из GVM.V082_BUILDING_PRESETS.",
        "Тюремные помещения исключены.",
        "Казармы наездных пауков используют тип Menagerie / Зверинец."
      ]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else if (GVM.refreshSettlement) GVM.refreshSettlement(actor);

  return created;
};

/**
 * Bridge the real old starter/default button.
 * If old UI calls GVM.initializeDefaults(actor), v0.8.2 starter building Items are now also created.
 */
if (!GVM.originalInitializeDefaultsV082StarterItems && GVM.initializeDefaults) {
  GVM.originalInitializeDefaultsV082StarterItems = GVM.initializeDefaults;

  GVM.initializeDefaults = async function initializeDefaultsV082StarterItems(actor, ...args) {
    const result = await GVM.originalInitializeDefaultsV082StarterItems(actor, ...args);

    try {
      await GVM.v082CreateStarterBuildingItems(actor, { force: false });
    } catch (err) {
      console.error("GVM v0.8.2 starter building item creation failed", err);
      ui.notifications.error("Ошибка создания стартовых зданий v0.8.2. Подробности в консоли.");
    }

    return result;
  };
}

GVM.v082OpenStarterItemsDialog = function v082OpenStarterItemsDialog(actor) {
  new Dialog({
    title: "Стартовые Items v0.8.2",
    content: `
      <form class="gvm-v082-dialog">
        <section class="gvm-v082-hero">
          <h2>Создать стартовые здания</h2>
          <p>Создаёт отсутствующие здания из актуальных v0.8.2 пресетов. Уже существующие здания с тем же presetId не дублируются.</p>
        </section>

        <section class="gvm-v082-section">
          <p>Будут использованы пресеты:</p>
          <ul>
            ${(GVM.V082_BUILDING_PRESETS || []).map(p => `<li>${GVM.escapeHtml(p.displayName)} · ${GVM.escapeHtml(p.officialTypeLabel || p.facilityType)}</li>`).join("")}
          </ul>
        </section>
      </form>
    `,
    buttons: {
      create: {
        label: "Создать отсутствующие",
        callback: async () => {
          await GVM.v082CreateStarterBuildingItems(actor, { force: false });
        }
      },
      force: {
        label: "Создать заново",
        callback: async () => {
          await GVM.v082CreateStarterBuildingItems(actor, { force: true });
        }
      },
      close: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 760,
    height: "auto"
  }).render(true);
};

GVM.v082InjectStarterItemsButton = function v082InjectStarterItemsButton(actor, root = document) {
  if (!actor) return;

  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  if (!board) return;

  let toolbar = board.querySelector("[data-gvm-v082-toolbar]");

  if (!toolbar) {
    toolbar = document.createElement("section");
    toolbar.className = "gvm-v082-toolbar";
    toolbar.dataset.gvmV082Toolbar = "1";

    const target =
      board.querySelector(".gvm-v080-settings-entry") ||
      board.querySelector("[data-gvm-v080-overview-panel]") ||
      board.querySelector("header") ||
      board.firstElementChild ||
      board;

    if (target?.insertAdjacentElement) {
      target.insertAdjacentElement("afterend", toolbar);
    } else {
      board.prepend(toolbar);
    }
  }

  if (!toolbar.querySelector("[data-gvm-v082-action='starter-items']")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gvm-control secondary";
    button.dataset.gvmV082Action = "starter-items";
    button.textContent = "Стартовые Items v0.8.2";

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v082OpenStarterItemsDialog(actor);
    });

    toolbar.appendChild(button);
  }
};

GVM.v082GetReforms = function v082GetReforms(actor) {
  if (!actor) return [];

  if (GVM.reforms) {
    const reforms = GVM.reforms(actor);
    if (Array.isArray(reforms)) return reforms;
  }

  return Array.from(actor.items || []).filter(item => {
    const data = GVM.gvmData ? GVM.gvmData(item) : item.getFlag(GVM.FLAG_SCOPE, "data");
    return data?.kind === (GVM.KIND?.REFORM || "reform") || data?.kind === "reform";
  });
};

GVM.v082FindReformCard = function v082FindReformCard(root, item) {
  if (!root || !item) return null;

  const id = String(item.id || "").replace(/"/g, '\\"');

  const selectors = [
    `[data-item-id="${id}"]`,
    `[data-gvm-item-id="${id}"]`,
    `[data-reform-id="${id}"]`,
    `[data-gvm-reform-id="${id}"]`
  ];

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  const cards = Array.from(root.querySelectorAll("article, .gvm-card, .gvm-reform-card, .gvm-management-card"));
  return cards.find(card => (card.textContent || "").includes(item.name)) || null;
};

GVM.v082DeleteReform = async function v082DeleteReform(actor, item) {
  if (!actor || !item) return;

  await actor.deleteEmbeddedDocuments("Item", [item.id]);

  ui.notifications.info(`Реформа удалена: ${item.name}.`);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "reform",
      title: "Реформа удалена",
      entries: [`Удалена реформа: ${item.name}.`]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else if (GVM.refreshSettlement) GVM.refreshSettlement(actor);
};

GVM.v082OpenDeleteReformDialog = function v082OpenDeleteReformDialog(actor, item) {
  new Dialog({
    title: `Удалить реформу: ${item.name}`,
    content: `
      <form class="gvm-v082-dialog">
        <section class="gvm-v082-danger">
          <h2>${GVM.escapeHtml(item.name)}</h2>
          <p>Реформа будет удалена из поселения. Это не удаляет другие здания или предметы.</p>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Подтверждение</span>
          <input type="text" name="confirm" placeholder="Введите DELETE">
        </label>
      </form>
    `,
    buttons: {
      delete: {
        label: "Удалить",
        callback: async html => {
          const confirm = String(html.find("[name=confirm]").val() || "").trim();

          if (confirm !== "DELETE") {
            ui.notifications.warn("Удаление отменено: нужно ввести DELETE.");
            return;
          }

          await GVM.v082DeleteReform(actor, item);
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
    width: 640,
    height: "auto"
  }).render(true);
};

GVM.v082InjectReformDeleteButtons = function v082InjectReformDeleteButtons(actor, root = document) {
  if (!actor) return;

  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  if (!board) return;

  const reforms = GVM.v082GetReforms(actor);

  for (const item of reforms) {
    const card = GVM.v082FindReformCard(board, item);
    if (!card) continue;

    if (card.querySelector(`[data-gvm-v082-delete-reform="${item.id}"]`)) continue;

    const tools = document.createElement("div");
    tools.className = "gvm-v082-reform-tools";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "gvm-control danger";
    button.dataset.gvmV082DeleteReform = item.id;
    button.textContent = "Удалить реформу";

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v082OpenDeleteReformDialog(actor, item);
    });

    tools.appendChild(button);

    const anchor =
      card.querySelector("footer") ||
      card.querySelector(".gvm-card-actions") ||
      card.querySelector(".gvm-management-card-actions") ||
      card;

    anchor.appendChild(tools);
  }
};

GVM.v082StarterAndReformBridge = function v082StarterAndReformBridge(actor, root = document) {
  try {
    GVM.v082InjectStarterItemsButton(actor, root);
    GVM.v082InjectReformDeleteButtons(actor, root);
  } catch (err) {
    console.error("GVM v0.8.2 starter/reform bridge failed", err);
  }
};

GVM.originalRefreshSettlementV082StarterReforms =
  GVM.originalRefreshSettlementV082StarterReforms || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV082StarterReforms(actor) {
  const result = GVM.originalRefreshSettlementV082StarterReforms(actor);

  setTimeout(() => {
    GVM.v082StarterAndReformBridge(actor, document);
  }, 420);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV082StarterReforms) {
  GVM.originalRenderSettlementPanelV082StarterReforms = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV082StarterReforms(actor, panel) {
    await GVM.originalRenderSettlementPanelV082StarterReforms(actor, panel);
    GVM.v082StarterAndReformBridge(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8.2 Starter Items + Reform Delete Bridge loaded");
});
