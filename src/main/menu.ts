import { app, BrowserWindow, ipcMain as ipc, Menu, MenuItem } from "electron";
import {AnyAction} from "redux";

const sendResponse = (response: AnyAction) => {
  return (menuItem: MenuItem, browserWindow: BrowserWindow) => {
    if (browserWindow) {
      browserWindow.webContents.send("redux-response", response);
    }
  };
};

const template: any[] = [
  {
    label: "File",
    submenu: [{
      label: "New Service",
      accelerator: "CmdOrCtrl+N",
      click: sendResponse({type: "MODAL", window: "NEW_SERVICE"}),
    }, {
      label: "Export Services...",
      click: sendResponse({type: "MODAL", window: "EXPORT"}),
    }, {
      label: "Import Services",
      click: (menuItem: MenuItem, browserWindow: BrowserWindow) => {
        if (browserWindow) {
          ipc.emit("redux-request", {sender: browserWindow.webContents}, {type: "@@IPC_REQUEST/IMPORT"});
        }
      },
    }],
  },
  {
    label: "Edit",
    submenu: [
      {role: "undo"},
      {role: "redo"},
      {type: "separator"},
      {role: "cut"},
      {role: "copy"},
      {role: "paste"},
      {role: "pasteandmatchstyle"},
      {role: "delete"},
      {role: "selectall"},
    ],
  },
  {
    label: "View",
    submenu: [
      {role: "reload"},
      {role: "forcereload"},
      {role: "toggledevtools"},
      {type: "separator"},
      {role: "resetzoom"},
      {role: "zoomin"},
      {role: "zoomout"},
      {type: "separator"},
      {role: "togglefullscreen"},
    ],
  },
  {
    role: "window",
    submenu: [
      {role: "minimize"},
      {role: "close"},
    ],
  },
  {
    role: "help",
  },
];

if (process.platform === "darwin") {
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: "about"},
      {type: "separator"},
      {role: "services", submenu: []},
      {type: "separator"},
      {role: "hide"},
      {role: "hideothers"},
      {role: "unhide"},
      {type: "separator"},
      {role: "quit"},
    ],
  });

  // Edit menu
  template[1].submenu.push(
    {type: "separator"},
    {
      label: "Speech",
      submenu: [
        {role: "startspeaking"},
        {role: "stopspeaking"},
      ],
    },
  );

  // Window menu
  template[4].submenu = [
    {role: "close"},
    {role: "minimize"},
    {role: "zoom"},
    {type: "separator"},
    {role: "front"},
  ];
}

export const menu = Menu.buildFromTemplate(template);
