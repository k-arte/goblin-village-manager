/**
 * Goblin Village Manager
 * Stage 4 UX Redesign Layer
 *
 * Goals:
 * - Force one dark GVM UX style.
 * - Replace white worker dialog with dark worker dialog.
 * - Add stat select helper for ability builder.
 * - Remove duplicate legacy Bonus/Service sections from rendered sheet.
 * - Normalize card art and resident portrait rendering.
 * - Keep gameplay logic unchanged.
 */

window.GVM = window.GVM || {};

GVM.STAGE4_STAT_ORDER = [
  "treasury",
  "food",
  "population",
  "loyalty",
  "threat",
  "military",
  "attractiveness",
  "projectCapacity",
  "foodCapacity",
  "treasuryCapacity"
];

GVM.renderStage4StatOptions = function renderStage4StatOptions(selected = "treasury") {
  const labels = GVM.STAT_LABELS || {};
  const keys = Array.from(new Set([
    ...GVM.STAGE4_STAT_ORDER,
    ...Object.keys(labels)
  ]));

  return keys.map(key => {
    const label = labels[key] || key;
    return `<option value="${GVM.escapeHtml(key)}" ${key === selected ? "selected" : ""}>${GVM.escapeHtml(label)}</option>`;
  }).join("");
};

GVM.stage4SafeImage = function stage4SafeImage(value) {
  const raw = String(value || "").trim();
  if (!raw) return GVM.SAFE_ICON || "icons/svg/item-bag.svg";
  if (raw === "undefined" || raw === "null") return GVM.SAFE_ICON || "icons/svg/item-bag.svg";
  return GVM.safeImg ? GVM.safeImg(raw) : raw;
};

GVM.getStage4BuildingArt = function getStage4BuildingArt(item) {
  const data = GVM.gvmData ? GVM.gvmData(item) : {};
  return GVM.stage4SafeImage(
    data.art ||
    data.img ||
    item?.img ||
    GVM.SAFE_ICON
  );
};

GVM.getStage4ResidentPortrait = function getStage4ResidentPortrait(actor, resident = {}) {
  const residentActor = GVM.getResidentActorSync ? GVM.getResidentActorSync(resident) : null;

  return GVM.stage4SafeImage(
    residentActor?.img ||
    resident.img ||
    resident.portrait ||
    GVM.SAFE_ICON
  );
};

GVM.stage4SelectorValue = function stage4SelectorValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
};

GVM.stage4FindCardForItem = function stage4FindCardForItem(root, item) {
  if (!root || !item) return null;

  const id = GVM.stage4SelectorValue(item.id);
  const selectors = [
    `[data-item-id="${id}"]`,
    `[data-gvm-item-id="${id}"]`,
    `[data-gvm-facility-id="${id}"]`,
    `[data-facility-item-id="${id}"]`
  ];

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  const cards = Array.from(root.querySelectorAll(".gvm-facility-card, .gvm-card, article"));
  return cards.find(card => {
    const title = card.querySelector("h3, h4, .title, .name")?.textContent?.trim();
    return title && title === item.name;
  }) || null;
};

GVM.stage4ApplyBuildingArt = function stage4ApplyBuildingArt(actor, root = document) {
  if (!actor || !GVM.buildings) return;

  for (const item of GVM.buildings(actor)) {
    const card = GVM.stage4FindCardForItem(root, item);
    if (!card) continue;

    const art = GVM.getStage4BuildingArt(item);

    card.classList.add("gvm-stage4-has-art");
    card.style.setProperty("--gvm-card-art", `url("${art}")`);
    card.style.backgroundImage = `linear-gradient(135deg, rgba(5, 7, 10, 0.88), rgba(5, 7, 10, 0.58)), url("${art}")`;
    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";
  }
};

GVM.stage4FindResidentCard = function stage4FindResidentCard(root, resident = {}) {
  if (!root || !resident?.id) return null;

  const id = GVM.stage4SelectorValue(resident.id);
  const selectors = [
    `[data-gvm-resident-id="${id}"]`,
    `[data-resident-id="${id}"]`,
    `[data-key-resident-id="${id}"]`
  ];

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  return null;
};

GVM.stage4ApplyResidentPortraits = function stage4ApplyResidentPortraits(actor, root = document) {
  if (!actor || !GVM.getKeyResidents) return;

  const residents = GVM.getKeyResidents(actor) || [];

  for (const resident of residents) {
    const card = GVM.stage4FindResidentCard(root, resident);
    if (!card) continue;

    const portrait = GVM.getStage4ResidentPortrait(actor, resident);

    card.classList.add("gvm-stage4-has-portrait");
    card.style.setProperty("--gvm-resident-portrait", `url("${portrait}")`);

    const img = card.querySelector("img");
    if (img) {
      img.src = portrait;
      img.alt = img.alt || resident.professionLabel || resident.professionId || "Key resident";
    }
  }
};

