import { AnyAction } from "redux";

const initial: any = {};

export function services(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/GET_SERVICES":
    return action.services;
  case "@@IPC_RESPONSE/ADD_SERVICE":
    return {...state, [action.service.id]: action.service};
  case "@@IPC_RESPONSE/UPDATE_SERVICE":
    return {...state, [action.id]: {...state[action.id], ...action.service}};
  case "@@IPC_RESPONSE/DELETE_SERVICE":
    const newState = {...state};
    delete newState[action.id];
    return newState;
  case "@@IPC_RESPONSE/SWITCH_SERVICE":
    const service = state[action.id];
    service.enabled = action.enabled;
    return {...state, [action.id]: service};
  default:
    return state;
  }
}
