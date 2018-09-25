import { IResponses, IUniq } from "@creditkarma/mimic-core";
import { formatThrift, generateThriftResponse, IThriftServiceJson, ThriftFile } from "@creditkarma/mimic-thrift";
import { Form, Icon, Input, Modal, Select, Switch } from "antd";
import { FormComponentProps } from "antd/lib/form";
import React from "react";
import { connect } from "react-redux";
import TreeView from "./TreeView";
import { validate } from "./validator";

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

const formatter = (typeId: ThriftFile.TypeID, type?: ThriftFile.Type, exception?: string): IResponseType => ({
  name: formatThrift(typeId, type), typeId, type, exception,
});

interface IResponseType {
  name: string;
  typeId: ThriftFile.TypeID;
  type?: ThriftFile.Type;
  extra?: ThriftFile.IExtraType;
  exception?: string;
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
  },
};

interface IProps extends FormComponentProps {
  id: string;
  func?: string;
  responses: IResponses;
  services: IUniq<IThriftServiceJson>;
  thrift: { [key: string]: ThriftFile.IJSON };
  addThriftResponse: (id: string, response: IUniq<any>) => void;
  cancel: () => void;
}
interface IState {
  tree: boolean;
}

export class ThriftResponse extends React.Component<IProps, IState> {
  public functions: { [name: string]: ThriftFile.IFunction } = {};
  public types: IResponseType[] = [];

  constructor(props: IProps) {
    super(props);
    const { id, thrift } = props;
    this.state = { tree: false };
    thrift[id].services.forEach((s) => {
      s.functions.forEach((f) => this.functions[f.name] = f);
    });
  }

  public render() {
    const { form: { getFieldDecorator }, func, responses, id, services } = this.props;
    const service = services[id];
    let data: any;
    let type: any;
    if (func) {
      this.setTypes(this.functions[func]);
      data = JSON.stringify(responses[id][func].data, null, 2);
      type = this.types.findIndex((t) => t.exception === responses[id][func].exception);
    }
    return (
      <Modal
        title={`Response for ${service.alias}`}
        visible onOk={this.handleOk} onCancel={this.props.cancel}
        width={600} okText="Save">
        <Form>
          <FormItem label="Function" {...formItemLayout}>
            {getFieldDecorator("func", { initialValue: func, rules: [{ required: true }] })(
              <Select onChange={this.onFunctionChange}>
                {Object.keys(this.functions).map((f, i) => <Option key={i} value={f}>{f}</Option>)}
              </Select>,
            )}
          </FormItem>
          <FormItem label="Type" {...formItemLayout}>
            {getFieldDecorator("type", { initialValue: type, rules: [{ required: true }] })(
              <Select onChange={this.generateResponse}>
                {this.types.map((t, i) => <Option key={i} value={i}>{t.name}</Option>)}
              </Select>,
            )}
          </FormItem>
          <FormItem label={this.dataLabel()}>
            {this.props.form.getFieldDecorator("data", {
              initialValue: data,
              rules: [{ validator: this.dataValidator, required: true }],
            })(<TextArea rows={20} style={{ display: this.state.tree ? "none" : "block" }} />)}
            {this.state.tree ?
              <TreeView
                onChange={(d) => this.props.form.setFieldsValue({ data: JSON.stringify(d, null, 2) })}
                data={JSON.parse(this.props.form.getFieldValue("data"))}
                thrift={this.props.thrift[id]}
                type={this.types[this.props.form.getFieldValue("type")]}
              /> : null
            }
          </FormItem>
        </Form>
      </Modal>);
  }
  public dataLabel = () => {
    const { getFieldValue, getFieldError } = this.props.form;
    const func = getFieldValue("func");
    const errors = getFieldError("data") || [];
    return <span>Data <Switch
      checkedChildren={<Icon type="bars" />}
      unCheckedChildren={<Icon type="form" />}
      checked={this.state.tree}
      onChange={(v) => this.setState({ tree: v })}
      disabled={!func || errors.length > 0}
    />
    </span>;
  }

  public dataValidator = (_: any, value: string, callback: any) => {
    const { form: { getFieldValue }, id, thrift } = this.props;
    let errors: string[] = [];
    try {
      const data = JSON.parse(value);
      const type = this.types[getFieldValue("type")];
      errors = validate(data, thrift[id], type.typeId, type.type).map((e) => `root${e}`);
    } catch (error) {
      const match = error.message.match(/at position (\d+)$/);
      if (match) {
        const position = parseInt(match[1], 10);
        const lines = value.substr(0, position).split("\n").length - 1;
        callback([`Error: Parse error on line ${lines}`]);
      }
      return callback([error.message]);
    }
    callback(errors);
  }

  public onFunctionChange = (index: any) => {
    const { responses, id } = this.props;
    const func = this.functions[index];
    this.setTypes(func);
    const resp = responses[id][func.name];
    if (resp) {
      const data = JSON.stringify(resp.data, null, 2);
      const type = this.types.findIndex((t) => t.exception === resp.exception);
      this.props.form.setFieldsValue({ data, type });
    } else {
      this.props.form.setFieldsValue({ type: 0 });
      this.generateResponse(0);
    }
  }
  public setTypes(func: ThriftFile.IFunction) {
    this.types = [formatter(func.returnTypeId, func.returnType)];
    func.exceptions.forEach((e) => this.types.push(formatter(e.typeId, e.type, e.type.class)));
  }
  public generateResponse = (index: any) => {
    const { id, thrift } = this.props;
    const rtype = this.types[index];
    const response = generateThriftResponse(rtype.typeId, thrift[id], rtype.type, rtype.extra);
    this.props.form.setFieldsValue({ data: JSON.stringify(response, null, 2) });
  }
  public handleOk = () => {
    const { form: { validateFields }, id } = this.props;
    validateFields((err, { func, type, data }) => {
      if (!err) {
        const { exception } = this.types[type];
        this.props.addThriftResponse(id, { [func]: { exception, data: JSON.parse(data) } });
      }
    });
  }
}

const mapStateToProps = ({ responses, services, thrift }: IProps) => ({ responses, services, thrift });
const mapDispatchToProps = (dispatch: any) => ({
  addThriftResponse: (id: string, response: IResponses) => {
    dispatch({ type: "@@IPC_REQUEST/ADD_RESPONSE", id, response });
  },
  cancel: () => dispatch({ type: "MODAL" }),
});
export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(ThriftResponse));
