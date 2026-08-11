# Version 0.6.0 Scope

## Implemented

### Facility content and progression

- Facility catalog with Basic and Special facilities.
- Real facility templates with:
  - category
  - type
  - levels
  - construction cost
  - construction time
  - worker requirements
  - upkeep
  - effects
  - services
  - requirements
- Catalog-based starting buildings.
- Build picker for unbuilt facilities.
- Basic and Special build lists.
- Build flow creates a building Item and a construction Order.

### Demolition

- Building menu includes demolition.
- Demolition can mark a building as destroyed.
- GM can delete the building Item.
- Demolition can return a treasury refund.
- Demolition creates a journal entry.

### Attacks and treasury loot

- Attack resolution added.
- Successful defense sends monster loot value to settlement treasury.
- Successful defense can still cause population and military losses.
- Failed defense causes population loss, treasury loss, loyalty loss and military damage.
- Threat is reduced after attacks.
- Military damage reduces derived military strength.

### Journal

- Settlement journal added.
- Journal keeps the latest 14 entries.
- Journal records:
  - building construction and expansion
  - demolition
  - attacks
  - migration
  - famine
  - completed orders
- Journal is displayed on the settlement sheet.

## Important rule

Loot from attacks goes to the settlement treasury, not directly to player characters.
