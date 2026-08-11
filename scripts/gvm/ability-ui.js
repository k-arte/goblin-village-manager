GVM.renderAbilityCard = function renderAbilityCard(actor, ability) {
  const art = GVM.getSourceArt({
    ...ability.source,
    actor
  }, GVM.SAFE_ICON);

  const missing = ability.missing?.length
    ? ability.missing.map(item => item.label).join(", ")
    : "";

  return `
    <article class="gvm-ability-card ${ability.available ? "available" : "unavailable"}" data-gvm-ability-id="${GVM.escapeHtml(ability.id)}" style="--gvm-card-art: url('${GVM.escapeHtml(GVM.safeImg(art))}');">
      <div class="gvm-ability-shade"></div>

      <header>
        <div>
          <h4>${GVM.escapeHtml(ability.label)}</h4>
          <span>${GVM.escapeHtml(GVM.abilitySourceLabel(ability))}</span>
        </div>

        <button type="button" class="gvm-mini-button primary" data-gvm-control="activate-ability" ${ability.available ? "" : "disabled"}>
          ${ability.available ? "Активировать" : "Недоступно"}
        </button>
      </header>

      <p>${GVM.escapeHtml(ability.description || "Описание не задано.")}</p>

      <div class="gvm-ability-meta">
        <span>${GVM.escapeHtml(ability.action?.orderType || ability.action?.type || "instant")}</span>
        <span>${GVM.escapeHtml(GVM.abilityCostLabel(ability))}</span>
        ${ability.source?.requiredLevel ? `<span>Уровень ${Number(ability.source.requiredLevel)}</span>` : ""}
      </div>

      ${!ability.available ? `<div class="gvm-ability-missing">Не хватает: ${GVM.escapeHtml(missing || "условия не выполнены")}</div>` : ""}
    </article>
  `;
};

GVM.renderAbilitiesSection = function renderAbilitiesSection(actor) {
  const abilities = GVM.collectAvailableAbilities ? GVM.collectAvailableAbilities(actor, { includeUnavailable: GVM.isGM() }) : [];
  const collapsed = GVM.sectionIsCollapsed ? GVM.sectionIsCollapsed(actor, "abilities") : false;

  if (!abilities.length) return "";

  return `
    <section class="gvm-abilities-section" data-gvm-section="abilities">
      <header class="gvm-management-section-header">
        <button type="button" class="gvm-collapse-button" data-gvm-control="toggle-section" data-gvm-section-key="abilities">
          <i class="fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}"></i>
        </button>
        <h3>Бонусы и услуги</h3>
        <span>${abilities.filter(item => item.available).length} / ${abilities.length}</span>
      </header>

      ${collapsed ? "" : `
        <div class="gvm-ability-list">
          ${abilities.map(ability => GVM.renderAbilityCard(actor, ability)).join("")}
        </div>
      `}
    </section>
  `;
};

GVM.originalRenderSettlementPanelV070Stage2 = GVM.originalRenderSettlementPanelV070Stage2 || GVM.renderSettlementPanel;

GVM.renderSettlementPanel = async function renderSettlementPanelWithAbilities(actor, panel) {
  await GVM.originalRenderSettlementPanelV070Stage2(actor, panel);

  const board = panel.querySelector(".gvm-bastion-board");
  if (!board) return;

  board.querySelector(".gvm-abilities-section")?.remove();

  const management = board.querySelector(".gvm-management-area");
  const abilitiesHtml = GVM.renderAbilitiesSection(actor);

  if (abilitiesHtml && management) {
    management.insertAdjacentHTML("afterend", abilitiesHtml);
  } else if (abilitiesHtml) {
    board.insertAdjacentHTML("beforeend", abilitiesHtml);
  }

  GVM.activateAbilitiesSection(actor, board);
};

GVM.activateAbilitiesSection = function activateAbilitiesSection(actor, root) {
  root.querySelectorAll("[data-gvm-control='activate-ability']").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const card = button.closest("[data-gvm-ability-id]");
      if (!card) return;

      await GVM.executeAbility(actor, card.dataset.gvmAbilityId);
      GVM.queueRefresh(actor);
    });
  });
};
