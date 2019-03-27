import { IResponses, IServiceJson, IUniq } from "@creditkarma/mimic-core";
import { CodeEditor } from "@renderer/components";
import { Form, Input, Modal, Select } from "antd";
import { FormComponentProps } from "antd/lib/form";
import React from "react";
import { connect } from "react-redux";

const FormItem = Form.Item;
const Option = Select.Option;

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
  index?: string;
  responses: IResponses;
  services: IUniq<IServiceJson>;
  addRestResponse: (id: string, response: IResponses) => void;
  cancel: () => void;
}

const jsonValidator = (_: any, value: string, callback: any) => {
  try {
    JSON.parse(value);
  } catch (error) {
    const match = error.message.match(/at position (\d+)$/);
    if (match) {
      const position = parseInt(match[1], 10);
      const lines = value.substr(0, position).split("\n").length - 1;
      callback([`Error: Parse error on line ${lines}`]);
    }
    return callback([error.message]);
  }
  callback([]);
};

export const RestResponse: React.SFC<IProps> = ({
  addRestResponse, form: { getFieldDecorator, validateFields }, index, responses, services, id, cancel }) => {
  const resp: any = index ? responses[id][index] : {};
  const service = services[id];
  const handleOk = () => {
    validateFields((err, response) => {
      if (!err) {
        const uid = index || Math.random().toString(36).substring(7);
        const data = JSON.parse(response.data);
        addRestResponse(id, {[uid]: {...response, data}});
      }
    });
  };
  return (
    <Modal
      title={`Response for ${service.alias}`}
      visible onOk={handleOk} onCancel={cancel}
      className="full-screen" okText="Save">
      <Form>
        <FormItem label="Method" {...formItemLayout}>
          {getFieldDecorator("method", { initialValue: resp.method, rules: [{ required: true }] })(
            <Select>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m, i) => <Option key={i} value={m}>{m}</Option>)}
            </Select>,
          )}
        </FormItem>
        <FormItem label="Path" {...formItemLayout} style={{margin: 0}}>
          {getFieldDecorator("path", { initialValue: resp.path, rules: [{ required: true }] })(
            <Input />,
          )}
          <b>Example:</b> /controller/:action/:id
        </FormItem>
        <FormItem label="Data" style={{margin: 0}}>
          {getFieldDecorator("data", {
            initialValue: JSON.stringify(resp.data, null, 2),
            rules: [{ validator: jsonValidator, required: true }],
          })(
            <CodeEditor />,
          )}
        </FormItem>
      </Form>
    </Modal>);
};

const mapStateToProps = ({ responses, services }: IProps) => ({ responses, services });
const mapDispatchToProps = (dispatch: any) => ({
  addRestResponse: (id: string, response: IResponses) => {
    dispatch({ type: "@@IPC_REQUEST/ADD_RESPONSE", id, response });
  },
  cancel: () => dispatch({ type: "MODAL" }),
});
export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(RestResponse));
