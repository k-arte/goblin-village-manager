GVM.clone = function clone(value) {
  return foundry.utils.deepClone(value);
};

GVM.merge = function merge(base, override) {
  return foundry.utils.mergeObject(GVM.clone(base), override || {}, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });
};

GVM.isGM = function isGM() {
  return game.user?.isGM;
};

GVM.d = function d(sides) {
  return Math.floor(Math.random() * sides) + 1;
};

GVM.signed = function signed(value) {
  const n = Number(value) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
};

GVM.escapeHtml = function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

GVM.effectLabel = function effectLabel(effect) {
  if (!effect) return "";
  const stat = GVM.STAT_LABELS[effect.stat] || effect.stat || "unknown";
  const timing = effect.timing ? ` · ${effect.timing}` : "";
  return `${stat} ${GVM.signed(effect.value)}${timing}`;
};

GVM.effectsLabel = function effectsLabel(effects = []) {
  if (!effects.length) return "—";
  return effects.map(GVM.effectLabel).join(", ");
};

GVM.itemDescriptionHtml = function itemDescriptionHtml(title, text) {
  return `<h2>${GVM.escapeHtml(title)}</h2><p>${GVM.escapeHtml(text || "")}</p>`;
};

GVM.stripHtml = function stripHtml(html) {
  if (!html) return "";
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent?.trim() || "";
};

GVM.getDragData = function getDragData(event) {
  const modern = foundry?.applications?.ux?.TextEditor?.implementation;
  if (modern?.getDragEventData) return modern.getDragEventData(event);

  try {
    return JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch (err) {
    return {};
  }
};
