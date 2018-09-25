import { AnyAction } from "redux";

const initial: {[key: string]: any} = {};

export function responses(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/GET_RESPONSES":
    return {...state, [action.id]: action.responses};
  case "@@IPC_RESPONSE/ADD_RESPONSE":
    const { id, response } = action;
    let resp = state[id] || {};
    resp = {...resp, ...response};
    return {...state, [action.id]: resp};
  default:
    return state;
  }
}
