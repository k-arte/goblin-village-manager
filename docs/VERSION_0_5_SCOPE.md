# Version 0.5.0 Scope

## Implemented

- Bastion-style visual direction for the settlement board.
- Modular v0.5 pipeline.
- Facility cards use building art through `data.art` or `item.img`.
- Facility cards are grouped into common and special buildings.
- JSON editor is replaced by config app entry points for normal editing.
- Bonus system is changed toward price-to-reward item flow.
- Bonus reward can be assigned by drop or UUID in the config app.
- Bonus activation pays a settlement resource and creates the reward Item on the Group Actor.
- Debug JSON is no longer the primary editing UX.

## Interaction Model

- Left click facility card: building functions.
- Right click facility card: native Item Sheet.
- Configure/edit button path: GVM config app, not raw JSON.
- Bonus activation: pay resource, create reward Item.

## Deferred

- Fully native D&D5e item activity integration.
- Full action popover replacing all Dialogs.
- Compendium pack generation.
- Official 2024 bastion import.
- Advanced drag target selection for reward recipients.
