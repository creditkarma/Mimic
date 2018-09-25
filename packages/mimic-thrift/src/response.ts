import { randomItem } from "@creditkarma/mimic-core";
import * as ThriftFile from "./file";

export function generateThriftResponse(
  typeId: string,
  def: ThriftFile.IJSON,
  type?: ThriftFile.Type,
  extra?: ThriftFile.IExtraType,
): any {
  if (extra && extra.typeId === "enum") {
    const en = def.enums.filter((e) => e.name === extra.class)[0];
    return randomItem(en.members.map((m) => m.value));
  }
  if (type) {
    switch (type.typeId) {
      case "exception":
      case "struct":
      case "union":
        const struct = def.structs.filter((s) => s.name === type.class)[0];
        const response: { [key: string]: any } = {};
        if (struct.isUnion) {
          const f = struct.fields[0];
          response[f.name] = generateThriftResponse(f.typeId, def, f.type, f.extra);
          return response;
        }
        for (const f of struct.fields.filter((field) => field.required !== "optional")) {
          response[f.name] = generateThriftResponse(f.typeId, def, f.type, f.extra);
        }
        return response;
      case "set":
      case "list":
        return [generateThriftResponse(type.elemTypeId, def, type.elemType, type.extra)];
      case "map":
        const key = generateThriftResponse(type.keyTypeId, def, type.keyType, type.keyExtra);
        const val = generateThriftResponse(type.valueTypeId, def, type.valueType, type.valueExtra);
        return { [key]: val };
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
  switch (typeId) {
    case "void":
      return null;
    case "bool":
      return Math.random() >= 0.5;
    case "i16":
    case "i32":
    case "i64":
      return Math.floor(Math.random() * 10);
    case "double":
      return Math.random() * 10;
    case "string":
      return "lorem_ipsum".substr(Math.random() * 10);
    default:
      throw new Error(`Can't handle "${typeId}" type yet`);
  }
}

export function formatThrift(typeId: string, type?: ThriftFile.Type): string {
  if (type) {
    switch (type.typeId) {
      case "exception":
      case "struct":
      case "union":
        return type.class;
      case "set":
        return `set<${formatThrift(type.elemTypeId, type.elemType)}>`;
      case "list":
        return `list<${formatThrift(type.elemTypeId, type.elemType)}>`;
      case "map":
        return `map<${formatThrift(type.keyTypeId, type.keyType)},${formatThrift(type.valueTypeId, type.valueType)}>`;
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
  return typeId;
}
