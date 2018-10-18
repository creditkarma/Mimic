import { IThriftServiceJson } from "@creditkarma/mimic-thrift";
import { Card, Popover } from "antd";
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
  service: IThriftServiceJson;
}

const DetailsCard: React.SFC<IProps> = ({service}) => (
  <Card>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Service">{service.service}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Type">{service.useHttp ? "HTTP" : "TCP"}</Wrapper>
    </Card.Grid>
    {service.useHttp ? <Card.Grid style={gridStyle}>
      <Wrapper title="Url">{service.url}</Wrapper>
    </Card.Grid> : null}
    <Card.Grid style={gridStyle}>
      <Wrapper title="Port">{service.port}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Transport">{service.transport}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Protocol">{service.protocol}</Wrapper>
    </Card.Grid>
    {service.proxy ?
      <div>
        <Card.Grid style={gridStyle}>
          <Wrapper title="Mode">Proxy</Wrapper>
        </Card.Grid>
        <Card.Grid style={gridStyle}>
          <Wrapper title="Remote Host">{service.remoteHost}</Wrapper>
        </Card.Grid>
        <Card.Grid style={gridStyle}>
          <Wrapper title="Remote Port">{service.remotePort}</Wrapper>
        </Card.Grid>
      </div> :
      <Card.Grid style={gridStyle}>
        <Wrapper title="Mode">Server</Wrapper>
      </Card.Grid>
    }
    {service.git ? <Card.Grid style={gridStyle}>
      <Wrapper title="Git">
        <Popover content={`HEAD: ${service.git.head}`}>{service.git.branch}</Popover>
      </Wrapper>
    </Card.Grid> : null}
  </Card>
);

export default DetailsCard;
