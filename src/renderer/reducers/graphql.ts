import { AnyAction } from "redux";

const initial = {};

export function graphql(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/GET_GRAPHQL":
    return {...state, [action.id]: action.schema};
  default:
    return state;
  }
}
