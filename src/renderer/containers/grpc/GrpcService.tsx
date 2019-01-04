import { IGit } from "@creditkarma/mimic-core";
// import { IGrpcServiceJson } from "@creditkarma/mimic-proto";
import { IGrpcServiceJson } from "../../../../packages/mimic-grpc/src";
import {
  Button,
  Collapse,
  Form,
  Icon,
  Input,
  InputNumber,
  Modal,
  notification,
  Radio,
  Select,
  Tooltip
} from "antd";
import { FormComponentProps } from "antd/lib/form";
// import { PARSE_THRIFT_FILE, Response } from "common/redux_events";
import React from "react";
import { connect } from "react-redux";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const Panel = Collapse.Panel;

const protocols = ["Protobuf"];

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 }
  }
};

interface IProps extends FormComponentProps {
  // grpcFile: Response<PARSE_GRPC_FILE>;
  grpcFile: any;
  parseGrpcFile: () => void;
  addGrpcService: (service: IGrpcServiceJson) => void;
  cancel: () => void;
}

let uuid = 0;

export class GrpcService extends React.Component<IProps, {}> {
  public services: any[] = [];
  // public git?: IGit;

  public componentWillReceiveProps(nextProps: IProps) {
    const { grpcFile } = nextProps;
    const { setFieldsValue } = this.props.form;

    if (this.props.grpcFile !== grpcFile) {
      // deep equals?
      // this.git = grpcFile.git;
      this.services = grpcFile.servicesList || [];
      setFieldsValue({
        path: grpcFile.path
      });
      if (!grpcFile.error) {
        notification.success({
          message: "Grpc file processed",
          description: "",
          duration: 1
        });
      }
    }
  }

  public render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Modal
        title="New gRPC Service"
        visible
        onOk={this.handleOk}
        okText="Save"
        onCancel={this.props.cancel}
      >
        <Form onSubmit={this.handleOk}>
          <FormItem label="Proto File" {...formItemLayout}>
            {getFieldDecorator("path", {
              rules: [{ required: true, message: "Protobuf file is required" }]
            })(
              <a onClick={e => this.props.parseGrpcFile()}>
                {this.chooseFile()}
              </a>
            )}
          </FormItem>
          <FormItem label="Server" {...formItemLayout}>
            <label>HTTP/2</label>
          </FormItem>
          <FormItem label="Protocol" {...formItemLayout}>
            {getFieldDecorator("protocol", {
              initialValue: protocols[0],
              rules: [{ required: true }]
            })(
              <Select>
                {protocols.map((p, i) => (
                  <Option key={i} value={p}>
                    {p}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem label="Service" {...formItemLayout}>
            {getFieldDecorator("service", { rules: [{ required: true }] })(
              <Select onChange={this.onServiceChange}>
                {this.services.map((service, index) => (
                  <Option key={index} value={service}>
                    {service.display}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem label="Alias" {...formItemLayout}>
            {getFieldDecorator("alias", { rules: [{ required: true }] })(
              <Input />
            )}
          </FormItem>
          <FormItem label="Port" {...formItemLayout}>
            {getFieldDecorator("port", { rules: [{ required: true }] })(
              <InputNumber min={1024} />
            )}
          </FormItem>
          <input type="submit" style={{ display: "none" }} />
        </Form>
      </Modal>
    );
  }

  public chooseFile = () => {
    const filePath = this.props.form.getFieldValue("path");
    if (filePath) {
      return filePath.split("/").pop();
    } else {
      return <Button icon="upload"> Choose File</Button>;
    }
  };

  public onServiceChange = (service: any) =>
    this.props.form.setFieldsValue({ alias: service });

  public handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    this.props.form.validateFields((errors, values) => {
      if (!errors) {
        delete values.keys;
        debugger;
        this.props.addGrpcService({
          ...values,
          type: "grpc"
          // git: this.git
        });
      }
    });
  };
}

const mapStateToProps = ({ grpcFile }: IProps) => ({ grpcFile });
const mapDispatchToProps = (dispatch: any) => ({
  addGrpcService: (service: IGrpcServiceJson) =>
    dispatch({ type: "@@IPC_REQUEST/ADD_SERVICE", service }),
  cancel: () => dispatch({ type: "MODAL" }),
  parseGrpcFile: () => {
    return dispatch({ type: "@@IPC_REQUEST/PARSE_GRPC_FILE" });
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Form.create()(GrpcService));
