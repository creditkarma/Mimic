/**
 * @module @creditkarma/mimic-thrift
 */

import * as EventEmitter from "events";
import { IncomingMessage, ServerResponse } from "http";
import { Server } from "net";
import * as path from "path";
import {
  createClient,
  createConnection,
  createHttpClient,
  createHttpConnection,
  createServer,
  createWebServer,
  TBinaryProtocol,
  TBufferedTransport,
  TCompactProtocol,
  TFramedTransport,
  Thrift,
  TJSONProtocol,
} from "thrift";

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
  writeConfig,
} from "@creditkarma/mimic-core";
import { buildServiceAPI, formatThrift, ThriftFile, ThriftParser } from "./index";

// Thrift Service definition
export interface IThriftServiceJson extends IServiceJson {
  type: "thrift";
  path: string;
  includes: string[];
  service: string;
  useHttp: boolean;
  url?: string;
  transport: "Buffered" | "Framed";
  protocol: "Binary" | "Json" | "Compact";
  proxy: boolean;
  remoteHost?: string;
  remotePort?: number;
  git?: {
    root: string;
    branch: string;
    head: string;
  };
}
export interface IParseOutput {
  includes: string[];
  path: string;
  content?: ThriftFile.IJSON;
  git?: IGit;
}

/**
 * Thrift Service Provider
 *
 * @class ThriftProvider
 */
export class ThriftProvider extends EventEmitter implements IServiceProvider, IClientProvider {
  // Supported transports
  public static transports = {
    Buffered: TBufferedTransport,
    Framed: TFramedTransport,
  };
  // Supported protocols
  public static protocols = {
    Binary: TBinaryProtocol,
    Json: TJSONProtocol,
    Compact: TCompactProtocol,
  };
  public clients: IUniq<IClient> = {};
  private headers: IUniq<any> = {};

  // Initialize
  constructor(private thrift: IUniq<ThriftFile.IJSON>, private respManager: IBaseResponseManager) {
    super();
    // Remove responses
    this.on("delete", (id) => this.delete(id));
  }

  // Find definitions for specified service
  public find = (id: string) => this.thrift[id];
  // Export thrift for specified services
  public export = (ids: string[]) => pick(this.thrift, ...ids);

  /**
   * Create Thrift server
   */
  public create = (params: IThriftServiceJson): Server => {
    const { id, transport, protocol, service, useHttp, url } = params;
    const api = buildServiceAPI(this.thrift[id]);
    const handler = this.handler(params);
    let server: Server;
    if (useHttp) {
      // HTTP Server
      const options = {
        processor: api[service], handler,
        transport: ThriftProvider.transports[transport],
        protocol: ThriftProvider.protocols[protocol],
        headers: {Server: `mimic: ${process.env.MIMIC_VERSION}`},
      };
      server = createWebServer({ services: { [url || "/"]: options } });
      server.on("request", (request: IncomingMessage, response: ServerResponse) => {
        this.headers[id] = request.headers;
      });
    } else {
      // TCP Server
      server = createServer(api[service], handler, {
        transport: ThriftProvider.transports[transport],
        protocol: ThriftProvider.protocols[protocol],
      });
    }
    this.clients[id] = this.createClient(params, api);
    return server;
  }

  /**
   * Create Thrift client
   */
  public createClient = (params: IThriftServiceJson, api: any) => {
    const { transport, protocol, service, useHttp } = params;
    let iclient: IClient;
    if (useHttp) {
      // HTTP Client
      iclient = (action, callback) => {
        try {
          const {request: {args, func, host, port}} = action;
          action.request.headers = Object.assign(
            {"User-Agent": `mimic: ${process.env.MIMIC_VERSION}`},
            action.request.headers,
          );
          const connection = createHttpConnection(host, port, {
            transport: ThriftProvider.transports[transport],
            protocol: ThriftProvider.protocols[protocol],
            path: action.request.path,
            headers: Object.assign({"User-Agent": `mimic: ${process.env.MIMIC_VERSION}`}, action.request.headers),
          });
          connection.on("error", (error) => {
            callback(error, action);
          });
          let headers: any;
          const orig = connection.responseCallback;
          connection.responseCallback = (response) => {
            headers = response.headers;
            orig(response);
          };
          const client: any = createHttpClient(api[service], connection);
          action.request.time = Date.now();
          client[func](args, (error: any, success: any) => {
            callback(null, {...action, response: {error, success, headers, time: Date.now()}});
          });
        } catch (error) {
          callback(error, action);
        }
      };
    } else {
      // TCP Client
      iclient = (action, callback) => {
        try {
          const {request: {args, func, host, port}} = action;
          const connection = createConnection(host, port, {
            transport: ThriftProvider.transports[transport],
            protocol: ThriftProvider.protocols[protocol],
          });
          connection.on("error", (error) => {
            callback(error, action);
          });
          const client: any = createClient(api[service], connection);
          action.request.time = Date.now();
          client[func](args, (error: any, success: any) => {
            callback(null, {...action, response: {error, success, time: Date.now()}});
          });
        } catch (error) {
          callback(error, action);
        }
      };
    }
    return iclient;
  }

