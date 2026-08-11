GVM.readCssVar = function readCssVar(element, name) {
  try {
    return getComputedStyle(element).getPropertyValue(name).trim();
  } catch (err) {
    return "";
  }
};

GVM.cssColorToRgb = function cssColorToRgb(value) {
  if (!value || String(value).includes("var(")) return null;

  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);

  const computed = getComputedStyle(probe).color;
  probe.remove();

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    css: computed
  };
};

GVM.colorLuminance = function colorLuminance(rgb) {
  const convert = value => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * convert(rgb.r) + 0.7152 * convert(rgb.g) + 0.0722 * convert(rgb.b);
};

GVM.colorSaturation = function colorSaturation(rgb) {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  if (max === 0) return 0;
  return (max - min) / max;
};

GVM.isUsableAccentColor = function isUsableAccentColor(name, value) {
  if (!value) return false;
  if (value.includes("var(")) return false;
  if (value === "initial" || value === "inherit" || value === "unset") return false;

  const rejectNames = new Set([
    "--dnd5e-color-card",
    "--dnd5e-color-parchment"
  ]);

  if (rejectNames.has(name)) return false;

  const rgb = GVM.cssColorToRgb(value);
  if (!rgb) return false;

  const lum = GVM.colorLuminance(rgb);
  const sat = GVM.colorSaturation(rgb);

  if (lum > 0.82) return false;
  if (lum < 0.03) return false;
  if (sat < 0.18 && !name.includes("gold")) return false;

  return true;
};

GVM.findThemeSourceElements = function findThemeSourceElements(panel) {
  const sources = [
    panel?.closest?.(".dnd5e2.sheet.actor"),
    panel?.closest?.(".dnd5e.sheet.actor"),
    panel?.closest?.(".sheet.actor"),
    panel?.closest?.(".application.sheet.actor"),
    document.querySelector(".dnd5e2.sheet.actor"),
    document.querySelector(".dnd5e.sheet.actor"),
    document.querySelector(".sheet.actor"),
    document.documentElement,
    document.body
  ].filter(Boolean);

  return [...new Set(sources)].filter(element => element instanceof HTMLElement);
};

GVM.pickThemeAccent = function pickThemeAccent(panel) {
  const names = [
    "--color-warm-2",
    "--dnd5e-color-red",
    "--dnd5e-color-gold",
    "--color-warm-1",
    "--color-text-hyperlink",
    "--dnd5e-color-blue",
    "--color-cool-3"
  ];

  const sources = GVM.findThemeSourceElements(panel);

  for (const source of sources) {
    for (const name of names) {
      const value = GVM.readCssVar(source, name);
      if (GVM.isUsableAccentColor(name, value)) {
        return {
          name,
          value
        };
      }
    }
  }

  return {
    name: "fallback",
    value: "#c9593f"
  };
};

GVM.syncThemeAccent = function syncThemeAccent(panel) {
  if (!panel) return "#c9593f";

  const chosen = GVM.pickThemeAccent(panel);
  const accent = chosen.value || "#c9593f";

  panel.style.setProperty("--gvm-accent", accent);
  panel.style.setProperty("--gvm-theme-source", `"${chosen.name}"`);

  return accent;
};
