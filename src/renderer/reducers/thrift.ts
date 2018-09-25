import { AnyAction } from "redux";

const initial = {};

export function thrift(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/GET_THRIFT":
    return {...state, [action.id]: action.thrift};
  default:
    return state;
  }
}
