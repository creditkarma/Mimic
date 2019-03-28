import { IClientAction, IUniq } from "@creditkarma/mimic-core";
import { generateThriftResponse, IThriftServiceJson, ThriftFile } from "@creditkarma/mimic-thrift";
import { trimLines } from "@renderer/components";
import { Button, Form, Icon, Input, Select, Switch, Tabs } from "antd";
import { FormComponentProps } from "antd/lib/form";
import * as React from "react";
import { connect } from "react-redux";
import { TreeView, validate } from "../thrift";
import { Headers, History } from "./index";
const FormItem = Form.Item;
const Option = Select.Option;
const InputGroup = Input.Group;
const TabPane = Tabs.TabPane;
const { TextArea } = Input;

interface IProps extends FormComponentProps {
  clients: IUniq<Array<Required<IClientAction>>>;
  service: IThriftServiceJson;
  thrift: IUniq<ThriftFile.IJSON>;
  loadThrift: (id: string) => void;
  sendRequest: (request: IClientAction["request"]) => void;
}

interface IState {
  request: IClientAction["request"] | undefined;
  response: IClientAction["response"] | undefined;
  tree: boolean;
}

const addArgs = (thrift: ThriftFile.IJSON, {arguments: fields, name: func}: ThriftFile.IFunction): ThriftFile.IJSON => {
  const name = `${func}Args`;
  const struct = { name, fields, isException: false, isUnion: false };
  return {...thrift, structs: [...thrift.structs, struct]};
};

export class ThriftClient extends React.PureComponent<IProps, IState> {
  public funcs: ThriftFile.IFunction[] = [];

  constructor(props: IProps) {
    super(props);
    this.state = {request: undefined, response: undefined, tree: false};
  }

  public componentDidMount() {
    this.loadData(this.props);
  }

  public componentDidUpdate(prevProps: IProps) {
    const { clients, service: {id} } = this.props;
    const { clients: oldClients } = prevProps;
    if (clients[id] !== oldClients[id]) {
      this.jumpTo(0);
    }
  }

  public loadData(props: IProps) {
    const { loadThrift, service, thrift } = props;
    if (!thrift[service.id]) { loadThrift(service.id); }
  }

  public render() {
    const { clients, form: { getFieldDecorator, getFieldValue }, service, thrift } = this.props;
    const { id, port, url, useHttp } = service;
    const { request } = this.state;
    const client = clients[id] || [];

    if (thrift[service.id]) {
      this.funcs = thrift[service.id].services.find((s) => s.name === service.service)!.functions;
    }

    let initialUrl = `http://127.0.0.1:${port}${url ? url : ""}`;
    let headers = Object.entries({});
    if (request) {
      initialUrl = `http://${request.host}:${request.port}${request.path ? request.path : ""}`;
      headers = Object.entries(request.headers || {});
    }

    return (
      <div className="client-wrapper">
        <Form onSubmit={this.handleSubmit} className="client">
          <div style={{display: "flex"}}>
            <div className="url-input">
              <InputGroup compact style={{flexGrow: 1}}>
                {getFieldDecorator("func", { rules: [{ required: true }] })(
                  <Select placeholder="Select function" style={{width: "20%"}} onChange={this.onFuncChange}>
                    {this.funcs.map((f) =>
                      <Option value={f.name} key={f.name}>{f.name}</Option>,
                    )}
                  </Select>,
                )}
                {getFieldDecorator("url", { initialValue: initialUrl, rules: [{ required: true }] })(
                  <Input placeholder="Enter request url" style={{width: "80%"}} />,
                )}
              </InputGroup>
              <Button type={"primary" as any} disabled={this.invalid()} htmlType="submit">Send</Button>
              <Button onClick={this.downloadRequest} disabled={this.invalid()}>Save</Button>
            </div>
            <div style={{width: 300}}>
              <h2 style={{textAlign: "center"}}>History</h2>
            </div>
          </div>
          <div className="scroll-container">
            <div style={{flexGrow: 1, overflow: "auto"}}>
              <Tabs defaultActiveKey="2" tabBarExtraContent={this.renderSwitch()}>
                <TabPane tab={<span>Headers {this.hSize(getFieldValue("headers"))}</span>} key="1" disabled={!useHttp}>
                  {getFieldDecorator("headers", {initialValue: headers})(
                    <Headers/>,
                  )}
                </TabPane>
                <TabPane tab="Body" key="2">
                  <FormItem>
                    {getFieldDecorator("args", { rules: [{ validator: this.dataValidator, required: true }],
                    })(<TextArea rows={20} style={{ display: this.state.tree ? "none" : "block" }} />)}
                    {this.state.tree ? this.renderTreeView() : null}
                  </FormItem>
                </TabPane>
              </Tabs>
              {this.renderResponse()}
            </div>
            <History client={client} onChange={this.jumpTo}/>
          </div>
        </Form>
      </div>);
  }

  public renderSwitch = () =>
    <Switch
      checkedChildren={<Icon type="bars" />}
      unCheckedChildren={<Icon type="form" />}
      checked={this.state.tree}
      onChange={(tree) => this.setState({...this.state, tree})}
      disabled={this.invalid()}
    />

