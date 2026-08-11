# Changelog

## 0.7.0

### Added

- Inline action drawers inside cards.
- Ability model with add, replace, upgrade and disable behavior.
- Automatic Bonuses and Services section.
- Ability Builder for buildings and key residents.
- Reward Item support for abilities.
- Settlement-tracked active effects.
- Minor order cycle processing.
- Repair as a city order.
- Demolition as a city order.
- Order cancellation with proportional refunds.
- Player donations to settlement treasury.
- Random building damage on failed defense.

### Fixed

- Broken image/alt rendering.
- Resident portrait rendering.
- Independent settlement name handling.
- Dark readable build picker and ability configuration UI.

### Notes

- Full native dnd5e ActiveEffect document generation remains planned for a later release.


## 0.6.2

### Added

- D&D theme accent synchronization for settlement UI.
- Key Residents section.
- Drag-and-drop Actor support for key residents.
- Resident configuration dialog.
- Resident worker slots for buildings.
- Operation requirements for buildings.
- Resident salaries and modifier foundation.
- Building and resident services foundation.
- Dark action popover for building actions.
- Minor order foundation for building-specific work.

### Changed

- Boons are no longer displayed directly on facility cards.
- Facility operation can be blocked by missing professions, assigned specialists, Items, resources or story flags without blocking construction.
- Key resident worker slots use the D&D sheet accent color.

### Notes

- Full active effects on player Actors are planned for a later version.


## 0.6.0

### Added

- Facility catalog with Basic and Special facilities.
- Real facility levels with build costs, durations, workers, upkeep, effects, services and requirements.
- Build picker that shows unbuilt facilities by category.
- Construction flow that creates a building Item and an Order.
- Demolition and delete options for buildings.
- Settlement journal for the latest 14 events/cycles.
- Attack resolution with population losses, military damage and threat reduction.
- Successful attack defense now sends monster loot value to settlement treasury.
- Journal display on the settlement sheet.

### Changed

- Starting buildings now use catalog-based facility data.
- Building expansion and construction create journal entries.
- Military strength can be reduced by military damage after attacks.

### Notes

- Attack loot belongs to the settlement treasury, not directly to player characters.


## 0.5.1

### Fixed

- Fixed Group Actor tabs becoming empty after using the Settlement tab.
- Restored Loyalty in the resource ribbon.
- Fixed settlement management order so controls appear above buildings.
- Added settlement rename control.
- Hid empty Reform, Order and Bonus sections.
- Added collapsible management and building sections.
- Improved basic/special building classification.
- Improved facility background image rendering using Item images.
- Added color variants for buttons and statuses.
- Added repeatable order template display support.


## 0.5.0

### Added

- Bastion-style settlement board direction.
- Facility cards with background art from `data.art` or `item.img`.
- Config app path replacing raw JSON as the normal editing flow.
- Bonus reward system: cost from settlement resource, reward by Item UUID/drop.
- Bonus activation creates the reward Item on the Group Actor.
- Modular files for v0.5 functionality.

### Changed

- Bonus Items no longer primarily act as direct stat modifiers.
- JSON editing is no longer the intended normal UX.
- Building visuals are moving toward D&D bastion-style facility cards.

### Deferred

- Full custom Item Sheets.
- Full action popover system.
- Compendium generation.
- Official bastion conversion.


## 0.4.0

### Added

- Modular file structure.
- Group Actor settlement tab.
- Native item-style settlement rows.
- Buildings, reforms, orders and bonuses as editable Actor Items.
- Left click on an item row opens the GVM action dialog.
- Right click on an item row opens the native Item Sheet.
- Item Sheet and GVM JSON quick buttons.
- Drag-and-drop ordinary Items into Buildings to import them as settlement buildings.
- Settlement resources and settings stored on the Group Actor.
- Cycle engine reads Group Actor Items.
- Senate-based project capacity.
- Building upgrades create Order Items.
- Safer core icon usage to avoid missing image paths.

### Notes

This version focuses on maintainability, modular architecture, stable Group Actor integration, and item-based settlement data.
