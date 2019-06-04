import { notification } from "antd";
import * as React from "react";
import { connect } from "react-redux";

interface IProps {
  notifications: {
    error?: any;
    type: string;
    [key: string]: any;
  };
}

const error = (err: {[key: string]: any}) =>
  <div>
    {Object.entries(err).map(([k, v]) => <p>{k}: <code>{v}</code></p>)}
  </div>;

export const Notifications: React.SFC<IProps> = ({ notifications }) => {
  if (notifications.error) {
    notification.error({ message: "Error", duration: 0, description: error(notifications.error) });
    return null;
  }
  switch (notifications.type) {
    case "@@IPC_RESPONSE/ADD_SERVICE":
      notification.success({ message: "New Service Created", description: "", duration: 1 });
      break;
    case "@@IPC_RESPONSE/SWITCH_SERVICE":
      notification.success({
        message: `Service ${notifications.enabled ? "Enabled" : "Disabled"}`,
        description: "", duration: 1,
      });
      break;
    case "@@IPC_RESPONSE/ADD_RESPONSE":
      notification.success({message: "Response Persisted", description: "", duration: 1});
      break;
    case "@@IPC_RESPONSE/EXPORT":
      notification.success({message: "Services Exported", description: "", duration: 1});
      break;
  }
  return null;
};

const mapStateToProps = ({ notifications }: IProps) => ({ notifications });
export default connect(mapStateToProps)(Notifications);
