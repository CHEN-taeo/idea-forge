// ---------------------------------------------------------------------------
// Idea Forge — Electron Desktop App
// ---------------------------------------------------------------------------
import { app, BrowserWindow, Menu } from 'electron';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow = null;
let serverProcess = null;

const isDev = !app.isPackaged;
const PORT = process.env.PORT || 3001;

function startServer() {
  const serverPath = join(__dirname, 'server.js');
  if (!existsSync(serverPath)) {
    console.error('server.js not found at', serverPath);
    return;
  }

  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    silent: true
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  serverProcess.on('error', (err) => console.error('[server] Failed:', err));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'Idea Forge',
    icon: join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#1c1410',
    titleBarStyle: 'hiddenInset'
  });

  // Build menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'Idea Forge',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  const url = `http://localhost:${PORT}`;
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();

  // Give the server a moment to start, then open the window
  setTimeout(() => {
    createWindow();
  }, 1500);
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
