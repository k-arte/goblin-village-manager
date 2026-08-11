GVM.ABILITY_PRESETS = {
  instantService: {
    label: "Мгновенная услуга",
    abilityLabel: "Новая услуга",
    description: "Услуга выполняется сразу и не занимает приказ.",
    actionType: "instant",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 0,
    resultType: "manual"
  },
  minorOrder: {
    label: "Малый приказ здания",
    abilityLabel: "Новый малый приказ",
    description: "Действие занимает малый приказ здания.",
    actionType: "minor",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 1,
    resultType: "manual"
  },
  cityOrder: {
    label: "Городской приказ",
    abilityLabel: "Новый городской приказ",
    description: "Действие занимает городской приказ поселения.",
    actionType: "city",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 1,
    resultType: "manual"
  },
  rewardItem: {
    label: "Выдать предмет",
    abilityLabel: "Новая награда",
    description: "После активации или завершения выдаёт Item.",
    actionType: "minor",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 1,
    resultType: "rewardItem"
  },
  activeEffect: {
    label: "Активный эффект",
    abilityLabel: "Новый эффект",
    description: "Создаёт активный эффект, отслеживаемый поселением.",
    actionType: "instant",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 1,
    resultType: "activeEffect"
  },
  manual: {
    label: "Ручное действие GM",
    abilityLabel: "Новое ручное действие",
    description: "GM вручную описывает результат.",
    actionType: "instant",
    costStat: "treasury",
    costValue: 0,
    durationCycles: 0,
    resultType: "manual"
  }
};

GVM.getAbilityBuilderSourceLabel = function getAbilityBuilderSourceLabel(actor, context = {}) {
  if (context.sourceType === "building" && context.item) return `${context.item.name}`;
  if (context.sourceType === "resident") {
    const resident = GVM.findResident(actor, context.residentId);
    const residentActor = GVM.getResidentActorSync(resident);
    return residentActor?.name || resident?.professionLabel || resident?.professionId || "Ключевой житель";
  }

  return "Источник";
};

GVM.getAbilityBuilderExistingAbilities = function getAbilityBuilderExistingAbilities(actor, context = {}) {
  if (context.sourceType === "building" && context.item) {
    return GVM.collectBuildingAbilities ? GVM.collectBuildingAbilities(actor, context.item) : [];
  }

  if (context.sourceType === "resident") {
    const resident = GVM.findResident(actor, context.residentId);
    return (resident?.abilities || resident?.services || []).map(raw => GVM.normalizeAbility(raw, {
      type: "resident",
      residentId: resident.id,
      residentName: resident.professionLabel || resident.professionId || "Ключевой житель",
      actorUuid: resident.actorUuid
    }));
  }

  return [];
};

GVM.renderAbilityTargetOptions = function renderAbilityTargetOptions(actor, context = {}) {
  const abilities = GVM.getAbilityBuilderExistingAbilities(actor, context);

  if (!abilities.length) {
    return `<option value="">Нет существующих способностей</option>`;
  }

  return [
    `<option value="">Не выбрано</option>`,
    ...abilities.map(ability => `<option value="${GVM.escapeHtml(ability.id)}">${GVM.escapeHtml(ability.label)}</option>`)
  ].join("");
};

GVM.renderAbilityBuilderLevelOptions = function renderAbilityBuilderLevelOptions(context = {}) {
  if (context.sourceType !== "building" || !context.item) return "";

  const data = GVM.gvmData(context.item);
  const max = Math.max(1, Number(data.maxLevel || data.level || 1));

  return `
    <label class="gvm-config-field">
      <span>Уровень здания</span>
      <select name="requiredLevel">
        ${Array.from({ length: max }, (_value, index) => index + 1).map(level => `
          <option value="${level}" ${level === Math.max(1, Number(data.level || 1)) ? "selected" : ""}>Уровень ${level}</option>
        `).join("")}
      </select>
    </label>
  `;
};

