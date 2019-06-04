import { IUniq } from "@creditkarma/mimic-core";
import { Icon, Tabs } from "antd";
import { ServiceType } from "common/redux_events";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ThriftClient } from "./index";
const TabPane = Tabs.TabPane;

interface IProps {
  services: IUniq<ServiceType>;
}

const clientPage = (service: ServiceType) => {
  switch (service.type) {
  case "thrift":
    return <ThriftClient service={service} />;
  default:
    return null;
  }
};

export const IndexPage: React.SFC<IProps> = ({services}) => {
  const tabs = Object.values(services).filter((s) => s.type === "thrift");
  if (tabs.length > 0) {
    return <Tabs type="card" className="client-tabs">
      {tabs.map((s) =>
        <TabPane tab={s.alias} key={s.id}>{clientPage(s)}</TabPane>,
      )}
    </Tabs>;
  }
  return <h1 className="no-clients">
    Create <Link to="/thrift">Thrift</Link> Service ... <Icon style={{color: "orange"}} type="rocket"/>
  </h1>;
};

const mapStateToProps = ({ services }: IProps) => ({ services });

export default connect(mapStateToProps)(IndexPage);
