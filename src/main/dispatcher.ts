import * as revents from "common/redux_events";
import { Event, ipcMain as ipc } from "electron";
import { AnyAction } from "redux";
import { App } from "./app";

const events: { [key: string]: revents.handler<any> } = {};
function addHandler<S>(type: string, handler: revents.handler<S>): void {
  events[type] = handler;
}

const app = new App();
app.load(() => {
  const { graphqlProvider, serviceManager, thriftProvider, responseManager, errors, requests } = app;
  ipc.on("redux-request", (event: Event, action: AnyAction) => {
    const type = action.type.substring(14);
    const callback = (error: Error | null, data?: { [key: string]: any }) => {
      const resp = { ...data, type: `@@IPC_RESPONSE/${type}`, error };
      app.sender = event.sender;
      app.sender.send("redux-response", resp);
    };
    if (events[type]) {
      events[type](action, callback);
    }
  });

  // Services
  addHandler<revents.GET_SERVICES>("GET_SERVICES", (action, callback) => {
    callback(null, { ...action, services: serviceManager.all() });
    while (errors.length > 0) {
      if (app.sender) {
        app.sender.send("redux-response", errors.pop());
      }
    }
  });
  addHandler<revents.ADD_SERVICE>("ADD_SERVICE", serviceManager.add);
  addHandler<revents.UPDATE_SERVICE>("UPDATE_SERVICE", serviceManager.update);
  addHandler<revents.DELETE_SERVICE>("DELETE_SERVICE", serviceManager.delete);
  addHandler<revents.SWITCH_SERVICE>("SWITCH_SERVICE", serviceManager.switch);
  addHandler<revents.GET_REQUESTS>("GET_REQUESTS", (action, callback) => {
    callback(null, { ...action, requests });
  });

  // GraphQL
  addHandler<revents.PARSE_GRAPHQL>("PARSE_GRAPHQL", app.parseGraphqlDialog);
  addHandler<revents.GET_GRAPHQL>("GET_GRAPHQL", (action, callback) => {
    callback(null, { ...action, schema: graphqlProvider.find(action.id) });
  });

  // Thrift
  addHandler<revents.PARSE_THRIFT_FILE>("PARSE_THRIFT_FILE", app.parseThriftDialog);
  addHandler<revents.GET_THRIFT>("GET_THRIFT", (action, callback) => {
    callback(null, { ...action, thrift: thriftProvider.find(action.id) });
  });

  // Responses
  addHandler<revents.GET_RESPONSES>("GET_RESPONSES", (action, callback) => {
    callback(null, { ...action, responses: responseManager.find(action.id) });
  });
  addHandler<revents.ADD_RESPONSE>("ADD_RESPONSE", responseManager.add);

  // Export/Import
  addHandler<revents.EXPORT>("EXPORT", app.export);
  addHandler<revents.IMPORT>("IMPORT", app.import);
});
