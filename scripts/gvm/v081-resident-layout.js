
/**
 * GVM v0.8.1
 * Resident card final layout.
 *
 * Layout:
 * - Portrait column takes 1/3.
 * - Info column takes 2/3.
 * - Name is above description.
 * - Broken raw portrait HTML text is removed.
 */

window.GVM = window.GVM || {};
GVM.V081 = GVM.V081 || {};

GVM.v081GetResidents = function v081GetResidents(actor) {
  if (!actor) return [];

  if (GVM.getKeyResidents) {
    const fromGvm = GVM.getKeyResidents(actor);
    if (Array.isArray(fromGvm)) return fromGvm;
  }

  const moduleId = GVM.MODULE_ID || "goblin-village-manager";
  const flags = actor.flags?.[moduleId] || {};
  const settings = actor.getFlag(moduleId, "settings") || {};

  return settings.keyResidents || settings.residents || flags.keyResidents || flags.residents || [];
};

GVM.v081GetResidentActorSync = function v081GetResidentActorSync(resident) {
  if (!resident) return null;

  if (GVM.getResidentActorSync) {
    const actor = GVM.getResidentActorSync(resident);
    if (actor) return actor;
  }

  if (resident.actorId && game.actors.get(resident.actorId)) return game.actors.get(resident.actorId);
  if (resident.id && game.actors.get(resident.id)) return game.actors.get(resident.id);
  if (resident.name && game.actors.getName(resident.name)) return game.actors.getName(resident.name);

  return null;
};

GVM.v081ResidentName = function v081ResidentName(resident, residentActor) {
  return (
    residentActor?.name ||
    resident?.name ||
    resident?.professionLabel ||
    resident?.professionId ||
    "Ключевой НИП"
  );
};

GVM.v081ResidentPortrait = function v081ResidentPortrait(resident, residentActor) {
  return (
    residentActor?.img ||
    resident?.img ||
    resident?.portrait ||
    resident?.texture?.src ||
    resident?.prototypeToken?.texture?.src ||
    GVM.SAFE_ICON ||
    "icons/svg/mystery-man.svg"
  );
};

GVM.v081CssEscape = function v081CssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value || "").replace(/"/g, '\\"');
};

GVM.v081FindResidentCard = function v081FindResidentCard(root, resident, name) {
  if (!root || !resident) return null;

  const id = resident.id ? String(resident.id) : "";
  const selectors = [];

  if (id) {
    selectors.push('[data-gvm-resident-id="' + GVM.v081CssEscape(id) + '"]');
    selectors.push('[data-resident-id="' + GVM.v081CssEscape(id) + '"]');
    selectors.push('[data-key-resident-id="' + GVM.v081CssEscape(id) + '"]');
  }

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  const cards = Array.from(root.querySelectorAll("article, .gvm-card, .gvm-resident-card, .gvm-key-resident-card"));
  return cards.find(card => (card.textContent || "").includes(name)) || null;
};

GVM.v081RemoveBrokenPortraitText = function v081RemoveBrokenPortraitText(card) {
  if (!card) return;

  const walker = document.createTreeWalker(
    card,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const value = String(node.nodeValue || "");

        if (value.includes("gvm-resident-portrait")) return NodeFilter.FILTER_ACCEPT;
        if (value.includes('class="gvm-resident')) return NodeFilter.FILTER_ACCEPT;
        if (value.includes('alt="')) return NodeFilter.FILTER_ACCEPT;
        if (value.includes('}" class=')) return NodeFilter.FILTER_ACCEPT;
        if (value.trim() === '}"') return NodeFilter.FILTER_ACCEPT;
        if (value.trim() === '">') return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    node.nodeValue = "";
  }
};

