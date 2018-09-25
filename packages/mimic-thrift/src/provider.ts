import * as EventEmitter from "events";
import { Server } from "net";
import * as path from "path";
import {
  createServer,
  createWebServer,
  TBinaryProtocol,
  TBufferedTransport,
  TCompactProtocol,
  TFramedTransport,
  TJSONProtocol,
} from "thrift";

import {
  deleteConfig,
  detectGit,
  IGit,
  IMimicRequest,
  IServiceJson,
  IServiceProvider,
  IUniq,
  pick,
  ResponseManager,
  toCallback,
  writeConfig,
} from "@creditkarma/mimic-core";
import { buildServiceAPI, formatThrift, generateThriftResponse, ThriftFile, ThriftParser } from "./index";

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
export class ThriftProvider extends EventEmitter implements IServiceProvider {
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
  public thrift: IUniq<ThriftFile.IJSON>;
  private respManager: ResponseManager;

  // Initialize
  constructor(thrift: IUniq<ThriftFile.IJSON>, respManager: ResponseManager) {
    super();
    this.thrift = thrift;
    this.respManager = respManager;
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
    const handler = this.handler(id);
    if (useHttp) {
      // HTTP Server
      const options = {
        processor: api[service], handler,
        transport: ThriftProvider.transports[transport],
        protocol: ThriftProvider.protocols[protocol],
        headers: {
          server: `mimic: ${process.env.MIMIC_VERSION}`,
        },
      };
      return createWebServer({ services: { [url || "/"]: options } });
    } else {
      // TCP Server
      return createServer(api[service], handler, {
        transport: ThriftProvider.transports[transport],
        protocol: ThriftProvider.protocols[protocol],
      });
    }
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
  private handler = (id: string) => {
    const def = this.thrift[id];
    return (func: ThriftFile.IFunction, args: any, callback: (data: any, excep?: string) => void) => {
      const { data, exception } = this.respManager.find(id)[func.name] || {
        data: generateThriftResponse(func.returnTypeId, def, func.returnType, func.returnExtra),
        exception: undefined,
      };
      // Return data
      callback(data, exception);
      // Emit request
      this.emitRequest(id, func, args, data, exception);
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
