import { AnyAction } from "redux";

const initial: any = {
  path: "",
  includes: [],
};

export function thriftFile(state = initial, action: AnyAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "@@IPC_RESPONSE/PARSE_THRIFT_FILE":
      return rest;
    default:
      return state;
  }
}
