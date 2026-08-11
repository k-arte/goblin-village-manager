GVM.openResidentConfig = function openResidentConfig(actor, residentId) {
  const resident = GVM.findResident(actor, residentId);

  if (!resident) {
    ui.notifications.warn("Ключевой житель не найден.");
    return;
  }

  const buildings = GVM.buildings(actor);
  const residentActor = GVM.getResidentActorSync(resident);
  const name = residentActor?.name || "Ключевой житель";

  const assignedOptions = [
    `<option value="">Не назначен</option>`,
    ...buildings.map(item => {
      const selected = item.id === resident.assignedBuildingId ? "selected" : "";
      return `<option value="${GVM.escapeHtml(item.id)}" ${selected}>${GVM.escapeHtml(item.name)}</option>`;
    })
  ].join("");

  new Dialog({
    title: `${name}: настройка ключевого жителя`,
    content: `
      <form class="gvm-resident-config-form">
        <section class="gvm-config-section">
          <h3>Основное</h3>

          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Profession ID</span>
              <input type="text" name="professionId" value="${GVM.escapeHtml(resident.professionId || "")}">
            </label>

            <label class="gvm-config-field">
              <span>Профессия</span>
              <input type="text" name="professionLabel" value="${GVM.escapeHtml(resident.professionLabel || "")}">
            </label>

            <label class="gvm-config-field">
              <span>Статус</span>
              <select name="status">
                <option value="available" ${resident.status === "available" ? "selected" : ""}>Доступен</option>
                <option value="assigned" ${resident.status === "assigned" ? "selected" : ""}>Назначен</option>
                <option value="injured" ${resident.status === "injured" ? "selected" : ""}>Ранен</option>
                <option value="absent" ${resident.status === "absent" ? "selected" : ""}>Отсутствует</option>
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Активен</span>
              <input type="checkbox" name="active" ${resident.active ? "checked" : ""}>
            </label>
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>Назначение</h3>

          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Здание</span>
              <select name="assignedBuildingId">
                ${assignedOptions}
              </select>
            </label>

            <label class="gvm-config-field">
              <span>Рабочих мест занимает</span>
              <input type="number" name="workerSlotsUsed" value="${Number(resident.workerSlotsUsed || 1)}">
            </label>
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>Зарплата</h3>

          <div class="gvm-config-grid">
            <label class="gvm-config-field">
              <span>Стат</span>
              <input type="text" name="salaryStat" value="${GVM.escapeHtml(resident.salary?.stat || "treasury")}">
            </label>

            <label class="gvm-config-field">
              <span>Значение за цикл</span>
              <input type="number" name="salaryValue" value="${Number(resident.salary?.value || 0)}">
            </label>
          </div>
        </section>

        <section class="gvm-config-section">
          <h3>Модификаторы</h3>
          <label class="gvm-config-field gvm-config-wide">
            <span>Один модификатор на строку</span>
            <small>Формат: label | target | stat | mode | value | timing</small>
            <textarea name="modifiers">${GVM.escapeHtml(GVM.residentModifierLines(resident.modifiers || []))}</textarea>
          </label>
        </section>

        <section class="gvm-config-section">
          <h3>Услуги</h3>
          <label class="gvm-config-field gvm-config-wide">
            <span>Одна услуга на строку</span>
            <small>Формат: label | costStat | costValue | orderType | description</small>
            <textarea name="services">${GVM.escapeHtml(GVM.residentServiceLines(resident.services || []))}</textarea>
          </label>
        </section>

        <section class="gvm-config-section">
          <h3>Заметки</h3>
          <label class="gvm-config-field gvm-config-wide">
            <textarea name="notes">${GVM.escapeHtml(resident.notes || "")}</textarea>
          </label>
        </section>
      </form>
    `,
    buttons: {
      save: {
        label: "Сохранить",
        callback: async html => {
          await GVM.saveResidentConfig(actor, resident.id, html);
        }
      }
    },
    width: 760
  }).render(true);
};

GVM.residentModifierLines = function residentModifierLines(modifiers) {
  return (modifiers || []).map(modifier => {
    return [
      modifier.label || "",
      modifier.target || "assignedBuilding",
      modifier.stat || "treasury",
      modifier.mode || "add",
      modifier.value ?? 0,
      modifier.timing || "perCycle"
    ].join(" | ");
  }).join("\n");
};

GVM.parseResidentModifierLines = function parseResidentModifierLines(value) {
  return String(value || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|").map(part => part.trim());
      return {
        id: foundry.utils.randomID(),
        label: parts[0] || "Модификатор",
        target: parts[1] || "assignedBuilding",
        stat: parts[2] || "treasury",
        mode: parts[3] || "add",
        value: Number(parts[4]) || 0,
        timing: parts[5] || "perCycle"
      };
    });
};

GVM.residentServiceLines = function residentServiceLines(services) {
  return (services || []).map(service => {
    return [
      service.label || "",
      service.cost?.stat || "treasury",
      service.cost?.value ?? 0,
      service.orderType || "instant",
      service.description || ""
    ].join(" | ");
  }).join("\n");
};

GVM.parseResidentServiceLines = function parseResidentServiceLines(value) {
  return String(value || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|").map(part => part.trim());
      return {
        id: foundry.utils.randomID(),
        label: parts[0] || "Услуга",
        source: {
          type: "resident"
        },
        cost: {
          stat: parts[1] || "treasury",
          value: Number(parts[2]) || 0
        },
        orderType: parts[3] || "instant",
        description: parts[4] || ""
      };
    });
};

GVM.saveResidentConfig = async function saveResidentConfig(actor, residentId, html) {
  const residents = GVM.getKeyResidents(actor);
  const resident = residents.find(item => item.id === residentId);

  if (!resident) {
    ui.notifications.warn("Ключевой житель не найден.");
    return;
  }

  const form = html.find("form.gvm-resident-config-form")[0];
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());

  resident.professionId = String(values.professionId || "").trim();
  resident.professionLabel = String(values.professionLabel || "").trim();
  resident.status = values.status || "available";
  resident.active = values.active === "on";
  resident.assignedBuildingId = values.assignedBuildingId || null;
  resident.workerSlotsUsed = Math.max(0, Number(values.workerSlotsUsed) || 1);

  const salaryValue = Number(values.salaryValue || 0);
  resident.salary = salaryValue
    ? {
        stat: values.salaryStat || "treasury",
        value: salaryValue,
        timing: "perCycle"
      }
    : null;

  resident.modifiers = GVM.parseResidentModifierLines(values.modifiers);
  resident.services = GVM.parseResidentServiceLines(values.services);
  resident.notes = values.notes || "";

  await GVM.setKeyResidents(actor, residents);

  ui.notifications.info("Ключевой житель сохранён.");
  GVM.refreshSettlement(actor);
};
