import { renderApp } from "./app";
import configureStore from "./store";
import "./styles.css";

const store = configureStore();

renderApp({store});

if (module.hot) {
  module.hot.accept("./app", () => {
    renderApp({store});
  });
}

store.dispatch({ type: "@@IPC_REQUEST/GET_SERVICES" });
store.dispatch({ type: "@@IPC_REQUEST/GET_REQUESTS" });
