import { ipcRenderer as ipc } from "electron";
import { Middleware } from "redux";

/* tslint:disable */
const logger: Middleware = (store) => (next) => (action) => {
  console.group(action.type);
  console.info(action);
  console.groupEnd();
  return next(action);
};
/* tslint:enable */

const ipcMiddleware: Middleware = (store) => {
  ipc.on("redux-response", (e: Event, action: any) => {
    store.dispatch(action);
  });
  return (next) => (action) => {
    const type: string = action.type;
    if (type.startsWith("@@IPC_REQUEST")) {
      ipc.send("redux-request", action);
    }
    return next(action);
  };
};

export { ipcMiddleware, logger };
