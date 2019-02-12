/**
 * @module @creditkarma/mimic-thrift
 */

import { IUniq, readAnyFile } from "@creditkarma/mimic-core";
import {
  Comment,
  ConstValue,
  EnumDefinition,
  ExceptionDefinition,
  FieldDefinition,
  FunctionDefinition,
  FunctionType,
  Identifier,
  parse,
  StructDefinition,
  SyntaxType,
  TextLocation,
  ThriftStatement,
  TypedefDefinition,
  UnionDefinition,
} from "@creditkarma/thrift-parser";
import * as path from "path";
import { ThriftFile } from "./index";

/* tslint:disable:radix */

enum KEYWORDS {
  // Composite
  StructDefinition = "struct",
  UnionDefinition = "union",
  ExceptionDefinition = "exception",
  // Container
  SetType = "set",
  ListType = "list",
  MapType = "map",
  // Base
  StringKeyword = "string",
  DoubleKeyword = "double",
  BoolKeyword = "bool",
  I8Keyword = "i8",
  I16Keyword = "i16",
  I32Keyword = "i32",
  I64Keyword = "i64",
  BinaryKeyword = "binary",
  ByteKeyword = "byte",
  VoidKeyword = "void",
}

// List of initializer options
export interface IThriftOptions {
  includes: string[];
}
// List of Identifiers
type Ident = StructDefinition | UnionDefinition | ExceptionDefinition | EnumDefinition | TypedefDefinition;

class FilesReadError extends Error {
  public type = "FilesRead";
  public file: string;
  public includes: string[];

  constructor(file: string, includes: string[]) {
    super("Coudn't find/read file");
    this.file = file;
    this.includes = includes;
  }
}

class ThriftError extends Error {
  public type = "ThriftError";
  public file: string;
  public loc: TextLocation;

  constructor(message: string, file: string, loc: TextLocation) {
    super(message);
    this.file = file;
    this.loc = loc;
  }
}

export interface IAstFile {
  file: string;
  content: ThriftStatement[];
}

/**
 * Process Thrift file
 *
 * @class ThriftParser
 */
export class ThriftParser {
  private identifiers: { [key: string]: Ident } = {};
  private includes: string[];

  // Constructor
  constructor({ includes }: IThriftOptions) {
    this.includes = includes;
  }

  /**
   * Parse Thrift file and return JSON representation
   */
  public parse(filePath: string, callback: (err: Error | null, data?: ThriftFile.IJSON) => void) {
    // Reset type definitions
    this.identifiers = {};
    const name = path.basename(filePath, ".thrift");
    this.parseThriftFiles(filePath, [""]).then(
      (ast) => {
        try {
          const data = this.astToJson(name, ast);
          callback(null, data);
        } catch (error) {
          callback(error);
        }
      },
      (err) => callback(err),
    );
  }

  /**
   * Parse Thrift file with all includes recursively
   */
  public parseThriftFiles = (filePath: string, includes: string[]): Promise<IAstFile[]> => {
    // Construct a list of files to look for
    const filePaths = includes.map((include) => path.join(include, filePath));

    // Read any file from the list
    return readAnyFile(filePaths).then(({ file, data }) => {
      // Parse Thrift file
      const thriftAST = parse(data);
      // Switch parse result
      switch (thriftAST.type) {
        // On success
        case SyntaxType.ThriftDocument:
          const promises: Array<Promise<IAstFile[]>> = [];
          thriftAST.body.forEach((st) => {
            switch (st.type) {
              // Read all files from include statements
              case SyntaxType.IncludeDefinition:
                const current = path.dirname(file);
                promises.push(this.parseThriftFiles(st.path.value, [current, ...this.includes]));
                break;
              // Index identifiers
              case SyntaxType.TypedefDefinition:
              case SyntaxType.EnumDefinition:
              case SyntaxType.StructDefinition:
              case SyntaxType.UnionDefinition:
              case SyntaxType.ExceptionDefinition:
                if (!this.identifiers.hasOwnProperty(st.name.value)) {
                  this.identifiers[st.name.value] = st;
                }
            }
          });
          // Return promise with merged files content
          return Promise.all(promises).then(
            (val) => Promise.resolve([...val, [{ file, content: thriftAST.body }]].reduce((a, b) => a.concat(b))),
            (errors) => Promise.reject(errors),
          );
        case SyntaxType.ThriftErrors:
          return Promise.reject(thriftAST);
      }
    }, () => Promise.reject(new FilesReadError(filePath, includes)));
  }

