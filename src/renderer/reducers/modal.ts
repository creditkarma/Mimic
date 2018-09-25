import { AnyAction } from "redux";

export function modal(state = {}, action: AnyAction) {
  // Don't act on errors
  if (action.error) { return state; }

  switch (action.type) {
    case "MODAL":
      return action;
    case "@@IPC_RESPONSE/ADD_SERVICE":
      return {};
    case "@@IPC_RESPONSE/ADD_RESPONSE":
      return {};
    case "@@IPC_REQUEST/EXPORT":
      return {};
    default:
      return state;
  }
}
