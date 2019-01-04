import { IServiceJson, IUniq } from "@creditkarma/mimic-core";
import { Icon, Menu, Modal } from "antd";
import * as React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { MenuSwitch } from "./components";
import { GraphqlLogo, GrpcLogo, ThriftLogo } from "./components/logos";

const confirm = Modal.confirm;

interface IProps {
  services: IUniq<IServiceJson>;
  switchService: (services: IUniq<IServiceJson>, id: string, enabled: boolean) => void;
}

const sortServices = (services: IUniq<IServiceJson>, type: string) =>
  Object.values(services).filter((s) => s.type === type).sort((a, b) => a.alias.localeCompare(b.alias));

const SideNav: React.SFC<RouteComponentProps<any> & IProps> = ({ location, services, switchService }) => (
  <Menu mode="inline" defaultOpenKeys={["sub1", "sub2", "sub3", "sub4"]} selectedKeys={[location.pathname]}>
    <Menu.SubMenu key="sub1" title={<span>Favorites</span>}>
      <Menu.Item key="/requests">
        <Link to="/requests">
          <Icon type="dashboard" />
          <span>Requests</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/client">
        <Link to="/client">
          <Icon type="rocket" />
          <span>Client</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/graphql">
        <Link to="/graphql">
          <i className="anticon"><GraphqlLogo/></i>
          <span>GraphQL</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/thrift">
        <Link to="/thrift">
          <i className="anticon"><ThriftLogo/></i>
          <span>Thrift</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/grpc">
        <Link to="/grpc">
          <i className="anticon"><GrpcLogo/></i>
          <span>gRPC</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/rest">
        <Link to="/rest">
          <Icon type="global" />
          <span>REST</span>
        </Link>
      </Menu.Item>
    </Menu.SubMenu>
    <Menu.SubMenu key="sub2" title={<span>GraphQL Services</span>}>
      {sortServices(services, "graphql").map(({enabled, id, alias}) =>
        MenuSwitch({ enabled, url: `/graphql_services/${id}`, name: alias,
          onChange: (checked) => switchService(services, id, checked),
        }),
      )}
    </Menu.SubMenu>
    <Menu.SubMenu key="sub3" title={<span>Thrift Services</span>}>
      {sortServices(services, "thrift").map(({enabled, id, alias}) =>
        MenuSwitch({ enabled, url: `/thrift_services/${id}`, name: alias,
          onChange: (checked) => switchService(services, id, checked),
        }),
      )}
    </Menu.SubMenu>
    <Menu.SubMenu key="sub4" title={<span>gRPC Services</span>}>
      {sortServices(services, "grpc").map(({enabled, id, alias}) =>
        MenuSwitch({ enabled, url: `/grpc_services/${id}`, name: alias,
          onChange: (checked) => switchService(services, id, checked),
        }),
      )}
    </Menu.SubMenu>
    <Menu.SubMenu key="sub5" title={<span>REST Services</span>}>
    {sortServices(services, "rest").map(({enabled, id, alias}) =>
        MenuSwitch({ enabled, url: `/rest_services/${id}`, name: alias,
          onChange: (checked) => switchService(services, id, checked),
        }),
      )}
    </Menu.SubMenu>
  </Menu>
);

const mapStateToProps = ({ services }: IProps) => ({ services });
const mapDispatchToProps = (dispatch: any) => ({
  switchService: (services: IUniq<IServiceJson>, id: string, enabled: boolean) => {
    const service = services[id];
    if (enabled) {
      const listen = Object.values(services).find((s) => s.port === service.port && s.enabled);
      if (listen) {
        confirm({
          title: `Port ${listen.port} is already taken`,
          content: `Service "${listen.alias}" is already listening to the port ${listen.port}.
                    Would you like to stop it?`,
          onOk: () => {
            dispatch({ type: "@@IPC_REQUEST/SWITCH_SERVICE", id, enabled });
          },
          onCancel: () => null,
        });
        return;
      }
    }
    dispatch({ type: "@@IPC_REQUEST/SWITCH_SERVICE", id, enabled });
  },
});
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SideNav));
