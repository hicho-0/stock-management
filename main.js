'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const dir = path.join(app.getPath('documents'), 'Gestion Stock Pro');
const dataFile = path.join(dir, 'donnees.json');
const backupDir = path.join(dir, 'sauvegardes');

function pad(n) { return String(n).padStart(2, '0'); }
function stamp() { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }

function autoBackup() {
  try {
    if (!fs.existsSync(dataFile)) return;
    fs.mkdirSync(backupDir, { recursive: true });
    const f = path.join(backupDir, `auto-${stamp()}.json`);
    if (!fs.existsSync(f)) fs.copyFileSync(dataFile, f);
    const olds = fs.readdirSync(backupDir).filter((x) => /^auto-\d+\.json$/.test(x)).sort().reverse();
    for (const x of olds.slice(30)) fs.unlinkSync(path.join(backupDir, x));
  } catch (e) { console.error('Sauvegarde auto impossible', e); }
}

ipcMain.on('gsp-load', (e) => {
  try { e.returnValue = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : null; }
  catch (err) { e.returnValue = null; }
});
ipcMain.on('gsp-save', (e, json) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = dataFile + '.tmp';
    fs.writeFileSync(tmp, json, 'utf8');
    fs.renameSync(tmp, dataFile);
  } catch (err) { console.error('Enregistrement impossible', err); }
});
ipcMain.on('gsp-open-folder', () => { fs.mkdirSync(dir, { recursive: true }); shell.openPath(dir); });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 380, minHeight: 600, title: 'Gestion Stock Pro', backgroundColor: '#eef3f0',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => { autoBackup(); createWindow(); });
app.on('window-all-closed', () => app.quit());
