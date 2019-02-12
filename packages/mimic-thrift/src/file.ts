/**
 * @module @creditkarma/mimic-thrift
 */

// TypeIDs
export type BaseTypeID = "bool" | "byte" | "i8" | "i16" | "i32" | "i64" | "double" | "string" | "binary" | "slist";
export type ContainerTypeID = "list" | "set" | "map";
export type СompositionalTypeID = "struct" | "union" | "exception";
export type TypeID = BaseTypeID | ContainerTypeID | СompositionalTypeID | "void";
// Types
export type ContainerType = IMapType | ISetType | IListType;
export type СompositionalType = IStructType | IUnionType | IExceptionType;
export type Type = ContainerType | СompositionalType;
export type FieldOrArg = IField | IArgument;

export interface IFieldType {
  typeId: TypeID;
  type?: Type;
  extra?: IExtraType;
}

export interface IExtraType {
  typeId: "enum" | "typedef";
  class: string;
}

export interface IStructType {
  typeId: "struct";
  class: string;
}

export interface IUnionType {
  typeId: "union";
  class: string;
}

export interface IListType {
  typeId: "list";
  elemTypeId: TypeID;
  elemType?: Type;
  extra?: IExtraType;
}

export interface ISetType {
  typeId: "set";
  elemTypeId: TypeID;
  elemType?: Type;
  extra?: IExtraType;
}

export interface IMapType {
  typeId: "map";
  keyTypeId: TypeID;
  valueTypeId: TypeID;
  keyType?: Type;
  valueType?: Type;
  keyExtra?: IExtraType;
  valueExtra?: IExtraType;
}

// Constants
export interface IConstant extends IFieldType {
  name: string;
  doc?: string;
  value: any;
}

// Enums
export interface IEnum {
  name: string;
  doc?: string;
  members: Array<{
    name: string;
    value: number;
  }>;
}

// Typedefs
export interface ITypeDef extends IFieldType {
  name: string;
  doc?: string;
}

// Struct
export interface IField extends IFieldType {
  key: number;
  name: string;
  required: "req_out" | "required" | "optional";
  default?: any;
}

export interface IStruct {
  name: string;
  doc?: string;
  isException: boolean;
  isUnion: boolean;
  fields: IField[];
}

// Services
export interface IArgument extends IFieldType {
  key: number;
  name: string;
  required: "req_out" | "required" | "optional";
}

export interface IExceptionType {
  typeId: "exception";
  class: string;
}

export interface IException {
  typeId: "exception";
  key: number;
  name: string;
  type: IExceptionType;
  required: "req_out";
}

export interface IFunction {
  name: string;
  returnTypeId: TypeID;
  returnType?: Type;
  returnExtra?: IExtraType;
  oneway: boolean;
  doc?: string;
  arguments: IArgument[];
  exceptions: IException[];
}

export interface IService {
  name: string;
  extends?: string;
  doc?: string;
  functions: IFunction[];
}

export interface IJSON {
  name: string;
  doc?: string;
  enums: IEnum[];
  typedefs: ITypeDef[];
  structs: IStruct[];
  constants: IConstant[];
  services: IService[];
}
