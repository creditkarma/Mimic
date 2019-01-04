import * as React from "react";
import { connect } from "react-redux";
import { ExportServices, NewService } from "./global";
import { GraphqlResponse, GraphqlService } from "./graphql";
import { GrpcService } from "./grpc";
import { RestResponse, RestService } from "./rest";
import { ThriftResponse, ThriftService } from "./thrift";

interface IProps {
  modal: {
    window: string;
    [key: string]: any;
  };
}

export const ModalWindow: React.SFC<IProps> = ({ modal }) => {
  const props: any = modal;
  switch (modal.window) {
    case "NEW_SERVICE":
      return <NewService />;
    case "GRAPHQL_SERVICE":
      return <GraphqlService />;
    case "GRAPHQL_RESPONSE":
      return <GraphqlResponse {...props} />;
    case "THRIFT_SERVICE":
      return <ThriftService />;
    case "THRIFT_RESPONSE":
      return <ThriftResponse {...props} />;
    case "GRPC_SERVICE":
      return <GrpcService/>;  //@todo: change to <GrpcService/>
    case "GRPC_RESPONSE":
      return <div {...props}/>;  //@todo: change to <GrpcResponse/>
    case "EXPORT":
      return <ExportServices />;
    case "REST_SERVICE":
      return <RestService />;
    case "REST_RESPONSE":
      return <RestResponse {...props} />;
    default:
      return null;
  }
};

const mapStateToProps = ({ modal }: IProps) => ({ modal });
export default connect(mapStateToProps)(ModalWindow);
