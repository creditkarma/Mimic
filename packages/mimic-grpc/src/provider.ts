import * as fs from "fs";

// import { GrpcFile } from "./index";

import * as protoLoader from "@grpc/proto-loader";
import * as EventEmitter from "events";
import * as grpcLibrary from "grpc";
import * as grpcJS from "@grpc/grpc-js";
// import { IncomingMessage, ServerResponse } from "http";
// import { Server } from "net";
import * as path from "path";
import * as protobufjs from "protobufjs";

import {
  deleteConfig,
  detectGit,
  IBaseResponseManager,
  IClient,
  IClientProvider,
  IGit,
  IMimicRequest,
  IServiceJson,
  IServiceProvider,
  IUniq,
  pick,
  toCallback,
  writeConfig
} from "@creditkarma/mimic-core";
// import { buildServiceAPI, formatThrift, GrpcFile, ThriftParser } from "./index";

export interface IGrpcServiceJson extends IServiceJson {
  type: "grpc";
  path: string;
  service: string;
  url?: string;
  // transport: "Buffered" | "Framed";
  protocol: "Protobuf";
  // proxy: boolean;
  // remoteHost?: string;
  // remotePort?: number;
  // git?: {
  //   root: string;
  //   branch: string;
  //   head: string;
  // };
}

// export interface IParseOutput {
//   includes: string[];
//   path: string;
//   content?: GrpcFile.IJSON;
//   git?: IGit;
// }

/**
 * gRPC Service Provider
 *
 * @class GrpcProvider
 */
export class GrpcProvider extends EventEmitter {
  constructor(private grpc: any, private respManager: any) {
    super();
    this.on("delete", id => this.delete(id));
  }

  // public static protocols = {
  //   Protobuf: TProtobufProtocol
  // };

  public clients: IUniq<IClient> = {};
  public servers: any = {};

  private headers: IUniq<any> = {};

  // Find definitions for specified service
  public find = (id: string) => this.grpc[id];

  // Export gRPC for specified services
  public export = (ids: string[]) => pick(this.grpc, ...ids);

  /**
   * Create gRPC server
   */
  // public create = (params: IGrpcServiceJson): Server => {
  // const { id, protocol, service, url } = params;
  // const api = buildServiceAPI(this.grpc[id]);
  // const handler = this.createHandler(params);
  // let server: Server;

  // if (useHttp) {
  //   // HTTP Server
  //   const options = {
  //     processor: api[service], handler,
  //     protocol: GrpcProvider.protocols[protocol],
  //     headers: {Server: `mimic: ${process.env.MIMIC_VERSION}`},
  //   };
  //   server = createWebServer({ services: { [url || "/"]: options } });
  //   server.on("request", (request: IncomingMessage, response: ServerResponse) => {
  //     this.headers[id] = request.headers;
  //   });
  // } else {
  //   // TCP Server
  //   server = createServer(api[service], handler, {
  //     transport: GrpcProvider.transports[transport],
  //     protocol: GrpcProvider.protocols[protocol],
  //   });
  // }

  // @todo: create gRPC server

  //   this.clients[id] = this.createClient(params, api);

  //   return server;
  // };

  /**
   * Create gRPC client
   */
  // public createClient = (params: IGrpcServiceJson, api: any) => {
  // @todo create grpc client
  // };

  /**
   * Parse and add gRPC file
   */
  public add = (
    service: IGrpcServiceJson,
    callback: (error: Error | null, server?: any) => void
  ) => {
    this.process(service.path, (error, data) => {
      this.grpc[service.id] = { ...service, ...data };
      toCallback(
        writeConfig(path.join("grpc", `${service.id}.json`), data),
        writeErr => {
          if (writeErr) {
            return callback(writeErr);
          }
          this.create(this.grpc[service.id]);
          callback(null);
        }
      );
    });
  };

  /**
   * Create gRPC Client and Server
   */
  public create = (service: any) => {};

  /**
   * Create gRPC Client
   */
  public createClient = (service: any) => {
    const client = new service.protoDescriptor[service.service](
      `0.0.0.0:${service.port}`,
      grpcJS.credentials.createInsecure()
    );
    this.clients[service.id] = client;
  };

