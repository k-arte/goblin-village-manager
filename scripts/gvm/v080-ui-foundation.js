/**
 * Goblin Village Manager v0.8
 * UI Foundation:
 * - Personal Orders terminology.
 * - Personal Order capacity for key residents.
 * - Navigation and readability polish.
 * - Bonus activation feedback.
 * - DOM cleanup for legacy labels.
 */

window.GVM = window.GVM || {};

GVM.V080 = GVM.V080 || {};

GVM.V080.TERMS = {
  minor: "Личный приказ",
  minorPlural: "Личные приказы",
  city: "Городской приказ",
  cityPlural: "Городские приказы",
  instant: "Мгновенно"
};

GVM.getPersonalOrderCapacity = function getPersonalOrderCapacity(resident = {}) {
  const raw =
    resident.personalOrderCapacity ??
    resident.personalOrders?.capacity ??
    resident.minorOrderCapacity ??
    resident.minorOrders?.capacity ??
    1;

  return Math.max(0, Number(raw) || 1);
};

GVM.setResidentPersonalOrderCapacity = async function setResidentPersonalOrderCapacity(actor, residentId, capacity) {
  if (!actor || !residentId || !GVM.getKeyResidents || !GVM.setKeyResidents) {
    ui.notifications.warn("Не удалось изменить количество личных приказов.");
    return;
  }

  const residents = GVM.getKeyResidents(actor);
  const resident = residents.find(item => item.id === residentId);

  if (!resident) {
    ui.notifications.warn("НИП не найден.");
    return;
  }

  resident.personalOrderCapacity = Math.max(0, Number(capacity) || 0);
  resident.personalOrders = resident.personalOrders || {};
  resident.personalOrders.capacity = resident.personalOrderCapacity;

  await GVM.setKeyResidents(actor, residents);

  ui.notifications.info(`Личные приказы обновлены: ${resident.personalOrderCapacity}.`);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "resident",
      title: "Настройки НИП обновлены",
      entries: [
        `Количество личных приказов: ${resident.personalOrderCapacity}.`
      ]
    });
  }

  if (GVM.queueRefresh) GVM.queueRefresh(actor);
  else GVM.refreshSettlement(actor);
};

