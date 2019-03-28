import { IGit } from "@creditkarma/mimic-core";
import { IThriftServiceJson } from "@creditkarma/mimic-thrift";
import { Button, Collapse, Form, Icon, Input, InputNumber, Modal, notification, Radio, Select, Tooltip } from "antd";
import { FormComponentProps } from "antd/lib/form";
import { PARSE_THRIFT_FILE, Response } from "common/redux_events";
import React from "react";
import { connect } from "react-redux";
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const Panel = Collapse.Panel;

const transports = ["Buffered", "Framed"];
const protocols = ["Binary", "Json", "Compact"];

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
  },
};

interface IProps extends FormComponentProps {
  thriftFile: Response<PARSE_THRIFT_FILE>;
  parseThriftFile: (includes: string[]) => void;
  addThriftService: (service: IThriftServiceJson) => void;
  cancel: () => void;
}

let uuid = 0;
export class ThriftService extends React.Component<IProps, {}> {
  public services: string[] = [];
  public git?: IGit;

  public componentWillReceiveProps(nextProps: IProps) {
    const { thriftFile } = nextProps;
    const { setFieldsValue } = this.props.form;
    if (this.props.thriftFile !== thriftFile) {
      // Update list of services
      this.services = thriftFile.content ? thriftFile.content.services.map((s) => s.name) : [];
      this.git = thriftFile.git;
      // Update file path
      setFieldsValue({ path: thriftFile.path });
      if (!thriftFile.error) {
        notification.success({ message: "Thrift file processed", description: "", duration: 1 });
      }
    }
  }

  public render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Modal title="New Thrift Service" visible onOk={this.handleOk} okText="Save" onCancel={this.props.cancel}>
        <Form onSubmit={this.handleOk}>
          <FormItem label="Thrift File" {...formItemLayout}>
            {getFieldDecorator("path", { rules: [{ required: true, message: "Thrift file is required" }] })(
              <a onClick={(e) => this.props.parseThriftFile(this.getIncludes())}>
                {this.chooseFile()}
              </a>,
            )}
          </FormItem>
          <Collapse bordered={false}>
            <Panel header={<span>Includes <Tooltip title="Provide a list of custom search paths for Thrift parser">
              <Icon type="question-circle-o" />
            </Tooltip>:</span>} key="1" className="includes-panel" style={{ border: 0 }}>
              <div style={{ marginLeft: 93, width: 320 }}>
                {this.includes()}
                <Button type={"dashed" as any} onClick={this.addInclude} style={{ marginTop: 10 }}>
                  <Icon type="plus" /> Add path
                </Button>
              </div>
            </Panel>
          </Collapse>
          <FormItem label="Mode" {...formItemLayout}>
            {getFieldDecorator("proxy", { initialValue: false, rules: [{required: true}] })(
              <RadioGroup>
                <Radio value={false}>Server</Radio>
                <Radio value={true}>Proxy</Radio>
              </RadioGroup>,
            )}
          </FormItem>
          {getFieldValue("proxy") ?
            <div>
              <FormItem label="Remote Host" {...formItemLayout}>
                {getFieldDecorator("remoteHost", {rules: [{ required: true }]})(
                  <Input />,
                )}
              </FormItem>
              <FormItem label="Remote Port" {...formItemLayout}>
                {getFieldDecorator("remotePort", {rules: [{ required: true }]})(
                  <InputNumber min={0} />,
                )}
              </FormItem>
            </div> : null
          }
          <FormItem label="Server" {...formItemLayout}>
            {getFieldDecorator("useHttp", { rules: [{ required: true, message: "Choose server type" }] })(
              <RadioGroup onChange={(e) => this.switchHttp(e.target.value)}>
                <Radio value={true}>HTTP</Radio>
                <Radio value={false}>TCP</Radio>
              </RadioGroup>,
            )}
          </FormItem>
          {getFieldValue("useHttp") ?
            <FormItem label="Url" {...formItemLayout}>
              {getFieldDecorator("url", { initialValue: "/", rules: [{ required: true }] })(
                <Input />,
              )}
            </FormItem> : null
          }
          <FormItem label="Transport" {...formItemLayout}>
            {getFieldDecorator("transport", { rules: [{ required: true }] })(
              <Select>
                {transports.map((t, i) => <Option key={i} value={t}>{t}</Option>)}
              </Select>,
            )}
          </FormItem>
          <FormItem label="Protocol" {...formItemLayout}>
            {getFieldDecorator("protocol", { rules: [{ required: true }] })(
              <Select>
                {protocols.map((p, i) => <Option key={i} value={p}>{p}</Option>)}
              </Select>,
            )}
          </FormItem>
          <FormItem label="Service" {...formItemLayout}>
            {getFieldDecorator("service", { rules: [{ required: true }] })(
              <Select onChange={this.onServiceChange} >
                {this.services.map((s, i) => <Option key={i} value={s}>{s}</Option>)}
              </Select>,
            )}
          </FormItem>
          <FormItem label="Alias" {...formItemLayout}>
            {getFieldDecorator("alias", { rules: [{ required: true }] })(
              <Input />,
            )}
          </FormItem>
          <FormItem label="Port" {...formItemLayout}>
            {getFieldDecorator("port", { rules: [{ required: true }] })(
              <InputNumber min={1024} />,
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
  }
  public includes = () => {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    getFieldDecorator("keys", { initialValue: [] });
    const keys = getFieldValue("keys");
    return keys.map((k: number) =>
      <FormItem style={{ margin: 0 }} key={k}>
        {getFieldDecorator(`includes[${k}]`, {
          initialValue: "", rules: [{
            required: true,
            whitespace: true,
            message: "Add path or delete this field",
          }],
        })(
          <div>
            <Input placeholder="path" style={{ width: 295 }} />
            <Icon type="close" onClick={() => this.deleteInclude(k)} style={{ padding: 5, cursor: "pointer" }} />
          </div>,
        )}
      </FormItem>,
    );
  }
  public getIncludes = () => {
    const { getFieldValue } = this.props.form;
    return getFieldValue("keys").length > 0 ? getFieldValue("includes").filter((v: any) => v !== null) : [];
  }
  public addInclude = () => {
    const { form } = this.props;
    const keys = form.getFieldValue("keys");
    form.setFieldsValue({ keys: [...keys, uuid] });
    uuid++;
  }
  public deleteInclude = (k: number) => {
    const { form } = this.props;
    const keys = form.getFieldValue("keys");
    form.setFieldsValue({
      keys: keys.filter((key: number) => key !== k),
    });
  }
  public switchHttp = (useHttp: any) => {
    const { setFieldsValue } = this.props.form;
    if (useHttp) {
      setFieldsValue({ transport: "Buffered", protocol: "Binary" });
    } else {
      setFieldsValue({ transport: "Framed", protocol: "Binary" });
    }
  }
  public onServiceChange = (service: any) => this.props.form.setFieldsValue({ alias: service });
  public handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    this.props.form.validateFields((errors, values) => {
      if (!errors) {
        delete values.keys;
        this.props.addThriftService({ ...values, type: "thrift", git: this.git, includes: this.getIncludes() });
      }
    });
  }
}

const mapStateToProps = ({ thriftFile }: IProps) => ({ thriftFile });
const mapDispatchToProps = (dispatch: any) => ({
  parseThriftFile: (includes: string[]) => dispatch({ type: "@@IPC_REQUEST/PARSE_THRIFT_FILE", includes }),
  cancel: () => dispatch({ type: "MODAL" }),
  addThriftService: (service: IThriftServiceJson) => dispatch({ type: "@@IPC_REQUEST/ADD_SERVICE", service }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(ThriftService));
