import { app, BrowserWindow, Menu } from "electron";
import * as log from "electron-log";
import { autoUpdater } from "electron-updater";

import "./dispatcher";
import { menu } from "./menu";

const isDevelopment = process.env.NODE_ENV !== "production";
if (isDevelopment) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

// Global reference to mainWindow
// Necessary to prevent win from being garbage collected
let mainWindow: BrowserWindow | null;

function createMainWindow() {
  // Construct new BrowserWindow
  const window = new BrowserWindow();

  // Set url for `win`
  // points to `webpack-dev-server` in development
  // points to `index.html` in production
  const url = isDevelopment
    ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    : `file://${__dirname}/index.html`;

  if (isDevelopment) {
    const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS, default: installExtension } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS);
    installExtension(REDUX_DEVTOOLS);
    window.webContents.openDevTools();
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
  }

  window.loadURL(url);

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// Quit application when all windows are closed
app.on("window-all-closed", () => {
  // On macOS it is common for applications to stay open
  // until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it is common to re-create a window
  // even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// Create main BrowserWindow when electron is ready
app.on("ready", () => {
  mainWindow = createMainWindow();
  Menu.setApplicationMenu(menu);
  log.transports.file.level = "debug";
  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();
  process.env.MIMIC_VERSION = app.getVersion();
});
