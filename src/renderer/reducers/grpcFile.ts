import { AnyAction } from "redux";

const initial: any = {
  path: "",
  // includes: [],
};

export function grpcFile(state = initial, action: AnyAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "@@IPC_RESPONSE/PARSE_GRPC_FILE":
      return rest;
    default:
      return state;
  }
}
