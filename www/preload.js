const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    RequestPlayerInfo: () => ipcRenderer.send("ipc-request-player-info"),
    RequestDapai: (arg) => ipcRenderer.send("ipc-request-dapai", arg),
    SendSSTP: (arg) => ipcRenderer.send("ipc-SSTP-send", arg),
    ReceivePlayerInfo: (listener) => {
      ipcRenderer.on("ipc-receive-player-info", (event, arg) => listener(arg));
    },
    ReceiveDapai: (listener) => {
      ipcRenderer.on("ipc-receive-dapai", (event, arg) => listener(arg));
    }
  }
);
