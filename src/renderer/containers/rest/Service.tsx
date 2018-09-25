import { IResponses, IServiceJson, IUniq } from "@creditkarma/mimic-core";
import { trimLines } from "@renderer/components";
import { Button, Row, Table } from "antd";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import DetailsCard from "./DetailsCard";

interface IParams {
  id: string;
}
interface IProps extends RouteComponentProps<IParams> {
  responses: IResponses;
  services: IUniq<IServiceJson>;
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

  public loadData(props: IProps) {
    const { loadResponses, responses, match: { params: { id } } } = props;
    if (!responses[id]) { loadResponses(id); }
  }

  public render() {
    const { match: { params: { id } }, responses, services } = this.props;
    const service = services[id];
    return (
      <div style={{ padding: 15 }}>
        <h2 id="Details">Details</h2>
        {service ? <DetailsCard service={service} /> : null}
        <br />
        <h2 id="Responses">Responses</h2>
        <Table
          columns={this.columns()}
          dataSource={this.responses(responses[id] || {})}
          expandedRowRender={expanded}
          rowKey="func"
        />
        <Row type="flex" justify="end" style={{ padding: 10 }}>
          <Button onClick={() => this.props.newResponse(id)} size="large" icon="plus">Add</Button>
        </Row>
      </div>
    );
  }
  public columns = () => {
    const { match: { params: { id } }, newResponse } = this.props;
    return [{
      title: "Method",
      dataIndex: "method",
    }, {
      title: "path",
      dataIndex: "path",
    }, {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, rec: any) => {
        return <a onClick={() => newResponse(id, rec.index)}>Edit</a>;
      },
    }];
  }
  public responses = (resp: IResponses) =>
    Object.entries(resp).map(([index, response]) => (
      { index, ...response }
    ))
}

const mapStateToProps = ({ responses, services }: IProps) => ({ responses, services });
const mapDispatchToProps = (dispatch: any) => ({
  loadResponses: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_RESPONSES", id }),
  newResponse: (id: string, index?: string) => {
    dispatch({ type: "MODAL", window: "REST_RESPONSE", id, index });
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(Service);
