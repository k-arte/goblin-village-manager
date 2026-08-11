GVM.getDonationActor = function getDonationActor() {
  const controlled = canvas?.tokens?.controlled?.[0]?.actor;
  if (controlled) return controlled;

  if (game.user?.character) return game.user.character;

  return null;
};

GVM.getActorGp = function getActorGp(actor) {
  return Number(foundry.utils.getProperty(actor, "system.currency.gp") || 0);
};

GVM.setActorGp = async function setActorGp(actor, gp) {
  await actor.update({ "system.currency.gp": Math.max(0, Number(gp || 0)) });
};

GVM.openDonateTreasuryDialog = function openDonateTreasuryDialog(settlementActor) {
  const donor = GVM.getDonationActor();

  if (!donor) {
    ui.notifications.warn("Не найден Actor игрока. Выберите токен или назначьте character пользователю.");
    return;
  }

  new Dialog({
    title: "Внести в казну поселения",
    content: `
      <form>
        <p><b>Источник:</b> ${GVM.escapeHtml(donor.name)}</p>
        <p><b>Доступно gp:</b> ${GVM.getActorGp(donor)}</p>
        <div class="form-group">
          <label>Сумма gp</label>
          <input type="number" name="amount" value="0">
        </div>
      </form>
    `,
    buttons: {
      donate: {
        label: "Внести",
        callback: async html => {
          const amount = Math.max(0, Math.floor(Number(html.find("[name=amount]").val()) || 0));
          if (!amount) return;

          const currentGp = GVM.getActorGp(donor);

          if (currentGp < amount) {
            ui.notifications.warn("У Actor недостаточно gp.");
            return;
          }

          await GVM.setActorGp(donor, currentGp - amount);

          const resources = GVM.getResources(settlementActor);
          resources.treasury = Number(resources.treasury || 0) + amount;
          await GVM.setResources(settlementActor, resources);

          if (GVM.addJournalEntry) {
            await GVM.addJournalEntry(settlementActor, {
              type: "economy",
              title: "Взнос в казну",
              entries: [`${donor.name} внёс ${amount} казны на развитие поселения.`],
              changes: {
                treasury: amount
              }
            });
          }

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ alias: donor.name }),
            content: `<p>${GVM.escapeHtml(donor.name)} внёс <b>${amount}</b> gp в казну поселения.</p>`
          });

          GVM.refreshSettlement(settlementActor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
};

GVM.originalRenderManagementAreaV07Donate = GVM.originalRenderManagementAreaV07Donate || GVM.renderManagementArea;

GVM.renderManagementArea = function renderManagementAreaWithDonate(actor) {
  let html = GVM.originalRenderManagementAreaV07Donate(actor);

  if (!html.includes('data-gvm-control="donate-treasury"')) {
    html = html.replace(
      '<div class="gvm-management-actions">',
      '<div class="gvm-management-actions"><button type="button" class="gvm-control primary" data-gvm-control="donate-treasury">Внести в казну</button>'
    );
  }

  return html;
};

GVM.originalActivatePanelV07Donate = GVM.originalActivatePanelV07Donate || GVM.activatePanel;

GVM.activatePanel = function activatePanelWithDonate(actor, panel) {
  GVM.originalActivatePanelV07Donate(actor, panel);

  panel.querySelectorAll("[data-gvm-control='donate-treasury']").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.openDonateTreasuryDialog(actor);
    });
  });
};
