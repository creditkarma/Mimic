import { Layout } from "antd";
import * as React from "react";
import { HashRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import { graphql, requests, rest, thrift } from "./containers";
import SideNav from "./side_nav";

const Routes = () => (
  <Router>
    <Layout>
      <Layout.Sider width="250">
        <SideNav/>
      </Layout.Sider>
      <Layout.Content style={{paddingLeft: 250}}>
        <Switch>
          <Redirect exact from="/" to="/requests"/>
          <Route path="/requests" component={requests.IndexPage} />
          <Route path="/graphql" component={graphql.IndexPage} />
          <Route path="/thrift" component={thrift.IndexPage} />
          <Route path="/rest" component={rest.IndexPage} />
          <Route path="/graphql_services/:id" component={graphql.Service} />
          <Route path="/thrift_services/:id" component={thrift.Service} />
          <Route path="/rest_services/:id" component={rest.Service} />
        </Switch>
      </Layout.Content>
    </Layout>
  </Router>
);
export default Routes;
