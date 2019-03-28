import { randomBytes } from "crypto";
import { EventEmitter } from "events";
import { Server } from "net";
import { writeConfig } from "./config";
import { IUniq, mapValues, pick, toCallback } from "./utils";

export interface IServiceJson {
  id: string;
  type: string;
  alias: string;
  port: number;
  enabled: boolean;
}

export interface IMimicRequest {
  type: string;
  serviceId: string;
  request: string;
  response: string;
  requestValue: any;
  responseValue: any;
}

export interface IClientAction {
  request: {
    id: string;
    host: string;
    port: number;
    path?: string;
    func: string;
    args: any;
    headers?: IUniq<string>;
    time?: number;
  };
  response?: {
    error?: any;
    success?: any;
    headers?: IUniq<string>;
    time: number;
  };
}

export interface IServiceProvider {
  // Create a server from existin config
  create(service: IServiceJson): Server;
  // Add a new server
  add(service: IServiceJson, callback: (err: Error | null, server?: Server) => void): void;
  // Events
  emit(event: "request", request: IMimicRequest): boolean;
  emit(event: "delete", id: string): boolean;
  on(event: "request", callback: (request: IMimicRequest) => void): this;
  on(event: "delete", callback: (id: string) => void): this;
}

export type IClient = (action: IClientAction, callback: (err: Error | null, action: IClientAction) => void) => void;
export interface IClientProvider {
  clients: IUniq<IClient>;
}

/**
 * Services Manager
 *
 * @class ServiceManager
 */
export class ServiceManager extends EventEmitter {
  // Initialize
  constructor(
    public services: IUniq<IServiceJson>,
    public servers: IUniq<Server> = {},
    protected providers: IUniq<IServiceProvider & Partial<IClientProvider>> = {},
  ) {
    super();
  }

  /**
   * Register service provider
   */
  public register = (type: string, provider: IServiceProvider) => {
    this.providers[type] = provider;
    Object.keys(this.services).map((k) => this.services[k])
      .filter((s) => s.type === type).forEach((service) => {
        const server = provider.create(service);
        this.servers[service.id] = server;
        // Emit events from the server
        server.on("error", (err) => this.emit("error", err, service.id));
        server.on("listening", () => this.emit("listening", service.id));
        // Listen for enabled services
        if (service.enabled) { server.listen(service.port); }
      });
    // Bubble up requests
    provider.on("request", (request) => this.emit("request", request));
  }

  /**
   * Find service
   */
  public find = (id: string) => {
    const service = this.services[id];
    const enabled = !!this.servers[id] && this.servers[id].listening;
    return service ? { ...service, enabled } : service;
  }

  // Get all services
  public all = () => mapValues(this.services, (s) => this.find(s.id));

  // Export specified services
  public export = (ids: string[]) => pick(this.all(), ...ids);

  /**
   * Add service
   */
  public add = (
    action: { service: IServiceJson},
    callback: (err: Error | null, action?: { service: IServiceJson }) => void,
  ) => {
    const service = { ...action.service, id: randomBytes(5).toString("hex"), enabled: false };
    this.providers[service.type].add(service, (error, server) => {
      // Stop if provider failed
      if (error || !server) { return callback(error); }
      this.services[service.id] = service;
      this.servers[service.id] = server;
      // Emit events from the server
      server.on("error", (err) => this.emit("error", err, service.id));
      server.on("listening", () => this.emit("listening", service.id));
      // Persist the service
      this.persist((err) => callback(err, {service}));
    });
  }

  /**
   * Update service
   */
  public update = (
    action: { id: string, service: Partial<IServiceJson> },
    callback: (err: Error | null, action?: { id: string, service: IServiceJson }) => void,
  ) => {
    const service = this.services[action.id] = {...this.find(action.id), ...action.service};
    this.persist((err) => callback(err, {...action, service}));
  }

  /**
   * Delete service
   */
  public delete = (
    action: { id: string },
    callback: (err: Error | null, action?: { id: string }) => void,
  ) => {
    const { id } = action;
    // Notify provider
    this.providers[this.find(id).type].emit("delete", id);
    // Shut down and delete server
    this.servers[id].close();
    delete this.servers[id];
    // Delete and persist services
    delete this.services[id];
    this.persist((err) => callback(err, {id}));
  }

  /**
   * Enable service
   */
  public enable = (id: string, callback: () => void) => {
    const { port } = this.services[id];
    const server = this.servers[id];
    return server.listen(port, () => {
      this.services[id].enabled = true;
      this.persist(callback);
    });
  }

  /**
   * Disable service
   */
  public disable = (id: string, callback: (err: Error | null) => void) => {
    this.servers[id].close((err?: Error) => {
      if (err) { return callback(err); }
      this.services[id].enabled = false;
      this.persist(callback);
    });
  }

  /**
   * Switch service
   */
  public switch = (
    action: { id: string, enabled: boolean },
    callback: (err: Error | null, action?: { id: string, enabled: boolean }) => void,
  ) => {
    const {id, enabled} = action;
    const service = this.find(id);
    if (enabled) {
      const running = Object.values(this.all()).find((s) => s.enabled && s.port === service.port);
      if (running) {
        return this.disable(running.id, (err) => {
          if (err) { return (callback(err)); }
          callback(null, { id: running.id, enabled: false });
          this.enable(id, () => callback(null, action));
        });
      }
      this.enable(id, () => callback(null, action));
    } else {
      this.disable(id, (err) => callback(err, action));
    }
  }

  /**
   * Send request
   */
  public request: IClient = (action, callback) => {
    const {request: {id}} = action;
    const provider = this.providers[this.services[id].type];
    if (provider.clients) {
      provider.clients[id](action, callback);
    }
  }

  // Persist services
  private persist = (callback: (err: Error | null) => void) => {
    toCallback(writeConfig("services.json", this.services), callback);
  }
}

export default ServiceManager;
