import { MODULE_ID, SETTINGS } from "./constants.js";
import { DEFAULT_STATE } from "../data/default-state.js";

const clone = (value) => foundry.utils.deepClone(value);

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.STATE, {
    name: "Settlement Manager State",
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULT_STATE)
  });
}

export async function getSettlementState() {
  const state = game.settings.get(MODULE_ID, SETTINGS.STATE);
  if (!state) return clone(DEFAULT_STATE);
  return foundry.utils.mergeObject(clone(DEFAULT_STATE), state, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });
}

export async function saveSettlementState(state) {
  return game.settings.set(MODULE_ID, SETTINGS.STATE, state);
}

export async function resetSettlementState() {
  return saveSettlementState(clone(DEFAULT_STATE));
}
