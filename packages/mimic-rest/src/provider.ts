import { IMimicRequest, IServiceJson, IServiceProvider, ResponseManager } from "@creditkarma/mimic-core";
import { EventEmitter } from "events";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "net";
import { parse } from "url";
import RouterTree from "./router";

/**
 * REST Service Provider
 *
 * @class RestProvider
 */
export class RestProvider extends EventEmitter implements IServiceProvider {
  private respManager: ResponseManager;

  // Initialize
  constructor(respManager: ResponseManager) {
    super();
    this.respManager = respManager;
    // Remove responses
    this.on("delete", (id) => this.respManager.delete(id));
  }

  /**
   * Create REST server
   */
  public create = (params: IServiceJson): Server => {
    const { id } = params;
    const handler = this.handler(id);
    return createServer(handler);
  }

  /**
   * Create REST server
   */
  public add = (service: IServiceJson, callback: (err: Error | null, server?: Server) => void) => {
    callback(null, this.create(service));
  }

  /**
   * Handle HTTP requests
   */
  private handler = (id: string) => {
    let router = new RouterTree(Object.values(this.respManager.find(id)));
    this.respManager.on("update", (serviceId: string) => {
      if (serviceId === id) {
        router = new RouterTree(Object.values(this.respManager.find(id)));
      }
    });
    return (request: IncomingMessage, response: ServerResponse) => {
      this.readBody(request, (body) => {
        if (request.url && request.method) {
          response.setHeader("server", `mimic: ${process.env.MIMIC_VERSION}`);
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Access-Control-Allow-Origin", "*");
          const url = parse(request.url);
          const match = router.match(request.method, url.pathname || "/");
          let req: Partial<IMimicRequest> = {
            type: "rest", serviceId: id,
            requestValue: { query: url.query, body },
          };
          const data = match ? match.data : { error: "not_found" };
          if (match) {
            req = {
              ...req,
              request: `${request.method} ${match.route}`,
              response: "200 OK",
              responseValue: match.data,
            };
            req.requestValue.route = match.params;
          } else {
            req = {
              ...req,
              request: `${request.method} ${url.pathname}`,
              response: "404 Not Found",
              responseValue: data,
            };
            response.writeHead(404);
          }
          response.write(JSON.stringify(data));
          response.end();
          this.emit("request", req);
          return;
        }
        response.writeHead(400);
        response.end();
      });
    };
  }
  private readBody = (request: IncomingMessage, callback: (body: any) => void) => {
    const body: string[] = [];
    if (!request.method) { return callback(""); }
    if (["POST", "PUTS", "PATCH"].includes(request.method)) {
      return request.on("data", (chunk: string) => {
        body.push(chunk);
      }).on("end", () => {
        try {
          const data = JSON.parse(body.join());
          callback(data);
        } catch {
          callback(body.join());
        }
      });
    }
    callback("");
  }
}
export default RestProvider;
