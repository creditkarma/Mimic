import { IGit, IUniq } from "@creditkarma/mimic-core";
import { IGrpcServiceJson } from "../../../../packages/mimic-grpc"; // todo: change to @creditkarma/package
import { EditableCell } from "@renderer/components";

import { Button, Popconfirm, Popover, Table } from "antd";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

interface IProps {
  services: IUniq<IGrpcServiceJson>;
  newRecord: () => void;
  updateRecord: (id: string, service: Partial<IGrpcServiceJson>) => void;
  deleteRecord: (id: string) => void;
}

const columns = (props: IProps) => [
  {
    dataIndex: "alias",
    title: "Alias",
    render: (alias: string, s: any) => (
      <EditableCell
        value={alias}
        onChange={v => props.updateRecord(s.id, { alias: v })}
      >
        <Link to={`/grpc_services/${s.id}`}>{alias}</Link>
      </EditableCell>
    )
  },
  {
    dataIndex: "path",
    title: "Path",
    render: (text: string) => (
      <Popover content={text}>{text.split("/").pop()}</Popover>
    )
  },
  {
    dataIndex: "service",
    title: "Service"
  },
  {
    dataIndex: "port",
    title: "Port"
  },
  {
    dataIndex: "enabled",
    title: "Enabled",
    render: (enabled: boolean) => enabled.toString()
  },
  {
    dataIndex: "url",
    title: "Url"
  },
  {
    dataIndex: "transport",
    title: "Transport"
  },
  {
    dataIndex: "protocol",
    title: "Protocol"
  },
  // {
  //   dataIndex: "git",
  //   title: "Branch",
  //   render: (git?: IGit) =>
  //     git ? <Popover content={`HEAD: ${git.head}`}>{git.branch}</Popover> : null
  // },
  {
    title: "Actions",
    key: "actions",
    render: (text: any, record: any) => (
      <Popconfirm
        title="Are you sure?"
        onConfirm={() => props.deleteRecord(record.id)}
      >
        <a>Delete</a>
      </Popconfirm>
    )
  }
];

export const GrpcPage: React.SFC<IProps> = props => {
  const grpcServices = Object.values(props.services).filter(
    s => s.type === "grpc"
  );
  return (
    <div>
      <Table
        dataSource={grpcServices}
        columns={columns(props)}
        rowKey="id"
        scroll={{ x: 1180 }}
      />
      <div style={{ padding: 10, float: "right" }}>
        <Button size="large" icon="plus" onClick={props.newRecord}>
          Add
        </Button>
      </div>
    </div>
  );
};

const mapStateToProps = ({ services }: IProps) => ({ services });
const mapDispatchToProps = (dispatch: any) => ({
  newRecord: () => dispatch({ type: "MODAL", window: "GRPC_SERVICE" }),
  updateRecord: (id: string, service: Partial<IGrpcServiceJson>) => {
    dispatch({ type: "@@IPC_REQUEST/UPDATE_SERVICE", id, service });
  },
  deleteRecord: (id: string) =>
    dispatch({ type: "@@IPC_REQUEST/DELETE_SERVICE", id })
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GrpcPage);
