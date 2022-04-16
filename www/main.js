'use strict';

const {app, Menu, BrowserWindow, ipcMain, Tray, nativeTheme, nativeImage} = require('electron');
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const { clear } = require('console');

// メインウィンドウ
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    title: app.name,
    width: 1024,
    height: 640,
    minWidth: 1024,
    minHeight: 640,
    "window.autoDetectColorScheme": true,
    webPreferences: {
      // In Electron 12, the default will be changed to true.
      worldSafeExecuteJavaScript: true,
      // XSS対策としてnodeモジュールをレンダラープロセスで使えなくする
      nodeIntegration: false,
      // レンダラープロセスに公開するAPIのファイル
      //（Electron 11 から、デフォルト：falseが非推奨となった）
      contextIsolation: true,
      preload: path.resolve(`${__dirname}/preload.js`)
    },
    // icon: iconPath
  });
  // load a local HTML file
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  // debug: ディベロッパーツールの表示
//  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

app.on('ready', () => {
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {  // macOS以外
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

var sstp_mes = '';
var sstp_id = -1;
ipcMain.on("ipc-SSTP-send", (event, data) => {
  const hwnd = data[0];
  let mes = ''
    + 'EXECUTE SAORI/1.0\n'
    + 'Charset: UTF-8\n'
    + 'SecurityLevel: Local\n'
    + 'Argument0: DSSTPSend\n'
    + 'Argument1: ' + hwnd + '\n'
    + 'Argument2: result\n'
    + 'Argument3: NOTIFY SSTP/1.1\n'
    + 'Argument4: Charset: UTF-8\n'
    + 'Argument5: Sender: Majiang\n'
    + 'Argument6: Event: OnMahjong\n'
    + 'Argument7: Option: nobreak\n'
    + 'Argument8: Reference0: UKAJONG/0.2\n';
  for (let i = 1; i < data.length; i++) {
    mes += 'Argument' + (8 + i) + ': Reference' + i + ': ' + data[i] + '\n';
  }
  mes += '\n';
  sstp_mes += mes;
  clearTimeout(sstp_id);
  sstp_id = setTimeout(execSSTP, 500);
});

const execSSTP = () => {
  const dt1 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
  const path1 = `${__dirname}\\saori\\log\\request${dt1}.txt`;
  fs.writeFile(path1, sstp_mes, (error) => {
    sstp_mes = '';
    if (error != null) {
      console.error('ERROR', error);
      return;
    }
    childProcess.exec(`${__dirname}\\saori\\shioricaller.exe ${__dirname}\\saori\\HandUtil.dll ${__dirname}\\saori\\ < ${path1}`, (error, stdout, stderr) => {
      if (error) {
        console.error('ERROR', error);
        const dt2 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
        const path2 = `${__dirname}\\saori\\log\\error${dt2}.txt`;
        fs.writeFile(path2, error.message + '\n\n' + mes, (err) => {
          if (err != null) {
            console.error('ERROR', err);
            return;
          }
        });
        return;
      }
//      console.log('Response: \n', stdout);  // string
      return stdout;
    });
  });
};

ipcMain.on("ipc-request-dapai", (event, data) => {
  const hwnd = data;
  const mes1 = ''
    + 'EXECUTE SAORI/1.0\n'
    + 'Charset: UTF-8\n'
    + 'SecurityLevel: Local\n'
    + 'Argument0: DSSTPSend\n'
    + 'Argument1: ' + hwnd + '\n'
    + 'Argument2: result\n'
    + 'Argument3: NOTIFY SSTP/1.1\n'
    + 'Argument4: Charset: UTF-8\n'
    + 'Argument5: Sender: Majiang\n'
    + 'Argument6: Event: OnMahjong\n'
    + 'Argument7: Option: nobreak\n'
    + 'Argument8: Reference0: UKAJONG/0.2\n'
    + 'Argument9: Reference1: sutehai?\n'
    + '\n';
  const dt1 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
  const path1 = `${__dirname}\\saori\\log\\request${dt1}.txt`;
  fs.writeFile(path1, mes1, (error) => {
    if (error != null) {
      console.error('ERROR', error);
      return;
    }
    childProcess.exec(`${__dirname}\\saori\\shioricaller.exe ${__dirname}\\saori\\HandUtil.dll ${__dirname}\\saori\\ < ${path1}`, (error, stdout, stderr) => {
      if (error) {
        console.error('ERROR', error);
        const dt2 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
        const path2 = `${__dirname}\\saori\\log\\error${dt2}.txt`;
        fs.writeFile(path2, error.message + '\n\n' + mes1, (err) => {
          if (err != null) {
            console.error('ERROR', err);
            return;
          }
        });
        return;
      }
      const res = stdout;
      const lines = res.split('\r\n');
      let command;
      let dapai;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('X-SSTP-PassThru-Reference2: ') >= 0) {
          command = lines[i].split('X-SSTP-PassThru-Reference2: ')[1].replace('\r', '');
        }
        else if (lines[i].indexOf('X-SSTP-PassThru-Reference3: ') >= 0) {
          dapai = lines[i].split('X-SSTP-PassThru-Reference3: ')[1].replace('\r', '');
        }
      }
      mainWindow.webContents.send("ipc-receive-dapai", [hwnd, command, dapai]);
    });
  });
});

ipcMain.on("ipc-request-player-info", (event) => {
  let hwnd_saved = [];
  let hwnd_dict = {};
  let name_saved = [];
  const path0 = `${__dirname}\\saori\\log\\`;
  fs.rmSync(path0, { recursive: true, force: true });
  fs.mkdirSync(path0);
  const mes1 = ''
    + 'EXECUTE SAORI/1.0\n'
    + 'Charset: UTF-8\n'
    + 'SecurityLevel: Local\n'
    + 'Argument0: GetFMO\n'
    + 'Argument1: SakuraUnicode\n'
    + '\n';
  const dt1 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
  const path1 = `${__dirname}\\saori\\log\\request${dt1}.txt`;
  fs.writeFile(path1, mes1, (error) => {
    if (error != null) {
      console.error('ERROR', error);
      return;
    }
  });
  childProcess.exec(`${__dirname}\\saori\\shioricaller.exe ${__dirname}\\saori\\HandUtil.dll ${__dirname}\\saori\\ < ${path1}`, (error, stdout, stderr) => {
    if(error) {
      return console.error('ERROR', error);
    }
//    console.log('Response: \n', stdout);  // string
//    console.log('STDERR', stderr);  // string
    const res = stdout;
    const lines = res.split('\r\n');
    let hwnd_tmp = [];
    let name_tmp = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('.hwnd' + String.fromCharCode(1)) >= 0) {
        const hwnd = lines[i].split(String.fromCharCode(1))[1].replace('\r', '');
        hwnd_tmp.push(hwnd);
      }
      else if (lines[i].indexOf('.name' + String.fromCharCode(1)) >= 0) {
        const name = lines[i].split(String.fromCharCode(1))[1].replace('\r', '');
        name_tmp.push(name);
      }
    }
    let mes2 = '';
    for (let i = 0; i < name_tmp.length; i++) {
      hwnd_dict[name_tmp[i]] = hwnd_tmp[i];
      mes2 += ''
        + 'EXECUTE SAORI/1.0\n'
        + 'Charset: UTF-8\n'
        + 'SecurityLevel: Local\n'
        + 'Argument0: DSSTPSend\n'
        + 'Argument1: ' + hwnd_tmp[i] + '\n'
        + 'Argument2: result\n'
        + 'Argument3: NOTIFY SSTP/1.1\n'
        + 'Argument4: Charset: UTF-8\n'
        + 'Argument5: Sender: Majiang\n'
        + 'Argument6: Event: OnMahjong\n'
        + 'Argument7: Reference0: UKAJONG/0.2\n'
        + 'Argument8: Reference1: hello\n'
        + '\n';
    }
    const dt2 = new Date().toISOString().replace(/[T.:]/g, '-').replace(/Z/, '');
    const path2 = `${__dirname}\\saori\\log\\request${dt2}.txt`;
    fs.writeFile(path2, mes2, (error) => {
      if (error != null) {
        console.error('ERROR', error);
        return;
      }
    });
    childProcess.exec(`${__dirname}\\saori\\shioricaller.exe ${__dirname}\\saori\\HandUtil.dll ${__dirname}\\saori\\ < ${path2}`, (error, stdout, stderr) => {
      if(error) {
        return console.error('ERROR', error);
      }
//      console.log('Response: \n', stdout);  // string
      const res = stdout;
      const lines = res.split('\r\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('X-SSTP-PassThru-Reference3: name=') >= 0) {
          const name = lines[i].split('X-SSTP-PassThru-Reference3: name=')[1].replace('\r', '');
          name_saved.push(name);
          hwnd_saved.push(hwnd_dict[name]);
        }
      }
      mainWindow.webContents.send("ipc-receive-player-info", [name_saved, hwnd_saved]);
    });
  });
});
