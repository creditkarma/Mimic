import { IServiceJson } from "@creditkarma/mimic-core";
import { Card } from "antd";
import * as React from "react";

const gridStyle = {
  padding: "0px",
  width: "auto",
};

interface IWrapperProps {
  children: any;
  title: string;
}

const Wrapper: React.SFC<IWrapperProps> = ({children, title}) => (
  <div>
    <span style={{float: "right", paddingRight: 5, fontSize: 12}}>{title}</span>
    <div style={{padding: "20px 25px 20px 25px", height: "4em", fontSize: 16, color: "black"}}>
      {children}
    </div>
  </div>
);

interface IProps {
  service: IServiceJson;
}

const DetailsCard: React.SFC<IProps> = ({service}) => (
  <Card>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Alias">{service.alias}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Type">REST</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Port">{service.port}</Wrapper>
    </Card.Grid>
  </Card>
);

export default DetailsCard;
