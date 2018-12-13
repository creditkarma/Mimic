import { generateGraphqlResponse, IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { Dropdown, Menu, Tooltip, Tree } from "antd";
import { IntrospectionOutputTypeRef } from "graphql";
import React from "react";
const TreeNode: any = Tree.TreeNode;
const SubMenu = Menu.SubMenu;

interface IProps {
  types: IGraphqlTypes;
  data: any;
  onChange: (data: any) => void;
  schema: IntrospectionOutputTypeRef;
}

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
  const { types, data, children, onChange, onDelete, required, schema } = props;
  const items: JSX.Element[] = [];
  switch (schema.kind) {
    case "OBJECT":
    case "INTERFACE":
    case "UNION":
      const {__type, ...keys} = data;
      const fields = types.OBJECT[__type].fields;
      const used = new Set(Object.keys(keys));
      const avail = fields.filter((f) => !used.has(f.name));
      if (avail.length > 0) {
        items.push(<SubMenu title="Add child" key="add">
          {avail.sort((a, b) => a.name.localeCompare(b.name)).map((field) =>
            <Menu.Item key={field.name}>
              <a onClick={() => onChange({
                ...data,
                [field.name]: generateGraphqlResponse(types, field.type, false),
              })}>{field.name}</a>
            </Menu.Item>,
          )}
        </SubMenu>);
      }
      if (schema.kind === "INTERFACE" || schema.kind === "UNION") {
        const possibleTypes = types[schema.kind][schema.name].possibleTypes.filter((t) => t.name !== __type);
        if (possibleTypes.length > 0) {
          items.push(<SubMenu title="Replace" key="replace">
            {possibleTypes.map((type) =>
              <Menu.Item key={type.name}>
                <a onClick={() => onChange(generateGraphqlResponse(types, type, false))}>
                  {type.name}
                </a>
              </Menu.Item>,
            )}
          </SubMenu>);
        }
      }
      break;
    case "LIST":
      items.push(<Menu.Item key="add">
        <a onClick={() => onChange([...data,
          generateGraphqlResponse(types, schema.ofType, false),
        ])}>Add Child</a>
      </Menu.Item>);
      break;
    case "NON_NULL":
      return LevelMenu({...props, schema: schema.ofType});
  }
  const menu = (
    <Menu>
      {items}
      <Menu.Item key="remove" disabled={required}>{required ? "Remove" : <a onClick={onDelete}>Remove</a>}</Menu.Item>
    </Menu>);
  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      {children}
    </Dropdown>);
};

const Title: React.SFC<ILevelProps> = (props) => {
  const { name, types, data, onChange, schema } = props;
  let dataInput = <div></div>;

  switch (schema.kind) {
    case "OBJECT":
    case "INTERFACE":
    case "UNION":
      return <LevelMenu {...props}>
        <Tooltip title={data.__type}>
          <a>{name} {`{${Object.keys(data).length - 1}}`}</a>
        </Tooltip>
      </LevelMenu>;
    case "LIST":
      return <LevelMenu {...props}>
        <Tooltip title={schema.ofType.name || schema.ofType.ofType.name}>
          <a>{name} {`[${data.length}]`}</a>
        </Tooltip>
      </LevelMenu>;
    case "ENUM":
      dataInput = <select value={data} className="tree-select jsoneditor-value"
        onChange={(e) => onChange(e.target.value)}>
        {types.ENUM[schema.name].enumValues.map((m) => <option value={m.name} key={m.name}>{m.name}</option>)}
      </select>;
      break;
    case "SCALAR":
      switch (schema.name) {
        case "Int":
        case "Float":
          dataInput = <input type="number"
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            value={data}
            className="jsoneditor-value jsoneditor-number"
            placeholder="number" />;
          break;
        case "Boolean":
          dataInput = <input
            onChange={(e) => onChange(e.target.checked)}
            type="checkbox" checked={data}
            className="jsoneditor-value" />;
          break;
        case "ID":
        case "String":
        default:
          dataInput = <input type="text"
            onChange={(e) => onChange(e.target.value)}
            value={data}
            className="jsoneditor-value jsoneditor-string"
            placeholder="text" />;
      }
      break;
    case "NON_NULL":
      return Title({...props, schema: schema.ofType});
  }
  return (<div>
    <LevelMenu {...props}>
      <a>{name} :</a>
    </LevelMenu>
    {dataInput}
  </div>);
};

const Level: React.SFC<ILevelProps> = (props) => {
  const { types, data, onChange, schema, prefix } = props;
  switch (schema.kind) {
    case "OBJECT":
    case "INTERFACE":
    case "UNION":
      const {__type, ...keys} = data;
      const fields = types.OBJECT[__type].fields;
      return (
        <TreeNode title={<Title {...props} />} key={prefix} selectable={false}>
          {Object.keys(keys).sort().map((key, index) => {
            let { type } = fields.find((f) => f.name === key)!;
            let required = false;
            if (type.kind === "NON_NULL") {
              required = true;
              type = type.ofType;
            }
            return Level({
              name: key, required, types, data: data[key], schema: type, prefix: prefix + index,
              onChange: (d: any) => onChange({ ...data, [key]: d }),
              onDelete: () => {
                const { [key]: deleted, ...rest } = data;
                onChange(rest);
              },
            });
          })}
        </TreeNode>);
    case "LIST":
      return (
        <TreeNode title={<Title {...props} />} key={prefix} selectable={false}>
          {data.map((el: any, index: number) => {
            return Level({
              name: index.toString(), required: false, types, data: el, schema: schema.ofType, prefix: prefix + index,
              onChange: (d: any) => onChange(Object.assign([...data], { [index]: d })),
              onDelete: () => onChange(data.filter((e: any, i: number) => i !== index)),
            });
          })}
        </TreeNode>);
    case "ENUM":
    case "SCALAR":
      return <TreeNode title={<Title {...props} />} key={prefix} selectable={false} isLeaf />;
    case "NON_NULL":
      return Level({ ...props, schema: schema.ofType});
  }
};

export const TreeView: React.SFC<IProps> = (props) =>
  <Tree showLine defaultExpandedKeys={["."]} className="tree-view">
    {Level({ ...props, name: "root", prefix: ".", required: true, onDelete: () => null })}
  </Tree>;

export default TreeView;