GVM.openPersonalOrderCapacityDialog = function openPersonalOrderCapacityDialog(actor, residentId) {
  const residents = GVM.getKeyResidents ? GVM.getKeyResidents(actor) : [];
  const resident = residents.find(item => item.id === residentId);

  if (!resident) {
    ui.notifications.warn("НИП не найден.");
    return;
  }

  const residentActor = GVM.getResidentActorSync ? GVM.getResidentActorSync(resident) : null;
  const name =
    residentActor?.name ||
    resident.name ||
    resident.professionLabel ||
    resident.professionId ||
    "Ключевой НИП";

  const current = GVM.getPersonalOrderCapacity(resident);

  new Dialog({
    title: `${name}: личные приказы`,
    content: `
      <form class="gvm-v080-dialog gvm-v080-personal-order-form">
        <section class="gvm-v080-dialog-hero">
          <h2>${GVM.escapeHtml(name)}</h2>
          <p>Личные приказы ограничивают количество поручений, которые этот НИП может выполнять параллельно.</p>
        </section>

        <label class="gvm-config-field gvm-config-wide">
          <span>Количество личных приказов</span>
          <input type="number" name="personalOrderCapacity" min="0" value="${current}">
        </label>

        <p class="gvm-v080-muted">
          Рекомендуемое значение: 1 для обычного специалиста, 2-3 для важного управляющего или мастера.
        </p>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const value = Number(html.find("[name=personalOrderCapacity]").val()) || 0;
          await GVM.setResidentPersonalOrderCapacity(actor, residentId, value);
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
    width: 620,
    height: "auto"
  }).render(true);
};

GVM.v080ActionTypeLabel = function v080ActionTypeLabel(type) {
  const value = String(type || "").toLowerCase();

  if (value === "minor" || value === "personal" || value === "personalorder") return "Личный приказ";
  if (value === "city" || value === "cityorder") return "Городской приказ";
  if (value === "instant") return "Мгновенно";
  if (value === "rewarditem") return "Награда";
  if (value === "activeeffect") return "Активный эффект";

  return type || "Действие";
};

GVM.v080NormalizeTerminology = function v080NormalizeTerminology(root = document) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const value = node.nodeValue || "";
        if (
          value.includes("Малый приказ") ||
          value.includes("малый приказ") ||
          value.includes("Малые приказы") ||
          value.includes("малые приказы") ||
          value.includes("малых приказ")
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    node.nodeValue = node.nodeValue
      .replaceAll("Малые приказы", "Личные приказы")
      .replaceAll("малые приказы", "личные приказы")
      .replaceAll("Малый приказ", "Личный приказ")
      .replaceAll("малый приказ", "личный приказ")
      .replaceAll("малых приказов", "личных приказов")
      .replaceAll("малых приказа", "личных приказа");
  }
};

GVM.v080GetResidentName = function v080GetResidentName(resident = {}) {
  const actor = GVM.getResidentActorSync ? GVM.getResidentActorSync(resident) : null;
  return actor?.name || resident.name || resident.professionLabel || resident.professionId || "Ключевой НИП";
};

GVM.v080FindResidentCard = function v080FindResidentCard(root, resident = {}) {
  if (!root || !resident?.id) return null;

  const escaped = String(resident.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const selectors = [
    `[data-gvm-resident-id="${escaped}"]`,
    `[data-resident-id="${escaped}"]`,
    `[data-key-resident-id="${escaped}"]`
  ];

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  const name = GVM.v080GetResidentName(resident);
  const cards = Array.from(root.querySelectorAll(".gvm-resident-card, .gvm-key-resident-card, article, .gvm-card"));

  return cards.find(card => {
    const text = card.textContent || "";
    return text.includes(name);
  }) || null;
};

GVM.v080CountActivePersonalOrders = function v080CountActivePersonalOrders(actor, resident = {}) {
  let count = 0;

  if (!actor || !resident) return count;

  if (GVM.buildings) {
    for (const building of GVM.buildings(actor)) {
      const data = GVM.gvmData(building);
      const orders = Array.isArray(data.activeMinorOrders) ? data.activeMinorOrders : [];

      for (const order of orders) {
        const source = order.source || order.ability?.source || {};
        if (source.residentId && source.residentId === resident.id) count += 1;
      }
    }
  }

  return count;
};

GVM.v080ApplyResidentCards = function v080ApplyResidentCards(actor, root = document) {
  if (!actor || !GVM.getKeyResidents) return;

  const residents = GVM.getKeyResidents(actor) || [];

  for (const resident of residents) {
    const card = GVM.v080FindResidentCard(root, resident);
    if (!card) continue;

    card.classList.add("gvm-v080-resident-card");

    const capacity = GVM.getPersonalOrderCapacity(resident);
    const active = GVM.v080CountActivePersonalOrders(actor, resident);

    if (!card.querySelector("[data-gvm-v080-personal-orders]")) {
      const row = document.createElement("div");
      row.className = "gvm-v080-personal-orders-row";
      row.dataset.gvmV080PersonalOrders = resident.id;
      row.innerHTML = `
        <span class="gvm-v080-pill">Личные приказы: ${active} / ${capacity}</span>
        <button type="button" class="gvm-mini-button secondary" data-gvm-v080-control="personal-order-capacity" data-resident-id="${GVM.escapeHtml(resident.id)}">
          Настроить
        </button>
      `;

      const anchor =
        card.querySelector(".gvm-resident-actions") ||
        card.querySelector("footer") ||
        card;

      anchor.appendChild(row);
    } else {
      const row = card.querySelector("[data-gvm-v080-personal-orders]");
      const pill = row.querySelector(".gvm-v080-pill");
      if (pill) pill.textContent = `Личные приказы: ${active} / ${capacity}`;
    }
  }
};

GVM.v080ApplyNavigationPolish = function v080ApplyNavigationPolish(root = document) {
  const board =
    root.querySelector(".gvm-bastion-board") ||
    root.querySelector(".gvm-settlement-board") ||
    root.querySelector(".gvm-root");

  if (!board || board.querySelector(".gvm-v080-nav-hint")) return;

  const hint = document.createElement("section");
  hint.className = "gvm-v080-nav-hint";
  hint.innerHTML = `
    <strong>Навигация v0.8</strong>
    <span>Основной экран будет разделён на: Обзор · Здания · НИПы · Приказы · Бонусы и услуги · Журнал.</span>
  `;

  const header = board.querySelector("header") || board.firstElementChild;
  if (header && header.parentElement) header.insertAdjacentElement("afterend", hint);
  else board.prepend(hint);
};

GVM.v080RemoveLegacyNoise = function v080RemoveLegacyNoise(root = document) {
  const duplicateTitles = new Set([
    "Бонусы",
    "Богусы",
    "Услуги",
    "Services",
    "Bonuses"
  ]);

  const sections = Array.from(root.querySelectorAll("section, article"));

  for (const section of sections) {
    if (section.closest(".gvm-abilities-section")) continue;

    const title = section.querySelector("h2, h3, h4")?.textContent?.trim();
    if (!title) continue;

    if (duplicateTitles.has(title)) {
      section.classList.add("gvm-v080-hidden-legacy");
    }
  }
};

GVM.v080ActivateControls = function v080ActivateControls(actor, root = document) {
  root.querySelectorAll("[data-gvm-v080-control='personal-order-capacity']").forEach(button => {
    if (button.dataset.gvmV080Bound) return;
    button.dataset.gvmV080Bound = "1";

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      const residentId = button.dataset.residentId;
      GVM.openPersonalOrderCapacityDialog(actor, residentId);
    });
  });
};

GVM.v080PolishSettlement = function v080PolishSettlement(actor, root = document) {
  try {
    GVM.v080NormalizeTerminology(root);
    GVM.v080RemoveLegacyNoise(root);
    GVM.v080ApplyResidentCards(actor, root);
    GVM.v080ApplyNavigationPolish(root);
    GVM.v080ActivateControls(actor, root);
  } catch (err) {
    console.warn("GVM v0.8 polish failed", err);
  }
};

GVM.originalRefreshSettlementV080 = GVM.originalRefreshSettlementV080 || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080(actor) {
  const result = GVM.originalRefreshSettlementV080(actor);

  setTimeout(() => {
    GVM.v080PolishSettlement(actor, document);
  }, 80);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080) {
  GVM.originalRenderSettlementPanelV080 = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080(actor, panel) {
    await GVM.originalRenderSettlementPanelV080(actor, panel);
    GVM.v080PolishSettlement(actor, panel || document);
  };
}

GVM.originalActivateBonusV080 = GVM.originalActivateBonusV080 || GVM.activateBonus;

GVM.activateBonus = async function activateBonusV080(actor, item) {
  const before = GVM.gvmData ? GVM.gvmData(item) : {};
  const result = await GVM.originalActivateBonusV080(actor, item);
  const after = GVM.gvmData ? GVM.gvmData(item) : {};

  const becameActive = !before.active && after.active;
  const redeemedReward = after.lastRewardName && after.lastRewardName !== before.lastRewardName;

  if (becameActive || redeemedReward) {
    const title = becameActive ? `Бонус активирован: ${item.name}` : `Награда получена: ${item.name}`;
    const entries = [];

    if (becameActive) entries.push(`Бонус "${item.name}" активирован.`);
    if (redeemedReward) entries.push(`Получена награда: ${after.lastRewardName}.`);

    ui.notifications.info(title);

    if (ChatMessage) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: GVM.getSettlementName ? GVM.getSettlementName(actor) : actor.name }),
        content: `
          <section class="gvm-v080-chat-card">
            <h2>${GVM.escapeHtml(title)}</h2>
            <ul>
              ${entries.map(line => `<li>${GVM.escapeHtml(line)}</li>`).join("")}
            </ul>
          </section>
        `
      });
    }

    if (GVM.addJournalEntry) {
      await GVM.addJournalEntry(actor, {
        type: "bonus",
        title,
        entries
      });
    }
  }

  return result;
};

Hooks.once("ready", () => {
  console.log("GVM v0.8 UI Foundation loaded");
});
