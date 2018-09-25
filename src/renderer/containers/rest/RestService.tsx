import { IServiceJson } from "@creditkarma/mimic-core";
import { Form, Input, InputNumber, Modal } from "antd";
import { FormComponentProps } from "antd/lib/form";
import React from "react";
import { connect } from "react-redux";
const FormItem = Form.Item;

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
  addRestService: (service: IServiceJson) => void;
  cancel: () => void;
}

export const RestService: React.SFC<IProps> = ({form: {getFieldDecorator, validateFields}, addRestService, cancel}) => {
  const handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    validateFields((err, values) => {
      if (!err) {
        addRestService({ ...values, type: "rest" });
      }
    });
  };
  return (
    <Modal title="New REST Service" visible onOk={handleOk} okText="Save" onCancel={cancel}>
      <Form onSubmit={handleOk}>
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
};

const mapDispatchToProps = (dispatch: any) => ({
  cancel: () => dispatch({ type: "MODAL" }),
  addRestService: (service: IServiceJson) => dispatch({ type: "@@IPC_REQUEST/ADD_SERVICE", service }),
});

export default connect(null, mapDispatchToProps)(Form.create()(RestService));