  /**
   * Convert AST statements to JSON representation
   */
  public astToJson = (name: string, ast: IAstFile[]): ThriftFile.IJSON => {
    const enums: IUniq<ThriftFile.IEnum> = {};
    const typedefs: IUniq<ThriftFile.ITypeDef> = {};
    const structs: IUniq<ThriftFile.IStruct> = {};
    const constants: IUniq<ThriftFile.IConstant> = {};
    const services: IUniq<ThriftFile.IService> = {};
    for (const { file, content } of ast) {
      for (const def of content) {
        switch (def.type) {
          case SyntaxType.EnumDefinition:
            let value = -1;
            enums[def.name.value] = {
              name: def.name.value,
              ...this.comments(def.comments),
              members: def.members.map((m) => {
                value = m.initializer ? parseInt(m.initializer.value.value) : value + 1;
                return { name: m.name.value, value };
              }),
            };
            break;
          case SyntaxType.TypedefDefinition:
            typedefs[def.name.value] = {
              name: def.name.value,
              ...this.comments(def.comments),
              ...this.astToType(def.definitionType, file),
            };
            break;
          case SyntaxType.StructDefinition:
          case SyntaxType.UnionDefinition:
          case SyntaxType.ExceptionDefinition:
            structs[def.name.value] = {
              name: def.name.value,
              isException: def.type === SyntaxType.ExceptionDefinition,
              isUnion: def.type === SyntaxType.UnionDefinition,
              fields: def.fields.map((f) => this.fieldToJson(f, file)),
              ...this.comments(def.comments),
            };
            break;
          case SyntaxType.ConstDefinition:
            constants[def.name.value] = {
              name: def.name.value,
              ...this.comments(def.comments),
              value: this.constToJson(def.initializer),
              ...this.astToType(def.fieldType, file),
            };
            break;
          case SyntaxType.ServiceDefinition:
            services[def.name.value] = {
              name: def.name.value,
              ...def.extends && { extends: this.ident(def.extends) },
              ...this.comments(def.comments),
              functions: def.functions.map((f) => this.funcToJson(f, file))
                .sort((a, b) => a.name.localeCompare(b.name)),
            };
        }
      }
    }
    return {
      name,
      enums: Object.keys(enums).sort().map((k) => enums[k]),
      typedefs: Object.keys(typedefs).sort().map((k) => typedefs[k]),
      structs: Object.keys(structs).sort().map((k) => structs[k]),
      constants: Object.keys(constants).sort().map((k) => constants[k]),
      services: Object.keys(services).map((key) => services[key]),
    };
  }

  /**
   * Convert Function AST statement to JSON representation
   */
  public funcToJson = (func: FunctionDefinition, file: string): ThriftFile.IFunction => {
    const { typeId: returnTypeId, type: returnType, extra: returnExtra } = this.astToType(func.returnType, file);
    return {
      name: func.name.value,
      returnTypeId,
      ...returnType && { returnType },
      ...returnExtra && { returnExtra },
      oneway: func.oneway,
      ...this.comments(func.comments),
      arguments: func.fields.map((f) => this.fieldToJson(f, file)),
      exceptions: func.throws.map((t) => this.fieldToJson(t, file) as ThriftFile.IException),
    };
  }

  /**
   * Convert Field AST statement to JSON representation
   */
  public fieldToJson = (field: FieldDefinition, file: string): ThriftFile.IField => {
    if (!field.fieldID || field.fieldID.value < 1) {
      throw new ThriftError("Invalid field id", file, field.loc);
    }
    return {
      key: field.fieldID.value,
      name: field.name.value,
      ...this.astToType(field.fieldType, file),
      required: field.requiredness || "req_out" as "req_out",
      ...field.defaultValue && { default: this.constToJson(field.defaultValue) },
    };
  }

