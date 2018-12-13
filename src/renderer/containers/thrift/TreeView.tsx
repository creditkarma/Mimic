import { generateThriftResponse, ThriftFile } from "@creditkarma/mimic-thrift";
import { Dropdown, Menu, Modal, Tooltip, Tree } from "antd";
import React from "react";
const TreeNode: any = Tree.TreeNode;
const SubMenu = Menu.SubMenu;

interface IProps {
  thrift: ThriftFile.IJSON;
  data: any;
  onChange: (data: any) => void;
  type: {
    typeId: ThriftFile.TypeID,
    type?: ThriftFile.Type,
    extra?: ThriftFile.IExtraType,
  };
}

const typeClass = (type?: ThriftFile.Type): string | null => {
  if (!type) { return null; }
  switch (type.typeId) {
    case "exception":
    case "struct":
    case "union":
      return type.class;
    case "map":
      return "Map";
    case "set":
    case "list":
      return typeClass(type.elemType);
  }
};

interface ILevelProps extends IProps {
  name: string;
  required: boolean;
  prefix: string;
  onDelete: () => void;
}

interface IMenuProps extends IProps {
  required: boolean;
  onDelete: () => void;
  children: JSX.Element;
}

const LevelMenu: React.SFC<IMenuProps> = (props) => {
  const { thrift, data, children, onChange, onDelete, required, type: { type, typeId } } = props;
  let items: JSX.Element | null = null;
  if (type) {
    switch (type.typeId) {
      case "exception":
      case "struct":
      case "union":
        const struct = thrift.structs.filter((s) => s.name === type.class)[0];
        const used = new Set(Object.keys(data));
        const fields = struct.fields.filter((f) => !used.has(f.name));
        if (fields.length === 0) { break; }
        if (type.typeId === "union") {
          items = <SubMenu title="Replace child" key="replace">
            {fields.map((field) =>
              <Menu.Item key={field.key}>
                <a onClick={() => onChange({
                  [field.name]: generateThriftResponse(field.typeId, thrift, field.type, field.extra),
                })}>{field.name}</a>
              </Menu.Item>,
            )}
          </SubMenu>;
        } else {
          items = <SubMenu title="Add child" key="add">
            {fields.map((field) =>
              <Menu.Item key={field.key}>
                <a onClick={() => onChange({
                  ...data,
                  [field.name]: generateThriftResponse(field.typeId, thrift, field.type, field.extra),
                })}>{field.name}</a>
              </Menu.Item>,
            )}
          </SubMenu>;
        }
        break;
      case "set":
      case "list":
        items = <Menu.Item key="add">
          <a onClick={() => onChange([...data,
          generateThriftResponse(type.elemTypeId, thrift, type.elemType, type.extra),
          ])}>Add Child</a>
        </Menu.Item>;
        break;
      case "map":
        items = <Menu.Item key="add">
          <a onClick={() => askFieldName((name) => {
            onChange({
              ...data,
              [name]: generateThriftResponse(type.valueTypeId, thrift, type.valueType, type.valueExtra),
            });
          })}>Add Child</a>
        </Menu.Item>;
        break;
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
  const menu = (
    <Menu>
      {items}
      <Menu.Item disabled={required}>{required ? "Remove" : <a onClick={onDelete}>Remove</a>}</Menu.Item>
    </Menu>);
  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      {children}
    </Dropdown>);
};

const askFieldName = (callback: (value: string) => void) => {
  let value = "";
  return Modal.confirm({
    width: 288,
    title: "Provide key name",
    content: <div style={{ position: "relative", left: -32 }}>
      key: <input onChange={(e) => value = e.target.value} />
    </div>,
    onOk: () => callback(value),
  });
};

const Title: React.SFC<ILevelProps> = (props) => {
  const { name, thrift, data, onChange, type: { type, typeId, extra } } = props;
  if (type) {
    switch (type.typeId) {
      case "exception":
      case "struct":
      case "union":
      case "map":
        return <LevelMenu {...props}>
          <Tooltip title={typeClass(type)}>
            <a>{name} {`{${Object.keys(data).length}}`}</a>
          </Tooltip>
        </LevelMenu>;
      case "set":
      case "list":
        return <LevelMenu {...props}>
          <Tooltip title={typeClass(type.elemType)}>
            <a>{name} {`[${data.length}]`}</a>
          </Tooltip>
        </LevelMenu>;
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
  let dataInput: JSX.Element;
  switch (typeId) {
    case "void":
      dataInput = <span> null</span>;
      break;
    case "string":
      dataInput = <input type="text"
        onChange={(e) => onChange(e.target.value)}
        value={data}
        className="jsoneditor-value jsoneditor-string"
        placeholder="text" />;
      break;
    case "i16":
    case "i32":
    case "i64":
    case "double":
      if (extra && extra.typeId === "enum") {
        const en = thrift.enums.filter((e) => e.name === extra.class)[0];
        dataInput = <select value={data} className="tree-select jsoneditor-value"
          onChange={(e) => onChange(Number(e.target.value))}>
          {en.members.map((m) => <option value={m.value} key={m.name}>{m.name}</option>)}
        </select>;
      } else {
        dataInput = <input type="number"
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          value={data}
          className="jsoneditor-value jsoneditor-number"
          placeholder="number" />;
      }
      break;
    case "bool":
      dataInput = <input
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox" checked={data}
        className="jsoneditor-value" />;
      break;
    default:
      throw new Error(`Can't handle "${typeId}" type yet`);
  }
  return (<div>
    <LevelMenu {...props}>
      <a>{name} :</a>
    </LevelMenu>
    {dataInput}
  </div>);
};

const Level: React.SFC<ILevelProps> = (props) => {
  const { thrift, data, onChange, type: { type, typeId }, prefix } = props;
  if (type) {
    switch (type.typeId) {
      case "exception":
      case "struct":
      case "union":
        const struct = thrift.structs.filter((s) => s.name === type.class)[0];
        return (
          <TreeNode title={<Title {...props} />} key={prefix} selectable={false}>
            {Object.keys(data).sort().map((key, index) => {
              const field = struct.fields.filter((f) => f.name === key)[0];
              const required = type.typeId === "union" || field.required !== "optional";
              return Level({
                name: key, required, thrift, data: data[key], type: field, prefix: prefix + index,
                onChange: (d: any) => onChange({ ...data, [key]: d }),
                onDelete: () => {
                  const { [key]: deleted, ...rest } = data;
                  onChange(rest);
                },
              });
            })}
          </TreeNode>);
      case "set":
      case "list":
        const { elemTypeId, elemType, extra: elemExtra } = type;
        return (
          <TreeNode title={<Title {...props} />} key={prefix} selectable={false}>
            {data.map((el: any, index: number) => {
              return Level({
                name: index.toString(), required: false, thrift, data: el, prefix: prefix + index,
                type: { typeId: elemTypeId, type: elemType, extra: elemExtra },
                onChange: (d: any) => onChange(Object.assign([...data], { [index]: d })),
                onDelete: () => onChange(data.filter((e: any, i: number) => i !== index)),
              });
            })}
          </TreeNode>);
      case "map":
        const { valueTypeId, valueType, valueExtra } = type;
        return (
          <TreeNode title={<Title {...props} />} key={prefix} selectable={false}>
            {Object.keys(data).sort().map((key, index) =>
              Level({
                name: key, required: false, thrift, data: data[key], prefix: prefix + index,
                type: { typeId: valueTypeId, type: valueType, extra: valueExtra },
                onChange: (d: any) => onChange({ ...data, [key]: d }),
                onDelete: () => {
                  const { [key]: deleted, ...rest } = data;
                  onChange(rest);
                },
              }),
            )}
          </TreeNode>);
      default:
        throw new Error(`Can't handle "${typeId}" type yet`);
    }
  }
  return <TreeNode title={<Title {...props} />} key={prefix} selectable={false} />;
};

export const TreeView: React.SFC<IProps> = (props) =>
  <Tree showLine defaultExpandedKeys={["."]} className="tree-view">
    {Level({ ...props, name: "root", prefix: ".", required: true, onDelete: () => null })}
  </Tree>;

export default TreeView;
