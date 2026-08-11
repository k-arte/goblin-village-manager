GVM.pickRandomDamageableBuilding = function pickRandomDamageableBuilding(actor) {
  const candidates = GVM.buildings(actor).filter(item => {
    const data = GVM.gvmData(item);
    return ["built", "damaged"].includes(data.status);
  });

  if (!candidates.length) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
};

GVM.damageRandomBuildingAfterFailedDefense = async function damageRandomBuildingAfterFailedDefense(actor, report = []) {
  const item = GVM.pickRandomDamageableBuilding(actor);
  if (!item) return;

  const data = GVM.clone(GVM.gvmData(item));
  const oldStatus = data.status;

  if (data.status === "damaged") data.status = "destroyed";
  else data.status = "damaged";

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);

  const line = oldStatus === "damaged"
    ? `Во время нападения здание "${item.name}" было разрушено.`
    : `Во время нападения здание "${item.name}" было повреждено.`;

  report.push(line);

  if (GVM.addJournalEntry) {
    await GVM.addJournalEntry(actor, {
      type: "attack",
      title: "Здание пострадало при нападении",
      entries: [line]
    });
  }
};

GVM.originalResolveAttackIfDueV07 = GVM.originalResolveAttackIfDueV07 || GVM.resolveAttackIfDue;

GVM.resolveAttackIfDue = function resolveAttackIfDueV07(actor, resources, settings, report) {
  const due = Number(settings.attack?.nextInCycles || 0) <= 0;
  const beforeThreat = Number(resources.threat || 0);
  const beforeDefense = GVM.calculateDerived(actor).military;
  const failed = due && beforeThreat > beforeDefense;

  GVM.originalResolveAttackIfDueV07(actor, resources, settings, report);

  if (failed) {
    GVM.damageRandomBuildingAfterFailedDefense(actor, report);
  }
};
