GVM.safeImg = function safeImg(src) {
  const value = String(src || GVM.SAFE_ICON || "icons/svg/item-bag.svg").trim();
  return value || "icons/svg/item-bag.svg";
};

GVM.renderImg = function renderImg(src, className = "", alt = "") {
  return `}" class="${GVM.escapeHtml(className || "")}" alt="${GVM.escapeHtml(alt || "")}">`;
};

GVM.getItemCardArt = function getItemCardArt(item) {
  const data = GVM.gvmData(item);
  return data.art || data.img || item.img || GVM.SAFE_ICON;
};

GVM.getSourceArt = function getSourceArt(source, fallback = null) {
  if (!source) return fallback || GVM.SAFE_ICON;

  if (source.rewardImg) return source.rewardImg;
  if (source.img) return source.img;

  if (source.buildingItemId && source.actor) {
    const item = source.actor.items.get(source.buildingItemId);
    if (item?.img) return item.img;
  }

  if (source.actorUuid) {
    const id = String(source.actorUuid).split(".").at(-1);
    const actor = game.actors.get(id);
    if (actor?.img) return actor.img;
  }

  return fallback || GVM.SAFE_ICON;
};

GVM.getSettlementName = function getSettlementName(actor) {
  const settings = GVM.getSettings(actor);
  return settings.settlementName || actor.name;
};

GVM.setSettlementName = async function setSettlementName(actor, name) {
  const settings = GVM.getSettings(actor);
  settings.settlementName = String(name || "").trim() || actor.name;
  await GVM.setSettings(actor, settings);
};

GVM.renameSettlement = function renameSettlement(actor) {
  const currentName = GVM.getSettlementName(actor);

  new Dialog({
    title: "Переименовать поселение",
    content: `
      <form>
        <div class="form-group">
          <label>Название поселения</label>
          <input type="text" name="name" value="${GVM.escapeHtml(currentName)}">
        </div>
        <p class="notes">Это меняет только имя поселения, а не имя Group Actor.</p>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const name = String(html.find("[name=name]").val() || "").trim();
          if (!name) return;
          await GVM.setSettlementName(actor, name);
          GVM.refreshSettlement(actor);
        }
      }
    }
  }).render(true);
};

GVM.confirmDeleteGvmItem = function confirmDeleteGvmItem(actor, item) {
  new Dialog({
    title: `Удалить: ${item.name}`,
    content: `
      <section class="gvm-dialog">
        <p>Удалить этот GVM Item из поселения?</p>
        <p><b>${GVM.escapeHtml(item.name)}</b></p>
      </section>
    `,
    buttons: {
      delete: {
        label: "Удалить",
        callback: async () => {
          const name = item.name;
          await item.delete();

          if (GVM.addJournalEntry) {
            await GVM.addJournalEntry(actor, {
              type: "note",
              title: `Удалено: ${name}`,
              entries: [`Item "${name}" удалён из поселения.`]
            });
          }

          GVM.refreshSettlement(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
};
