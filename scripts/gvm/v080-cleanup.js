/**
 * Goblin Village Manager v0.8
 * Final UI Cleanup Layer
 *
 * Goals:
 * - Hide legacy/debug UI noise by default.
 * - Improve readability and spacing.
 * - Normalize old labels and technical tokens.
 * - Add stronger dark styling hooks.
 * - Keep gameplay logic unchanged.
 */

window.GVM = window.GVM || {};
GVM.V080 = GVM.V080 || {};

GVM.v080GetUiSettings = function v080GetUiSettings(actor) {
  const settings = GVM.getSettings ? GVM.getSettings(actor) : {};
  const ui = settings?.v080?.ui || {};

  return {
    compactMode: !!ui.compactMode,
    showUnavailableAbilities: ui.showUnavailableAbilities || "gm",
    showDebugFields: !!ui.showDebugFields,
    showLegacySections: !!ui.showLegacySections
  };
};

GVM.v080NormalizeInterfaceText = function v080NormalizeInterfaceText(root = document) {
  const replacements = [
    ["Малый приказ", "Личный приказ"],
    ["малый приказ", "личный приказ"],
    ["Малые приказы", "Личные приказы"],
    ["малые приказы", "личные приказы"],
    ["малых приказов", "личных приказов"],
    ["minor", "personal"],
    ["Minor", "Personal"]
  ];

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const value = node.nodeValue || "";
        if (!value.trim()) return NodeFilter.FILTER_REJECT;

        if (
          value.includes("Малый") ||
          value.includes("малый") ||
          value.includes("minor") ||
          value.includes("Minor") ||
          value.includes("Богусы")
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (const node of nodes) {
    let value = node.nodeValue;

    for (const [oldValue, newValue] of replacements) {
      value = value.replaceAll(oldValue, newValue);
    }

    value = value.replaceAll("Богусы", "Бонусы и услуги");

    node.nodeValue = value;
  }
};

GVM.v080LooksTechnical = function v080LooksTechnical(text = "") {
  const value = String(text || "").trim();

  if (!value) return false;

  const lower = value.toLowerCase();

  if (lower.includes("facilityid")) return true;
  if (lower.includes("catalogid")) return true;
  if (lower.includes("targetitemid")) return true;
  if (lower.includes("source uuid")) return true;
  if (lower.includes("actoruuid")) return true;
  if (lower.includes("item uuid")) return true;
  if (lower.includes("flags.")) return true;
  if (lower.includes("goblin-village-manager")) return true;
  if (lower.includes("debug")) return true;
  if (lower.includes("raw json")) return true;
  if (lower.includes("json")) return true;

  if (/^[a-zA-Z0-9_-]{12,}$/.test(value)) return true;
  if (/^[a-z]+[A-Z][A-Za-z0-9]+$/.test(value)) return true;

  return false;
};

GVM.v080HideDebugNoise = function v080HideDebugNoise(actor, root = document) {
  const ui = GVM.v080GetUiSettings(actor);

  root.classList?.toggle?.("gvm-v080-debug-visible", ui.showDebugFields);
  root.classList?.toggle?.("gvm-v080-legacy-visible", ui.showLegacySections);
  root.classList?.toggle?.("gvm-v080-compact", ui.compactMode);

  if (ui.showDebugFields) return;

  const candidates = Array.from(root.querySelectorAll(
    ".gvm-debug, .gvm-json, .gvm-raw, [data-debug], [data-gvm-debug], .debug, .json-editor"
  ));

  for (const element of candidates) {
    element.classList.add("gvm-v080-hidden-debug");
  }

  const textCandidates = Array.from(root.querySelectorAll("small, code, pre, span, div, p, label"));

  for (const element of textCandidates) {
    if (element.closest(".gvm-v080-window")) continue;
    if (element.closest(".gvm-v080-debug-visible")) continue;

    const text = element.textContent || "";

    if (GVM.v080LooksTechnical(text)) {
      element.classList.add("gvm-v080-hidden-debug");
    }
  }
};

GVM.v080HideLegacySections = function v080HideLegacySections(actor, root = document) {
  const ui = GVM.v080GetUiSettings(actor);

  if (ui.showLegacySections) return;

  const legacyTitles = new Set([
    "Бонусы",
    "Богусы",
    "Услуги",
    "Services",
    "Bonuses",
    "Legacy"
  ]);

  const sections = Array.from(root.querySelectorAll("section, article, .gvm-section"));

  for (const section of sections) {
    if (section.closest(".gvm-abilities-section")) continue;
    if (section.closest(".gvm-v080-ability-manager")) continue;

    const title = section.querySelector("h1, h2, h3, h4, .title")?.textContent?.trim();

    if (title && legacyTitles.has(title)) {
      section.classList.add("gvm-v080-hidden-legacy-section");
    }
  }
};

GVM.v080PolishCards = function v080PolishCards(root = document) {
  const cards = Array.from(root.querySelectorAll(
    ".gvm-facility-card, .gvm-building-card, .gvm-resident-card, .gvm-key-resident-card, .gvm-ability-card, article.gvm-card"
  ));

  for (const card of cards) {
    card.classList.add("gvm-v080-clean-card");

    const longSmalls = Array.from(card.querySelectorAll("small"));

    for (const small of longSmalls) {
      if ((small.textContent || "").length > 70) {
        small.classList.add("gvm-v080-secondary-text");
      }
    }

    const buttons = Array.from(card.querySelectorAll("button"));

    for (const button of buttons) {
      if (!button.classList.contains("gvm-mini-button") && !button.classList.contains("gvm-control")) {
        button.classList.add("gvm-v080-button");
      }
    }
  }
};

GVM.v080PolishDialogs = function v080PolishDialogs(root = document) {
  const windows = Array.from(document.querySelectorAll(".app.window-app, .dialog"));

  for (const app of windows) {
    const content = app.querySelector(".window-content");
    if (!content) continue;

    const hasGvmContent =
      content.querySelector(".gvm-dialog") ||
      content.querySelector(".gvm-config-form") ||
      content.querySelector(".gvm-ability-builder-form") ||
      content.querySelector(".gvm-v080-settings-form") ||
      content.querySelector(".gvm-v080-ability-manager") ||
      content.querySelector(".gvm-v080-ability-editor") ||
      content.querySelector(".gvm-stage4-dialog");

    if (hasGvmContent) {
      app.classList.add("gvm-v080-window");
    }
  }
};

GVM.v080AddEmptyStateHints = function v080AddEmptyStateHints(root = document) {
  const empties = Array.from(root.querySelectorAll(".gvm-empty, .gvm-v080-empty"));

  for (const empty of empties) {
    empty.classList.add("gvm-v080-empty-state");

    if (!empty.textContent.trim()) {
      empty.textContent = "Пока здесь ничего нет.";
    }
  }
};

GVM.v080FinalUiCleanup = function v080FinalUiCleanup(actor, root = document) {
  try {
    GVM.v080NormalizeInterfaceText(root);
    GVM.v080HideLegacySections(actor, root);
    GVM.v080HideDebugNoise(actor, root);
    GVM.v080PolishCards(root);
    GVM.v080PolishDialogs(root);
    GVM.v080AddEmptyStateHints(root);
  } catch (err) {
    console.warn("GVM v0.8 final UI cleanup failed", err);
  }
};

GVM.originalRefreshSettlementV080Cleanup = GVM.originalRefreshSettlementV080Cleanup || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080Cleanup(actor) {
  const result = GVM.originalRefreshSettlementV080Cleanup(actor);

  setTimeout(() => {
    GVM.v080FinalUiCleanup(actor, document);
  }, 260);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080Cleanup) {
  GVM.originalRenderSettlementPanelV080Cleanup = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080Cleanup(actor, panel) {
    await GVM.originalRenderSettlementPanelV080Cleanup(actor, panel);
    GVM.v080FinalUiCleanup(actor, panel || document);
  };
}

Hooks.on("renderDialog", app => {
  setTimeout(() => GVM.v080PolishDialogs(document), 30);
});

Hooks.once("ready", () => {
  console.log("GVM v0.8 Final UI Cleanup Layer loaded");
});
