/**
 * Goblin Village Manager v0.8
 * Visuals + Building Adaptation Layer
 *
 * Goals:
 * - Reliable building card art.
 * - Visible resident portraits beside resident names.
 * - Adapt old building data to v0.8 abilities/services structure.
 * - Add "Адаптировать здания" control for GM.
 */

window.GVM = window.GVM || {};
GVM.V080 = GVM.V080 || {};

GVM.v080SafeImage = function v080SafeImage(value) {
  const raw = String(value || "").trim();

  if (!raw || raw === "undefined" || raw === "null") {
    return GVM.SAFE_ICON || "icons/svg/item-bag.svg";
  }

  if (GVM.safeImg) return GVM.safeImg(raw);

  return raw;
};

GVM.v080GetBuildingArt = function v080GetBuildingArt(item) {
  const data = GVM.gvmData ? GVM.gvmData(item) : {};

  return GVM.v080SafeImage(
    data.art ||
    data.img ||
    item?.img ||
    GVM.SAFE_ICON
  );
};

GVM.v080GetResidentPortrait = function v080GetResidentPortrait(resident = {}) {
  const residentActor = GVM.getResidentActorSync ? GVM.getResidentActorSync(resident) : null;

  return GVM.v080SafeImage(
    residentActor?.img ||
    resident.img ||
    resident.portrait ||
    GVM.SAFE_ICON
  );
};

GVM.v080ApplyBuildingVisuals = function v080ApplyBuildingVisuals(actor, root = document) {
  if (!actor || !GVM.buildings) return;

  for (const item of GVM.buildings(actor)) {
    const card = GVM.v080FindBuildingCard
      ? GVM.v080FindBuildingCard(root, item)
      : null;

    if (!card) continue;

    const art = GVM.v080GetBuildingArt(item);

    card.classList.add("gvm-v080-building-art-card");
    card.style.setProperty("--gvm-v080-building-art", `url("${art}")`);

    const existingImg = card.querySelector("img.gvm-v080-building-thumb");

    if (!existingImg) {
      const img = document.createElement("img");
      img.className = "gvm-v080-building-thumb";
      img.src = art;
      img.alt = item.name;

      const header = card.querySelector("header") || card.firstElementChild || card;
      header.prepend(img);
    } else {
      existingImg.src = art;
      existingImg.alt = item.name;
    }
  }
};

GVM.v080ApplyResidentPortraits = function v080ApplyResidentPortraits(actor, root = document) {
  if (!actor || !GVM.getKeyResidents || !GVM.v080FindResidentCard) return;

  const residents = GVM.getKeyResidents(actor) || [];

  for (const resident of residents) {
    const card = GVM.v080FindResidentCard(root, resident);
    if (!card) continue;

    const portrait = GVM.v080GetResidentPortrait(resident);
    const name = GVM.v080GetResidentName ? GVM.v080GetResidentName(resident) : "Ключевой НИП";

    card.classList.add("gvm-v080-resident-portrait-card");

    let portraitBox = card.querySelector(".gvm-v080-resident-portrait-box");

    if (!portraitBox) {
      portraitBox = document.createElement("div");
      portraitBox.className = "gvm-v080-resident-portrait-box";

      const img = document.createElement("img");
      img.className = "gvm-v080-resident-portrait";
      img.src = portrait;
      img.alt = name;
      img.onerror = function () {
        img.src = "icons/svg/mystery-man.svg";
      };

      portraitBox.appendChild(img);

      const header =
        card.querySelector("header") ||
        card.querySelector(".gvm-resident-header") ||
        card.querySelector(".gvm-key-resident-header") ||
        card.firstElementChild ||
        card;

      header.classList.add("gvm-v080-resident-header-with-portrait");

      if (!header.querySelector(".gvm-v080-resident-portrait-box")) {
        header.prepend(portraitBox);
      }
    } else {
      const img = portraitBox.querySelector("img");

      if (img) {
        img.src = portrait;
        img.alt = name;
      }
    }
  }
};

GVM.v080ServiceToAbility = function v080ServiceToAbility(service, source = {}) {
  if (!service) return null;

  if (typeof service === "object") {
    const ability = foundry.utils.deepClone(service);

    ability.id = ability.id || `${GVM.slugify ? GVM.slugify(ability.label || ability.name || "service") : "service"}-${foundry.utils.randomID(5)}`;
    ability.label = ability.label || ability.name || "Услуга";
    ability.description = ability.description || ability.text || ability.label;
    ability.mode = ability.mode || "add";

    ability.action = ability.action || {};
    ability.action.type = ability.action.type || ability.type || ability.orderType || "instant";
    ability.action.orderType = ability.action.orderType || ability.orderType || ability.action.type || "instant";
    ability.action.durationCycles = Number(ability.action.durationCycles ?? ability.durationCycles ?? ability.duration ?? 0);
    ability.action.cost = ability.action.cost || ability.cost || { stat: "treasury", value: 0 };

    ability.result = ability.result || {
      type: "manual",
      text: ability.description || ability.label
    };

    ability.source = ability.source || source;

    return ability;
  }

  const label = String(service);

  return {
    id: `${GVM.slugify ? GVM.slugify(label) : "service"}-${foundry.utils.randomID(5)}`,
    label,
    description: label,
    mode: "add",
    action: {
      type: "instant",
      orderType: "instant",
      durationCycles: 0,
      cost: {
        stat: "treasury",
        value: 0
      }
    },
    result: {
      type: "manual",
      text: label
    },
    requirements: [],
    source
  };
};

