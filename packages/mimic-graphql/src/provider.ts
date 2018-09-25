import {
  deleteConfig,
  detectGit,
  IGit,
  IMimicRequest,
  IServiceJson,
  IServiceProvider,
  IUniq,
  mapValues,
  pick,
  readRecursively,
  ResponseManager,
  toCallback,
  writeConfig,
} from "@creditkarma/mimic-core";
import { EventEmitter } from "events";
import * as gql from "graphql";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "net";
import * as path from "path";
import * as querystring from "querystring";
import * as url from "url";
import { generateGraphqlResponse } from "./response";

// GraphQL Service definition
export interface IGraphqlServiceJson extends IServiceJson {
  type: "graphql";
  files: string[];
  git?: IGit;
}

// GraphQL types
export interface IGraphqlTypes {
  OBJECT: IUniq<gql.IntrospectionObjectType>;
  INPUT_OBJECT: IUniq<gql.IntrospectionInputObjectType>;
  INTERFACE: IUniq<gql.IntrospectionInterfaceType>;
  UNION: IUniq<gql.IntrospectionUnionType>;
  ENUM: IUniq<gql.IntrospectionEnumType>;
  SCALAR: IUniq<gql.IntrospectionScalarType>;
  ROOT: IUniq<gql.IntrospectionNamedTypeRef<gql.IntrospectionObjectType>>;
}

/**
 * GraphQL Service Provider
 *
 * @class GraphQLProvider
 */
export class GraphQLProvider extends EventEmitter implements IServiceProvider {
  public gqlSchemas: IUniq<gql.GraphQLSchema>;
  public introSchemas: IUniq<IGraphqlTypes> = {};

  // Initialize
  constructor(private schemas: IUniq<string>, private respManager: ResponseManager) {
    super();
    this.gqlSchemas = mapValues(this.schemas, (s) => {
      const schema = gql.buildSchema(s);
      // Provide type resolvers
      Object.values(schema.getTypeMap()).forEach((type) => {
        switch (true) {
        case type instanceof gql.GraphQLInterfaceType:
          (type as gql.GraphQLInterfaceType).resolveType = (v) => v.__type;
          break;
        case type instanceof gql.GraphQLUnionType:
          (type as gql.GraphQLUnionType).resolveType = (v) => v.__type;
          break;
        }
      });
      return schema;
    });
    // Remove responses and GraphQL file
    this.on("delete", (id) => this.delete(id));
  }

  // Find introspection schema for specified service
  public find = (id: string) => this.introSchemas[id];
  // Export Graphql for specified services
  public export = (ids: string[]) => pick(this.schemas, ...ids);

  /**
   * Create GraphQL server
   */
  public create = (params: IGraphqlServiceJson): Server => {
    const { id } = params;
    const schema = this.introSchema(this.gqlSchemas[id]);
    schema.then((sch) => {
      this.introSchemas[id] = sch;
    });
    const handler = this.handler(id, schema);
    return createServer(handler);
  }

  // Add Introspection Schema
  public introSchema = (schema: gql.GraphQLSchema) =>
    new Promise<IGraphqlTypes>((resolve, reject) => {
      // Get introspection schema
      gql.graphql(schema, gql.introspectionQuery, {}).then((result) => {
        const { __schema } = (result.data as gql.IntrospectionQuery);
        const { types: schemaTypes, directives, ...rest } = __schema;
        const types: IGraphqlTypes = {OBJECT: {}, INPUT_OBJECT: {}, INTERFACE: {}, UNION: {}, ENUM: {}, SCALAR: {},
          ROOT: Object.entries(rest).filter(([_, v]) => v).reduce<IGraphqlTypes["ROOT"]>((a, [k, v]) => {
            a[k.replace("Type", "")] = {kind: "OBJECT", ...v};
            return a;
          }, {}),
        };
        schemaTypes.forEach((t: gql.IntrospectionType) => {
          if (!t.name.startsWith("__")) { types[t.kind][t.name] = t; }
        });
        resolve(types);
    });
  })

  /**
   * Add GraphQL server
   */
  public add = (service: IGraphqlServiceJson, callback: (err: Error | null, server?: Server) => void) => {
    const { id, files } = service;
    this.readGraphQL(files, (readErr, contents) => {
      if (readErr) { return callback(readErr); }
      if (contents) {
        const content = Object.values(contents).join("\n");
        this.schemas[id] = content;
        this.gqlSchemas[id] = gql.buildSchema(content);
        const file = path.join("graphql", `${service.id}.graphql`);
        toCallback(writeConfig(file, content), (writeErr) => {
          callback(writeErr, this.create(service));
        });
      }
    });
  }

  /**
   * Validate GraphQL files
   */
  public validate = (files: string[], callback: (err: Error | null, action: {files: string[], git?: IGit}) => void) =>
    this.readGraphQL(files, (err, contents) => {
      if (err) { return callback(err, {files}); }
      if (contents) {
        files = Object.keys(contents);
        const content = Object.values(contents).join("\n");
        try {
          gql.buildSchema(content);
          detectGit(files[0], (_, git) => {
            callback(null, {files, git});
          });
        } catch (error) {
          const {message} = error;
          callback({name: "GraphQL Error", message}, {files});
        }
      }
    })

  /**
   * Read GraphQL files recursively
   */
  public readGraphQL = (files: string[], callback: (err: Error | null, files?: {[key: string]: string}) => void) =>
    Promise.all(files.map((f) => readRecursively(f, "graphql"))).then((values) => {
      const content = Object.assign({}, ...values);
      callback(null, content);
    }, (err) => callback(err))

  /**
   * Delete GraphQL file
   */
  public delete = (id: string) => {
    // Notify response manager
    this.respManager.delete(id);
    // Delete GraphQL file
    delete this.gqlSchemas[id];
    deleteConfig(path.join("graphql", `${id}.graphql`));
  }

  /**
   * Handle HTTP requests
   */
  private handler = (id: string, schema: Promise<IGraphqlTypes>) => {
    const root = {};
    schema.then((sch) => {
      Object.values(sch.ROOT).forEach((v) => {
        const type = sch.OBJECT[v.name];
        Object.assign(root, generateGraphqlResponse(sch, type));
      });
    });
    return (request: IncomingMessage, response: ServerResponse) => {
      this.readBody(request, response, (body) => {
        response.setHeader("server", `mimic: ${process.env.MIMIC_VERSION}`);
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Access-Control-Allow-Origin", "*");
        const {query, operationName} = body;
        Object.assign(root, ...Object.values(this.respManager.find(id)));
        gql.graphql(this.gqlSchemas[id], query, root).then((data) => {
          const req: IMimicRequest = {
            type: "graphql",
            serviceId: id,
            requestValue: body,
            request: operationName || "graphql",
            response: "200 OK",
            responseValue: data,
          };
          response.write(JSON.stringify(data));
          response.end();
          this.emit("request", req);
        });
      });
    };
  }

  private readBody = (request: IncomingMessage, response: ServerResponse, callback: (body: any) => void) => {
    switch (request.method) {
    case "POST":
      const body: string[] = [];
      request.on("data", (chunk: string) => {
        body.push(chunk);
      }).on("end", () => {
        try {
          callback(JSON.parse(body.join()));
        } catch {
          response.writeHead(400);
          response.end();
        }
      });
      break;
    case "GET":
      const parsedUrl = url.parse(request.url!);
      callback(querystring.parse(parsedUrl.query!));
      break;
    default:
      response.writeHead(400);
      response.end();
    }
  }
}

export default GraphQLProvider;