  /**
   * Parse and add Thrift file
   */
  public add = (service: IThriftServiceJson, callback: (err: Error | null, server?: Server) => void) => {
    this.process(service.path, service.includes, (parseErr, data) => {
      if (parseErr) { return callback(parseErr); }
      if (data && data.content) {
        this.thrift[service.id] = data.content;
        toCallback(writeConfig(path.join("thrift", `${service.id}.json`), data.content), (writeErr) => {
          callback(writeErr, this.create(service));
        });
      }
    });
  }

  /**
   * Delete Thrift file
   */
  public delete = (id: string) => {
    // Notify response manager
    this.respManager.delete(id);
    // Delete Thrift file
    delete this.thrift[id];
    // Delete Thrift client
    delete this.clients[id];
    // Delete Headers
    delete this.headers[id];
    deleteConfig(path.join("thrift", `${id}.json`));
  }

  /**
   * Process Thrift file
   */
  public process = (
    filePath: string,
    includes: string[],
    callback: (err: Error | null, data?: IParseOutput) => void,
  ) => {
    // Detect git root
    detectGit(filePath, (gitErr, git) => {
      // Include git root
      if (git) { includes.push(git.root); }
      // Initialize parser
      const parser = new ThriftParser({ includes });
      parser.parse(filePath, (parseErr, content) => {
        callback(parseErr, { path: filePath, content, git, includes });
      });
    });
  }

  /**
   * Handle Thrift requests
   */
  private handler = (params: IThriftServiceJson) => {
    const {id, proxy, remoteHost, remotePort, url} = params;
    return (func: ThriftFile.IFunction, args: any, callback: (data: any, excep?: string) => void) => {
      if (proxy) {
        const request = {id, host: remoteHost!, port: remotePort!, path: url,
          func: func.name, args, time: Date.now(), headers: this.headers[id],
        };
        this.clients[id]({request}, (err, action) => {
          const {response} = action;
          const {error, success} = response!;
          if (error) {
            callback(error, error.name);
            this.emitRequest(id, func, args, error, error.name);
          } else {
            callback(success);
            this.emitRequest(id, func, args, success);
          }
        });
      } else {
        const { data, exception } = this.respManager.find(id)[func.name] || this.missingResult(func);
        // Return data
        callback(data, exception);
        // Emit request
        this.emitRequest(id, func, args, data, exception);
      }
    };
  }

  /**
   * Generate an error when response is expected, but not set
   */
  private missingResult = (func: ThriftFile.IFunction) => {
    if (func.returnTypeId === "void") {
      return {data: null, exception: null};
    }
    return {
      data: new Thrift.TApplicationException(
        Thrift.TApplicationExceptionType.MISSING_RESULT,
        `Mimic: no data found for function '${func.name}'`,
      ),
      exception: "MISSING_RESULT",
    };
  }

  /**
   * Format and emit request
   */
  private emitRequest(serviceId: string, func: ThriftFile.IFunction, requestValue: any, data: any, exception?: string) {
    // Format request/response
    const fArgs = func.arguments.map(({ name, typeId, type }) => `${name}: ${formatThrift(typeId, type)}`);
    const response = exception ? exception : formatThrift(func.returnTypeId, func.returnType);
    // Emit request event
    const request: IMimicRequest = {
      type: "thrift",
      serviceId, request: `${func.name}(${fArgs.join(" ,")})`,
      requestValue, response, responseValue: data,
    };
    this.emit("request", request);
  }
}
export default ThriftProvider;
