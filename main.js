// Annotateur PDF — processus principal Electron
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch (e) { /* mode développement */ }

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let win = null;
let dirty = false;
let rendererReady = false;
let pendingFile = null;

// Un seul exemplaire : un PDF ouvert depuis l'Explorateur arrive dans la fenêtre existante
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', (_e, argv) => {
  const f = pdfFromArgs(argv);
  if (f) sendFile(f);
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

function pdfFromArgs(argv) {
  return argv.slice(1).find(a => /\.pdf$/i.test(a) && fs.existsSync(a)) || null;
}

function sendFile(p) {
  if (!rendererReady) { pendingFile = p; return; }
  try {
    const data = fs.readFileSync(p);
    win.webContents.send('open-file', { name: path.basename(p), path: p, data });
  } catch (e) {
    dialog.showErrorBox('Ouverture impossible', String(e.message || e));
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 900, minWidth: 640, minHeight: 480,
    title: 'Annotateur PDF',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true }
  });
  win.loadURL('app://local/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });

  win.on('close', e => {
    if (!dirty) return;
    const r = dialog.showMessageBoxSync(win, {
      type: 'warning', buttons: ['Quitter sans enregistrer', 'Annuler'], defaultId: 1, cancelId: 1,
      title: 'Annotations non enregistrées',
      message: 'Des annotations n\'ont pas été enregistrées. Quitter quand même ?'
    });
    if (r !== 0) e.preventDefault();
  });
}

function buildMenu() {
  const send = a => () => win && win.webContents.send('menu', a);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Fichier', submenu: [
      { label: 'Ouvrir un PDF…', accelerator: 'CmdOrCtrl+O', click: send('open') },
      { label: 'Enregistrer le PDF annoté…   Ctrl+S', click: send('save') },
      { type: 'separator' },
      { role: 'quit', label: 'Quitter' }
    ]},
    { label: 'Édition', submenu: [
      { label: 'Annuler   Ctrl+Z', click: send('undo') },
      { label: 'Rétablir   Ctrl+Y', click: send('redo') }
    ]},
    { label: 'Affichage', submenu: [
      { label: 'Zoom avant', click: send('zin') },
      { label: 'Zoom arrière', click: send('zout') },
      { label: 'Ajuster à la largeur', click: send('zfit') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Plein écran' }
    ]},
    { label: 'Aide', submenu: [
      { label: 'Rechercher les mises à jour', click: () => checkUpdates(true) },
      { label: 'À propos', click: () => dialog.showMessageBox(win, {
          title: 'À propos', message: 'Annotateur PDF', detail: 'Version ' + app.getVersion() }) }
    ]}
  ]));
}

// ---------- Mises à jour automatiques ----------
function checkUpdates(manual) {
  if (!autoUpdater || !app.isPackaged) {
    if (manual) dialog.showMessageBox(win, { message: 'Les mises à jour ne sont disponibles que dans la version installée.' });
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.removeAllListeners();
  autoUpdater.on('update-downloaded', info => {
    const r = dialog.showMessageBoxSync(win, {
      type: 'info', buttons: ['Redémarrer maintenant', 'Plus tard'], defaultId: 0,
      title: 'Mise à jour prête',
      message: `La version ${info.version} est téléchargée.`,
      detail: 'Elle sera installée au redémarrage de l\'application.'
    });
    if (r === 0) { dirty = false; autoUpdater.quitAndInstall(); }
  });
  if (manual) {
    autoUpdater.on('update-not-available', () =>
      dialog.showMessageBox(win, { message: `Vous avez déjà la dernière version (${app.getVersion()}).` }));
    autoUpdater.on('update-available', info =>
      dialog.showMessageBox(win, { message: `Version ${info.version} disponible : téléchargement en cours…` }));
    autoUpdater.on('error', err =>
      dialog.showMessageBox(win, { type: 'error', message: 'Vérification impossible', detail: String(err.message || err) }));
  }
  autoUpdater.checkForUpdates().catch(() => {});
}

// ---------- Échanges avec la fenêtre ----------
ipcMain.on('ready', () => {
  rendererReady = true;
  if (pendingFile) { const p = pendingFile; pendingFile = null; sendFile(p); }
});
ipcMain.on('dirty', (_e, v) => { dirty = !!v; });

ipcMain.handle('open-dialog', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'PDF', extensions: ['pdf'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  return { name: path.basename(p), path: p, data: fs.readFileSync(p) };
});

ipcMain.handle('save-pdf', async (_e, name, srcPath, bytes) => {
  const dir = srcPath ? path.dirname(srcPath) : app.getPath('documents');
  const r = await dialog.showSaveDialog(win, {
    defaultPath: path.join(dir, name), filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, Buffer.from(bytes));
  return r.filePath;
});

app.whenReady().then(() => {
  const root = path.join(__dirname, 'app');
  protocol.handle('app', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) return new Response('Interdit', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  buildMenu();
  createWindow();
  const f = pdfFromArgs(process.argv);
  if (f) pendingFile = f;
  setTimeout(() => checkUpdates(false), 4000);
});

app.on('window-all-closed', () => app.quit());
