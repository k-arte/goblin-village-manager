/**
 * Stage 3
 * Unified derived pipeline
 */

GVM.applyDerivedPipeline = function applyDerivedPipeline(actor, derived) {

  derived = derived || {};

  derived.pipeline = {

    workers: true,
    requirements: true,
    residents: true,
    militaryDamage: true

  };

  return derived;
};

if (!GVM.originalCalculateDerivedStage3) {

  GVM.originalCalculateDerivedStage3 = GVM.calculateDerived;

  GVM.calculateDerived = function calculateDerivedStage3(actor) {

    const derived =
      GVM.originalCalculateDerivedStage3(actor);

    return GVM.applyDerivedPipeline(
      actor,
      derived
    );
  };

}

GVM.applyBuildingCyclePipeline =
function applyBuildingCyclePipeline(
  actor,
  totals
) {

  return totals;
};

if (!GVM.originalApplyBuildingCycleStage3) {

  GVM.originalApplyBuildingCycleStage3 =
    GVM.applyBuildingCycle;

  GVM.applyBuildingCycle =
  function applyBuildingCycleStage3(
    actor,
    totals
  ) {

    totals =
      GVM.originalApplyBuildingCycleStage3(
        actor,
        totals
      );

    return GVM.applyBuildingCyclePipeline(
      actor,
      totals
    );
  };

}

Hooks.once("ready", () => {

  console.log(
    "GVM Stage3 loaded"
  );

});
