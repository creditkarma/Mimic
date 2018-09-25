import { AnyAction } from "redux";

export function notifications(state = {}, action: AnyAction) {
  // Report errors
  if (action.error) {
    return action;
  }
  // Listen for specific events
  switch (action.type) {
    case "@@IPC_RESPONSE/ADD_SERVICE":
      return action;
    case "@@IPC_RESPONSE/SWITCH_SERVICE":
      return action;
    case "@@IPC_RESPONSE/ADD_RESPONSE":
      return action;
    case "@@IPC_RESPONSE/EXPORT":
      return action;
    default:
      return state;
  }
}
