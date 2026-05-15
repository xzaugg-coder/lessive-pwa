(function () {
  "use strict";

  const STORAGE_PREFIX = "lessive-";
  const DEFAULT_MIN_YEAR = 2000;
  const DEFAULT_MAX_YEAR = 2100;

  const state = {
    year: new Date().getFullYear(),
    entries: []
  };

  const elements = {
    appTitle: document.getElementById("appTitle"),
    yearInput: document.getElementById("yearInput"),
    addRowBtn: document.getElementById("addRowBtn"),
    printBtn: document.getElementById("printBtn"),
    backupBtn: document.getElementById("backupBtn"),
    restoreBtn: document.getElementById("restoreBtn"),
    quitBtn: document.getElementById("quitBtn"),
    restoreInput: document.getElementById("restoreInput"),
    saveStatus: document.getElementById("saveStatus"),
    entriesBody: document.getElementById("entriesBody"),
    emptyState: document.getElementById("emptyState"),
    totalWash: document.getElementById("totalWash"),
    totalDry: document.getElementById("totalDry"),
    totalAll: document.getElementById("totalAll"),
    printTitle: document.getElementById("printTitle"),
    printBody: document.getElementById("printBody"),
    printTotalWash: document.getElementById("printTotalWash"),
    printTotalDry: document.getElementById("printTotalDry"),
    printTotalAll: document.getElementById("printTotalAll"),
    actionModal: document.getElementById("actionModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalMessage: document.getElementById("modalMessage"),
    modalCancelBtn: document.getElementById("modalCancelBtn"),
    modalConfirmBtn: document.getElementById("modalConfirmBtn")
  };

  let modalConfirmHandler = null;

  function init() {
    elements.yearInput.value = String(state.year);
    loadYear(state.year);
    bindEvents();
    registerServiceWorker();
  }

  function bindEvents() {
    elements.yearInput.addEventListener("change", handleYearChange);
    elements.yearInput.addEventListener("blur", handleYearChange);
    elements.addRowBtn.addEventListener("click", addEntry);
    elements.printBtn.addEventListener("click", printPdf);
    elements.backupBtn.addEventListener("click", exportBackup);
    elements.restoreBtn.addEventListener("click", confirmRestorePicker);
    elements.quitBtn.addEventListener("click", quitApp);
    elements.restoreInput.addEventListener("change", handleRestoreFile);
    elements.modalCancelBtn.addEventListener("click", hideActionModal);
    elements.actionModal.addEventListener("click", (event) => {
      if (event.target === elements.actionModal) {
        hideActionModal();
      }
    });
    elements.modalConfirmBtn.addEventListener("click", () => {
      if (typeof modalConfirmHandler === "function") {
        modalConfirmHandler();
      }
    });
  }

  function handleYearChange() {
    const nextYear = clampNumber(elements.yearInput.value, DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR);

    elements.yearInput.value = String(nextYear);
    if (nextYear === state.year) {
      return;
    }

    state.year = nextYear;
    loadYear(nextYear);
  }

  function loadYear(year) {
    const rawData = localStorage.getItem(storageKey(year));
    state.entries = parseEntries(rawData);
    updateTitle();
    render();
  }

  function parseEntries(rawData) {
    if (!rawData) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalizeEntry).filter(Boolean);
    } catch (error) {
      console.warn("Impossible de lire les donnees locales.", error);
      return [];
    }
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    return {
      id: String(entry.id || createId()),
      date: isValidDateValue(entry.date) ? entry.date : getTodayValue(),
      washes: clampNumber(entry.washes, 0, 999),
      dries: clampNumber(entry.dries, 0, 999)
    };
  }

  function save() {
    localStorage.setItem(storageKey(state.year), JSON.stringify(state.entries));
    setSaveStatus("Sauvegarde effectuee");
  }

  function setSaveStatus(message) {
    elements.saveStatus.textContent = message;

    window.clearTimeout(setSaveStatus.timer);
    setSaveStatus.timer = window.setTimeout(() => {
      elements.saveStatus.textContent = "Sauvegarde locale active";
    }, 1600);
  }

  function addEntry() {
    state.entries.push({
      id: createId(),
      date: getTodayValue(),
      washes: 0,
      dries: 0
    });

    sortEntries();
    save();
    render();
  }

  function updateEntry(id, patch) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) {
      return;
    }

    Object.assign(entry, patch);
    sortEntries();
    save();
    render();
  }

  function deleteEntry(id) {
    state.entries = state.entries.filter((item) => item.id !== id);
    save();
    render();
  }

  function sortEntries() {
    state.entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  function render() {
    elements.entriesBody.innerHTML = "";
    elements.emptyState.hidden = state.entries.length > 0;

    state.entries.forEach((entry) => {
      elements.entriesBody.appendChild(createRow(entry));
    });

    renderTotals();
    renderPrintView();
  }

  function createRow(entry) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.className = "date-input";
    dateInput.type = "date";
    dateInput.value = entry.date;
    dateInput.addEventListener("change", () => {
      updateEntry(entry.id, { date: dateInput.value || getTodayValue() });
    });
    dateCell.appendChild(dateInput);

    const washCell = document.createElement("td");
    washCell.appendChild(createCounter(entry, "washes"));

    const dryCell = document.createElement("td");
    dryCell.appendChild(createCounter(entry, "dries"));

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => confirmDelete(entry.id));
    actionCell.appendChild(deleteButton);

    row.append(dateCell, washCell, dryCell, actionCell);
    return row;
  }

  function createCounter(entry, field) {
    const wrapper = document.createElement("div");
    wrapper.className = "counter";

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.textContent = "-";
    minusButton.setAttribute("aria-label", "Diminuer");
    minusButton.addEventListener("click", () => {
      updateEntry(entry.id, { [field]: Math.max(0, entry[field] - 1) });
    });

    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "0";
    input.max = "999";
    input.step = "1";
    input.value = String(entry[field]);
    input.setAttribute("aria-label", field === "washes" ? "Nombre de lavages" : "Nombre de sechages");
    input.addEventListener("change", () => {
      updateEntry(entry.id, { [field]: clampNumber(input.value, 0, 999) });
    });

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", "Augmenter");
    plusButton.addEventListener("click", () => {
      updateEntry(entry.id, { [field]: Math.min(999, entry[field] + 1) });
    });

    wrapper.append(minusButton, input, plusButton);
    return wrapper;
  }

  function renderTotals() {
    const totals = getTotals();
    elements.totalWash.textContent = String(totals.washes);
    elements.totalDry.textContent = String(totals.dries);
    elements.totalAll.textContent = String(totals.all);
  }

  function renderPrintView() {
    const totals = getTotals();

    elements.printTitle.textContent = `Tableau des lessives ${state.year}`;
    elements.printBody.innerHTML = "";

    state.entries.forEach((entry) => {
      const row = document.createElement("tr");
      row.append(
        createPrintCell(formatDate(entry.date)),
        createPrintCell(String(entry.washes)),
        createPrintCell(String(entry.dries))
      );
      elements.printBody.appendChild(row);
    });

    elements.printTotalWash.textContent = String(totals.washes);
    elements.printTotalDry.textContent = String(totals.dries);
    elements.printTotalAll.textContent = String(totals.all);
  }

  function createPrintCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function getTotals() {
    return state.entries.reduce(
      (totals, entry) => {
        totals.washes += entry.washes;
        totals.dries += entry.dries;
        totals.all = totals.washes + totals.dries;
        return totals;
      },
      { washes: 0, dries: 0, all: 0 }
    );
  }

  function updateTitle() {
    const title = `Lessive ${state.year}`;
    document.title = `Lessive_${state.year}`;
    elements.appTitle.textContent = title;
  }

  function printPdf() {
    renderPrintView();
    document.title = `Lessive_${state.year}`;
    window.print();
  }

  function quitApp() {
    window.close();

    window.setTimeout(() => {
      setSaveStatus("Vous pouvez fermer l'application avec le bouton retour ou accueil de la tablette.");
    }, 300);
  }

  function confirmDelete(id) {
    showActionModal({
      title: "Supprimer la ligne",
      message: "Supprimer cette ligne de lessive ?",
      confirmText: "Supprimer",
      danger: true,
      onConfirm: () => {
        hideActionModal();
        deleteEntry(id);
      }
    });
  }

  function confirmRestorePicker() {
    showActionModal({
      title: "Restaurer une sauvegarde",
      message: "Choisissez un fichier JSON exporte auparavant. Vous pourrez encore annuler avant de remplacer les donnees.",
      confirmText: "Choisir un fichier",
      danger: false,
      onConfirm: () => {
        hideActionModal();
        elements.restoreInput.click();
      }
    });
  }

  function showActionModal(options) {
    elements.modalTitle.textContent = options.title;
    elements.modalMessage.textContent = options.message;
    elements.modalConfirmBtn.textContent = options.confirmText;
    elements.modalConfirmBtn.className = options.danger ? "danger-button" : "primary-button";
    modalConfirmHandler = options.onConfirm;
    elements.actionModal.hidden = false;
    elements.modalCancelBtn.focus();
  }

  function hideActionModal() {
    elements.actionModal.hidden = true;
    modalConfirmHandler = null;
    elements.modalConfirmBtn.className = "primary-button";
  }

  function exportBackup() {
    const backup = {
      app: "lessive-pwa",
      version: 1,
      exportedAt: new Date().toISOString(),
      years: getAllSavedYears()
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getBackupFileName(backup.years);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setSaveStatus("Sauvegarde JSON exportee");
  }

  function getAllSavedYears() {
    const years = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(STORAGE_PREFIX)) {
        continue;
      }

      const year = key.slice(STORAGE_PREFIX.length);
      if (!/^\d{4}$/.test(year)) {
        continue;
      }

      years[year] = parseEntries(localStorage.getItem(key));
    }

    return years;
  }

  function getBackupFileName(years) {
    const savedYears = Object.keys(years).sort();

    if (savedYears.length === 1) {
      return `Sauvegarde_lessives_${savedYears[0]}.json`;
    }

    return "Sauvegarde_lessives_complete.json";
  }

  function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => restoreBackup(reader.result));
    reader.addEventListener("error", () => {
      window.alert("Impossible de lire ce fichier de sauvegarde.");
    });
    reader.readAsText(file);

    // Permet de rechoisir le meme fichier plus tard.
    event.target.value = "";
  }

  function restoreBackup(rawData) {
    let backup;

    try {
      backup = JSON.parse(rawData);
    } catch (error) {
      window.alert("Ce fichier JSON n'est pas valide.");
      return;
    }

    const years = normalizeBackupYears(backup);
    const yearKeys = Object.keys(years).sort();

    if (yearKeys.length === 0) {
      window.alert("Aucune donnee de lessive valide n'a ete trouvee dans ce fichier.");
      return;
    }

    const confirmed = window.confirm(
      `Restaurer cette sauvegarde va remplacer les donnees existantes pour ${yearKeys.length} annee(s) : ${yearKeys.join(", ")}. Continuer ?`
    );

    if (!confirmed) {
      return;
    }

    yearKeys.forEach((year) => {
      localStorage.setItem(storageKey(year), JSON.stringify(years[year]));
    });

    loadYear(state.year);
    setSaveStatus("Sauvegarde restauree");
  }

  function normalizeBackupYears(backup) {
    const years = {};

    if (!backup || typeof backup !== "object" || !backup.years || typeof backup.years !== "object") {
      return years;
    }

    Object.keys(backup.years).forEach((year) => {
      if (!/^\d{4}$/.test(year) || !Array.isArray(backup.years[year])) {
        return;
      }

      years[year] = backup.years[year].map(normalizeEntry).filter(Boolean);
    });

    return years;
  }

  function storageKey(year) {
    return `${STORAGE_PREFIX}${year}`;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clampNumber(value, min, max) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
      return min;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  function getTodayValue() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function isValidDateValue(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function formatDate(value) {
    if (!isValidDateValue(value)) {
      return "";
    }

    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((error) => {
        console.warn("Service worker non enregistre.", error);
      });
    });
  }

  init();
})();
