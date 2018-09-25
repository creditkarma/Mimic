import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import { ipcMiddleware, logger } from "./middleware";
import * as reducers from "./reducers";

const middleware = [ipcMiddleware];
if (process.env.NODE_ENV === "production") {
  middleware.push(logger);
}
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore() {
  const rootReducer = combineReducers(reducers);
  const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middleware)));

  if (module.hot) {
    module.hot.accept("./reducers", () => {
      store.replaceReducer(rootReducer);
    });
  }

  return store;
}
