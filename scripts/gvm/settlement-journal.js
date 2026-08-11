GVM.getJournal = function getJournal(actor) {
  const settings = GVM.getSettings(actor);
  return Array.isArray(settings.journal) ? settings.journal : [];
};

GVM.setJournal = async function setJournal(actor, journal) {
  const settings = GVM.getSettings(actor);
  settings.journal = journal.slice(0, 14);
  await GVM.setSettings(actor, settings);
};

GVM.addJournalEntry = async function addJournalEntry(actor, entry) {
  const settings = GVM.getSettings(actor);
  const journal = Array.isArray(settings.journal) ? settings.journal : [];

  const normalized = {
    cycle: Number(settings.cycle || 0),
    type: entry.type || "note",
    title: entry.title || "Событие поселения",
    entries: Array.isArray(entry.entries) ? entry.entries : [],
    changes: entry.changes || {},
    time: Date.now()
  };

  journal.unshift(normalized);
  settings.journal = journal.slice(0, 14);

  await GVM.setSettings(actor, settings);
};

GVM.journalBuilding = async function journalBuilding(actor, title, entries = [], changes = {}) {
  await GVM.addJournalEntry(actor, {
    type: "building",
    title,
    entries,
    changes
  });
};

GVM.journalOrder = async function journalOrder(actor, title, entries = [], changes = {}) {
  await GVM.addJournalEntry(actor, {
    type: "order",
    title,
    entries,
    changes
  });
};

GVM.journalMigration = async function journalMigration(actor, migration) {
  const entries = [];

  if (migration > 0) entries.push(`Пришло ${migration} новых жителей.`);
  else if (migration < 0) entries.push(`Ушло ${Math.abs(migration)} жителей.`);
  else entries.push("Численность населения не изменилась.");

  await GVM.addJournalEntry(actor, {
    type: "migration",
    title: "Миграция жителей",
    entries,
    changes: {
      population: migration
    }
  });
};

GVM.journalAttack = async function journalAttack(actor, title, entries = [], changes = {}) {
  await GVM.addJournalEntry(actor, {
    type: "attack",
    title,
    entries,
    changes
  });
};
