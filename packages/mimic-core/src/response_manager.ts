/**
 * @module @creditkarma/mimic-core
 */

import { EventEmitter } from "events";
import * as path from "path";
import { deleteConfig, writeConfig } from "./config";
import { IUniq, pick, toCallback } from "./utils";

export type IResponses = IUniq<IUniq<any>>;

// Base Response manager for providers
export interface IBaseResponseManager {
  find: (id: string) => IUniq<any>;
  delete: (id: string, callback?: (err: Error | null) => null) => void;
}
/**
 * Responses Manager
 *
 * @class ResponseManager
 */
export class ResponseManager extends EventEmitter implements IBaseResponseManager {
  constructor(public responses: IResponses = {}) {
    super();
  }

  // Find responses for specified service
  public find = (id: string) => this.responses[id] || {};

  // Export responses for specified services
  public export = (ids: string[]) => pick(this.responses, ...ids);

  /**
   * Add/Update response
   */
  public add = (
    action: { id: string, response: IUniq<any> },
    callback: (err: Error | null, action?: { id: string, response: IUniq<any> }) => void,
  ) => {
    this.responses[action.id] = { ...this.find(action.id), ...action.response };
    this.emit("update", action.id);
    this.persist(action.id, (err) => callback(err, action));
  }

  /**
   * Delete responses for the service
   */
  public delete = (id: string, callback = (err: Error | null) => null) => {
    delete this.responses[id];
    toCallback(deleteConfig(path.join("responses", `${id}.json`)), callback);
  }

  /**
   * Persist responses
   */
  private persist = (id: string, callback: (err: Error | null) => void) => {
    toCallback(writeConfig(path.join("responses", `${id}.json`), this.responses[id]), callback);
  }
}

export default ResponseManager;
