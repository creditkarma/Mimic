import { AnyAction } from "redux";

const initial: any = {
  files: [],
};

export function graphqlFiles(state = initial, action: AnyAction) {
  const { type, ...rest } = action;
  switch (type) {
    case "@@IPC_RESPONSE/PARSE_GRAPHQL":
      return rest;
    default:
      return state;
  }
}
