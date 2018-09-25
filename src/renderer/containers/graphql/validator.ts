import { IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { IntrospectionOutputTypeRef } from "graphql";

export function validate(data: any, types: IGraphqlTypes, schema: IntrospectionOutputTypeRef): string[] {
  const errors: string[] = [];
  switch (schema.kind) {
    case "OBJECT":
    case "INTERFACE":
    case "UNION":
      if (!(data instanceof Object)) { return [" should be Object"]; }
      const {__type, ...keys} = data;
      if (!__type) { return [".__type required"]; }
      const object = types.OBJECT[__type];
      if (!object) { return [`.__type "${__type}" is not defined`]; }
      switch (schema.kind) {
      case "OBJECT":
        if (__type !== schema.name) { return [`.__type should be "${schema.name}"`]; }
        break;
      case "INTERFACE":
      case "UNION":
        if (!types[schema.kind][schema.name].possibleTypes.some((type) => type.name === __type)) {
          return [`.__type doesn't allow "${__type}"`];
        }
        break;
      }
      const { fields } = object;
      const required = fields.filter((f) => f.type.kind === "NON_NULL");
      Object.keys(keys).forEach((key) => {
        if (!fields.some((f) => f.name === key)) { errors.push(`.${key} is not defined`); }
      });
      fields.forEach((field) => {
        const value = data[field.name];
        if (typeof value === "undefined") {
          // If value is not present, but required
          if (required.some((f) => f.name === field.name)) {
            errors.push(`.${field.name} is required`);
          }
        } else {
          validate(value, types, field.type).forEach((err) => {
            errors.push(`.${field.name}${err}`);
          });
        }
      });
      return errors;
    case "LIST":
      if (!(data instanceof Array)) { return [" should be Array"]; }
      for (let index = 0; index < data.length; index++) {
        validate(data[index], types, schema.ofType).forEach((err) => {
          errors.push(`[${index}]${err}`);
        });
        if (errors.length > 0) { return errors; }
      }
      return errors;
    case "ENUM":
      return types.ENUM[schema.name].enumValues.some((v) => v.name === data) ? [] : [" should be member"];
    case "SCALAR":
      const dataType = typeof data;
      switch (schema.name) {
        case "Int":
        case "Float":
          return dataType === "number" ? [] : [" should be number"];
        case "Boolean":
          return dataType === "boolean" ? [] : [" should be boolean"];
        case "ID":
        case "String":
          return dataType === "string" ? [] : [" should be string"];
        default:
          return [];
      }
    case "NON_NULL":
      return validate(data, types, schema.ofType);
  }
}
