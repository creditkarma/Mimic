import * as thrift from "thrift";
import { inherits } from "util";
import { createClient } from "./client";
import * as ThriftFile from "./file";
import { readArg, readStruct, writeStruct } from "./struct";
const { Thrift } = thrift;

export function addService(serv: ThriftFile.IService, ns: any, def: ThriftFile.IJSON) {
  serv.functions.forEach((f) => addArgsFunction(f, serv.name, ns));
  serv.functions.forEach((f) => addResultFunction(f, serv.name, ns));
  return {
    Client: createClient(serv, ns),
    Processor: addProcessor(serv, ns, def),
  };
}

function addArgsFunction(f: ThriftFile.IFunction, service: string, ns: any) {
  const argsName = `${service}_${f.name}_args`;
  const argsFunc = function(this: any, args?: any) {
    f.arguments.forEach((a) => this[a.name] = null);
    if (args) {
      f.arguments.forEach((a) => this[a.name] = readArg(a.name, args, a, ns));
    }
  };
  argsFunc.prototype = {};
  argsFunc.prototype.read = readStruct(f.arguments, ns);
  argsFunc.prototype.write = writeStruct(f.arguments, argsName);
  ns[argsName] = argsFunc;
}

function addResultFunction(f: ThriftFile.IFunction, service: string, ns: any) {
  const resultName = `${service}_${f.name}_result`;
  const success = { key: 0, name: "success", typeId: f.returnTypeId,
                    type: f.returnType, required: "req_out" as "req_out"};
  const fields = [success, ...f.exceptions];
  const resultFunc = function(this: any, args?: any) {
    fields.forEach((a) => this[a.name] = null);
    for (const e of f.exceptions) {
      if (args instanceof ns[e.type.class]) {
        this[e.name] = args;
        return;
      }
    }
    if (args) {
      fields.forEach((a) => this[a.name] = readArg(a.name, args, a, ns));
    }
  };
  resultFunc.prototype = {};
  resultFunc.prototype.read = readStruct(fields, ns);
  resultFunc.prototype.write = writeStruct(fields, resultName);
  ns[resultName] = resultFunc;
}

function skipStruct(input: thrift.TProtocol): Buffer {
  input.readStructBegin();
  while (true) {
    const ret = input.readFieldBegin();
    const ftype = ret.ftype;
    if (ftype === Thrift.Type.STOP) { break; }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  const transport: any = input.getTransport();
  const position = transport.readCursor;
  transport.rollbackPosition();
  return transport.read(position);
}

function addProcessor(s: ThriftFile.IService, ns: any, def: ThriftFile.IJSON) {
  const processor = function(this: any, handler: any) {
    this._handler = handler;
  };
  // Extend from other service if specified
  if (s.extends) { inherits(processor, ns[s.extends].Processor); }
  processor.prototype.process = function(this: any, input: thrift.TProtocol, output: thrift.TProtocol) {
    let r: thrift.TMessage;
    try {
      r = input.readMessageBegin();
    } catch (err) {
      // Hadle Upgraded Thrift protocol
      input.getTransport().rollbackPosition();
      output.getTransport().write(skipStruct(input));
      r = input.readMessageBegin();
    }
    if (this["process_" + r.fname]) {
      return this["process_" + r.fname].call(this, r.rseqid || 0, input, output);
    } else {
      input.skip(Thrift.Type.STRUCT);
      input.readMessageEnd();
      const x = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN_METHOD,
        `Unknown function  ${r.fname}`);
      output.writeMessageBegin(r.fname, Thrift.MessageType.EXCEPTION, r.rseqid);
      x.write(output);
      output.writeMessageEnd();
      output.flush();
    }
  };
  s.functions.forEach((f) => processor.prototype[`process_${f.name}`] = addProcessFunc(f, s.name, ns, def));
  return processor;
}

function addProcessFunc(f: ThriftFile.IFunction, service: string, ns: any, def: ThriftFile.IJSON) {
  return function(this: any, seqid: number, input: thrift.TProtocol, output: thrift.TProtocol) {
    try {
      const args = new ns[`${service}_${f.name}_args`]();
      args.read(input);
      input.readMessageEnd();
      this._handler(f, args, (data: any, exception?: string) => {
        if (f.oneway) { return; }
        const resultObj = new ns[`${service}_${f.name}_result`](exception ? ns[exception](data) : {success: data});
        output.writeMessageBegin(f.name, Thrift.MessageType.REPLY, seqid);
        resultObj.write(output);
        output.writeMessageEnd();
        output.flush();
      });
    } catch (ex) {
      /* tslint:disable */
      console.log(ex);
      /* tslint:enable */
      throw(ex);
    }
  };
}
