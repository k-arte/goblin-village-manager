/**
 * Goblin Village Manager v0.8
 * Ability and Service Management Layer
 *
 * Goals:
 * - Show abilities and services on buildings and key residents.
 * - Allow delete / duplicate / basic edit.
 * - Avoid requiring deletion of a building/resident to remove an ability.
 * - Keep old data model compatible.
 */

window.GVM = window.GVM || {};
GVM.V080 = GVM.V080 || {};

GVM.v080Clone = function v080Clone(value) {
  return foundry.utils.deepClone(value);
};

GVM.v080AbilityId = function v080AbilityId(ability, fallback = "") {
  if (!ability.id) {
    ability.id = `${GVM.slugify ? GVM.slugify(ability.label || ability.name || "ability") : "ability"}-${foundry.utils.randomID(5)}`;
  }
  return ability.id || fallback;
};

GVM.v080AbilityLabel = function v080AbilityLabel(ability) {
  if (typeof ability === "string") return ability;
  return ability.label || ability.name || ability.id || "Способность";
};

GVM.v080AbilityActionType = function v080AbilityActionType(ability) {
  if (typeof ability === "string") return "instant";
  return ability.action?.orderType || ability.action?.type || ability.orderType || ability.type || "instant";
};

GVM.v080AbilityCost = function v080AbilityCost(ability) {
  if (typeof ability === "string") return { stat: "treasury", value: 0 };

  const cost = ability.action?.cost || ability.cost || {};
  return {
    stat: cost.stat || "treasury",
    value: Number(cost.value || 0)
  };
};

GVM.v080AbilityDescription = function v080AbilityDescription(ability) {
  if (typeof ability === "string") return ability;
  return ability.description || ability.text || ability.result?.text || "";
};

GVM.v080StatOptions = function v080StatOptions(selected = "treasury") {
  if (GVM.renderStage4StatOptions) return GVM.renderStage4StatOptions(selected);

  const labels = GVM.STAT_LABELS || {};
  const keys = Object.keys(labels).length ? Object.keys(labels) : [
    "treasury",
    "food",
    "population",
    "loyalty",
    "threat",
    "military",
    "attractiveness",
    "projectCapacity"
  ];

  return keys.map(key => `
    <option value="${GVM.escapeHtml(key)}" ${key === selected ? "selected" : ""}>
      ${GVM.escapeHtml(labels[key] || key)}
    </option>
  `).join("");
};

GVM.v080TypeOptions = function v080TypeOptions(selected = "instant") {
  const options = [
    ["instant", "Мгновенно"],
    ["minor", "Личный приказ"],
    ["personal", "Личный приказ"],
    ["city", "Городской приказ"],
    ["rewardItem", "Награда"],
    ["activeEffect", "Активный эффект"],
    ["manual", "Ручное действие"]
  ];

  return options.map(([value, label]) => `
    <option value="${GVM.escapeHtml(value)}" ${value === selected ? "selected" : ""}>
      ${GVM.escapeHtml(label)}
    </option>
  `).join("");
};

GVM.v080NormalizeAbilityForEdit = function v080NormalizeAbilityForEdit(raw) {
  if (typeof raw === "string") {
    return {
      id: `${GVM.slugify ? GVM.slugify(raw) : "service"}-${foundry.utils.randomID(5)}`,
      label: raw,
      description: raw,
      action: {
        type: "instant",
        orderType: "instant",
        durationCycles: 0,
        cost: {
          stat: "treasury",
          value: 0
        }
      },
      result: {
        type: "manual",
        text: raw
      },
      requirements: []
    };
  }

  const ability = GVM.v080Clone(raw || {});
  GVM.v080AbilityId(ability);

  ability.label = ability.label || ability.name || "Способность";
  ability.description = ability.description || ability.text || ability.result?.text || "";

  ability.action = ability.action || {};
  ability.action.type = ability.action.type || ability.type || ability.orderType || "instant";
  ability.action.orderType = ability.action.orderType || ability.orderType || ability.action.type || "instant";
  ability.action.durationCycles = Number(ability.action.durationCycles ?? ability.durationCycles ?? ability.duration ?? 0);
  ability.action.cost = ability.action.cost || ability.cost || { stat: "treasury", value: 0 };

  ability.result = ability.result || {
    type: ability.reward ? "rewardItem" : "manual",
    reward: ability.reward || null,
    text: ability.description || ""
  };

  ability.requirements = ability.requirements || [];

  return ability;
};

