import { IExportFile, SCHEMA_VERSION } from "@creditkarma/mimic-cli";
import {
  emptyConfigFolder,
  IMimicRequest,
  IResponses,
  IServiceJson,
  IUniq,
  readConfig,
  readConfigFolder,
  ResponseManager,
  ServiceManager,
  writeConfig,
  writeConfigFolder,
} from "@creditkarma/mimic-core";
import { GraphQLProvider } from "@creditkarma/mimic-graphql";
import { RestProvider } from "@creditkarma/mimic-rest";
import { ThriftFile, ThriftProvider } from "@creditkarma/mimic-thrift";
import * as revents from "common/redux_events";
import { app, dialog, WebContents } from "electron";
import * as fs from "fs";

export interface IServiceInput {
  responses: IResponses;
  graphql: IUniq<string>;
  services: IUniq<IServiceJson>;
  thrift: IUniq<ThriftFile.IJSON>;
}

export class App {
  public serviceManager = new ServiceManager({});
  public responseManager = new ResponseManager({});
  public graphqlProvider = new GraphQLProvider({}, this.responseManager);
  public thriftProvider = new ThriftProvider({}, this.responseManager);
  public errors: any[] = [];
  public requests: IMimicRequest[] = [];
  public sender?: WebContents;

  public load(callback: () => void) {
    const config = [readConfig("services.json")];
    config.push(readConfigFolder("responses"));
    config.push(readConfigFolder("thrift")),
    config.push(readConfigFolder("graphql"));
    Promise.all(config).then(([serv, responses, thrift, graphql]) => {
      this.serviceManager = new ServiceManager(serv || {});
      this.responseManager = new ResponseManager(responses);
      this.graphqlProvider = new GraphQLProvider(graphql, this.responseManager);
      this.thriftProvider = new ThriftProvider(thrift, this.responseManager);
      const restProvider = new RestProvider(this.responseManager);
      this.serviceManager.register("graphql", this.graphqlProvider);
      this.serviceManager.register("thrift", this.thriftProvider);
      this.serviceManager.register("rest", restProvider);

      this.serviceManager.on("error", (error, id) => {
        const err = { type: `@@IPC_RESPONSE/SWITCH_SERVICE`, id, enabled: true, error };
        if (this.sender) {
          this.sender.send("redux-response", err);
        } else {
          this.errors.push(err);
        }
      });

      let key = 1;
      this.serviceManager.on("request", (request) => {
        request.time = Date.now();
        request.id = key++;
        if (this.requests.length >= 50) {
          this.requests.pop();
        }
        this.requests.unshift(request);
        if (this.sender) {
          this.sender.send("redux-response", { type: `@@IPC_RESPONSE/GET_REQUESTS`, requests: [request] });
        }
      });
      callback();
    });
  }

  /**
   * Choose Thrift file and return JSON representation
   */
  public parseThriftDialog: revents.handler<revents.PARSE_THRIFT_FILE> = (action, callback) => {
    dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Thrift File", extensions: ["thrift"] },
      ],
    }, (files) => {
      if (files) {
        this.thriftProvider.process(files[0], action.includes, callback);
      }
    });
  }

  /**
   * Choose Graphql files/directory and return JSON representation
   */
  public parseGraphqlDialog: revents.handler<revents.PARSE_GRAPHQL> = (_, callback) => {
    dialog.showOpenDialog({
      properties: ["openFile", "openDirectory", "multiSelections"],
      filters: [
        { name: "GraphQL Files", extensions: ["graphql", "gql"] },
      ],
    }, (files) => {
      if (files) {
        this.graphqlProvider.validate(files, callback);
      }
    });
  }

  public export: revents.handler<revents.EXPORT> = (action, callback) => {
    const { ids } = action;
    const options = {
      title: "Export Services",
      filters: [{ name: "Mimic", extensions: ["mimic"] }],
    };
    dialog.showSaveDialog(options, (filename) => {
      if (filename) {
        const exported: IExportFile = {
          date: new Date().toJSON(),
          mimicVersion: app.getVersion(),
          schemaVersion: SCHEMA_VERSION,
          services: this.serviceManager.export(ids),
          responses: this.responseManager.export(ids),
          graphql: this.graphqlProvider.export(ids),
          thrift: this.thriftProvider.export(ids),
        };
        fs.writeFile(filename, JSON.stringify(exported, null, 2), (err) => callback(err, action));
      }
    });
  }
  public import: revents.handler<revents.IMPORT> = (action, callback) => {
    dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Exported Services", extensions: ["mimic"] },
      ],
    }, (files) => {
      if (files) {
        dialog.showMessageBox({
          type: "warning",
          message: "All services will be replaced. Are you sure?",
          buttons: ["Import", "Cancel"],
        }, (index) => {
          if (index === 0) {
            fs.readFile(files[0], "utf8", (err, data) => {
              if (err) { return callback(err); }
              try {
                const { graphql, responses, services, thrift }: IServiceInput = JSON.parse(data);
                Promise.all([
                  emptyConfigFolder("responses"),
                  emptyConfigFolder("graphql"),
                  emptyConfigFolder("thrift"),
                  writeConfig("services.json", services),
                  writeConfigFolder("responses", responses),
                  writeConfigFolder("graphql", graphql),
                  writeConfigFolder("thrift", thrift),
                ]).then(() => {
                  app.relaunch({execPath: process.argv[0], args: process.argv.slice(1)});
                  app.exit(0);
                }, (importErr) => callback(importErr));
              } catch (error) {
                return callback(error);
              }
            });
          }
        });
      }
    });
  }
}
