/**
 * @module @creditkarma/mimic-graphql
 */

import { IUniq, randomItem } from "@creditkarma/mimic-core";
import { IntrospectionOutputTypeRef } from "graphql";
import { IGraphqlTypes } from "./provider";

export const generateGraphqlResponse = (types: IGraphqlTypes, t: IntrospectionOutputTypeRef, all = true): any => {
  switch (t.kind) {
    case "OBJECT":
      return types.OBJECT[t.name].fields.reduce<IUniq<any>>((acum, f) => {
        if (all) {
          acum[f.name] = generateGraphqlResponse(types, f.type, all);
        } else if (f.type.kind === "NON_NULL") {
          acum[f.name] = generateGraphqlResponse(types, f.type, all);
        }
        return acum;
      }, {__type: t.name});
    case "INTERFACE":
    case "UNION":
      return generateGraphqlResponse(types, randomItem((types[t.kind][t.name] as any).possibleTypes), all);
    case "ENUM":
      return randomItem(types.ENUM[t.name].enumValues).name;
    case "LIST":
      return [generateGraphqlResponse(types, t.ofType, all)];
    case "NON_NULL":
      return generateGraphqlResponse(types, t.ofType, all);
    case "SCALAR":
      switch (t.name) {
        case "Int":
          return Math.floor(Math.random() * 10);
        case "ID":
          return Math.floor(Math.random() * 10).toString();
        case "Float":
          return Math.random() * 10;
        case "Boolean":
          return Math.random() >= 0.5;
        case "String":
        default:
          return "lorem_ipsum".substr(Math.random() * 10);
      }
  }
};