GVM.openAbilityBuilder = function openAbilityBuilder(actor, context = {}) {
  const sourceLabel = GVM.getAbilityBuilderSourceLabel(actor, context);
  const targetOptions = GVM.renderAbilityTargetOptions(actor, context);
  const levelOptions = GVM.renderAbilityBuilderLevelOptions(context);
  const presetOptions = Object.entries(GVM.ABILITY_PRESETS).map(([id, preset]) => {
    return `<option value="${id}">${GVM.escapeHtml(preset.label)}</option>`;
  }).join("");

  const dialog = new Dialog({
    title: `Создать способность: ${sourceLabel}`,
    content: `
      <form class="gvm-ability-builder-form">
        <section class="gvm-builder-hero">
          <h2>${GVM.escapeHtml(sourceLabel)}</h2>
          <p>Создай способность через пресет. Большинство полей уже заполнится автоматически.</p>
        </section>

        <section class="gvm-config-section">
          <h3>1. Что создать?</h3>
          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Пресет</span>
              <select name="preset">
                ${presetOptions}
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Как добавить?</span>
              <select name="mode">
                <option value="add">Добавить новую</option>
                <option value="replace">Заменить старую</option>
                <option value="upgrade">Улучшить старую</option>
                <option value="disable">Отключить старую</option>
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Целевая способность</span>
              <select name="targetAbilityId">
                ${targetOptions}
              </select>
            </label>

            ${levelOptions}
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>2. Основное</h3>
          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Название</span>
              <input type="text" name="label" value="Новая услуга">
            </label>

            <label class="gvm-config-field">
              <span>Тип действия</span>
              <select name="actionType">
                <option value="instant">Мгновенно</option>
                <option value="minor">Малый приказ</option>
                <option value="city">Городской приказ</option>
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Длительность в циклах</span>
              <input type="number" name="durationCycles" value="0">
            </label>

            <label class="gvm-config-field">
              <span>Тип результата</span>
              <select name="resultType">
                <option value="manual">Ручной результат GM</option>
                <option value="rewardItem">Выдать Item</option>
                <option value="activeEffect">Активный эффект</option>
              </select>
            </label>
          </div>

          <label class="gvm-config-field gvm-config-wide">
            <span>Описание</span>
            <textarea name="description">Услуга выполняется сразу и не занимает приказ.</textarea>
          </label>
        </section>

        <section class="gvm-config-section">
          <h3>3. Цена</h3>
          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Ресурс</span>
              <select name="costStat">
                ${GVM.renderStage4StatOptions ? GVM.renderStage4StatOptions("treasury") : `<option value="treasury">Казна</option>`}
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Стоимость</span>
              <input type="number" name="costValue" value="0">
            </label>
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>4. Reward Item</h3>
          <p class="gvm-builder-note">Нужно только для способностей, которые выдают предмет. Можно перетащить Item сюда или вставить UUID.</p>

          <div class="gvm-ability-reward-drop" data-gvm-reward-drop>
            <strong>Перетащите Item-награду сюда</strong>
            <p data-gvm-reward-label>Награда не назначена.</p>
          </div>

          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Reward UUID</span>
              <input type="text" name="rewardUuid" value="">
            </label>

            <label class="gvm-config-field">
              <span>Количество</span>
              <input type="number" name="rewardQuantity" value="1">
            </label>
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>5. Требования</h3>
          <p class="gvm-builder-note">Упрощённый формат на сейчас. Один пункт на строку: type | value | label</p>
          <textarea name="requirements" style="min-height:72px;"></textarea>
        </section>

        <section class="gvm-config-section">
          <h3>Preview</h3>
          <div class="gvm-ability-builder-preview">
            <strong data-preview-label>Новая услуга</strong>
            <span data-preview-meta>instant · бесплатно</span>
            <p data-preview-description>Услуга выполняется сразу и не занимает приказ.</p>
          </div>
        </section>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить способность",
        callback: async html => {
          await GVM.saveAbilityBuilder(actor, context, html);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    render: html => {
      GVM.activateAbilityBuilder(actor, context, html);
    }
  }, {
    width: 820,
    height: "auto"
  });

  dialog.render(true);
};

GVM.activateAbilityBuilder = function activateAbilityBuilder(actor, context, html) {
  const form = html.find("form.gvm-ability-builder-form");

  const applyPreset = () => {
    const presetId = form.find("[name=preset]").val();
    const preset = GVM.ABILITY_PRESETS[presetId] || GVM.ABILITY_PRESETS.instantService;

    form.find("[name=label]").val(preset.abilityLabel);
    form.find("[name=description]").val(preset.description);
    form.find("[name=actionType]").val(preset.actionType);
    form.find("[name=costStat]").val(preset.costStat);
    form.find("[name=costValue]").val(preset.costValue);
    form.find("[name=durationCycles]").val(preset.durationCycles);
    form.find("[name=resultType]").val(preset.resultType);

    updatePreview();
  };

  const updatePreview = () => {
    const label = form.find("[name=label]").val() || "Способность";
    const actionType = form.find("[name=actionType]").val() || "instant";
    const costStat = form.find("[name=costStat]").val() || "treasury";
    const costValue = Number(form.find("[name=costValue]").val()) || 0;
    const description = form.find("[name=description]").val() || "";

    form.find("[data-preview-label]").text(label);
    form.find("[data-preview-meta]").text(`${actionType} · ${costValue ? `${costStat} ${costValue}` : "бесплатно"}`);
    form.find("[data-preview-description]").text(description);
  };

  form.find("[name=preset]").on("change", applyPreset);
  form.find("input, textarea, select").on("input change", updatePreview);

  const dropZone = form.find("[data-gvm-reward-drop]");

  dropZone.on("dragover", event => {
    event.preventDefault();
    dropZone.addClass("dragover");
  });

  dropZone.on("dragleave", () => {
    dropZone.removeClass("dragover");
  });

  dropZone.on("drop", async event => {
    event.preventDefault();
    dropZone.removeClass("dragover");

    const dragData = GVM.getDragData(event.originalEvent || event);
    let dropped = null;

    if (dragData.uuid) dropped = await fromUuid(dragData.uuid);
    else if (dragData.type === "Item" && dragData.id) dropped = game.items.get(dragData.id);

    if (!dropped || dropped.documentName !== "Item") {
      ui.notifications.warn("Reward должен быть Item.");
      return;
    }

    form.find("[name=rewardUuid]").val(dropped.uuid);
    form.find("[data-gvm-reward-label]").text(`${dropped.name} (${dropped.uuid})`);
  });

  applyPreset();
};

GVM.parseAbilityRequirementLines = function parseAbilityRequirementLines(value) {
  return String(value || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|").map(part => part.trim());

      return {
        type: parts[0] || "story",
        value: parts[1] || "",
        label: parts[2] || parts[1] || parts[0] || "Требование"
      };
    });
};

GVM.buildAbilityFromBuilderForm = function buildAbilityFromBuilderForm(html) {
  const form = html.find("form.gvm-ability-builder-form")[0];
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());

  const mode = values.mode || "add";
  const targetAbilityId = values.targetAbilityId || null;
  const label = String(values.label || "Способность").trim();

  const ability = {
    id: `${GVM.slugify(label)}-${foundry.utils.randomID(5)}`,
    label,
    description: values.description || "",
    mode,
    action: {
      type: values.actionType || "instant",
      orderType: values.actionType || "instant",
      durationCycles: Math.max(0, Number(values.durationCycles) || 0),
      cost: {
        stat: values.costStat || "treasury",
        value: Number(values.costValue) || 0
      }
    },
    result: {
      type: values.resultType || "manual",
      text: values.description || ""
    },
    requirements: GVM.parseAbilityRequirementLines(values.requirements)
  };

  if (mode === "replace") ability.replacesAbilityId = targetAbilityId;
  if (mode === "upgrade") ability.upgradesAbilityId = targetAbilityId;
  if (mode === "disable") ability.disablesAbilityId = targetAbilityId;

  if (values.resultType === "rewardItem" && values.rewardUuid) {
    ability.result.reward = {
      uuid: values.rewardUuid,
      quantity: Math.max(1, Number(values.rewardQuantity) || 1),
      target: "selectedActor"
    };
  }

  if (values.resultType === "activeEffect") {
    ability.result.effect = {
      label,
      durationCycles: Math.max(1, Number(values.durationCycles) || 1),
      description: values.description || ""
    };
  }

  return ability;
};

GVM.ensureBuildingLevelData = function ensureBuildingLevelData(data, levelNumber) {
  data.levels = Array.isArray(data.levels) ? data.levels : [];

  let levelData = data.levels.find(level => Number(level.level) === Number(levelNumber));

  if (!levelData) {
    levelData = {
      level: Number(levelNumber),
      title: `Уровень ${levelNumber}`,
      description: "",
      cost: [],
      duration: 1,
      workersRequired: Number(data.workersRequired || 0),
      effectsMode: "replace",
      abilitiesMode: "add",
      effects: [],
      abilities: []
    };

    data.levels.push(levelData);
    data.levels.sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  }

  levelData.abilities = Array.isArray(levelData.abilities) ? levelData.abilities : [];
  return levelData;
};

GVM.saveAbilityBuilder = async function saveAbilityBuilder(actor, context, html) {
  const ability = GVM.buildAbilityFromBuilderForm(html);

  if (context.sourceType === "building" && context.item) {
    const data = GVM.clone(GVM.gvmData(context.item));
    const levelNumber = Math.max(1, Number(html.find("[name=requiredLevel]").val()) || Number(data.level || 1) || 1);
    const levelData = GVM.ensureBuildingLevelData(data, levelNumber);

    levelData.abilities.push(ability);

    await context.item.setFlag(GVM.FLAG_SCOPE, "data", data);

    ui.notifications.info(`Способность добавлена в ${context.item.name}: ${ability.label}`);
    GVM.queueRefresh(actor);
    return;
  }

  if (context.sourceType === "resident") {
    const residents = GVM.getKeyResidents(actor);
    const resident = residents.find(item => item.id === context.residentId);

    if (!resident) {
      ui.notifications.warn("Ключевой житель не найден.");
      return;
    }

    resident.abilities = Array.isArray(resident.abilities) ? resident.abilities : [];
    resident.abilities.push(ability);

    await GVM.setKeyResidents(actor, residents);

    ui.notifications.info(`Способность добавлена ключевому жителю: ${ability.label}`);
    GVM.queueRefresh(actor);
    return;
  }

  ui.notifications.warn("Неизвестный источник способности.");
};
