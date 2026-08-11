# Version 0.6.0 Stage 3

Implemented:

- Attack resolution.
- Successful defense sends monster loot value to settlement treasury.
- Successful defense can still cause population loss and military damage.
- Failed defense causes population loss, treasury loss, loyalty loss and military damage.
- Threat is reduced after attacks.
- Military damage is tracked in settlement resources and reduces derived military strength.
- Journal entries for:
  - attacks
  - migration
  - famine
  - completed orders
  - building completion
- Journal remains capped to the latest 14 entries/cycles.

Important:

- Loot from attacks goes to the settlement treasury, not directly to player characters.
