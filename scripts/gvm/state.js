GVM.isSettlementActor = function isSettlementActor(actor) {
  if (!actor) return false;
  if (actor.type === "group") return true;
  if (actor.type === "party") return true;
  if (actor.getFlag?.(GVM.FLAG_SCOPE, "isSettlement")) return true;
  return false;
};

GVM.getResources = function getResources(actor) {
  return GVM.merge(GVM.DEFAULT_RESOURCES, actor.getFlag(GVM.FLAG_SCOPE, "resources"));
};

GVM.getSettings = function getSettings(actor) {
  return GVM.merge(GVM.DEFAULT_SETTINGS, actor.getFlag(GVM.FLAG_SCOPE, "settings"));
};

GVM.setResources = async function setResources(actor, resources) {
  await actor.setFlag(GVM.FLAG_SCOPE, "resources", resources);
};

GVM.setSettings = async function setSettings(actor, settings) {
  await actor.setFlag(GVM.FLAG_SCOPE, "settings", settings);
};

GVM.ensureSettlement = async function ensureSettlement(actor) {
  if (!actor.getFlag(GVM.FLAG_SCOPE, "resources")) {
    await actor.setFlag(GVM.FLAG_SCOPE, "resources", GVM.clone(GVM.DEFAULT_RESOURCES));
  }

  if (!actor.getFlag(GVM.FLAG_SCOPE, "settings")) {
    await actor.setFlag(GVM.FLAG_SCOPE, "settings", GVM.clone(GVM.DEFAULT_SETTINGS));
  }
};

GVM.addResource = function addResource(resources, stat, value) {
  if (resources[stat] === undefined) resources[stat] = 0;
  resources[stat] += Number(value) || 0;
};
