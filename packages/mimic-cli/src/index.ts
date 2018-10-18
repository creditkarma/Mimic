import { IResponses, IServiceJson, IUniq, ResponseManager, ServiceManager } from "@creditkarma/mimic-core";
import { GraphQLProvider } from "@creditkarma/mimic-graphql";
import { RestProvider } from "@creditkarma/mimic-rest";
import { ThriftFile, ThriftProvider } from "@creditkarma/mimic-thrift";
import { Console } from "console";
import * as fs from "fs";

export const SCHEMA_VERSION = 2;

export interface IExportFile {
  date: string;
  mimicVersion: string;
  schemaVersion: number;
  services: IUniq<IServiceJson>;
  responses: IResponses;
  graphql: IUniq<string>;
  thrift: IUniq<ThriftFile.IJSON>;
}

// Log output to STDOUT and STDERR
const output = new Console(process.stdout, process.stderr);
const HELP_MESSAGE = `$ mimic --help

  Usage: mimic [options] <file.mimic> [-r|--request] <request.json>

  Options:

    -h, --help     output usage information
    -a, --all      enable all services
    -r, --request  switch to client mode and send request
    -V, --version  output the version number
`;
export const parse = (args: string[]) => {
  const [, , ...rest] = args;
  let all = false;
  let request: string | undefined;
  switch (true) {
    case rest.length === 0:
    case rest.includes("-h"):
    case rest.includes("--help"):
      return output.log(HELP_MESSAGE);
      break;
    case rest.includes("-V"):
    case rest.includes("--version"):
      return output.log(process.env.MIMIC_VERSION);
      break;
    case rest.includes("-a"):
    case rest.includes("--all"):
      all = true;
      break;
    case rest.includes("-r"):
    case rest.includes("--request"):
      request = rest.pop();
      rest.pop();
      break;
  }
  const config = rest.pop();
  if (config) {
    init(config, all, request);
  }
};
const init = (configFile: string, all: boolean, request?: string) => {
  // Read config file
  fs.readFile(configFile, "utf8", (err, data) => {
    if (err) {
      return output.error(`Couldn't read ${configFile}`);
    }
    try {
      const config: IExportFile = JSON.parse(data);
      if (request || all) {
        for (const key in config.services) {
          if (config.services.hasOwnProperty(key)) {
            config.services[key].enabled = !request;
          }
        }
      }
      main(config, request);
    } catch (error) {
      output.error(error);
    }
  });
};

// Main app
export const main = (
  { graphql, mimicVersion, responses, schemaVersion, services, thrift }: IExportFile,
  request?: string,
  ) => {
  if (process.env.MIMIC_VERSION !== mimicVersion) {
    output.warn({
      type: "Warning",
      message: `Using file from Mimic version "${mimicVersion}" in "${process.env.MIMIC_VERSION}"`,
    });
  }
  if (schemaVersion !== SCHEMA_VERSION) {
    output.error({
      type: "Error",
      message: `Parsed file with schema version "${schemaVersion}", but "${SCHEMA_VERSION}" is supported`,
    });
  }
  const respManager = new ResponseManager(responses);
  const thriftProvider = new ThriftProvider(thrift, respManager);
  const graphqlProvider = new GraphQLProvider(graphql, respManager);
  const serviceManager = new ServiceManager(services);
  const restProvider = new RestProvider(respManager);
  // Report requests
  serviceManager.on("request", (req) => {
    output.log(JSON.stringify({ time: new Date(), service: services[req.serviceId].alias, ...req }));
  });
  // Report port bindings
  serviceManager.on("listening", (id) => {
    const service = services[id];
    output.log(JSON.stringify({ service: service.alias, status: "listening", port: service.port}));
  });
  // Report errors
  serviceManager.on("error", (err) => {
    output.error(err);
  });
  // Register providers
  serviceManager.register("graphql", graphqlProvider);
  serviceManager.register("thrift", thriftProvider);
  serviceManager.register("rest", restProvider);
  if (request) {
    fs.readFile(request, "utf8", (err, data) => {
      if (err) { return output.error(`Couldn't read ${request}`); }
      const action = {request: JSON.parse(data)};
      serviceManager.request(action, (conErr, act) => {
        if (conErr) {
          output.error(conErr);
          process.exit(1);
        }
        const {success, error} = act.response!;
        output.log(JSON.stringify({success, error}));
        process.exit();
      });
    });
  }
  return serviceManager;
};
