# Changelog

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
