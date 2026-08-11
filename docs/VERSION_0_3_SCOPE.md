# Version 0.3 Scope

## Implemented

- Settlement UI is injected only into Group/Party Actors or actors with `flags.goblin-village-manager.isSettlement`.
- Settlement data is stored on the Group Actor.
- Buildings, reforms, orders and bonuses are Actor Items.
- Items use `flags.goblin-village-manager.data`.
- Drag and drop GVM Items into settlement sections.
- Click item name to open native Item Sheet.
- Right click card or press GVM JSON to edit module data.
- Create building/reform/order/bonus from the settlement tab.
- Default settlement Items can be created from the tab.
- Cycle calculation reads Actor Items.
- Senate determines project capacity.
- Building upgrades create Order Items.
- Basic player services are stored on building Items.
- Bonuses allow only one active bonus at a time.
- Reports are stored on the Group Actor.

## Known Limitations

- Custom Item Sheets are not yet registered; v0.3 uses native Item Sheets plus a JSON editor.
- Compendium packs are not generated automatically yet.
- Advanced effect builder is still dialog-based, not full UI.
- Advanced threat categories are not yet implemented.
