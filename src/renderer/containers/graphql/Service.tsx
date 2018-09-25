import { IResponses, IUniq } from "@creditkarma/mimic-core";
import { IGraphqlServiceJson, IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { trimLines } from "@renderer/components";
import { Anchor, Button, Col, Row, Table } from "antd";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import DetailsCard from "./DetailsCard";
import { Documentation } from "./Documentation";
const { Link } = Anchor;

interface IParams {
  id: string;
}
interface IProps extends RouteComponentProps<IParams> {
  responses: IResponses;
  services: IUniq<IGraphqlServiceJson>;
  graphql: IUniq<IGraphqlTypes>;
  loadGraphql: (id: string) => void;
  loadResponses: (id: string) => void;
  newResponse: (id: string, func?: string) => void;
}

const expanded = ({ data }: any) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type: "application/json"});
  return <div>
    <pre className="json">
      <code>{trimLines(json, 200)}</code>
    </pre>
    <Button type="primary" href={URL.createObjectURL(blob)} download="untitled.json" icon="download">Download</Button>
  </div>;
};

class Service extends React.Component<IProps, {}> {
  public componentDidMount() {
    this.loadData(this.props);
  }

  public componentWillReceiveProps(nextProps: IProps) {
    const { match: { params: { id: oldId } } } = this.props;
    const { match: { params: { id: newId } } } = nextProps;
    if (oldId !== newId) { this.loadData(nextProps); }
  }

  public loadData(props: IProps) {
    const { loadResponses, loadGraphql, responses, graphql, match: { params: { id } } } = props;
    if (!graphql[id]) { loadGraphql(id); }
    if (!responses[id]) { loadResponses(id); }
  }

  public render() {
    const { newResponse, match: { params: { id } }, responses, services } = this.props;
    const service = services[id];
    const graphql = this.props.graphql[id];
    return (
      <div style={{ padding: 15 }}>
        <Row gutter={8}>
          <Col span={19}>
            <h2 id="Details">Details</h2>
            {service ? <DetailsCard service={service} /> : null}
            <br />
            <h2 id="Responses">Responses</h2>
            <Table
              columns={this.reponseColumns()}
              dataSource={this.responses(responses[id] || {})}
              expandedRowRender={expanded}
              rowKey="type"
            />
            <Row type="flex" justify="end" style={{ padding: 10 }}>
              <Button onClick={() => newResponse(id)} size="large" icon="plus">Add</Button>
            </Row>
            {graphql ? <Documentation graphql={graphql} /> : null}
          </Col>
          <Col span={5}>
            <div onClick={(e) => e.preventDefault()} style={{ paddingTop: 30, minWidth: 220 }}>
              {this.renderAnchor()}
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  public reponseColumns = () => {
    const { match: { params: { id } }, newResponse } = this.props;
    return [{
      title: "Type",
      dataIndex: "type",
    }, {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, rec: any) => <a onClick={() => newResponse(id, rec.type)}>Edit</a>,
    }];
  }

  public renderAnchor = () =>
    <Anchor offsetTop={30} style={{ paddingBottom: 15 }}>
      <Link href="#Details" title="Details" />
      <Link href="#Responses" title="Responses" />
      <Link href="#Search" title="Search" />
      <Link href="#Schema" title="Schema" />
      <Link href="#OBJECT" title="Objects" />
      <Link href="#INPUT_OBJECT" title="Input Object" />
      <Link href="#INTERFACE" title="Interfaces" />
      <Link href="#UNION" title="Unions" />
      <Link href="#ENUM" title="Enums" />
      <Link href="#SCALAR" title="Scalars" />
    </Anchor>

  public responses = (resp: IResponses) =>
    Object.entries(resp).map(([type, data]) => (
      { type, data }
    ))
}

const mapStateToProps = ({ responses, services, graphql }: IProps) => ({ responses, services, graphql });
const mapDispatchToProps = (dispatch: any) => ({
  loadGraphql: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_GRAPHQL", id }),
  loadResponses: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_RESPONSES", id }),
  newResponse: (id: string, schema?: string) => {
    dispatch({ type: "MODAL", window: "GRAPHQL_RESPONSE", id, schema });
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(Service);
