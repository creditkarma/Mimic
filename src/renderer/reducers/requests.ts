import { AnyAction } from "redux";

const initial: any[] = [];

export function requests(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/GET_REQUESTS":
    return [...action.requests, ...state.slice(0, 100)];
  default:
    return state;
  }
}
