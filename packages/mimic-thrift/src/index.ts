/**
 * @module @creditkarma/mimic-thrift
 */

import * as ThriftFile from "./file";
import { addService } from "./service";
import { addStruct } from "./struct";
export * from "./response";
export * from "./parser";
export * from "./provider";
export { ThriftFile };

export function buildServiceAPI(def: ThriftFile.IJSON) {
  const ns: any = {};
  const { structs, services } = def;
  // Define structs
  structs.forEach((s) => ns[s.name] = addStruct(s, ns));
  // Define services
  sortServices(services).forEach((s) => ns[s.name] = addService(s, ns, def));
  return ns;
}

/**
 * Sorting Services with dependencies first
 */
function sortServices(services: ThriftFile.IService[], names = [""]): ThriftFile.IService[] {
  if (services.length === 0) { return []; }
  const result: ThriftFile.IService[] = [];
  const rest: ThriftFile.IService[] = [];
  const nextNames: string[] = [];
  services.forEach((service) => {
    if (names.includes(service.extends || "")) {
      result.push(service);
      nextNames.push(service.name);
    } else {
      rest.push(service);
    }
  });
  return result.concat(sortServices(rest, nextNames));
}