GVM.v080GetBuildingAbilityLocations = function v080GetBuildingAbilityLocations(item) {
  const data = GVM.gvmData(item);
  const locations = [];

  for (const service of data.services || []) {
    locations.push({
      sourceType: "building",
      item,
      container: data.services,
      containerKind: "services",
      levelNumber: null,
      ability: GVM.v080NormalizeAbilityForEdit(service),
      raw: service
    });
  }

  for (const action of data.actions || []) {
    locations.push({
      sourceType: "building",
      item,
      container: data.actions,
      containerKind: "actions",
      levelNumber: null,
      ability: GVM.v080NormalizeAbilityForEdit(action),
      raw: action
    });
  }

  for (const levelData of data.levels || []) {
    levelData.abilities = Array.isArray(levelData.abilities) ? levelData.abilities : [];
    levelData.actions = Array.isArray(levelData.actions) ? levelData.actions : [];
    levelData.services = Array.isArray(levelData.services) ? levelData.services : [];

    for (const ability of levelData.abilities) {
      locations.push({
        sourceType: "building",
        item,
        container: levelData.abilities,
        containerKind: "level.abilities",
        levelNumber: Number(levelData.level || 0),
        ability: GVM.v080NormalizeAbilityForEdit(ability),
        raw: ability,
        levelData
      });
    }

    for (const action of levelData.actions) {
      locations.push({
        sourceType: "building",
        item,
        container: levelData.actions,
        containerKind: "level.actions",
        levelNumber: Number(levelData.level || 0),
        ability: GVM.v080NormalizeAbilityForEdit(action),
        raw: action,
        levelData
      });
    }

    for (const service of levelData.services) {
      locations.push({
        sourceType: "building",
        item,
        container: levelData.services,
        containerKind: "level.services",
        levelNumber: Number(levelData.level || 0),
        ability: GVM.v080NormalizeAbilityForEdit(service),
        raw: service,
        levelData
      });
    }
  }

  return locations;
};

GVM.v080GetResidentAbilityLocations = function v080GetResidentAbilityLocations(resident) {
  resident.abilities = Array.isArray(resident.abilities) ? resident.abilities : [];
  resident.services = Array.isArray(resident.services) ? resident.services : [];

  const locations = [];

  for (const ability of resident.abilities) {
    locations.push({
      sourceType: "resident",
      resident,
      container: resident.abilities,
      containerKind: "resident.abilities",
      ability: GVM.v080NormalizeAbilityForEdit(ability),
      raw: ability
    });
  }

  for (const service of resident.services) {
    locations.push({
      sourceType: "resident",
      resident,
      container: resident.services,
      containerKind: "resident.services",
      ability: GVM.v080NormalizeAbilityForEdit(service),
      raw: service
    });
  }

  return locations;
};

GVM.v080FindLocationById = function v080FindLocationById(locations, abilityId) {
  return locations.find(location => {
    const ability = GVM.v080NormalizeAbilityForEdit(location.raw);
    return ability.id === abilityId || GVM.v080AbilityId(ability) === abilityId;
  });
};

GVM.v080ReplaceInContainer = function v080ReplaceInContainer(container, oldRaw, newAbility) {
  const index = container.indexOf(oldRaw);
  if (index >= 0) {
    container[index] = newAbility;
    return true;
  }

  const oldId = GVM.v080NormalizeAbilityForEdit(oldRaw).id;
  const fallback = container.findIndex(item => GVM.v080NormalizeAbilityForEdit(item).id === oldId);

  if (fallback >= 0) {
    container[fallback] = newAbility;
    return true;
  }

  return false;
};

