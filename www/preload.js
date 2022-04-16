const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    RequestPlayerInfo: () => ipcRenderer.send("ipc-get-player-info"),
    SendSSTP: (arg) => ipcRenderer.send("ipc-SSTP-send", arg),
    ReceivePlayerInfo: (listener) => {
      ipcRenderer.on("ipc-receive-player-info", (event, arg) => listener(arg));
    }
  }
);
