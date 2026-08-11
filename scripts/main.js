Hooks.once("ready", () => {
  game.goblinVillage = {
    open: GVM.openSettlement,
    initializeDefaults: GVM.initializeDefaults,
    advanceCycle: GVM.advanceCycle,
    getResources: GVM.getResources,
    getSettings: GVM.getSettings,
    calculateDerived: GVM.calculateDerived,
    createBuildingDialog: GVM.createBuildingDialog,
    createReformDialog: GVM.createReformDialog,
    createOrderDialog: GVM.createOrderDialog,
    createBonusDialog: GVM.createBonusDialog
  };

  console.log(`${GVM.MODULE_ID} | v0.4.0 ready`);
});

Hooks.on("renderActorSheet", GVM.injectSettlementTab);
Hooks.on("renderActorSheetV2", GVM.injectSettlementTab);

Hooks.on("renderApplication", (app, html) => {
  try {
    const actor = app.actor || app.document;
    if (!GVM.isSettlementActor(actor)) return;
    GVM.injectSettlementTab(app, html);
  } catch (err) {
    // Ignore non-actor applications.
  }
});

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  try {
    const actor = app.actor || app.document;
    if (!GVM.isSettlementActor(actor)) return;

    buttons.unshift({
      label: "Поселение",
      class: "gvm-open-settlement",
      icon: "fas fa-fort-awesome",
      onclick: () => GVM.openSettlement(actor)
    });
  } catch (err) {
    console.warn(`${GVM.MODULE_ID} | Header button failed`, err);
  }
});


// =====================================================
// GVM Stage2 Final API
// =====================================================

Hooks.once("ready", () => {

  console.log("========== GVM Stage2 ==========");

  // freeze final implementations

  GVM.FinalAPI = {

    advanceCycle: GVM.advanceCycle,
    executeAbility: GVM.executeAbility,
    completeUpgrade: GVM.completeUpgrade,
    editGvmData: GVM.editGvmData,
    itemActionDialog: GVM.itemActionDialog,
    resolveAttackIfDue: GVM.resolveAttackIfDue

  };

  Object.freeze(GVM.FinalAPI);

  console.log(
    "advanceCycle =>",
    GVM.advanceCycle?.name
  );

  console.log(
    "executeAbility =>",
    GVM.executeAbility?.name
  );

  console.log(
    "completeUpgrade =>",
    GVM.completeUpgrade?.name
  );

  console.log(
    "itemActionDialog =>",
    GVM.itemActionDialog?.name
  );

  console.log("================================");

});