GVM.v080AdaptBuildingData = function v080AdaptBuildingData(item) {
  const data = foundry.utils.deepClone(GVM.gvmData(item));
  let changed = false;

  data.levels = Array.isArray(data.levels) ? data.levels : [];

  if (!data.art && item.img && item.img !== GVM.SAFE_ICON) {
    data.art = item.img;
    changed = true;
  }

  const currentLevel = Math.max(1, Number(data.level || 1));

  let currentLevelData = data.levels.find(level => Number(level.level || 0) === currentLevel);

  if (!currentLevelData) {
    currentLevelData = {
      level: currentLevel,
      title: `Уровень ${currentLevel}`,
      description: data.note || "",
      abilities: []
    };
    data.levels.push(currentLevelData);
    changed = true;
  }

  currentLevelData.abilities = Array.isArray(currentLevelData.abilities) ? currentLevelData.abilities : [];

  const existingLabels = new Set(
    currentLevelData.abilities.map(ability => String(ability.label || ability.name || ability.id || ""))
  );

  for (const service of data.services || []) {
    const ability = GVM.v080ServiceToAbility(service, {
      type: "building",
      buildingItemId: item.id,
      buildingName: item.name,
      requiredLevel: currentLevel,
      img: item.img || GVM.SAFE_ICON
    });

    if (!ability) continue;

    if (!existingLabels.has(ability.label)) {
      currentLevelData.abilities.push(ability);
      existingLabels.add(ability.label);
      changed = true;
    }
  }

  for (const action of data.actions || []) {
    const ability = GVM.v080ServiceToAbility(action, {
      type: "building",
      buildingItemId: item.id,
      buildingName: item.name,
      requiredLevel: currentLevel,
      img: item.img || GVM.SAFE_ICON
    });

    if (!ability) continue;

    if (!existingLabels.has(ability.label)) {
      currentLevelData.abilities.push(ability);
      existingLabels.add(ability.label);
      changed = true;
    }
  }

  data.v080Adapted = true;
  data.v080AdaptedAt = Date.now();

  if (!changed && data.v080Adapted) {
    return {
      changed: false,
      data
    };
  }

  return {
    changed: true,
    data
  };
};

GVM.v080AdaptSettlementBuildings = async function v080AdaptSettlementBuildings(actor) {
  if (!actor || !GVM.buildings) return;

  let changed = 0;
  let checked = 0;

  for (const item of GVM.buildings(actor)) {
    checked += 1;

    const result = GVM.v080AdaptBuildingData(item);

    if (result.changed) {
      await item.setFlag(GVM.FLAG_SCOPE, "data", result.data);
      changed += 1;
    }
  }

  ui.notifications.info(`Адаптация зданий: обновлено ${changed} из ${checked}.`);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "settings",
      title: "Адаптация зданий v0.8",
      entries: [
        `Проверено зданий: ${checked}.`,
        `Обновлено зданий: ${changed}.`,
        "Старые services/actions перенесены в abilities текущего уровня, где это было возможно."
      ]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.v080InjectAdaptBuildingsButton = function v080InjectAdaptBuildingsButton(actor, root = document) {
  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  if (!board || board.querySelector("[data-gvm-v080-control='adapt-buildings']")) return;

  const settingsEntry =
    board.querySelector(".gvm-v080-settings-entry") ||
    board.querySelector(".gvm-management-area") ||
    board.querySelector("[data-gvm-v080-overview-panel]") ||
    board;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "gvm-control secondary";
  button.dataset.gvmV080Control = "adapt-buildings";
  button.textContent = "Адаптировать здания";

  button.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    await GVM.v080AdaptSettlementBuildings(actor);
  });

  if (settingsEntry.classList && settingsEntry.classList.contains("gvm-v080-settings-entry")) {
    settingsEntry.appendChild(button);
  } else {
    const wrap = document.createElement("section");
    wrap.className = "gvm-v080-settings-entry";
    wrap.appendChild(button);
    settingsEntry.prepend(wrap);
  }
};

GVM.v080VisualAndContentPolish = function v080VisualAndContentPolish(actor, root = document) {
  try {
    GVM.v080ApplyBuildingVisuals(actor, root);
    GVM.v080ApplyResidentPortraits(actor, root);
    GVM.v080InjectAdaptBuildingsButton(actor, root);
  } catch (err) {
    console.warn("GVM v0.8 visual/content polish failed", err);
  }
};

GVM.originalRefreshSettlementV080VisualContent = GVM.originalRefreshSettlementV080VisualContent || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080VisualContent(actor) {
  const result = GVM.originalRefreshSettlementV080VisualContent(actor);

  setTimeout(() => {
    GVM.v080VisualAndContentPolish(actor, document);
  }, 220);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080VisualContent) {
  GVM.originalRenderSettlementPanelV080VisualContent = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080VisualContent(actor, panel) {
    await GVM.originalRenderSettlementPanelV080VisualContent(actor, panel);
    GVM.v080VisualAndContentPolish(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8 Visual + Content Adaptation Layer loaded");
});
