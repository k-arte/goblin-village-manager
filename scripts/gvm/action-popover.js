GVM.closeActionPopover = function closeActionPopover() {
  document.querySelectorAll(".gvm-action-popover").forEach(element => element.remove());
};

GVM.renderActionPopoverButton = function renderActionPopoverButton(label, control, options = {}) {
  const cls = options.cls || "secondary";
  const icon = options.icon || "fas fa-circle";
  const data = options.data || "";

  return `
    <button type="button" class="gvm-popover-button ${GVM.escapeHtml(cls)}" data-gvm-popover-control="${GVM.escapeHtml(control)}" ${data}>
      <i class="${GVM.escapeHtml(icon)}"></i>
      <span>${GVM.escapeHtml(label)}</span>
    </button>
  `;
};

GVM.renderServiceButton = function renderServiceButton(service) {
  const source = service.source?.residentName
    ? service.source.residentName
    : service.source?.buildingName || "Источник";

  const cost = service.cost?.value
    ? `${GVM.STAT_LABELS[service.cost.stat] || service.cost.stat} ${service.cost.value}`
    : "бесплатно";

  return `
    <button type="button" class="gvm-popover-service" data-gvm-service-id="${GVM.escapeHtml(service.id || service.label)}">
      <span class="title">${GVM.escapeHtml(service.label || "Услуга")}</span>
      <span class="meta">${GVM.escapeHtml(source)} · ${GVM.escapeHtml(service.orderType || "instant")} · ${GVM.escapeHtml(cost)}</span>
    </button>
  `;
};

GVM.openActionPopover = function openActionPopover(actor, item, anchor = null) {
  GVM.closeActionPopover();

  const data = GVM.gvmData(item);
  const services = data.kind === GVM.KIND.BUILDING
    ? GVM.getAvailableActionsForBuilding(actor, item)
    : [];

  const minorOrders = data.kind === GVM.KIND.BUILDING && GVM.getBuildingMinorOrders
    ? GVM.getBuildingMinorOrders(item)
    : [];

  const capacity = data.kind === GVM.KIND.BUILDING && GVM.getMinorOrderCapacity
    ? GVM.getMinorOrderCapacity(item)
    : 0;

  const popover = document.createElement("section");
  popover.className = "gvm-action-popover";
  popover.dataset.itemId = item.id;

  popover.innerHTML = `
    <header class="gvm-popover-header">
      <div>
        <h3>${GVM.escapeHtml(item.name)}</h3>
        <p>${GVM.escapeHtml(data.kind || "item")}</p>
      </div>
      <button type="button" class="gvm-popover-close" data-gvm-popover-control="close">×</button>
    </header>

    ${data.kind === GVM.KIND.BUILDING ? `
      <section class="gvm-popover-group">
        <h4>Основные</h4>
        ${GVM.renderActionPopoverButton(Number(data.level || 0) === 0 ? "Построить" : "Расширить", "upgrade", { cls: "primary", icon: "fas fa-hammer" })}
        ${GVM.renderActionPopoverButton("Рабочие", "workers", { cls: "secondary", icon: "fas fa-users" })}
      </section>

      <section class="gvm-popover-group">
        <h4>Малые приказы ${minorOrders.length}/${capacity}</h4>
        ${minorOrders.length ? minorOrders.map(order => `
          <div class="gvm-popover-minor-order">
            <span>${GVM.escapeHtml(order.label)}</span>
            <small>${Number(order.progress || 0)}/${Number(order.duration || 1)}</small>
          </div>
        `).join("") : `<p class="gvm-popover-empty">Активных малых приказов нет.</p>`}
      </section>

      <section class="gvm-popover-group">
        <h4>Услуги и бонусы</h4>
        ${services.length ? services.map(GVM.renderServiceButton).join("") : `<p class="gvm-popover-empty">Доступных услуг нет.</p>`}
      </section>

      <section class="gvm-popover-group">
        <h4>Управление</h4>
        ${GVM.renderActionPopoverButton("Настроить", "configure", { cls: "secondary", icon: "fas fa-cog" })}
        ${GVM.renderActionPopoverButton("Item Sheet", "sheet", { cls: "secondary", icon: "fas fa-scroll" })}
      </section>

      <section class="gvm-popover-group danger-zone">
        <h4>Опасное</h4>
        ${GVM.renderActionPopoverButton("Снести", "demolish", { cls: "danger", icon: "fas fa-trash" })}
      </section>
    ` : `
      <section class="gvm-popover-group">
        <h4>Item</h4>
        ${GVM.renderActionPopoverButton("Настроить", "configure", { cls: "secondary", icon: "fas fa-cog" })}
        ${GVM.renderActionPopoverButton("Item Sheet", "sheet", { cls: "secondary", icon: "fas fa-scroll" })}
      </section>
    `}
  `;

  document.body.appendChild(popover);

  const rect = anchor?.getBoundingClientRect?.();
  const width = 340;
  const gap = 8;

  let left = rect ? rect.left : window.innerWidth / 2 - width / 2;
  let top = rect ? rect.bottom + gap : window.innerHeight / 2 - 200;

  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  top = Math.max(12, Math.min(top, window.innerHeight - 80));

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.style.width = `${width}px`;

  GVM.syncThemeAccent(popover);

  popover.addEventListener("click", async event => {
    const control = event.target.closest("[data-gvm-popover-control]")?.dataset?.gvmPopoverControl;
    const serviceButton = event.target.closest("[data-gvm-service-id]");

    if (serviceButton) {
      event.preventDefault();
      event.stopPropagation();
      await GVM.executeBuildingService(actor, item, serviceButton.dataset.gvmServiceId);
      GVM.closeActionPopover();
      return;
    }

    if (!control) return;

    event.preventDefault();
    event.stopPropagation();

    if (control === "close") {
      GVM.closeActionPopover();
    } else if (control === "upgrade") {
      GVM.closeActionPopover();
      GVM.upgradeBuilding(actor, item);
    } else if (control === "workers") {
      GVM.closeActionPopover();
      GVM.assignWorkers(actor, item);
    } else if (control === "configure") {
      GVM.closeActionPopover();
      GVM.openConfigForItem(actor, item);
    } else if (control === "sheet") {
      GVM.closeActionPopover();
      item.sheet?.render(true);
    } else if (control === "demolish") {
      GVM.closeActionPopover();
      GVM.confirmDemolishBuilding(actor, item);
    }
  });

  const closeOnOutside = event => {
    if (!popover.contains(event.target)) {
      GVM.closeActionPopover();
      document.removeEventListener("mousedown", closeOnOutside);
    }
  };

  setTimeout(() => document.addEventListener("mousedown", closeOnOutside), 50);
};

GVM.itemActionDialog = function itemActionPopoverShim(actor, item, anchor = null) {
  GVM.openActionPopover(actor, item, anchor);
};
