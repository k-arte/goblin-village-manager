GVM.renderJournalEntry = function renderJournalEntry(entry) {
  const type = entry.type || "note";
  const title = entry.title || "Событие поселения";
  const entries = Array.isArray(entry.entries) ? entry.entries : [];
  const cycle = Number(entry.cycle || 0);

  return `
    <article class="gvm-journal-entry type-${GVM.escapeHtml(type)}">
      <header>
        <h4>${GVM.escapeHtml(title)}</h4>
        <span>Цикл ${cycle}</span>
      </header>
      ${entries.length ? `
        <ul>
          ${entries.map(line => `<li>${GVM.escapeHtml(line)}</li>`).join("")}
        </ul>
      ` : `<p>Нет подробностей.</p>`}
    </article>
  `;
};

GVM.renderJournalSection = function renderJournalSection(actor) {
  const settings = GVM.getSettings(actor);
  const journal = Array.isArray(settings.journal) ? settings.journal.slice(0, 14) : [];
  const collapsed = GVM.sectionIsCollapsed ? GVM.sectionIsCollapsed(actor, "journal") : false;

  if (!journal.length) {
    return "";
  }

  return `
    <section class="gvm-journal-section" data-gvm-section="journal">
      <header class="gvm-management-section-header">
        <button type="button" class="gvm-collapse-button" data-gvm-control="toggle-section" data-gvm-section-key="journal">
          <i class="fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}"></i>
        </button>
        <h3>Журнал последних циклов</h3>
        <span>${journal.length} / 14</span>
      </header>

      ${collapsed ? "" : `
        <div class="gvm-journal-list">
          ${journal.map(GVM.renderJournalEntry).join("")}
        </div>
      `}
    </section>
  `;
};

GVM.originalRenderSettlementPanelV060 = GVM.originalRenderSettlementPanelV060 || GVM.renderSettlementPanel;

GVM.renderSettlementPanel = async function renderSettlementPanelWithJournal(actor, panel) {
  await GVM.originalRenderSettlementPanelV060(actor, panel);

  const board = panel.querySelector(".gvm-bastion-board");
  if (!board) return;

  const existing = board.querySelector(".gvm-journal-section");
  if (existing) existing.remove();

  const journalHtml = GVM.renderJournalSection(actor);
  if (!journalHtml) return;

  board.insertAdjacentHTML("beforeend", journalHtml);

  board.querySelectorAll(".gvm-journal-section [data-gvm-control='toggle-section']").forEach(element => {
    element.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      const key = element.dataset.gvmSectionKey;
      const collapsed = GVM.sectionIsCollapsed(actor, key);
      GVM.setSectionCollapsed(actor, key, !collapsed);
      GVM.queueRefresh(actor);
    });
  });
};
