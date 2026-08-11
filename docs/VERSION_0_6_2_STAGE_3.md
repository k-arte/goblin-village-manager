# Version 0.6.2 Stage 3

Implemented:

- Operation requirements for buildings.
- Requirements now block production and services, not construction.
- Supported operation requirement types:
  - profession
  - assignedProfession
  - item
  - building
  - level
  - resource
  - story
- Buildings can be built even if operation requirements are missing.
- Build picker shows operation requirements as "needed for work".
- Facility cards show operation status:
  - Works
  - Understaffed
  - Missing requirements
  - Disabled
  - Damaged
  - Destroyed
- Missing requirements are displayed on facility cards.
- Item requirements can be consumed by upgrades if `consume: true`.
- Upgrade levels can have `requirements` or `upgradeRequirements`.

Notes:

- Stage 4 adds resident modifiers, resident services and action popover foundation.