  /**
   * Create gRPC Server
   */
  public createServer = (service: any) => {
    const server = new grpcLibrary.Server();

    server.addService(
      service.protoDescriptor[service.service],
      this.getServiceMethods(service)
    );
    server.bind(
      `0.0.0.0:${service.port}`,
      grpcLibrary.ServerCredentials.createInsecure()
    );
    server.start();

    this.servers[service.id] = server;
  };

  /**
   * Delete gRPC file
   */
  public delete = (id: string) => {
    // Notify response manager
    this.respManager.delete(id);
    // Delete gRPC file
    delete this.grpc[id];
    // Delete gRPC client
    delete this.clients[id];
    // Delete Headers
    delete this.headers[id];
    deleteConfig(path.join("grpc", `${id}.json`));
  };

  /**
   * Get a list of Services from a proto descriptor
   */
  private getServicesList = (protoDescriptor: any) => {
    const servicesList: any[] = [];
    Object.keys(protoDescriptor).forEach(descriptorKey => {
      Object.keys(protoDescriptor[descriptorKey]).forEach(serviceKey => {
        if (protoDescriptor[descriptorKey][serviceKey].service) {
          servicesList.push({
            display: serviceKey,
            key: `${descriptorKey}.${serviceKey}`
          });
        }
      });
    });
    return servicesList;
  };

  /**
   * Get a list of Service methods for a given Service
   */
  private getServiceMethods = (protoDescriptor: any) => {};

  /**
   * Process gRPC file
   */
  public process = (
    filePath: string,
    callback: (error: Error | null, data?: any) => void
  ) => {
    // Detect git root
    // detectGit(filePath, (gitErr, git: any) => {

    // build services dropdown list

    protoLoader
      .load(filePath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      })
      .then(packageDefinition => {
        const protoDescriptor = grpcJS.loadPackageDefinition(packageDefinition);
        callback(null, {
          packageDefinition,
          path: filePath,
          protoDescriptor,
          servicesList: this.getServicesList(protoDescriptor)
        });
      })
      .catch(error => {
        callback(error);
      });
  };

  // /**
  //  * Handle gRPC requests
  //  */
  // private createHandler = (params: IGrpcServiceJson) => {
  //   const { id, url } = params;
  //   return (
  //     func: GrpcFile.IFunction,
  //     args: any,
  //     callback: (data: any, excep?: string) => void
  //   ) => {
  //     const { data, exception } =
  //       this.respManager.find(id)[func.name] || this.missingResult(func);
  //     // Return data
  //     callback(data, exception);
  //     // Emit request
  //     this.emitRequest(id, func, args, data, exception);
  //   };
  // };

  // /**
  //  * Generate an error when response is expected, but not set
  //  */
  // private missingResult = (func: GrpcFile.IFunction) => {
  //   if (func.returnTypeId === "void") {
  //     return { data: null, exception: null };
  //   }
  //   return {
  //     data: new Grpc.TApplicationException(
  //       Grpc.TApplicationExceptionType.MISSING_RESULT,
  //       `Mimic: no data found for function '${func.name}'`
  //     ),
  //     exception: "MISSING_RESULT"
  //   };
  // };

  // /**
  //  * Format and emit request
  //  */
  // private emitRequest(
  //   serviceId: string,
  //   func: GrpcFile.IFunction,
  //   requestValue: any,
  //   data: any,
  //   exception?: string
  // ) {
  //   // Format request/response
  //   const fArgs = func.arguments.map(
  //     ({ name, typeId, type }) => `${name}: ${formatGrpc(typeId, type)}`
  //   );
  //   const response = exception
  //     ? exception
  //     : formatGrpc(func.returnTypeId, func.returnType);
  //   // Emit request event
  //   const request: IMimicRequest = {
  //     type: "grpc",
  //     serviceId,
  //     request: `${func.name}(${fArgs.join(" ,")})`,
  //     requestValue,
  //     response,
  //     responseValue: data
  //   };
  //   this.emit("request", request);
  // }
}
export default GrpcProvider;
