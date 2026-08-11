GVM.createEffectInputs = function createEffectInputs(prefix) {
  return `
    <div class="form-group">
      <label>Стат</label>
      <select name="${prefix}stat">
        ${Object.entries(GVM.STAT_LABELS).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
      </select>
    </div>
    <div class="form-group">
      <label>Значение</label>
      <input type="number" name="${prefix}value" value="0">
    </div>
    <div class="form-group">
      <label>Timing</label>
      <select name="${prefix}timing">
        <option value="passive">passive</option>
        <option value="perCycle">perCycle</option>
        <option value="everyInterval">everyInterval</option>
      </select>
    </div>
  `;
};

GVM.upgradeBuilding = async function upgradeBuilding(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));
  const nextLevel = Number(data.level || 0) + 1;
  const levelData = (data.levels || []).find(level => Number(level.level) === nextLevel);

  if (!levelData) {
    ui.notifications.warn("Следующий уровень не описан. Откройте GVM JSON и добавьте levels.");
    return;
  }

  if (!GVM.canPay(actor, levelData.cost || [])) {
    ui.notifications.warn("Недостаточно ресурсов.");
    return;
  }

  const derived = GVM.calculateDerived(actor);

  if (GVM.activeOrders(actor).length >= derived.projectCapacity) {
    ui.notifications.warn(`Лимит проектов: ${GVM.activeOrders(actor).length} / ${derived.projectCapacity}.`);
    return;
  }

  new Dialog({
    title: `${item.name}: ${levelData.title || `уровень ${nextLevel}`}`,
    content: `
      <section class="gvm-dialog">
        <p>${GVM.escapeHtml(levelData.description || "")}</p>
        <p><b>Стоимость:</b> ${GVM.escapeHtml(GVM.effectsLabel(levelData.cost || []))}</p>
        <p><b>Длительность:</b> ${Number(levelData.duration || 1)} цикл(а)</p>
        <p><b>Рабочие после улучшения:</b> ${Number(levelData.workersRequired ?? data.workersRequired ?? 0)}</p>
        <p><b>Эффекты:</b> ${GVM.escapeHtml(GVM.effectsLabel(levelData.effects || []))}</p>
        <p><b>Сервисы:</b> ${GVM.escapeHtml((levelData.services || []).join(", ") || "—")}</p>
      </section>
    `,
    buttons: {
      ok: {
        label: "Создать проект",
        callback: () => GVM.createOrder(actor, {
          name: levelData.title || `Улучшить ${item.name}`,
          description: levelData.description || "",
          duration: Number(levelData.duration || 1),
          cost: levelData.cost || [],
          targetItemId: item.id,
          action: "upgrade-building"
        })
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
};

GVM.assignWorkers = async function assignWorkers(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));
  const resources = GVM.getResources(actor);

  const otherAssigned = GVM.buildings(actor)
    .filter(building => building.id !== item.id)
    .reduce((sum, building) => {
      const buildingData = GVM.gvmData(building);
      if (!["built", "damaged"].includes(buildingData.status)) return sum;
      return sum + Math.min(Number(buildingData.workersAssigned) || 0, Number(buildingData.workersRequired) || 0);
    }, 0);

  const max = Math.min(
    Number(data.workersRequired) || 0,
    Math.max(0, Number(resources.population || 0) - otherAssigned)
  );

  new Dialog({
    title: `${item.name}: рабочие`,
    content: `
      <form>
        <p>Доступно для этого здания: <b>${max}</b></p>
        <div class="form-group">
          <label>Рабочие</label>
          <input type="number" name="workers" value="${Number(data.workersAssigned || 0)}">
        </div>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          data.workersAssigned = Math.max(0, Math.min(max, Number(html.find("[name=workers]").val()) || 0));
          await item.setFlag(GVM.FLAG_SCOPE, "data", data);
          GVM.queueRefresh(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    }
  }).render(true);
};

GVM.toggleBuilding = async function toggleBuilding(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));

  if (data.status === "built") data.status = "disabled";
  else if (data.status === "disabled") data.status = "built";
  else {
    ui.notifications.warn("Включать/отключать можно только построенное здание.");
    return;
  }

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  GVM.queueRefresh(actor);
};

GVM.toggleReform = async function toggleReform(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));
  data.active = !data.active;
  await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  GVM.queueRefresh(actor);
};

GVM.activateBonus = async function activateBonus(actor, item) {
  const data = GVM.clone(GVM.gvmData(item));

  if (data.active) {
    data.active = false;
    data.remaining = 0;
    await item.setFlag(GVM.FLAG_SCOPE, "data", data);
    GVM.queueRefresh(actor);
    return;
  }

  const active = GVM.bonuses(actor).find(bonus => GVM.gvmData(bonus).active);

  if (active) {
    ui.notifications.warn(`Уже активен бонус: ${active.name}`);
    return;
  }

  if (!GVM.canPay(actor, data.cost || [])) {
    ui.notifications.warn("Недостаточно ресурсов.");
    return;
  }

  await GVM.payCost(actor, data.cost || []);

  data.active = true;
  data.remaining = Number(data.duration || 1);

  await item.setFlag(GVM.FLAG_SCOPE, "data", data);
  GVM.queueRefresh(actor);
};

GVM.editGvmData = function editGvmData(actor, item) {
  const data = GVM.gvmData(item);

  new Dialog({
    title: `${item.name}: GVM JSON`,
    content: `
      <form>
        <textarea name="json" style="width:100%;height:420px;font-family:monospace;">${GVM.escapeHtml(JSON.stringify(data, null, 2))}</textarea>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          try {
            const parsed = JSON.parse(html.find("[name=json]").val());
            await item.setFlag(GVM.FLAG_SCOPE, "data", parsed);
            GVM.queueRefresh(actor);
          } catch (err) {
            ui.notifications.error(`JSON ошибка: ${err.message}`);
          }
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    width: 720
  }).render(true);
};

GVM.itemActionDialog = function itemActionDialog(actor, item) {
  const data = GVM.gvmData(item);

  if (data.kind === GVM.KIND.BUILDING) return GVM.buildingDialog(actor, item);
  if (data.kind === GVM.KIND.REFORM) return GVM.reformDialog(actor, item);
  if (data.kind === GVM.KIND.ORDER) return GVM.orderDialog(actor, item);
  if (data.kind === GVM.KIND.BONUS) return GVM.bonusDialog(actor, item);

  item.sheet?.render(true);
};

GVM.buildingDialog = function buildingDialog(actor, item) {
  const data = GVM.gvmData(item);
  const services = (data.services || []).length
    ? data.services.map(service => `<li>${GVM.escapeHtml(service)}</li>`).join("")
    : "<li>Нет сервисов</li>";

  new Dialog({
    title: `${item.name}: функции здания`,
    content: `
      <section class="gvm-dialog">
        <p><b>Тип:</b> ${GVM.escapeHtml(GVM.BUILDING_TYPES[data.type] || data.type || "Здание")}</p>
        <p><b>Статус:</b> ${GVM.escapeHtml(data.status || "unknown")} · <b>Уровень:</b> ${Number(data.level || 0)}/${Number(data.maxLevel || 5)}</p>
        <p><b>Рабочие:</b> ${Number(data.workersAssigned || 0)}/${Number(data.workersRequired || 0)}</p>
        <p><b>Эффекты:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.effects || []))}</p>
        <h3>Сервисы</h3>
        <ul>${services}</ul>
      </section>
    `,
    buttons: {
      upgrade: {
        label: Number(data.level || 0) === 0 ? "Построить" : "Расширить",
        callback: () => GVM.upgradeBuilding(actor, item)
      },
      workers: {
        label: "Рабочие",
        callback: () => GVM.assignWorkers(actor, item)
      },
      toggle: {
        label: data.status === "disabled" ? "Включить" : "Отключить",
        callback: () => GVM.toggleBuilding(actor, item)
      },
      sheet: {
        label: "Item Sheet",
        callback: () => item.sheet?.render(true)
      },
      json: {
        label: "Настроить",
        callback: () => GVM.editGvmData(actor, item)
      }
    }
  }).render(true);
};

GVM.reformDialog = function reformDialog(actor, item) {
  const data = GVM.gvmData(item);

  new Dialog({
    title: `${item.name}: реформа`,
    content: `
      <section class="gvm-dialog">
        <p>${GVM.escapeHtml(data.description || "")}</p>
        <p><b>Статус:</b> ${data.active ? "активна" : "выключена"}</p>
        <p><b>Интервал:</b> ${Number(data.interval || 1)}</p>
        <p><b>Эффекты:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.effects || []))}</p>
      </section>
    `,
    buttons: {
      toggle: {
        label: data.active ? "Отключить" : "Включить",
        callback: () => GVM.toggleReform(actor, item)
      },
      sheet: {
        label: "Item Sheet",
        callback: () => item.sheet?.render(true)
      },
      json: {
        label: "Настроить",
        callback: () => GVM.editGvmData(actor, item)
      }
    }
  }).render(true);
};

GVM.orderDialog = function orderDialog(actor, item) {
  const data = GVM.gvmData(item);

  new Dialog({
    title: `${item.name}: приказ`,
    content: `
      <section class="gvm-dialog">
        <p>${GVM.escapeHtml(data.description || "")}</p>
        <p><b>Статус:</b> ${GVM.escapeHtml(data.status || "unknown")}</p>
        <p><b>Прогресс:</b> ${Number(data.progress || 0)}/${Number(data.duration || 1)}</p>
        <p><b>Стоимость:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.cost || []))}</p>
        <p><b>При завершении:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.effectsOnComplete || []))}</p>
      </section>
    `,
    buttons: {
      sheet: {
        label: "Item Sheet",
        callback: () => item.sheet?.render(true)
      },
      json: {
        label: "Настроить",
        callback: () => GVM.editGvmData(actor, item)
      }
    }
  }).render(true);
};

GVM.bonusDialog = function bonusDialog(actor, item) {
  const data = GVM.gvmData(item);

  new Dialog({
    title: `${item.name}: бонус`,
    content: `
      <section class="gvm-dialog">
        <p>${GVM.escapeHtml(data.description || "")}</p>
        <p><b>Источник:</b> ${GVM.escapeHtml(data.source || "—")}</p>
        <p><b>Статус:</b> ${data.active ? `активен, осталось ${Number(data.remaining || 0)}` : "неактивен"}</p>
        <p><b>Цена:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.cost || []))}</p>
        <p><b>Эффекты:</b> ${GVM.escapeHtml(GVM.effectsLabel(data.effects || []))}</p>
      </section>
    `,
    buttons: {
      activate: {
        label: data.active ? "Снять" : "Активировать",
        callback: () => GVM.activateBonus(actor, item)
      },
      sheet: {
        label: "Item Sheet",
        callback: () => item.sheet?.render(true)
      },
      json: {
        label: "Настроить",
        callback: () => GVM.editGvmData(actor, item)
      }
    }
  }).render(true);
};

GVM.createBuildingDialog = function createBuildingDialog(actor) {
  new Dialog({
    title: "Создать здание",
    content: `
      <form>
        <div class="form-group"><label>Название</label><input name="name" value="Новое здание"></div>
        <div class="form-group">
          <label>Тип</label>
          <select name="type">
            ${Object.entries(GVM.BUILDING_TYPES).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Статус</label>
          <select name="status">
            <option value="available">available</option>
            <option value="built">built</option>
            <option value="locked">locked</option>
          </select>
        </div>
        <div class="form-group"><label>Уровень</label><input type="number" name="level" value="0"></div>
        <div class="form-group"><label>Макс. уровень</label><input type="number" name="maxLevel" value="5"></div>
        <div class="form-group"><label>Рабочие требуются</label><input type="number" name="workersRequired" value="0"></div>
        <div class="form-group"><label>Рабочие назначены</label><input type="number" name="workersAssigned" value="0"></div>
        <div class="form-group"><label>Описание</label><textarea name="note"></textarea></div>
        <hr>
        <h3>Первый эффект</h3>
        ${GVM.createEffectInputs("e_")}
      </form>
    `,
    buttons: {
      create: {
        label: "Создать",
        callback: async html => {
          const value = Number(html.find("[name=e_value]").val()) || 0;
          const effects = value ? [{
            stat: html.find("[name=e_stat]").val(),
            value,
            timing: html.find("[name=e_timing]").val()
          }] : [];

          const name = html.find("[name=name]").val();
          const note = html.find("[name=note]").val();

          await GVM.createGvmItem(actor, name, {
            kind: GVM.KIND.BUILDING,
            type: html.find("[name=type]").val(),
            status: html.find("[name=status]").val(),
            level: Number(html.find("[name=level]").val()) || 0,
            maxLevel: Number(html.find("[name=maxLevel]").val()) || 5,
            unlockLevel: 5,
            workersRequired: Number(html.find("[name=workersRequired]").val()) || 0,
            workersAssigned: Number(html.find("[name=workersAssigned]").val()) || 0,
            upkeep: [],
            effects,
            levels: [],
            services: [],
            actions: [],
            note
          }, { description: note });

          GVM.queueRefresh(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    width: 620
  }).render(true);
};

GVM.createReformDialog = function createReformDialog(actor) {
  new Dialog({
    title: "Создать реформу",
    content: `
      <form>
        <div class="form-group"><label>Название</label><input name="name" value="Новая реформа"></div>
        <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
        <div class="form-group"><label>Активна</label><input type="checkbox" name="active"></div>
        <div class="form-group"><label>Интервал</label><input type="number" name="interval" value="1"></div>
        <hr>
        <h3>Эффект</h3>
        ${GVM.createEffectInputs("e_")}
      </form>
    `,
    buttons: {
      create: {
        label: "Создать",
        callback: async html => {
          const value = Number(html.find("[name=e_value]").val()) || 0;
          const effects = value ? [{
            stat: html.find("[name=e_stat]").val(),
            value,
            timing: html.find("[name=e_timing]").val()
          }] : [];

          const name = html.find("[name=name]").val();
          const description = html.find("[name=description]").val();

          await GVM.createGvmItem(actor, name, {
            kind: GVM.KIND.REFORM,
            active: !!html.find("[name=active]").prop("checked"),
            interval: Math.max(1, Number(html.find("[name=interval]").val()) || 1),
            tick: 0,
            description,
            effects
          }, { description });

          GVM.queueRefresh(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    width: 620
  }).render(true);
};

GVM.createOrderDialog = function createOrderDialog(actor) {
  new Dialog({
    title: "Создать приказ",
    content: `
      <form>
        <div class="form-group"><label>Название</label><input name="name" value="Новый приказ"></div>
        <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
        <div class="form-group"><label>Длительность</label><input type="number" name="duration" value="1"></div>
        <hr>
        <h3>Стоимость</h3>
        ${GVM.createEffectInputs("c_")}
        <hr>
        <h3>Эффект при завершении</h3>
        ${GVM.createEffectInputs("e_")}
      </form>
    `,
    buttons: {
      create: {
        label: "Создать",
        callback: async html => {
          const costValue = Number(html.find("[name=c_value]").val()) || 0;
          const effectValue = Number(html.find("[name=e_value]").val()) || 0;

          await GVM.createOrder(actor, {
            name: html.find("[name=name]").val(),
            description: html.find("[name=description]").val(),
            duration: Number(html.find("[name=duration]").val()) || 1,
            cost: costValue ? [{ stat: html.find("[name=c_stat]").val(), value: costValue }] : [],
            effectsOnComplete: effectValue ? [{ stat: html.find("[name=e_stat]").val(), value: effectValue }] : []
          });
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    width: 620
  }).render(true);
};

GVM.createBonusDialog = function createBonusDialog(actor) {
  new Dialog({
    title: "Создать бонус",
    content: `
      <form>
        <div class="form-group"><label>Название</label><input name="name" value="Новый бонус"></div>
        <div class="form-group"><label>Источник</label><input name="source" value=""></div>
        <div class="form-group"><label>Описание</label><textarea name="description"></textarea></div>
        <div class="form-group"><label>Длительность</label><input type="number" name="duration" value="1"></div>
        <hr>
        <h3>Цена</h3>
        ${GVM.createEffectInputs("c_")}
        <hr>
        <h3>Эффект</h3>
        ${GVM.createEffectInputs("e_")}
      </form>
    `,
    buttons: {
      create: {
        label: "Создать",
        callback: async html => {
          const costValue = Number(html.find("[name=c_value]").val()) || 0;
          const effectValue = Number(html.find("[name=e_value]").val()) || 0;

          const name = html.find("[name=name]").val();
          const description = html.find("[name=description]").val();

          await GVM.createGvmItem(actor, name, {
            kind: GVM.KIND.BONUS,
            source: html.find("[name=source]").val(),
            active: false,
            remaining: 0,
            duration: Math.max(1, Number(html.find("[name=duration]").val()) || 1),
            cost: costValue ? [{ stat: html.find("[name=c_stat]").val(), value: costValue }] : [],
            effects: effectValue ? [{ stat: html.find("[name=e_stat]").val(), value: effectValue, timing: "passive" }] : [],
            description
          }, { description });

          GVM.queueRefresh(actor);
        }
      },
      cancel: {
        label: "Отмена"
      }
    },
    width: 620
  }).render(true);
};
