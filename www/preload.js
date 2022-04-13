const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    SendSSTP: (arg) => ipcRenderer.send("ipc-SSTP-send", arg),
    GetPlayerNames: (listener) => {
      ipcRenderer.on("ipc-get-player-names", (event, arg) => listener(arg));
    }
  }
);
