import {
  IClientAction,
  IGit,
  IMimicRequest,
  IResponses,
  IServiceJson,
  IUniq,
} from "@creditkarma/mimic-core";
import { IGraphqlServiceJson, IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { IRestServiceJson } from "@creditkarma/mimic-rest";
import { IThriftServiceJson, ThriftFile } from "@creditkarma/mimic-thrift";

// REDUX
export type handler<S> = (action: S, callback: (err: Error | null, action?: S) => void) => void;
export type Response<S> = S &  {error: Error | null };

// Supported Services
export type ServiceType = IThriftServiceJson | IGraphqlServiceJson | IRestServiceJson;

/* tslint:disable:class-name interface-name no-empty-interface */

// REQUESTS
export interface GET_REQUESTS {
  requests?: IMimicRequest[];
}

// RESPONSES
export interface GET_RESPONSES {
  id: string;
  responses?: IResponses;
}
export interface ADD_RESPONSE {
  id: string;
  response: IResponses;
}

// SERVICES
export interface GET_SERVICES {
  services: IUniq<IServiceJson>;
  ids?: string[];
}

export interface SWITCH_SERVICE {
  id: string;
  enabled: boolean;
}

export interface ADD_SERVICE {
  service: IServiceJson;
}

export interface UPDATE_SERVICE {
  id: string;
  service: Partial<IServiceJson>;
}

export interface DELETE_SERVICE {
  id: string;
}

// CLIENT
export interface SEND_REQUEST extends IClientAction {}

// THRIFT
export interface GET_THRIFT {
  id: string;
  thrift?: ThriftFile.IJSON;
}

export interface PARSE_THRIFT_FILE {
  includes: string[];
  path: string;
  content?: ThriftFile.IJSON;
  git?: IGit;
}

export interface PARSE_GRAPHQL {
  files: string[];
  git?: IGit;
}

export interface GET_GRAPHQL {
  id: string;
  schema: IGraphqlTypes;
}

// EXPORT/IMPORT
export interface EXPORT {
  ids: string[];
}

export interface IMPORT {}
