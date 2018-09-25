import React from "react";
import * as ReactDOM from "react-dom";
import { Provider} from "react-redux";
import { Store } from "redux";
import { ModalWindow, Notifications } from "./containers";
import Routes from "./routes";

interface IProps {
  store: Store<any>;
}

const App: React.SFC<IProps> = ({store}) =>
  <Provider store={store}>
    <div>
      <Routes />
      <Notifications />
      <ModalWindow />
    </div>
  </Provider>;

export const renderApp = (props: IProps) =>
  ReactDOM.render(
    <App {...props} />,
    document.getElementById("app"),
  );

export default App;
