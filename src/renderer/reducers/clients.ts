import { IUniq } from "@creditkarma/mimic-core/src";
import { AnyAction } from "redux";

const initial: IUniq<any[]> = {};

export function clients(state = initial, action: AnyAction) {
  if (action.error) { return state; }

  switch (action.type) {
  case "@@IPC_RESPONSE/SEND_REQUEST":
    const { request, response } = action;
    const { id } = request;
    const prev = state[id] || [];
    return {...state, [id]: [{request, response}, ...prev]};
  default:
    return state;
  }
}
