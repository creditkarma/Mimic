import { IMimicRequest, IServiceJson, IUniq  } from "@creditkarma/mimic-core";
import { trimLines } from "@renderer/components";
import { Button, Table } from "antd";
import * as React from "react";
import { connect } from "react-redux";

interface IProps {
  services: IUniq<IServiceJson>;
  requests: IMimicRequest[];
}

const columns = (services: IUniq<IServiceJson>) => ([{
  dataIndex: "time",
  title: "Time",
  render: (t: number) => {
    const time = new Date(t);
    return time.toLocaleString();
  },
}, {
  dataIndex: "serviceId",
  title: "Service",
  render: (serviceId: string) => services[serviceId] ? services[serviceId].alias : "Deleted",
},
{
  dataIndex: "request",
  title: "Request",
}, {
  dataIndex: "response",
  title: "Response",
}]);

const expanded = (record: IMimicRequest) => {
  const requestJson = JSON.stringify(record.requestValue, null, 2);
  const responseJson = JSON.stringify(record.responseValue, null, 2);
  const requestBlob = new Blob([requestJson], {type: "application/json"});
  const responseBlob = new Blob([responseJson], {type: "application/json"});
  return <div>
    <h3>Request Args</h3>
    <pre className="json">
      <code>{trimLines(requestJson, 200)}</code>
    </pre>
    <Button type="primary" href={URL.createObjectURL(requestBlob)} download="request.json" icon="download">
      Download
    </Button>
    <h3>Response</h3>
    <pre className="json">
      <code>{trimLines(responseJson, 200)}</code>
    </pre>
    <Button type="primary" href={URL.createObjectURL(responseBlob)} download="response.json" icon="download">
      Download
    </Button>
  </div>;
};

export const RequestsPage: React.SFC<IProps> = ({requests, services}) => (
  <Table dataSource={requests} columns={columns(services)} rowKey="id" expandedRowRender={expanded} />
);

const mapStateToProps = ({requests, services}: IProps) => ({ requests, services });
export default connect(mapStateToProps)(RequestsPage);
