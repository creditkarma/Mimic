import { IResponses, IUniq } from "@creditkarma/mimic-core";
import { generateGraphqlResponse, IGraphqlServiceJson, IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { Form, Icon, Input, Modal, Select, Switch } from "antd";
import { FormComponentProps } from "antd/lib/form";
import React from "react";
import { connect } from "react-redux";
import TreeView from "./TreeView";
import { validate } from "./validator";

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

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
  schema?: string;
  responses: IResponses;
  services: IUniq<IGraphqlServiceJson>;
  graphql: IUniq<IGraphqlTypes>;
  addGraphqlResponse: (id: string, response: IUniq<any>) => void;
  cancel: () => void;
}
interface IState {
  tree: boolean;
}

export class GraphqlResponse extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { tree: false };
  }

  public render() {
    const { form: { getFieldDecorator }, schema, responses, id, services } = this.props;
    const service = services[id];
    const graphql = this.props.graphql[id];
    let data: any;
    if (schema) {
      data = JSON.stringify(responses[id][schema], null, 2);
    }
    return (
      <Modal
        title={`Response for ${service.alias}`}
        visible onOk={this.handleOk} onCancel={this.props.cancel}
        width={600} okText="Save">
        <Form>
          <FormItem label="Schema" {...formItemLayout}>
            {getFieldDecorator("schema", { initialValue: schema, rules: [{ required: true }] })(
              <Select onChange={this.onSchemaChange}>
                {Object.keys(graphql.ROOT).map((t, i) =>
                  <Option key={i} value={t}>{t}</Option>,
                )}
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
                types={this.props.graphql[id]}
                schema={this.props.graphql[id].ROOT[this.props.form.getFieldValue("schema")]}
              /> : null
            }
          </FormItem>
        </Form>
      </Modal>);
  }
  public dataLabel = () => {
    const { getFieldValue, getFieldError } = this.props.form;
    const schema = getFieldValue("schema");
    const errors = getFieldError("data") || [];
    return <span>Data <Switch
      checkedChildren={<Icon type="bars" />}
      unCheckedChildren={<Icon type="form" />}
      checked={this.state.tree}
      onChange={(v) => this.setState({ tree: v })}
      disabled={!schema || errors.length > 0}
    />
    </span>;
  }

  public dataValidator = (_: any, value: string, callback: any) => {
    const { form: { getFieldValue }, id, graphql } = this.props;
    let errors: string[] = [];
    try {
      const data = JSON.parse(value);
      const schema = {kind: "OBJECT", ...graphql[id].ROOT[getFieldValue("schema")]};
      errors = validate(data, graphql[id], schema).map((e) => `root${e}`);
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

  public onSchemaChange = (schema: any) => {
    const { responses, id } = this.props;
    const graphql = this.props.graphql[id];
    const resp = responses[id][schema];
    let data: any;
    if (resp) {
      data = JSON.stringify(resp, null, 2);
    } else {
      const { name } = graphql.ROOT[schema];
      data = JSON.stringify(generateGraphqlResponse(graphql, graphql.OBJECT[name], false), null, 2);
    }
    this.props.form.setFieldsValue({ data });
  }

  public handleOk = () => {
    const { form: { validateFields }, id } = this.props;
    validateFields((err, { schema, data }) => {
      if (!err) {
        this.props.addGraphqlResponse(id, { [schema]: JSON.parse(data) });
      }
    });
  }
}

const mapStateToProps = ({ responses, services, graphql }: IProps) => ({ responses, services, graphql });
const mapDispatchToProps = (dispatch: any) => ({
  addGraphqlResponse: (id: string, response: IResponses) => {
    dispatch({ type: "@@IPC_REQUEST/ADD_RESPONSE", id, response });
  },
  cancel: () => dispatch({ type: "MODAL" }),
});
export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(GraphqlResponse));
