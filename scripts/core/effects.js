/**
 * Unified effect model. Everything in the system should eventually use this:
 * buildings, reforms, orders, bonuses, crises and special player services.
 */
export async function resolveEffectValue(effect) {
  if (typeof effect.value === "string" && effect.value.match(/\d*d\d+/i)) {
    const roll = await new Roll(effect.value).evaluate();
    return roll.total;
  }
  return Number(effect.value) || 0;
}

export async function applyEffect(state, effect, context = {}) {
  const value = await resolveEffectValue(effect);
  const stat = effect.stat;
  if (!stat) return { stat, value: 0, skipped: true };

  const target = state.resources?.[stat] !== undefined ? state.resources : state.derived;
  if (!target || target[stat] === undefined) return { stat, value, skipped: true };

  switch (effect.mode || "add") {
    case "add": target[stat] += value; break;
    case "multiply": target[stat] = Math.round(target[stat] * value); break;
    case "set": target[stat] = value; break;
    case "min": target[stat] = Math.max(target[stat], value); break;
    case "max": target[stat] = Math.min(target[stat], value); break;
  }
  return { stat, value, skipped: false, context };
}
