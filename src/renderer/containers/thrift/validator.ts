import { ThriftFile } from "@creditkarma/mimic-thrift";
export function validate(
    data: any,
    def: ThriftFile.IJSON,
    typeId: string,
    type?: ThriftFile.Type,
    extra?: ThriftFile.IExtraType,
  ): string[] {
    const errors: string[] = [];
    if (extra && extra.typeId === "enum") {
      const en = def.enums.filter((e) => e.name === extra.class)[0];
      if (!en.members.some((m) => m.value === data)) { return [" should be member"]; }
    }
    if (type) {
      switch (type.typeId) {
        case "exception":
        case "struct":
        case "union":
          if (!(data instanceof Object)) { return [" should be Object"]; }
          if (type.typeId === "union" && Object.keys(data).length !== 1) {
            return [" should have exactly one field"];
          }
          const struct = def.structs.filter((s) => s.name === type.class)[0];
          Object.keys(data).forEach((key) => {
            if (!struct.fields.map((f) => f.name).includes(key)) { errors.push(`.${key} is not defined`); }
          });
          struct.fields.forEach((field) => {
            const value = data[field.name];
            if (typeof value === "undefined") {
              // If value is not present, but required and doesn't have default
              if (["req_out", "required"].includes(field.required) && !field.hasOwnProperty("default")) {
                errors.push(`.${field.name} is required`);
              }
            } else {
              validate(value, def, field.typeId, field.type, field.extra).forEach((err) => {
                errors.push(`.${field.name}${err}`);
              });
            }
          });
          return errors;
        case "set":
        case "list":
          if (!(data instanceof Array)) { return [" should be Array"]; }
          for (let index = 0; index < data.length; index++) {
            validate(data[index], def, type.elemTypeId, type.elemType, type.extra).forEach((err) => {
              errors.push(`[${index}]${err}`);
            });
            if (errors.length > 0) { return errors; }
          }
          return errors;
        case "map":
          if (!(data instanceof Object)) { return [" should be Object"]; }
          Object.entries(data).forEach(([k, v]) => {
            validate(k, def, type.keyTypeId, type.keyType, type.keyExtra).forEach((err) => {
              errors.push(`key${err}`);
            });
            validate(v, def, type.valueTypeId, type.valueType, type.valueExtra).forEach((err) => {
              errors.push(`value${err}`);
            });
          });
          return errors;
        default:
          throw new Error(`Can't handle "${typeId}" type yet`);
      }
    }
    const dataType = typeof data;
    switch (typeId) {
      case "void":
        return [];
      case "bool":
        return (dataType) === "boolean" ? [] : [" should be boolean"];
      case "i16":
      case "i32":
      case "i64":
      case "double":
        return dataType === "number" ? [] : [" should be number"];
      case "string":
        return dataType === "string" ? [] : [" should be string"];
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
