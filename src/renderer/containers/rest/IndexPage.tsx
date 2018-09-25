import { IServiceJson, IUniq } from "@creditkarma/mimic-core";
import { EditableCell } from "@renderer/components";
import { Button, Popconfirm, Table } from "antd";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

interface IProps {
  services: IUniq<IServiceJson>;
  newRecord: () => void;
  updateRecord: (id: string, service: Partial<IServiceJson>) => void;
  deleteRecord: (id: string) => void;
}

const columns = (props: IProps) => ([{
  dataIndex: "alias",
  title: "Alias",
  render: (alias: string, s: any) => (
    <EditableCell value={alias} onChange={(v) => props.updateRecord(s.id, {alias: v})}>
      <Link to={`/rest_services/${s.id}`}>{alias}</Link>
    </EditableCell>
  ),
}, {
  dataIndex: "port",
  title: "Port",
}, {
  dataIndex: "enabled",
  title: "Enabled",
  render: (enabled: boolean) => enabled.toString(),
}, {
  title: "Actions",
  key: "actions",
  render: (text: any, record: any) => (
    <Popconfirm title="Are you sure?" onConfirm={() => props.deleteRecord(record.id)}>
      <a>Delete</a>
    </Popconfirm>
  ),
}]);

export const IndexPage: React.SFC<IProps> = (props) => {
  const restServices = Object.values(props.services).filter((s) => s.type === "rest");
  return (
    <div>
      <Table dataSource={restServices} columns={columns(props)} rowKey="id" scroll={{x: 400}} />
      <div style={{padding: 10, float: "right"}}>
        <Button size="large" icon="plus" onClick={props.newRecord}>Add</Button>
      </div>
    </div>
  );
};

const mapStateToProps = ({services}: IProps) => ({ services });
const mapDispatchToProps = (dispatch: any) => ({
  newRecord: () => dispatch({type: "MODAL", window: "REST_SERVICE"}),
  updateRecord: (id: string, service: Partial<IServiceJson>) => {
    dispatch({type: "@@IPC_REQUEST/UPDATE_SERVICE", id, service});
  },
  deleteRecord: (id: string) => dispatch({type: "@@IPC_REQUEST/DELETE_SERVICE", id}),
});
export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);