  /**
   * Convert Type AST representation to JSON type
   */
  public astToType = (ast: FunctionType, file: string): ThriftFile.IFieldType => {
    switch (ast.type) {
      case SyntaxType.Identifier:
        return this.identToType(ast, file);
      case SyntaxType.SetType:
      case SyntaxType.ListType:
        const { typeId: elemTypeId, type: elemType, extra } = this.astToType(ast.valueType, file);
        return {
          typeId: KEYWORDS[ast.type],
          type: {
            typeId: KEYWORDS[ast.type] as "set",
            elemTypeId, elemType, extra,
          },
        };
      case SyntaxType.MapType:
        const { typeId: keyTypeId, type: keyType, extra: keyExtra } = this.astToType(ast.keyType, file);
        const { typeId: valueTypeId, type: valueType, extra: valueExtra } = this.astToType(ast.valueType, file);
        return {
          typeId: KEYWORDS.MapType,
          type: {
            typeId: KEYWORDS.MapType,
            keyTypeId, valueTypeId,
            ...keyType && { keyType }, ...valueType && { valueType },
            ...keyExtra && { keyExtra }, ...valueExtra && { valueExtra },
          },
        };
      case SyntaxType.StringKeyword:
      case SyntaxType.DoubleKeyword:
      case SyntaxType.BoolKeyword:
      case SyntaxType.I8Keyword:
      case SyntaxType.I16Keyword:
      case SyntaxType.I32Keyword:
      case SyntaxType.I64Keyword:
      case SyntaxType.BinaryKeyword:
      case SyntaxType.ByteKeyword:
      case SyntaxType.VoidKeyword:
        return {
          typeId: KEYWORDS[ast.type],
        };
    }
  }

  /**
   * Convert Identifier AST to JSON type
   */
  public identToType = (ast: Identifier, file: string): ThriftFile.IFieldType => {
    const ident = this.identifiers[this.ident(ast)];
    if (!ident) {
      throw new ThriftError(`Can't find "${ast.value}" identifier`, file, ast.loc);
    }
    switch (ident.type) {
      case SyntaxType.StructDefinition:
        return {
          typeId: KEYWORDS.StructDefinition,
          type: {
            typeId: KEYWORDS.StructDefinition,
            class: this.ident(ast),
          },
        };
      case SyntaxType.UnionDefinition:
        return {
          typeId: KEYWORDS.UnionDefinition,
          type: {
            typeId: KEYWORDS.UnionDefinition,
            class: this.ident(ast),
          },
        };
      case SyntaxType.ExceptionDefinition:
        return {
          typeId: "exception",
          type: {
            typeId: "exception",
            class: this.ident(ast),
          },
        };
      case SyntaxType.EnumDefinition:
        return {
          typeId: KEYWORDS.I32Keyword,
          extra: {
            typeId: "enum",
            class: this.ident(ast),
          },
        };
      case SyntaxType.TypedefDefinition:
        return {
          ...this.astToType(ident.definitionType, file),
          extra: {
            typeId: "typedef",
            class: this.ident(ast),
          },
        };
    }
  }

  /**
   * Convert Constant value to JSON type
   */
  public constToJson = (constant: ConstValue): any => {
    switch (constant.type) {
      case SyntaxType.StringLiteral:
      case SyntaxType.BooleanLiteral:
      case SyntaxType.Identifier:
        return constant.value;
      case SyntaxType.IntConstant:
        return parseInt(constant.value.value);
      case SyntaxType.DoubleConstant:
        return parseFloat(constant.value.value);
      case SyntaxType.ConstMap:
        return constant.properties.reduce((acum, v) => ({
          ...acum, [this.constToJson(v.name)]: this.constToJson(v.initializer),
        }), {});
      case SyntaxType.ConstList:
        return constant.elements.map(this.constToJson);
    }
  }

  public comments = (input: Comment[]) => {
    if (input.length === 0) { return {}; }
    const doc = input.reduce((a, v) => {
      switch (v.type) {
        case SyntaxType.CommentLine:
          return a + v.value;
        case SyntaxType.CommentBlock:
          return a + v.value.join("");
      }
    }, "");
    return { doc };
  }

  public ident = (input: Identifier) => (
    input.value.split(".").pop() || input.value
  )
}
export default ThriftParser;