  public renderTreeView = () => {
    const { form: { getFieldValue, setFieldsValue }, service: {id}, thrift } = this.props;
    const name = getFieldValue("func");
    const func = this.funcs.find((f) => f.name === name)!;
    const type = {
      name: func.name, typeId: "struct" as "struct",
      type: {typeId: "struct" as "struct", class: `${name}Args`},
    };
    return <TreeView
      onChange={(d) => setFieldsValue({ args: JSON.stringify(d, null, 2) })}
      data={JSON.parse(getFieldValue("args"))}
      thrift={addArgs(thrift[id], func)}
      type={type}
    />;
  }

  public hSize = (headers?: any[]) => {
    if (headers && headers.length > 0) {
      return <span style={{color: "green"}}>({headers.length})</span>;
    }
    return null;
  }

  public dataValidator = (_: any, value: string, callback: any) => {
    const { form: { getFieldValue }, service: { id }, thrift } = this.props;
    let errors: JSX.Element[] = [];
    try {
      const data = JSON.parse(value);
      const name = getFieldValue("func");
      const func = this.funcs.find((f) => f.name === name)!;
      const type = {typeId: "struct" as "struct", class: `${name}Args`};
      errors = validate(data, addArgs(thrift[id], func), "struct", type).map((e) => <span>root{e}<br/></span> );
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

  public onFuncChange = (name: any) => {
    const { form: { setFieldsValue }, service: { id }, thrift } = this.props;
    const func = this.funcs.find((f) => f.name === name)!;
    const type = {typeId: "struct" as "struct", class: `${name}Args`};
    const data = generateThriftResponse("struct", addArgs(thrift[id], func), type);
    setFieldsValue({args: JSON.stringify(data, null, 2)});
  }

  public invalid = () => {
    const { getFieldValue, getFieldError } = this.props.form;
    const func = getFieldValue("func");
    const errors = getFieldError("args") || [];
    return !func || errors.length > 0;
  }

  public jumpTo = (index: number) => {
    const {clients, form: { setFieldsValue }, service: {id}} = this.props;
    const {request, response} = clients[id][index];
    const {args, func, headers, host, path, port} = request;
    setFieldsValue({
      func, url: `http://${host}:${port}${path ? path : ""}`,
      headers: Object.entries(headers || {}),
      args: JSON.stringify(args, null, 2)});
    this.setState({...this.state, request, response});
  }

  public formatRequest = (callback: (request: IClientAction["request"]) => void) => {
    const {service: {id}, form: { validateFields }} = this.props;
    validateFields((errors, values) => {
      if (!errors) {
        const { args, func, headers, url } = values;
        const { hostname: host, port, pathname: path } = new URL(url);
        callback({id, host, port: Number(port), path, func, args: JSON.parse(args),
          headers: headers.reduce((a: IUniq<string>, [k, v]: [string, string]) => { a[k] = v; return a; }, {}),
        });
      }
    });
  }

  public handleSubmit = (e: React.FormEvent) => {
    const {sendRequest} = this.props;
    e.preventDefault();
    this.formatRequest(sendRequest);
  }

  public downloadRequest = () => {
    this.formatRequest((request) => {
      const body = JSON.stringify(request, null, 2);
      const blob = new Blob([body], {type: "application/json"});
      const element = document.createElement("a");
      element.setAttribute("href", URL.createObjectURL(blob));
      element.setAttribute("download", "request.json");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });
  }

  public renderMeta = () => {
    const {request, response} = this.state;
    const {time: reqTime} = request!;
    const {time: respTime, error} = response!;
    return <span>
      Status: {error ? <span className="error">Error</span> : <span className="success">Success</span>}
      <span style={{padding: "0 10px"}}>Time: <span className="success">{respTime - reqTime!} ms</span></span>
    </span>;
  }

  public renderResponse = () => {
    const { service: {useHttp} } = this.props;
    const { response } = this.state;
    if (response) {
      const body = JSON.stringify(response.error || response.success, null, 2);
      const blob = new Blob([body], {type: "application/json"});
      const headers = Object.entries(response.headers || {});
      return (<Tabs defaultActiveKey="1" tabBarExtraContent={this.renderMeta()}>
      <TabPane tab="Body" key="1">
        <TextArea rows={20} value={trimLines(body, 200)} />
        <Button type="primary" href={URL.createObjectURL(blob)}
                style={{margin: "10px 0"}} download="response.json" icon="download">
          Download
        </Button>
      </TabPane>
      <TabPane tab={<span>Headers {this.hSize(headers)}</span>} key="2" disabled={!useHttp}>
        {headers.map(([k, v], i) =>
          <div key={i}><span style={{fontWeight: "bold"}}>{k}:</span> {v}</div>,
        )}
      </TabPane>
    </Tabs>);
    }
    return null;
  }
}

const mapStateToProps = ({ clients, thrift }: IProps) => ({ clients, thrift });
const mapDispatchToProps = (dispatch: any) => ({
  loadThrift: (id: string) => dispatch({ type: "@@IPC_REQUEST/GET_THRIFT", id }),
  sendRequest: (request: IClientAction["request"]) => dispatch({ type: "@@IPC_REQUEST/SEND_REQUEST", request }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(ThriftClient));
