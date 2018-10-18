import { IResponses, IUniq } from "@creditkarma/mimic-core";
import { formatThrift, IThriftServiceJson, ThriftFile } from "@creditkarma/mimic-thrift";
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
  services: IUniq<IThriftServiceJson>;
  thrift: IUniq<ThriftFile.IJSON>;
  loadThrift: (id: string) => void;
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
    const { loadResponses, loadThrift, responses, thrift, match: { params: { id } } } = props;
    if (!thrift[id]) { loadThrift(id); }
    if (!responses[id]) { loadResponses(id); }
  }

  public render() {
    const { match: { params: { id } }, responses, services } = this.props;
    const service = services[id];
    const thrift = this.props.thrift[id];
    return (
      <div style={{ padding: 15 }}>
        <Row gutter={8}>
          <Col span={19}>
            <h2 id="Details">Details</h2>
            {service ? <DetailsCard service={service} /> : null}
            <br />
            {service && !service.proxy ?
              <div>
                <h2 id="Responses">Responses</h2>
                <Table
                  columns={this.reponseColumns(thrift)}
                  dataSource={this.responses(responses[id] || {})}
                  expandedRowRender={expanded}
                  rowKey="func"
                />
                <Row type="flex" justify="end" style={{ padding: 10 }}>
                  <Button onClick={() => this.props.newResponse(id)} size="large" icon="plus">Add</Button>
                </Row>
              </div> : null
            }
            {thrift ? <Documentation thrift={thrift} /> : null}
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

  public reponseColumns = (thrift?: ThriftFile.IJSON) => {
    const funcs = this.functions(thrift);
    const { match: { params: { id } }, newResponse } = this.props;
    return [{
      title: "Function",
      dataIndex: "func",
    }, {
      title: "Type",
      dataIndex: "exception",
      render: (exception: string, record: any) => {
        if (exception) {
          return formatThrift("", { typeId: "exception" as "exception", class: exception });
        }
        const { returnTypeId, returnType } = funcs[record.func];
        return formatThrift(returnTypeId, returnType);
      },
    }, {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, rec: any) => <a onClick={() => newResponse(id, rec.func)}>Edit</a>,
    }];
  }

  public renderAnchor = () => {
    const { match: { params: { id } }, services } = this.props;
    const { proxy } = services[id];
    return <Anchor offsetTop={30} style={{ paddingBottom: 15 }}>
      <Link href="#Details" title="Details" />
      {!proxy ? <Link href="#Responses" title="Responses" /> : null}
      <Link href="#Search" title="Search" />
      <Link href="#services" title="Services" />
      <Link href="#structs" title="Structs" />
      <Link href="#enumerations" title="Enumerations" />
      <Link href="#typedefs" title="Typedefs" />
      <Link href="#constants" title="Constants" />
    </Anchor>;
  }

  public functions = (thrift?: ThriftFile.IJSON) => {
    const func: { [key: string]: ThriftFile.IFunction } = {};
    if (thrift) {
      thrift.services.forEach((s) => s.functions.forEach((f) => func[f.name] = f));
    }
    return func;
  }
  public responses = (resp: IResponses) =>
    Object.entries(resp).map(([func, { exception, data }]) => (
      { func, exception, data }
    ))
}

const mapStateToProps = ({ responses, services, thrift }: IProps) => ({ responses, services, thrift });
const mapDispatchToProps = (dispatch: any) => ({
  loadThrift: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_THRIFT", id }),
  loadResponses: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_RESPONSES", id }),
  newResponse: (id: string, func?: string) => {
    dispatch({ type: "MODAL", window: "THRIFT_RESPONSE", id, func });
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(Service);
