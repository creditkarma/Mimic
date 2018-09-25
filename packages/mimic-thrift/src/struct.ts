import * as thrift from "thrift";
import { inherits } from "util";
import * as ThriftFile from "./file";
const { Thrift } = thrift;

// Add Struct to namespace
export function addStruct(s: ThriftFile.IStruct, ns: any) {
  // Build Struct function
  const struct = function(this: any, args?: any) {
    if (s.isException) {
      Thrift.TException.call(this, s.name);
      this.name = s.name;
    }
    // Set default values
    s.fields.forEach((f) => this[f.name] = f.default || null);
    // if args provided
    if (args) {
      s.fields.forEach((f) => this[f.name] = readArg(f.name, args, f, ns));
    }
  };
  if (s.isException) {
    inherits(struct, Thrift.TException);
    struct.prototype.name = s.name;
  } else {
    struct.prototype = {};
  }
  struct.prototype.read = readStruct(s.fields, ns);
  struct.prototype.write = writeStruct(s.fields, s.name);
  return struct;
}

function readStructField(type: ThriftFile.СompositionalType, input: thrift.TProtocol, ns: any) {
    const struct = new ns[type.class]();
    struct.read(input);
    return struct;
  }

function readListField(type: ThriftFile.IListType, input: thrift.TProtocol, ns: any) {
  const list = [];
  const { size } = input.readListBegin();
  for (let i = 0; i < size; ++i) {
    const record = readField(type.elemTypeId, input, ns, type.elemType);
    list.push(record);
  }
  input.readListEnd();
  return list;
}

function readSetField(type: ThriftFile.ISetType, input: thrift.TProtocol, ns: any) {
  const set = [];
  const { size } = input.readSetBegin();
  for (let i = 0; i < size; ++i) {
    const record = readField(type.elemTypeId, input, ns, type.elemType);
    set.push(record);
  }
  input.readSetEnd();
  return set;
}

function readMapField(type: ThriftFile.IMapType, input: thrift.TProtocol, ns: any) {
  const map: any = {};
  const { size } = input.readMapBegin();
  for (let i = 0; i < size; ++i) {
    const key = readField(type.keyTypeId, input, ns, type.keyType);
    const value = readField(type.valueTypeId, input, ns, type.valueType);
    map[key] = value;
  }
  input.readMapEnd();
  return map;
}

function readField(typeId: string, input: thrift.TProtocol, ns: any, type?: ThriftFile.Type): any {
  // Handle Complex types
  if (type) {
    switch (type.typeId) {
      // Handle Struct
    case "struct":
    case "union":
    case "exception":
      return readStructField(type, input, ns);
    case "list":
      return readListField(type, input, ns);
    case "set":
      return readSetField(type, input, ns);
    case "map":
      return readMapField(type, input, ns);
    default:
      throw new Error(`Can't handle "${typeId}" type yet`);
    }
  } else {
    switch (typeId) {
    case "i64":
      return (input as any)[`read${capitalize(typeId)}`]().toNumber();
    default:
      return (input as any)[`read${capitalize(typeId)}`]();
    }
  }
}

export function readStruct(fields: ThriftFile.FieldOrArg[], ns: any) {
  // Map fields to object
  const mappedFields: {[key: number]: ThriftFile.FieldOrArg} = {};
  fields.forEach((f) => mappedFields[f.key] = f);
  // Return function
  return function(this: any, input: thrift.TProtocol) {
    input.readStructBegin();
    while (true) {
      const ret = input.readFieldBegin();
      const ftype = ret.ftype;
      const fid = ret.fid;
      if (ftype === Thrift.Type.STOP) {
        break;
      }
      const field = mappedFields[fid];
      // If field exists and type matches
      const typeId = ["struct", "union", "exception"].includes(field.typeId) ? "struct" : field.typeId;
      if (field && ftype === (Thrift.Type as any)[typeId.toUpperCase()]) {
        this[field.name] = readField(typeId, input, ns, field.type);
      } else {
        input.skip(ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return;
  };
}

function writeField(output: thrift.TProtocol, typeId: string, data: any, type?: ThriftFile.Type) {
// Handle Complex types
  if (type) {
    switch (type.typeId) {
    // Handle Struct
    case "struct":
    case "union":
    case "exception":
      data.write(output);
      break;
    case "list":
      output.writeListBegin((Thrift.Type as any)[type.elemTypeId.toUpperCase()], data.length);
      for (const record of data) {
        writeField(output, type.elemTypeId, record, type.elemType);
      }
      output.writeListEnd();
      break;
    case "set":
      output.writeSetBegin((Thrift.Type as any)[type.elemTypeId.toUpperCase()], data.length);
      for (const record of data) {
        writeField(output, type.elemTypeId, record, type.elemType);
      }
      output.writeSetEnd();
      break;
    case "map":
      const keyType = (Thrift.Type as any)[type.keyTypeId.toUpperCase()];
      const valType = (Thrift.Type as any)[type.valueTypeId.toUpperCase()];
      output.writeMapBegin(keyType, valType, Thrift.objectLength(data));
      for (const key of Object.keys(data)) {
        writeField(output, type.keyTypeId, key, type.keyType);
        writeField(output, type.valueTypeId, data[key], type.valueType);
      }
      output.writeMapEnd();
      break;
    default:
      throw new Error(`Can't handle "${typeId}" type yet`);
    }
  } else {
    (output as any)[`write${capitalize(typeId)}`](data);
  }
}

export function writeStruct(fields: ThriftFile.FieldOrArg[], name: string) {
  return function(this: any, output: thrift.TProtocol) {
    output.writeStructBegin(name);
    // Iterate every field
    fields.forEach((f) => {
      // If field is not empty;
      if (this[f.name] !== null && this[f.name] !== undefined) {
        const typeId = ["struct", "union", "exception"].includes(f.typeId) ? "struct" : f.typeId;
        output.writeFieldBegin(f.name, (Thrift.Type as any)[typeId.toUpperCase()], f.key);
        writeField(output, f.typeId, this[f.name], f.type);
        output.writeFieldEnd();
      }
    });
    output.writeFieldStop();
    output.writeStructEnd();
    return;
  };
}

export function readArg(name: string, args: any, f: ThriftFile.FieldOrArg, ns: any) {
  let klass = null;
  // Read args
  if (args[name] !== undefined && args[name] !== null) {
    // Handle complex types
    if (f.type) {
      switch (f.type.typeId) {
      // Handle Struct
      case "struct":
      case "union":
      case "exception":
        return new ns[f.type.class](args[name]);
      case "set":
      case "list":
        if (f.type.elemType) {
          switch (f.type.elemType.typeId) {
          case "struct":
          case "union":
          case "exception":
            klass = ns[f.type.elemType.class];
          }
        }
        return (Thrift as any).copyList(args[name], [klass]);
      case "map":
        if (f.type.valueType) {
          switch (f.type.valueType.typeId) {
          case "struct":
          case "union":
          case "exception":
            klass = ns[f.type.valueType.class];
          }
        }
        return (Thrift as any).copyMap(args[name], [klass]);
      default:
        throw new Error(`Can't handle "${f.typeId}" type yet`);
      }
    } else {
      // Simple types
      return args[name];
    }
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
