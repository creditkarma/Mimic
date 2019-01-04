import * as GrpcFile from "./file";
// import { addService } from "./service";
// import { addStruct } from "./struct";
// export * from "./response";
export * from "./provider";
// export { ThriftFile };

// export function buildServiceAPI(def: ThriftFile.IJSON) {
//   const ns: any = {};
//   const { structs, services } = def;
//   // Define structs
//   structs.forEach((s) => ns[s.name] = addStruct(s, ns));
//   // Define services
//   sortServices(services).forEach((s) => ns[s.name] = addService(s, ns, def));
//   return ns;
// }
