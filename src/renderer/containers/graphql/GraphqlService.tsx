import { IGit } from "@creditkarma/mimic-core";
import { IGraphqlServiceJson } from "@creditkarma/mimic-graphql";
import { Badge, Button, Form, Input, InputNumber, Modal, notification } from "antd";
import { FormComponentProps } from "antd/lib/form";
import { PARSE_GRAPHQL, Response } from "common/redux_events";
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
  graphqlFiles: Response<PARSE_GRAPHQL>;
  parseGraphqlFile: () => void;
  addGraphqlService: (service: IGraphqlServiceJson) => void;
  cancel: () => void;
}

export class GraphqlService extends React.Component<IProps, {}> {
  public git?: IGit;
  public count = 0;

  public componentWillReceiveProps(nextProps: IProps) {
    const { graphqlFiles } = nextProps;
    const { setFieldsValue } = this.props.form;
    if (this.props.graphqlFiles !== graphqlFiles) {
      if (!graphqlFiles.error) {
        this.git = graphqlFiles.git;
        setFieldsValue({ files: graphqlFiles.files });
        this.count = graphqlFiles.files.length;
        notification.success({
          message: `Processed ${this.count} GraphQL file ${this.count === 1 ? "" : "s"}`,
          description: "",
          duration: 1,
        });
      }
    }
  }

  public render() {
    const {form: {getFieldDecorator}, parseGraphqlFile, cancel} = this.props;
    return (
      <Modal title="New GraphQL Service" visible onOk={this.handleOk} okText="Save" onCancel={cancel}>
        <Form onSubmit={this.handleOk}>
          <FormItem label="GraphQL" {...formItemLayout}>
            {getFieldDecorator("files", { rules: [{ required: true, message: "GraphQL file(s) are required" }] })(
              <Badge count={this.count} style={{ backgroundColor: "#52c41a" }}>
                <Button onClick={() => parseGraphqlFile()} icon="upload">Choose Files</Button>
              </Badge>,
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
  public handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    const {form: {validateFields}, addGraphqlService} = this.props;
    validateFields((err, values) => {
      if (!err) {
        addGraphqlService({ ...values, type: "graphql", git: this.git });
      }
    });
  }
}

const mapStateToProps = ({ graphqlFiles }: IProps) => ({ graphqlFiles });
const mapDispatchToProps = (dispatch: any) => ({
  parseGraphqlFile: () => dispatch({ type: "@@IPC_REQUEST/PARSE_GRAPHQL" }),
  addGraphqlService: (service: IGraphqlServiceJson) => dispatch({ type: "@@IPC_REQUEST/ADD_SERVICE", service }),
  cancel: () => dispatch({ type: "MODAL" }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(GraphqlService));
