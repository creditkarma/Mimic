/**
 * @module @creditkarma/mimic-thrift
 */

import * as thrift from "thrift";
import { inherits } from "util";
import * as ThriftFile from "./file";

/* tslint:disable:variable-name */
export function createClient(service: ThriftFile.IService, ns: any) {
  const client = function(this: any, output: thrift.TTransport, protocol: thrift.TProtocolConstructor) {
    this.output = output;
    this.protocol = protocol;
    this._seqid = 0;
    this._reqs = {};
  };
  client.prototype.seqid = function() { return this._seqid; };
  client.prototype.new_seqid = function() { return this._seqid += 1; };
  if (service.extends) { inherits(client, ns[service.extends].Client); }
  service.functions.forEach((f) => {
    // Main
    client.prototype[f.name] = function(this: any, params: any, callback: (err: Error | null, data?: any) => void) {
      // Increment seqid
      this._seqid = this.new_seqid();
      // send request
      this._reqs[this.seqid()] = callback;
      this[`send_${f.name}`](params);
    };
    // Send
    client.prototype[`send_${f.name}`] = function(this: any, params: any) {
      const output = new this.protocol(this.output);
      output.writeMessageBegin(f.name, thrift.Thrift.MessageType.CALL, this.seqid());
      // Build args
      const args = new ns[`${service.name}_${f.name}_args`](params);
      args.write(output);
      output.writeMessageEnd();
      return this.output.flush();
    };
    // Receive
    client.prototype[`recv_${f.name}`] = function(
      this: any, input: any, mtype: thrift.Thrift.MessageType, rseqid: number) {
      const callback = this._reqs[rseqid];
      delete this._reqs[rseqid];
      if (mtype === thrift.Thrift.MessageType.EXCEPTION) {
        const x = new thrift.Thrift.TApplicationException();
        x.read(input);
        input.readMessageEnd();
        return callback(x);
      }
      // Read result
      const result = new ns[`${service.name}_${f.name}_result`]();
      result.read(input);
      input.readMessageEnd();

      const {success, ...rest} = result;
      // Handle exceptions
      for (const key in rest) {
        if (result[key] !== null) {
          return callback(result[key]);
        }
      }
      return callback(null, success);
    };
  });
  return client;
}
