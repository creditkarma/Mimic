import { IGraphqlServiceJson } from "@creditkarma/mimic-graphql";
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
  service: IGraphqlServiceJson;
}

const DetailsCard: React.SFC<IProps> = ({service}) => (
  <Card>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Alias">{service.alias}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Port">{service.port}</Wrapper>
    </Card.Grid>
    <Card.Grid style={gridStyle}>
      <Wrapper title="Files">
        <Popover content={service.files.map((f, i) => <p key={i}>{f}</p>)}>
          {service.files.length === 1 ? service.files[0].split("/").pop() : `${service.files.length} files`}
          </Popover>
      </Wrapper>
    </Card.Grid>
    {service.git ? <Card.Grid style={gridStyle}>
      <Wrapper title="Git">
        <Popover content={`HEAD: ${service.git.head}`}>{service.git.branch}</Popover>
      </Wrapper>
    </Card.Grid> : null}
  </Card>
);

export default DetailsCard;