GVM.stage4RemoveDuplicateSections = function stage4RemoveDuplicateSections(root = document) {
  const duplicateTitles = new Set([
    "Бонусы",
    "богусы",
    "Богусы",
    "Услуги",
    "Services",
    "Bonuses"
  ]);

  const candidates = Array.from(root.querySelectorAll(
    ".gvm-management-area > section, .gvm-bastion-board > section, section.gvm-management-section"
  ));

  for (const section of candidates) {
    if (section.classList.contains("gvm-abilities-section")) continue;
    if (section.closest(".gvm-abilities-section")) continue;

    const title = section.querySelector("h2, h3, h4")?.textContent?.trim();
    if (!title) continue;

    if (duplicateTitles.has(title)) {
      section.remove();
    }
  }
};

GVM.stage4PolishSettlement = function stage4PolishSettlement(actor, root = document) {
  try {
    GVM.stage4RemoveDuplicateSections(root);
    GVM.stage4ApplyBuildingArt(actor, root);
    GVM.stage4ApplyResidentPortraits(actor, root);
  }
  catch (err) {
    console.warn("GVM Stage4 polish failed", err);
  }
};

/**
 * Replace old white worker dialog with dark GVM worker dialog.
 */
GVM.originalAssignWorkersStage4 = GVM.originalAssignWorkersStage4 || GVM.assignWorkers;

GVM.assignWorkers = async function assignWorkersStage4(actor, item) {
  if (!actor || !item) return GVM.originalAssignWorkersStage4?.(actor, item);

  const data = GVM.clone ? GVM.clone(GVM.gvmData(item)) : foundry.utils.deepClone(GVM.gvmData(item));
  const resources = GVM.getResources(actor);

  const otherAssigned = GVM.buildings(actor)
    .filter(building => building.id !== item.id)
    .reduce((sum, building) => {
      const buildingData = GVM.gvmData(building);
      if (!["built", "damaged"].includes(buildingData.status)) return sum;
      return sum + Math.min(
        Number(buildingData.workersAssigned) || 0,
        Number(buildingData.workersRequired) || 0
      );
    }, 0);

  const required = Number(data.workersRequired) || 0;
  const current = Number(data.workersAssigned) || 0;
  const available = Math.max(0, Number(resources.population || 0) - otherAssigned);
  const max = Math.min(required, available);

  new Dialog({
    title: `${item.name}: рабочие`,
    content: `
      <form class="gvm-stage4-dialog gvm-stage4-worker-form">
        <section class="gvm-stage4-hero">
          <h2>${GVM.escapeHtml(item.name)}</h2>
          <p>Назначь обычных рабочих здания. Ключевые жители назначаются отдельно через карточки НИП.</p>
        </section>

        <section class="gvm-stage4-grid">
          <div class="gvm-stage4-stat">
            <strong>${max}</strong>
            <span>доступно для здания</span>
          </div>
          <div class="gvm-stage4-stat">
            <strong>${required}</strong>
            <span>требуется максимум</span>
          </div>
          <div class="gvm-stage4-stat">
            <strong>${available}</strong>
            <span>свободно в поселении</span>
          </div>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Рабочие</span>
          <input type="number" name="workers" value="${current}" min="0" max="${max}">
        </label>

        <p class="gvm-stage4-note">
          Значение будет ограничено диапазоном 0-${max}.
        </p>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const value = Number(html.find("[name=workers]").val()) || 0;
          data.workersAssigned = Math.max(0, Math.min(max, value));
          await item.setFlag(GVM.FLAG_SCOPE, "data", data);

          if (GVM.queueRefresh) GVM.queueRefresh(actor);
          else GVM.refreshSettlement(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-stage4-window");
    }
  }, {
    width: 620,
    height: "auto"
  }).render(true);
};

/**
 * Polish after normal refresh.
 */
GVM.originalRefreshSettlementStage4 = GVM.originalRefreshSettlementStage4 || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementStage4(actor) {
  const result = GVM.originalRefreshSettlementStage4(actor);

  setTimeout(() => {
    GVM.stage4PolishSettlement(actor, document);
  }, 60);

  return result;
};

/**
 * Polish after panel render.
 */
if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelStage4) {
  GVM.originalRenderSettlementPanelStage4 = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelStage4(actor, panel) {
    await GVM.originalRenderSettlementPanelStage4(actor, panel);
    GVM.stage4PolishSettlement(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM Stage4 UX Redesign loaded");

  for (const app of Object.values(ui.windows || {})) {
    const actor = app?.actor;
    if (actor && GVM.isSettlementActor && GVM.isSettlementActor(actor)) {
      GVM.stage4PolishSettlement(actor, app.element?.[0] || document);
    }
  }
});
