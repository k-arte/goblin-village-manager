GVM.closeInlineDrawers = function closeInlineDrawers(root = document) {
  root.querySelectorAll(".gvm-inline-drawer").forEach(element => element.remove());
  root.querySelectorAll(".gvm-facility-card.expanded, .gvm-management-card.expanded").forEach(element => {
    element.classList.remove("expanded");
  });
};

GVM.drawerButton = function drawerButton(label, control, options = {}) {
  const cls = options.cls || "secondary";
  const icon = options.icon || "fas fa-circle";
  const extra = options.extra || "";

  return `
    <button type="button" class="gvm-drawer-button ${GVM.escapeHtml(cls)}" data-gvm-drawer-control="${GVM.escapeHtml(control)}" ${extra}>
      <i class="${GVM.escapeHtml(icon)}"></i>
      <span>${GVM.escapeHtml(label)}</span>
    </button>
  `;
};

GVM.drawerServiceButton = function drawerServiceButton(service) {
  const source = service.source?.residentName
    ? service.source.residentName
    : service.source?.buildingName || "Источник";

  const cost = service.cost?.value
    ? `${GVM.STAT_LABELS[service.cost.stat] || service.cost.stat} ${service.cost.value}`
    : "бесплатно";

  return `
    <button type="button" class="gvm-drawer-service" data-gvm-service-id="${GVM.escapeHtml(service.id || service.label)}">
      <span class="title">${GVM.escapeHtml(service.label || "Услуга")}</span>
      <span class="meta">${GVM.escapeHtml(source)} · ${GVM.escapeHtml(service.orderType || "instant")} · ${GVM.escapeHtml(cost)}</span>
    </button>
  `;
};

GVM.renderInlineDrawer = function renderInlineDrawer(actor, item) {
  const data = GVM.gvmData(item);
  const isBuilding = data.kind === GVM.KIND.BUILDING;

  const services = isBuilding && GVM.getAvailableActionsForBuilding
    ? GVM.getAvailableActionsForBuilding(actor, item)
    : [];

  const minorOrders = isBuilding && GVM.getBuildingMinorOrders
    ? GVM.getBuildingMinorOrders(item)
    : [];

  const minorCapacity = isBuilding && GVM.getMinorOrderCapacity
    ? GVM.getMinorOrderCapacity(item)
    : 0;

  return `
    <section class="gvm-inline-drawer" data-gvm-drawer-item-id="${GVM.escapeHtml(item.id)}">
      <div class="gvm-drawer-grid">
        ${isBuilding ? `
          <section class="gvm-drawer-group">
            <h4>Основные</h4>
            ${GVM.drawerButton(Number(data.level || 0) === 0 ? "Построить" : "Расширить", "upgrade", { cls: "primary", icon: "fas fa-hammer" })}
            ${GVM.drawerButton("Рабочие", "workers", { cls: "secondary", icon: "fas fa-users" })}
            ${data.status === "damaged" || data.status === "destroyed" ? GVM.drawerButton("Починить", "repair", { cls: "primary", icon: "fas fa-wrench" }) : ""}
          </section>

          <section class="gvm-drawer-group">
            <h4>Малые приказы ${minorOrders.length}/${minorCapacity}</h4>
            ${minorOrders.length ? minorOrders.map(order => `
              <div class="gvm-drawer-minor-order">
                <span>${GVM.escapeHtml(order.label)}</span>
                <small>${Number(order.progress || 0)}/${Number(order.duration || 1)}</small>
              </div>
            `).join("") : `<p class="gvm-drawer-empty">Активных малых приказов нет.</p>`}
          </section>

          <section class="gvm-drawer-group">
            <h4>Услуги и бонусы</h4>
            ${services.length ? services.map(GVM.drawerServiceButton).join("") : `<p class="gvm-drawer-empty">Доступных услуг нет.</p>`}
          </section>
        ` : ""}

        <section class="gvm-drawer-group">
          <h4>Управление</h4>
          ${isBuilding ? GVM.drawerButton("Создать способность", "create-ability", { cls: "primary", icon: "fas fa-plus" }) : ""}
          ${GVM.drawerButton("Настроить", "configure", { cls: "secondary", icon: "fas fa-cog" })}
          ${GVM.drawerButton("Item Sheet", "sheet", { cls: "secondary", icon: "fas fa-scroll" })}
          ${data.kind !== GVM.KIND.BUILDING ? GVM.drawerButton("Удалить", "delete-item", { cls: "danger", icon: "fas fa-trash" }) : ""}
        </section>

        ${isBuilding ? `
          <section class="gvm-drawer-group danger-zone">
            <h4>Опасное</h4>
            ${GVM.drawerButton("Снести", "demolish", { cls: "danger", icon: "fas fa-trash" })}
          </section>
        ` : ""}
      </div>
    </section>
  `;
};

GVM.toggleInlineActionDrawer = function toggleInlineActionDrawer(actor, item, card) {
  if (!card) return;

  const existing = card.querySelector(".gvm-inline-drawer");
  const root = card.closest(".gvm-bastion-board") || document;

  if (existing) {
    existing.remove();
    card.classList.remove("expanded");
    return;
  }

  GVM.closeInlineDrawers(root);

  card.classList.add("expanded");
  card.insertAdjacentHTML("beforeend", GVM.renderInlineDrawer(actor, item));

  const drawer = card.querySelector(".gvm-inline-drawer");
  if (!drawer) return;

  GVM.syncThemeAccent(drawer);

  drawer.addEventListener("click", async event => {
    const control = event.target.closest("[data-gvm-drawer-control]")?.dataset?.gvmDrawerControl;
    const serviceButton = event.target.closest("[data-gvm-service-id]");

    if (serviceButton) {
      event.preventDefault();
      event.stopPropagation();

      if (GVM.executeBuildingService) {
        await GVM.executeBuildingService(actor, item, serviceButton.dataset.gvmServiceId);
      }

      GVM.queueRefresh(actor);
      return;
    }

    if (!control) return;

    event.preventDefault();
    event.stopPropagation();

    if (control === "upgrade") GVM.upgradeBuilding(actor, item);
    else if (control === "workers") GVM.assignWorkers(actor, item);
    else if (control === "create-ability") GVM.openAbilityBuilder(actor, { sourceType: "building", item });
    else if (control === "configure") GVM.openConfigForItem(actor, item);
    else if (control === "sheet") item.sheet?.render(true);
    else if (control === "demolish") GVM.startDemolishBuildingOrder ? GVM.startDemolishBuildingOrder(actor, item) : GVM.confirmDemolishBuilding(actor, item);
    else if (control === "repair") {
      if (GVM.startRepairBuildingOrder) await GVM.startRepairBuildingOrder(actor, item);
      else ui.notifications.warn("Приказ починки будет добавлен на следующем этапе v0.7.");
    }
    else if (control === "delete-item") GVM.confirmDeleteGvmItem(actor, item);
  });
};

GVM.openActionPopover = function openActionPopover(actor, item, anchor = null) {
  const card = anchor?.closest?.(".gvm-facility-card, .gvm-management-card") || anchor;
  if (card) return GVM.toggleInlineActionDrawer(actor, item, card);

  return GVM.itemActionDialog?.(actor, item);
};

GVM.itemActionDialog = function itemActionDialogInlineDrawer(actor, item, anchor = null) {
  const card = anchor?.closest?.(".gvm-facility-card, .gvm-management-card") || anchor;
  if (card) return GVM.toggleInlineActionDrawer(actor, item, card);

  if (item?.sheet) item.sheet.render(true);
};
