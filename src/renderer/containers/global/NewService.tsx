import { GraphqlLogo, ThriftLogo } from "@renderer/components/logos";
import { Card, Icon, Modal } from "antd";
import * as React from "react";
import { connect } from "react-redux";

const Grid: any = Card.Grid;

interface IProps {
  cancel: () => void;
  newService: (type: string) => void;
}

const data = (newService: (type: string) => void) => [
  {
    icon: <i className="anticon" style={{fontSize: 18, paddingRight: 5}}><GraphqlLogo /></i>,
    title: "GraphQL",
    description: `GraphQL is a query language for APIs and a runtime for fulfilling
      those queries with your existing data. It gives clients the power
      to ask for exactly what they need and nothing more.`,
    onClick: () => newService("GRAPHQL_SERVICE"),
  },
  {
    icon: <i className="anticon" style={{fontSize: 18, paddingRight: 5}}><ThriftLogo /></i>,
    title: "Apache Thrift",
    description: `Software framework, for scalable cross-language services development,
      combines a software stack with a code generation engine for multiple languages.`,
    onClick: () => newService("THRIFT_SERVICE"),
  },
  {
    icon: <Icon type="global"  style={{fontSize: 18, paddingRight: 5}} />,
    title: "REST",
    description: `Representational State Transfer (REST) is an architectural style that
                  defines a set of constraints and properties based on HTTP.`,
    onClick: () => newService("REST_SERVICE"),
  },
];

const gridStyle = {
  width: "100%",
  cursor: "pointer",
};

export const NewService: React.SFC<IProps> = ({cancel, newService}) =>
  <Modal title="New Mimic Service" visible onOk={cancel} onCancel={cancel} footer="">
    <h3>Choose Service Type:</h3>
    <Card>
      {data(newService).map((item, i) =>
        <Grid style={gridStyle} key={i} onClick={item.onClick}>
          <h4>{item.icon} {item.title}</h4>
          {item.description}
        </Grid>,
      )}
    </Card>
  </Modal>;

const mapDispatchToProps = (dispatch: any) => ({
  cancel: () => dispatch({type: "MODAL"}),
  newService: (type: string) => dispatch({type: "MODAL", window: type}),
});
export default connect(null, mapDispatchToProps)(NewService);
