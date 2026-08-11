GVM.flagsFor = function flagsFor(data) {
  return {
    "goblin-village-manager": {
      data: GVM.clone(data)
    }
  };
};

GVM.gvmData = function gvmData(item) {
  return item?.getFlag(GVM.FLAG_SCOPE, "data") || {};
};

GVM.kindOf = function kindOf(item) {
  return GVM.gvmData(item).kind;
};

GVM.gvmItems = function gvmItems(actor, kind = null) {
  return actor.items.filter(item => {
    const itemKind = GVM.kindOf(item);
    if (!itemKind) return false;
    return kind ? itemKind === kind : true;
  });
};

GVM.buildings = function buildings(actor) {
  return GVM.gvmItems(actor, GVM.KIND.BUILDING);
};

GVM.reforms = function reforms(actor) {
  return GVM.gvmItems(actor, GVM.KIND.REFORM);
};

GVM.orders = function orders(actor) {
  return GVM.gvmItems(actor, GVM.KIND.ORDER);
};

GVM.bonuses = function bonuses(actor) {
  return GVM.gvmItems(actor, GVM.KIND.BONUS);
};

GVM.createGvmItem = async function createGvmItem(actor, name, data, options = {}) {
  const img = options.img || GVM.SAFE_ICON;
  const description = options.description || data.description || data.note || "";

  const itemData = {
    name,
    type: "loot",
    img,
    system: {
      description: {
        value: GVM.itemDescriptionHtml(name, description)
      }
    },
    flags: GVM.flagsFor(data)
  };

  const created = await actor.createEmbeddedDocuments("Item", [itemData]);
  return created?.[0];
};

GVM.initializeDefaults = async function initializeDefaults(actor) {
  await GVM.ensureSettlement(actor);

  if (GVM.gvmItems(actor).length) {
    ui.notifications.warn("У этого Group Actor уже есть Items поселения.");
    return;
  }

  for (const template of GVM.defaultBuildingTemplates()) {
    await GVM.createGvmItem(actor, template.name, template.data);
  }

  for (const template of GVM.defaultReformTemplates()) {
    await GVM.createGvmItem(actor, template.name, template.data);
  }

  for (const template of GVM.defaultBonusTemplates()) {
    await GVM.createGvmItem(actor, template.name, template.data);
  }

  ui.notifications.info("Стартовые Items поселения созданы.");
  GVM.queueRefresh(actor);
};

GVM.inferBuildingType = function inferBuildingType(item) {
  const name = String(item?.name || "").toLowerCase();

  if (name.includes("казарм") || name.includes("barrack") || name.includes("guard") || name.includes("сторож")) return "military";
  if (name.includes("храм") || name.includes("temple") || name.includes("sacristy") || name.includes("sanctuary")) return "religion";
  if (name.includes("рынок") || name.includes("market") || name.includes("auction") || name.includes("аукцион")) return "economy";
  if (name.includes("теплиц") || name.includes("greenhouse") || name.includes("garden") || name.includes("сад")) return "food";
  if (name.includes("склад") || name.includes("store") || name.includes("warehouse")) return "storage";
  if (name.includes("кузн") || name.includes("smith") || name.includes("forge")) return "crafting";
  if (name.includes("сенат") || name.includes("senate") || name.includes("war room")) return "governance";
  if (name.includes("гостиниц") || name.includes("inn") || name.includes("pub") || name.includes("bath") || name.includes("бани")) return "social";

  return "special";
};

GVM.makeBuildingFromDroppedItem = function makeBuildingFromDroppedItem(item) {
  const description = GVM.stripHtml(item.system?.description?.value || "");

  return {
    kind: GVM.KIND.BUILDING,
    type: GVM.inferBuildingType(item),
    status: "available",
    level: 0,
    maxLevel: 5,
    unlockLevel: 5,
    workersRequired: 0,
    workersAssigned: 0,
    upkeep: [],
    effects: [],
    levels: [
      {
        level: 1,
        title: `Построить: ${item.name}`,
        description: `Здание создано из перетащенного предмета "${item.name}". Отредактируйте GVM JSON или Item Sheet, чтобы задать стоимость, рабочих, эффекты и функции.`,
        cost: [
          { stat: "treasury", value: -100 }
        ],
        duration: 1,
        workersRequired: 4,
        upkeep: [
          { stat: "treasury", value: -1, timing: "perCycle" }
        ],
        effects: [],
        services: []
      }
    ],
    services: [],
    actions: [],
    note: description || `Импортировано из предмета "${item.name}".`
  };
};

GVM.handleDrop = async function handleDrop(actor, event, expectedKind) {
  event.preventDefault();
  event.stopPropagation();

  if (!GVM.isGM()) return;

  const dragData = GVM.getDragData(event);
  let dropped = null;

  if (dragData.uuid) dropped = await fromUuid(dragData.uuid);
  else if (dragData.type === "Item" && dragData.id) dropped = game.items.get(dragData.id);

  if (!dropped || dropped.documentName !== "Item") {
    ui.notifications.warn("Можно перетаскивать только Items.");
    return;
  }

  const itemData = dropped.toObject();
  delete itemData._id;

  const data = GVM.gvmData(dropped);

  if (!data.kind) {
    if (expectedKind !== GVM.KIND.BUILDING) {
      ui.notifications.warn("Обычные Items автоматически импортируются только как здания.");
      return;
    }

    itemData.type = "loot";
    itemData.img = itemData.img || GVM.SAFE_ICON;
    itemData.system = itemData.system || {};
    itemData.system.description = itemData.system.description || {};
    itemData.system.description.value = itemData.system.description.value || GVM.itemDescriptionHtml(dropped.name, "Импортировано как здание поселения.");
    itemData.flags = itemData.flags || {};
    itemData.flags[GVM.FLAG_SCOPE] = {
      data: GVM.makeBuildingFromDroppedItem(dropped)
    };
  } else if (data.kind !== expectedKind) {
    ui.notifications.warn(`Этот Item имеет тип ${data.kind}, а секция ожидает ${expectedKind}.`);
    return;
  }

  await actor.createEmbeddedDocuments("Item", [itemData]);
  ui.notifications.info(`${dropped.name} добавлен в поселение.`);
  GVM.queueRefresh(actor);
};