GVM.v080RemoveFromContainer = function v080RemoveFromContainer(container, oldRaw) {
  const index = container.indexOf(oldRaw);
  if (index >= 0) {
    container.splice(index, 1);
    return true;
  }

  const oldId = GVM.v080NormalizeAbilityForEdit(oldRaw).id;
  const fallback = container.findIndex(item => GVM.v080NormalizeAbilityForEdit(item).id === oldId);

  if (fallback >= 0) {
    container.splice(fallback, 1);
    return true;
  }

  return false;
};

GVM.v080SaveBuildingLocations = async function v080SaveBuildingLocations(item, data) {
  await item.setFlag(GVM.FLAG_SCOPE, "data", data);
};

GVM.v080SaveResidentData = async function v080SaveResidentData(actor, residents) {
  await GVM.setKeyResidents(actor, residents);
};

GVM.v080RenderAbilityRow = function v080RenderAbilityRow(location) {
  const ability = GVM.v080NormalizeAbilityForEdit(location.raw);
  const id = GVM.v080AbilityId(ability);
  const label = GVM.v080AbilityLabel(ability);
  const type = GVM.v080AbilityActionType(ability);
  const cost = GVM.v080AbilityCost(ability);
  const desc = GVM.v080AbilityDescription(ability);

  const level = location.levelNumber ? ` · Уровень ${location.levelNumber}` : "";
  const costLabel = Number(cost.value || 0)
    ? `${GVM.STAT_LABELS?.[cost.stat] || cost.stat} ${cost.value}`
    : "бесплатно";

  return `
    <article class="gvm-v080-ability-row" data-ability-id="${GVM.escapeHtml(id)}">
      <div class="gvm-v080-ability-main">
        ${GVM.escapeHtml(label)}
        <span>${GVM.escapeHtml(GVM.v080ActionTypeLabel ? GVM.v080ActionTypeLabel(type) : type)}${level} · ${GVM.escapeHtml(costLabel)}</span>
        ${desc ? `<p>${GVM.escapeHtml(desc)}</p>` : ""}
      </div>

      <div class="gvm-v080-ability-actions">
        <button type="button" data-gvm-v080-ability-action="edit" data-ability-id="${GVM.escapeHtml(id)}">Редактировать</button>
        <button type="button" data-gvm-v080-ability-action="duplicate" data-ability-id="${GVM.escapeHtml(id)}">Дублировать</button>
        <button type="button" data-gvm-v080-ability-action="delete" data-ability-id="${GVM.escapeHtml(id)}">Удалить</button>
      </div>
    </article>
  `;
};