GVM.v081ExtractResidentLines = function v081ExtractResidentLines(card, name) {
  const rawText = card.textContent || "";

  const lines = rawText
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const useful = [];

  for (const line of lines) {
    if (line === name) continue;
    if (line.includes("gvm-resident-portrait")) continue;
    if (line.includes("class=")) continue;
    if (line.includes("alt=")) continue;
    if (line === "}") continue;
    if (line === '}"') continue;
    if (line === "+ СПОСОБНОСТЬ") continue;
    if (line === "НАСТРОИТЬ") continue;
    if (line === "УБРАТЬ") continue;
    if (line === "СПОСОБНОСТИ") continue;

    if (!useful.includes(line)) useful.push(line);
  }

  return useful;
};

GVM.v081CollectResidentButtons = function v081CollectResidentButtons(card) {
  return Array.from(card.querySelectorAll("button"));
};

GVM.v081RebuildResidentCard = function v081RebuildResidentCard(card, resident, residentActor) {
  if (!card || card.dataset.gvmV081LayoutApplied === "1") return;

  const name = GVM.v081ResidentName(resident, residentActor);
  const portrait = GVM.v081ResidentPortrait(resident, residentActor);

  GVM.v081RemoveBrokenPortraitText(card);

  const usefulLines = GVM.v081ExtractResidentLines(card, name);
  const buttons = GVM.v081CollectResidentButtons(card);

  card.innerHTML = "";
  card.dataset.gvmV081LayoutApplied = "1";
  card.classList.add("gvm-v081-resident-card-final");

  const portraitColumn = document.createElement("div");
  portraitColumn.className = "gvm-v081-resident-portrait-column";

  const portraitWrap = document.createElement("div");
  portraitWrap.className = "gvm-v081-resident-portrait-wrap";

  const img = document.createElement("img");
  img.className = "gvm-v081-resident-portrait-img";
  img.src = portrait;
  img.alt = name;
  img.onerror = function () {
    img.src = "icons/svg/mystery-man.svg";
  };

  portraitWrap.appendChild(img);
  portraitColumn.appendChild(portraitWrap);

  const infoColumn = document.createElement("div");
  infoColumn.className = "gvm-v081-resident-info-column";

  const nameEl = document.createElement("div");
  nameEl.className = "gvm-v081-resident-name";
  nameEl.textContent = name;

  const description = document.createElement("div");
  description.className = "gvm-v081-resident-description";

  if (!usefulLines.length) {
    const empty = document.createElement("div");
    empty.textContent = "Данные НИП не настроены";
    description.appendChild(empty);
  } else {
    for (const line of usefulLines) {
      const field = document.createElement("div");
      field.textContent = line;
      description.appendChild(field);
    }
  }

  const actions = document.createElement("div");
  actions.className = "gvm-v081-resident-actions";

  for (const button of buttons) {
    actions.appendChild(button);
  }

  infoColumn.appendChild(nameEl);
  infoColumn.appendChild(description);
  infoColumn.appendChild(actions);

  card.appendChild(portraitColumn);
  card.appendChild(infoColumn);
};

GVM.v081ApplyResidentLayout = function v081ApplyResidentLayout(actor, root = document) {
  if (!actor) return;

  const residents = GVM.v081GetResidents(actor);
  if (!Array.isArray(residents) || !residents.length) return;

  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root") ||
    root;

  for (const resident of residents) {
    const residentActor = GVM.v081GetResidentActorSync(resident);
    const name = GVM.v081ResidentName(resident, residentActor);
    const card = GVM.v081FindResidentCard(board, resident, name);

    if (card) {
      GVM.v081RebuildResidentCard(card, resident, residentActor);
    }
  }
};

GVM.originalRefreshSettlementV081ResidentLayout =
  GVM.originalRefreshSettlementV081ResidentLayout || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV081ResidentLayout(actor) {
  const result = GVM.originalRefreshSettlementV081ResidentLayout(actor);

  setTimeout(() => {
    GVM.v081ApplyResidentLayout(actor, document);
  }, 320);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV081ResidentLayout) {
  GVM.originalRenderSettlementPanelV081ResidentLayout = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV081ResidentLayout(actor, panel) {
    await GVM.originalRenderSettlementPanelV081ResidentLayout(actor, panel);
    GVM.v081ApplyResidentLayout(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8.1 Resident Layout loaded");
});
