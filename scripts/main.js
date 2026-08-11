import { MODULE_ID, SETTINGS } from "./core/constants.js";
import { registerSettings, getSettlementState, saveSettlementState, resetSettlementState } from "./core/settings.js";
import { SettlementApp } from "./apps/SettlementApp.js";

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", async () => {
  game.goblinVillage = {
    open: () => new SettlementApp().render(true),
    getState: getSettlementState,
    saveState: saveSettlementState,
    reset: resetSettlementState
  };
  console.log(`${MODULE_ID} | Ready. Use game.goblinVillage.open()`);
});

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  try {
    const actor = app.actor || app.document;
    if (!actor) return;
    if (!actor.testUserPermission(game.user, "OBSERVER")) return;
    buttons.unshift({
      label: "Поселение",
      class: "gvm-open-settlement",
      icon: "fas fa-fort-awesome",
      onclick: () => new SettlementApp().render(true)
    });
  } catch (err) {
    console.warn(`${MODULE_ID} | Failed to inject actor sheet button`, err);
  }
});
