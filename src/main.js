const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const si = require("systeminformation");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    title: "KAR SECURE",
    backgroundColor: "#090d18",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

ipcMain.handle("kar:system", async () => {
  const results = await Promise.allSettled([
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.cpuTemperature(),
    si.currentLoad(),
    si.time()
  ]);

  const value = (index, fallback = {}) =>
    results[index].status === "fulfilled"
      ? results[index].value
      : fallback;

  const osInfo = value(0);
  const cpu = value(1);
  const memory = value(2);
  const graphics = value(3, { controllers: [] });
  const temperature = value(4, { main: -1 });
  const load = value(5, { currentLoad: 0 });
  const time = value(6);

  return {
    computerName: os.hostname(),
    platform: osInfo.platform || process.platform,
    distro: osInfo.distro || "Windows",
    release: osInfo.release || "",
    arch: osInfo.arch || process.arch,
    manufacturer: osInfo.manufacturer || "",
    model: osInfo.model || "",
    uptimeSeconds: os.uptime(),
    cpu: {
      manufacturer: cpu.manufacturer || "",
      brand: cpu.brand || "Non detecte",
      cores: cpu.cores || 0,
      physicalCores: cpu.physicalCores || 0,
      speed: cpu.speed || 0
    },
    memory: {
      total: memory.total || 0,
      free: memory.free || 0,
      used: memory.active || 0
    },
    graphics: (graphics.controllers || []).map(gpu => ({
      vendor: gpu.vendor || "",
      model: gpu.model || "Carte graphique",
      vram: gpu.vram || 0,
      driverVersion: gpu.driverVersion || ""
    })),
    temperature: temperature.main ?? -1,
    cpuLoad: load.currentLoad || 0,
    collectedAt: time.current || new Date().toISOString()
  };
});

ipcMain.handle("kar:drivers", async () => {
  const command =
    "Get-CimInstance Win32_PnPSignedDriver | " +
    "Select-Object DeviceName,DriverVersion,DriverDate,Manufacturer,DeviceClass | " +
    "ConvertTo-Json -Depth 3";

  const output = await runPowerShell(command);

  try {
    const parsed = JSON.parse(output.trim() || "[]");
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error("Impossible de lire la liste des pilotes.");
  }
});

ipcMain.handle("kar:save-report", async (_event, report) => {
  if (!report || typeof report !== "object") {
    throw new Error("Rapport invalide.");
  }

  const documents = app.getPath("documents");
  const directory = path.join(documents, "KAR-SECURE-Reports");
  fs.mkdirSync(directory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(directory, `KAR-SECURE-${timestamp}.json`);

  fs.writeFileSync(destination, JSON.stringify(report, null, 2), "utf8");
  return destination;
});

ipcMain.handle("kar:balanced-power", async () => {
  await runPowerShell(
    "powercfg.exe /setactive SCHEME_BALANCED"
  );
  return "Le mode d'alimentation Equilibre a ete demande.";
});

ipcMain.handle("kar:open-page", async (_event, page) => {
  const pages = {
    update: "ms-settings:windowsupdate",
    security: "windowsdefender:",
    power: "ms-settings:powersleep"
  };

  if (!Object.prototype.hasOwnProperty.call(pages, page)) {
    throw new Error("Page Windows non autorisee.");
  }

  await shell.openExternal(pages[page]);
  return true;
});
