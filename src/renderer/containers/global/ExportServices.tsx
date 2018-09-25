import { IServiceJson, IUniq } from "@creditkarma/mimic-core";
import { Modal, Table } from "antd";
import React from "react";
import { connect } from "react-redux";

interface IProps {
  services: IUniq<IServiceJson>;
  cancel: () => void;
  submit: (ids: string[]) => void;
}

const columns = [{
  title: "Alias",
  dataIndex: "alias",
}, {
  title: "Type",
  dataIndex: "type",
}, {
  title: "Enabled",
  dataIndex: "enabled",
  render: (enabled: boolean) => enabled.toString(),
}, {
  title: "Port",
  dataIndex: "port",
}];

export const ExportServices: React.SFC<IProps> = ({ cancel, services, submit }) => {
  let selected: string[] = [];
  const rowSelection = {
    onChange: (_: any, selectedRows: any[]) => {
      selected = selectedRows.map((r) => r.id);
    },
  };
  return (
    <Modal width={600} title="Export Services" visible onOk={() => submit(selected)} onCancel={cancel}  okText="Export">
      <Table rowSelection={rowSelection} columns={columns} rowKey="id" dataSource={Object.values(services)} />
    </Modal>
  );
};

const mapStateToProps = ({ services }: IProps) => ({ services });
const mapDispatchToProps = (dispatch: any) => ({
  cancel: () => dispatch({type: "MODAL"}),
  submit: (ids: string[]) => dispatch({ type: "@@IPC_REQUEST/EXPORT", ids }),
});
export default connect(mapStateToProps, mapDispatchToProps)(ExportServices);
