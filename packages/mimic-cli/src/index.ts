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

  Usage: mimic [options] <file.mimic>

  Options:

    -h, --help     output usage information
    -a, --all      Enable all services
    -V, --version  output the version number
`;
export const parse = (args: string[]) => {
  const [, , ...rest] = args;
  let all = false;
  switch (true) {
    case rest.length === 0:
    case rest.includes("-h"):
    case rest.includes("--help"):
      return output.log(HELP_MESSAGE);
    case rest.includes("-V"):
    case rest.includes("--version"):
      return output.log(process.env.MIMIC_VERSION);
    case rest.includes("-a"):
    case rest.includes("--all"):
      all = true;
  }
  const config = rest.pop();
  if (config) {
    init(config, all);
  }
};
const init = (configFile: string, all: boolean) => {
  // Read config file
  fs.readFile(configFile, "utf8", (err, data) => {
    if (err) {
      return output.error(`Couldn't read ${configFile}`);
    }
    try {
      const config: IExportFile = JSON.parse(data);
      // Enable all services
      if (all) {
        for (const key in config.services) {
          if (config.services.hasOwnProperty(key)) {
            config.services[key].enabled = true;
          }
        }
      }
      main(config);
    } catch (error) {
      output.error(error);
    }
  });
};

// Main app
export const main = ({ graphql, mimicVersion, responses, schemaVersion, services, thrift }: IExportFile) => {
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
    const request = { time: new Date(), service: services[req.serviceId].alias, ...req };
    output.log(JSON.stringify(request));
  });
  // Report port bindings
  serviceManager.on("listening", (id) => {
    const service = services[id];
    output.log(JSON.stringify({ service: service.alias, status: "listening", port: service.port}));
  });
  // Report errors
  serviceManager.on("error", (err, id) => {
    output.error(err);
  });
  // Register providers
  serviceManager.register("graphql", graphqlProvider);
  serviceManager.register("thrift", thriftProvider);
  serviceManager.register("rest", restProvider);
  return serviceManager;
};
