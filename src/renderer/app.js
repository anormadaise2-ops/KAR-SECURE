const $ = id => document.getElementById(id);
let latestReport = null;
let toastTimer;

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Indisponible";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function setProgress(id, value) {
  $(id).style.width = `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
}

function addDetail(container, label, value) {
  const item = document.createElement("div");
  item.className = "detail";
  const caption = document.createElement("span");
  caption.textContent = label;
  const content = document.createElement("strong");
  content.textContent = value == null || value === "" ? "Indisponible" : String(value);
  item.append(caption, content);
  container.appendChild(item);
}

async function scan() {
  $("scan").disabled = true;
  $("scan").textContent = "Analyse en cours...";
  try {
    const data = await window.karSecure.getSystem();
    latestReport = { product: "KAR SECURE", version: "1.0.0", generatedAt: new Date().toISOString(), system: data };

    $("cpu-name").textContent = data.cpu.brand || "Non detecte";
    $("cpu-detail").textContent = `${data.cpu.cores} coeurs logiques · ${data.cpu.physicalCores} physiques`;
    const total = data.memory.total || 0;
    const free = data.memory.free || 0;
    const used = Math.max(0, total - free);
    const ramPercent = total ? (used / total) * 100 : 0;
    $("ram-value").textContent = formatBytes(total);
    $("ram-detail").textContent = `${formatBytes(used)} utilises (estimation)`;
    setProgress("ram-progress", ramPercent);
    $("cpu-load").textContent = `${Number(data.cpuLoad).toFixed(1)} %`;
    setProgress("cpu-progress", data.cpuLoad);

    if (Number(data.temperature) >= 0) {
      $("cpu-temp").textContent = `${Number(data.temperature).toFixed(1)} °C`;
      $("temp-detail").textContent = "Valeur fournie par un capteur accessible";
    } else {
      $("cpu-temp").textContent = "N/D";
      $("temp-detail").textContent = "Capteur non disponible";
    }

    $("last-scan").textContent = `Mis a jour a ${new Date().toLocaleTimeString("fr-FR")}`;
    $("system-summary").textContent = `${data.computerName} · ${data.distro} ${data.release} · Architecture ${data.arch}. Les informations affichees dependent des capteurs accessibles.`;

    const details = $("hardware-details");
    details.replaceChildren();
    [
      ["Nom du PC", data.computerName],
      ["Systeme", `${data.distro} ${data.release}`],
      ["Fabricant", data.manufacturer],
      ["Modele", data.model],
      ["Architecture", data.arch],
      ["Vitesse CPU de base", `${data.cpu.speed} GHz`],
      ["RAM totale", formatBytes(total)],
      ["RAM libre", formatBytes(free)],
      ["Temps de fonctionnement", `${Math.floor(data.uptimeSeconds / 3600)} h ${Math.floor(data.uptimeSeconds % 3600 / 60)} min`]
    ].forEach(([label, value]) => addDetail(details, label, value));

    const gpuList = $("gpu-list");
    gpuList.replaceChildren();
    if (!data.graphics.length) {
      gpuList.textContent = "Aucune carte graphique detectee par l'interface.";
    } else {
      data.graphics.forEach(gpu => {
        const item = document.createElement("div");
        item.className = "gpu-item";
        const title = document.createElement("strong");
        title.textContent = gpu.model;
        const desc = document.createElement("p");
        desc.textContent = `${gpu.vendor || "Fabricant inconnu"} · VRAM : ${gpu.vram ? `${gpu.vram} Mo` : "N/D"} · Pilote : ${gpu.driverVersion || "N/D"}`;
        item.append(title, desc);
        gpuList.appendChild(item);
      });
    }
    notify("Diagnostic termine.");
  } catch (error) {
    notify(`Erreur de diagnostic : ${error.message}`);
  } finally {
    $("scan").disabled = false;
    $("scan").textContent = "Lancer le diagnostic →";
  }
}

async function loadDrivers() {
  const status = $("driver-status");
  const table = $("driver-table");
  status.textContent = "Lecture des pilotes Windows en cours...";
  $("load-drivers").disabled = true;
  try {
    const drivers = await window.karSecure.getDrivers();
    table.replaceChildren();
    drivers.forEach(driver => {
      const row = document.createElement("tr");
      [
        driver.DeviceName,
        driver.Manufacturer,
        driver.DriverVersion,
        driver.DriverDate
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value || "N/D";
        row.appendChild(cell);
      });
      table.appendChild(row);
    });
    if (!drivers.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "Aucun pilote retourne par Windows.";
      row.appendChild(cell);
      table.appendChild(row);
    }
    status.textContent = `${drivers.length} entree(s) de pilote chargee(s).`;
    if (latestReport) latestReport.drivers = drivers;
    notify("Inventaire des pilotes termine.");
  } catch (error) {
    status.textContent = `Erreur : ${error.message}`;
    notify("Impossible de charger les pilotes.");
  } finally {
    $("load-drivers").disabled = false;
  }
}

async function exportReport() {
  if (!latestReport) {
    notify("Lance d'abord un diagnostic.");
    return;
  }
  try {
    const destination = await window.karSecure.saveReport(latestReport);
    notify(`Rapport enregistre : ${destination}`);
  } catch (error) {
    notify(`Erreur d'export : ${error.message}`);
  }
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active-section"));
    button.classList.add("active");
    $(button.dataset.section).classList.add("active-section");
    $("page-title").textContent = button.textContent.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  });
});

$("scan").addEventListener("click", scan);
$("refresh").addEventListener("click", scan);
$("export").addEventListener("click", exportReport);
$("load-drivers").addEventListener("click", loadDrivers);
$("drivers-button").addEventListener("click", () => {
  document.querySelector('[data-section="drivers"]').click();
  loadDrivers();
});

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", async () => {
    try {
      await window.karSecure.openPage(button.dataset.page);
      notify("Ouverture des parametres Windows.");
    } catch (error) {
      notify(error.message);
    }
  });
});

$("balanced").addEventListener("click", async () => {
  try {
    const message = await window.karSecure.balancedPower();
    notify(message);
  } catch (error) {
    notify(`Action impossible : ${error.message}`);
  }
});

scan();
