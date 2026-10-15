const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("karSecure", {
  getSystem: () => ipcRenderer.invoke("kar:system"),
  getDrivers: () => ipcRenderer.invoke("kar:drivers"),
  saveReport: report => ipcRenderer.invoke("kar:save-report", report),
  balancedPower: () => ipcRenderer.invoke("kar:balanced-power"),
  openPage: page => ipcRenderer.invoke("kar:open-page", page)
});