GVM.v080OpenAbilityEditor = function v080OpenAbilityEditor(actor, context, abilityId) {
  const locations = context.locations();
  const location = GVM.v080FindLocationById(locations, abilityId);

  if (!location) {
    ui.notifications.warn("Способность не найдена.");
    return;
  }

  const ability = GVM.v080NormalizeAbilityForEdit(location.raw);
  const cost = GVM.v080AbilityCost(ability);
  const type = GVM.v080AbilityActionType(ability);

  new Dialog({
    title: `Редактировать способность: ${GVM.v080AbilityLabel(ability)}`,
    content: `
      <form class="gvm-v080-ability-editor">
        <section class="gvm-v080-settings-hero">
          <h2>${GVM.escapeHtml(GVM.v080AbilityLabel(ability))}</h2>
          <p>Быстрое редактирование основных полей. Расширенные поля можно доработать через будущий full editor.</p>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Основное</h3>
          <div class="gvm-v080-settings-grid">
            <label>
              <span>Название</span>
              <input type="text" name="label" value="${GVM.escapeHtml(GVM.v080AbilityLabel(ability))}">
            </label>

            <label>
              <span>Тип действия</span>
              <select name="actionType">
                ${GVM.v080TypeOptions(type)}
              </select>
            </label>

            <label>
              <span>Длительность</span>
              <input type="number" name="durationCycles" value="${Number(ability.action?.durationCycles || 0)}">
            </label>
          </div>

          <label class="gvm-config-field gvm-config-wide">
            <span>Описание</span>
            <textarea name="description">${GVM.escapeHtml(GVM.v080AbilityDescription(ability))}</textarea>
          </label>
        </section>

        <section class="gvm-v080-settings-section">
          <h3>Цена</h3>
          <div class="gvm-v080-settings-grid">
            <label>
              <span>Ресурс</span>
              <select name="costStat">
                ${GVM.v080StatOptions(cost.stat)}
              </select>
            </label>
            <label>
              <span>Стоимость</span>
              <input type="number" name="costValue" value="${Number(cost.value || 0)}">
            </label>
          </div>
        </section>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          const form = html.find("form")[0];
          const values = Object.fromEntries(new FormData(form).entries());

          const updated = GVM.v080NormalizeAbilityForEdit(ability);
          updated.label = String(values.label || "Способность").trim();
          updated.description = values.description || "";

          updated.action = updated.action || {};
          updated.action.type = values.actionType || "instant";
          updated.action.orderType = values.actionType || "instant";
          updated.action.durationCycles = Math.max(0, Number(values.durationCycles || 0));
          updated.action.cost = {
            stat: values.costStat || "treasury",
            value: Number(values.costValue || 0)
          };

          updated.result = updated.result || {};
          if (!updated.result.text) updated.result.text = updated.description;

          await context.update(location, updated);

          ui.notifications.info(`Способность обновлена: ${updated.label}.`);

          if (GVM.queueRefresh) GVM.queueRefresh(actor);
          else GVM.refreshSettlement(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 760,
    height: "auto"
  }).render(true);
};

GVM.v080OpenAbilityDeleteDialog = function v080OpenAbilityDeleteDialog(actor, context, abilityId) {
  const locations = context.locations();
  const location = GVM.v080FindLocationById(locations, abilityId);

  if (!location) {
    ui.notifications.warn("Способность не найдена.");
    return;
  }

  const ability = GVM.v080NormalizeAbilityForEdit(location.raw);

  new Dialog({
    title: `Удалить способность: ${GVM.v080AbilityLabel(ability)}`,
    content: `
      <form class="gvm-v080-settings-form">
        <section class="gvm-v080-danger-hero">
          <h2>${GVM.escapeHtml(GVM.v080AbilityLabel(ability))}</h2>
          <p>Способность будет удалена из источника. Здание или НИП останутся.</p>
        </section>
        <label class="gvm-config-field gvm-config-wide">
          <span>Подтверждение</span>
          <input type="text" name="confirm" placeholder="Введите DELETE">
        </label>
      </form>
    `,
    buttons: {
      delete: {
        label: "Удалить",
        callback: async html => {
          const confirm = String(html.find("[name=confirm]").val() || "").trim();
          if (confirm !== "DELETE") {
            ui.notifications.warn("Удаление отменено: нужно ввести DELETE.");
            return;
          }

          await context.remove(location);

          ui.notifications.info(`Способность удалена: ${GVM.v080AbilityLabel(ability)}.`);

          if (GVM.queueRefresh) GVM.queueRefresh(actor);
          else GVM.refreshSettlement(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");
    }
  }, {
    width: 620,
    height: "auto"
  }).render(true);
};

GVM.v080OpenAbilityManager = function v080OpenAbilityManager(actor, context) {
  const sourceLabel = context.label();
  const locations = context.locations();

  const content = `
    <form class="gvm-v080-ability-manager">
      <section class="gvm-v080-settings-hero">
        <h2>${GVM.escapeHtml(sourceLabel)}</h2>
        <p>Здесь можно посмотреть, отредактировать, дублировать или удалить способности и услуги источника.</p>
      </section>

      <section class="gvm-v080-settings-section">
        <h3>Способности и услуги</h3>
        ${locations.length ? `
          <div class="gvm-v080-ability-list">
            ${locations.map(location => GVM.v080RenderAbilityRow(location)).join("")}
          </div>
        ` : `
          <p class="gvm-v080-empty">У этого источника пока нет способностей или услуг.</p>
        `}
      </section>

      <section class="gvm-v080-button-row">
        ${context.canCreate ? `<button type="button" data-gvm-v080-manager-action="create">Создать способность</button>` : ""}
      </section>
    </form>
  `;

  const dialog = new Dialog({
    title: `${sourceLabel}: способности и услуги`,
    content,
    buttons: {
      close: {
        label: "Закрыть"
      }
    },
    render: html => {
      html.closest(".app").addClass("gvm-v080-window");

      html.find("[data-gvm-v080-ability-action='edit']").on("click", event => {
        event.preventDefault();
        GVM.v080OpenAbilityEditor(actor, context, event.currentTarget.dataset.abilityId);
        dialog.close();
      });

      html.find("[data-gvm-v080-ability-action='delete']").on("click", event => {
        event.preventDefault();
        GVM.v080OpenAbilityDeleteDialog(actor, context, event.currentTarget.dataset.abilityId);
        dialog.close();
      });

      html.find("[data-gvm-v080-ability-action='duplicate']").on("click", async event => {
        event.preventDefault();
        const abilityId = event.currentTarget.dataset.abilityId;
        const location = GVM.v080FindLocationById(context.locations(), abilityId);

        if (!location) {
          ui.notifications.warn("Способность не найдена.");
          return;
        }

        const copy = GVM.v080NormalizeAbilityForEdit(location.raw);
        copy.id = `${copy.id}-copy-${foundry.utils.randomID(4)}`;
        copy.label = `${copy.label} копия`;

        await context.add(copy);

        ui.notifications.info(`Способность дублирована: ${copy.label}.`);

        if (GVM.queueRefresh) GVM.queueRefresh(actor);
        else GVM.refreshSettlement(actor);

        dialog.close();
      });

      html.find("[data-gvm-v080-manager-action='create']").on("click", event => {
        event.preventDefault();
        if (context.create) context.create();
        dialog.close();
      });
    }
  }, {
    width: 860,
    height: "auto"
  });

  dialog.render(true);
};

GVM.v080BuildingAbilityContext = function v080BuildingAbilityContext(actor, item) {
  return {
    canCreate: true,
    label: () => item.name,
    locations: () => GVM.v080GetBuildingAbilityLocations(item),
    create: () => {
      if (GVM.openAbilityBuilder) {
        GVM.openAbilityBuilder(actor, {
          sourceType: "building",
          item
        });
      }
    },
    add: async ability => {
      const data = GVM.v080Clone(GVM.gvmData(item));
      const level = Math.max(1, Number(data.level || 1));
      data.levels = Array.isArray(data.levels) ? data.levels : [];

      let levelData = data.levels.find(entry => Number(entry.level || 0) === level);

      if (!levelData) {
        levelData = {
          level,
          title: `Уровень ${level}`,
          abilities: []
        };
        data.levels.push(levelData);
      }

      levelData.abilities = Array.isArray(levelData.abilities) ? levelData.abilities : [];
      levelData.abilities.push(ability);

      await GVM.v080SaveBuildingLocations(item, data);
    },
    update: async (location, ability) => {
      const data = GVM.v080Clone(GVM.gvmData(item));
      const freshLocations = GVM.v080GetBuildingAbilityLocations({
        ...item,
        get name() { return item.name; }
      });

      let changed = false;

      const replaceInData = container => {
        if (!Array.isArray(container)) return false;
        const oldId = GVM.v080NormalizeAbilityForEdit(location.raw).id;
        const index = container.findIndex(entry => GVM.v080NormalizeAbilityForEdit(entry).id === oldId);
        if (index >= 0) {
          container[index] = ability;
          return true;
        }
        return false;
      };

      changed = replaceInData(data.services) || changed;
      changed = replaceInData(data.actions) || changed;

      for (const levelData of data.levels || []) {
        changed = replaceInData(levelData.abilities) || changed;
        changed = replaceInData(levelData.actions) || changed;
        changed = replaceInData(levelData.services) || changed;
      }

      if (!changed) ui.notifications.warn("Не удалось найти контейнер способности.");
      await GVM.v080SaveBuildingLocations(item, data);
    },
    remove: async location => {
      const data = GVM.v080Clone(GVM.gvmData(item));
      const oldId = GVM.v080NormalizeAbilityForEdit(location.raw).id;

      const removeFromData = container => {
        if (!Array.isArray(container)) return false;
        const index = container.findIndex(entry => GVM.v080NormalizeAbilityForEdit(entry).id === oldId);
        if (index >= 0) {
          container.splice(index, 1);
          return true;
        }
        return false;
      };

      let changed = false;
      changed = removeFromData(data.services) || changed;
      changed = removeFromData(data.actions) || changed;

      for (const levelData of data.levels || []) {
        changed = removeFromData(levelData.abilities) || changed;
        changed = removeFromData(levelData.actions) || changed;
        changed = removeFromData(levelData.services) || changed;
      }

      if (!changed) ui.notifications.warn("Не удалось найти контейнер способности.");
      await GVM.v080SaveBuildingLocations(item, data);
    }
  };
};

GVM.v080ResidentAbilityContext = function v080ResidentAbilityContext(actor, residentId) {
  return {
    canCreate: true,
    label: () => {
      const resident = (GVM.getKeyResidents(actor) || []).find(entry => entry.id === residentId);
      return GVM.v080GetResidentName ? GVM.v080GetResidentName(resident) : "Ключевой НИП";
    },
    locations: () => {
      const resident = (GVM.getKeyResidents(actor) || []).find(entry => entry.id === residentId);
      if (!resident) return [];
      return GVM.v080GetResidentAbilityLocations(resident);
    },
    create: () => {
      if (GVM.openAbilityBuilder) {
        GVM.openAbilityBuilder(actor, {
          sourceType: "resident",
          residentId
        });
      }
    },
    add: async ability => {
      const residents = GVM.getKeyResidents(actor);
      const resident = residents.find(entry => entry.id === residentId);

      if (!resident) {
        ui.notifications.warn("НИП не найден.");
        return;
      }

      resident.abilities = Array.isArray(resident.abilities) ? resident.abilities : [];
      resident.abilities.push(ability);

      await GVM.v080SaveResidentData(actor, residents);
    },
    update: async (location, ability) => {
      const residents = GVM.getKeyResidents(actor);
      const resident = residents.find(entry => entry.id === residentId);

      if (!resident) {
        ui.notifications.warn("НИП не найден.");
        return;
      }

      const oldId = GVM.v080NormalizeAbilityForEdit(location.raw).id;

      const replaceInData = container => {
        if (!Array.isArray(container)) return false;
        const index = container.findIndex(entry => GVM.v080NormalizeAbilityForEdit(entry).id === oldId);
        if (index >= 0) {
          container[index] = ability;
          return true;
        }
        return false;
      };

      let changed = false;
      changed = replaceInData(resident.abilities) || changed;
      changed = replaceInData(resident.services) || changed;

      if (!changed) ui.notifications.warn("Не удалось найти способность НИП.");
      await GVM.v080SaveResidentData(actor, residents);
    },
    remove: async location => {
      const residents = GVM.getKeyResidents(actor);
      const resident = residents.find(entry => entry.id === residentId);

      if (!resident) {
        ui.notifications.warn("НИП не найден.");
        return;
      }

      const oldId = GVM.v080NormalizeAbilityForEdit(location.raw).id;

      const removeFromData = container => {
        if (!Array.isArray(container)) return false;
        const index = container.findIndex(entry => GVM.v080NormalizeAbilityForEdit(entry).id === oldId);
        if (index >= 0) {
          container.splice(index, 1);
          return true;
        }
        return false;
      };

      let changed = false;
      changed = removeFromData(resident.abilities) || changed;
      changed = removeFromData(resident.services) || changed;

      if (!changed) ui.notifications.warn("Не удалось найти способность НИП.");
      await GVM.v080SaveResidentData(actor, residents);
    }
  };
};

GVM.v080FindBuildingCard = function v080FindBuildingCard(root, item) {
  if (!root || !item) return null;

  const id = String(item.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const selectors = [
    `[data-item-id="${id}"]`,
    `[data-gvm-item-id="${id}"]`,
    `[data-gvm-facility-id="${id}"]`,
    `[data-facility-item-id="${id}"]`
  ];

  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }

  const cards = Array.from(root.querySelectorAll(".gvm-facility-card, .gvm-building-card, article, .gvm-card"));
  return cards.find(card => (card.textContent || "").includes(item.name)) || null;
};

GVM.v080InjectBuildingAbilityButtons = function v080InjectBuildingAbilityButtons(actor, root = document) {
  if (!actor || !GVM.buildings) return;

  for (const item of GVM.buildings(actor)) {
    const card = GVM.v080FindBuildingCard(root, item);
    if (!card || card.querySelector("[data-gvm-v080-control='manage-building-abilities']")) continue;

    const locations = GVM.v080GetBuildingAbilityLocations(item);
    const wrap = document.createElement("div");
    wrap.className = "gvm-v080-card-tools";
    wrap.innerHTML = `
      <span class="gvm-v080-pill">Способности: ${locations.length}</span>
      <button type="button" class="gvm-mini-button secondary" data-gvm-v080-control="manage-building-abilities" data-item-id="${GVM.escapeHtml(item.id)}">
        Способности
      </button>
    `;

    const anchor =
      card.querySelector(".gvm-card-actions") ||
      card.querySelector("footer") ||
      card;

    anchor.appendChild(wrap);

    wrap.querySelector("[data-gvm-v080-control='manage-building-abilities']").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v080OpenAbilityManager(actor, GVM.v080BuildingAbilityContext(actor, item));
    });
  }
};

GVM.v080InjectResidentAbilityButtons = function v080InjectResidentAbilityButtons(actor, root = document) {
  if (!actor || !GVM.getKeyResidents || !GVM.v080FindResidentCard) return;

  const residents = GVM.getKeyResidents(actor) || [];

  for (const resident of residents) {
    const card = GVM.v080FindResidentCard(root, resident);
    if (!card || card.querySelector("[data-gvm-v080-control='manage-resident-abilities']")) continue;

    const locations = GVM.v080GetResidentAbilityLocations(resident);

    const wrap = document.createElement("div");
    wrap.className = "gvm-v080-card-tools";
    wrap.innerHTML = `
      <span class="gvm-v080-pill">Способности: ${locations.length}</span>
      <button type="button" class="gvm-mini-button secondary" data-gvm-v080-control="manage-resident-abilities" data-resident-id="${GVM.escapeHtml(resident.id)}">
        Способности
      </button>
    `;

    const anchor =
      card.querySelector(".gvm-resident-actions") ||
      card.querySelector("footer") ||
      card;

    anchor.appendChild(wrap);

    wrap.querySelector("[data-gvm-v080-control='manage-resident-abilities']").addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      GVM.v080OpenAbilityManager(actor, GVM.v080ResidentAbilityContext(actor, resident.id));
    });
  }
};

GVM.v080InjectAbilityManagement = function v080InjectAbilityManagement(actor, root = document) {
  try {
    GVM.v080InjectBuildingAbilityButtons(actor, root);
    GVM.v080InjectResidentAbilityButtons(actor, root);
  } catch (err) {
    console.warn("GVM v0.8 ability management injection failed", err);
  }
};

GVM.originalRefreshSettlementV080AbilityManagement = GVM.originalRefreshSettlementV080AbilityManagement || GVM.refreshSettlement;

GVM.refreshSettlement = function refreshSettlementV080AbilityManagement(actor) {
  const result = GVM.originalRefreshSettlementV080AbilityManagement(actor);

  setTimeout(() => {
    GVM.v080InjectAbilityManagement(actor, document);
  }, 180);

  return result;
};

if (GVM.renderSettlementPanel && !GVM.originalRenderSettlementPanelV080AbilityManagement) {
  GVM.originalRenderSettlementPanelV080AbilityManagement = GVM.renderSettlementPanel;

  GVM.renderSettlementPanel = async function renderSettlementPanelV080AbilityManagement(actor, panel) {
    await GVM.originalRenderSettlementPanelV080AbilityManagement(actor, panel);
    GVM.v080InjectAbilityManagement(actor, panel || document);
  };
}

Hooks.once("ready", () => {
  console.log("GVM v0.8 Ability Management Layer loaded");
});
