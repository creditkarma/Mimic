import { IUniq, mapValues, pick } from "@creditkarma/mimic-core";
import { ThriftFile } from "@creditkarma/mimic-thrift";
import { capitalize, joinElements } from "@renderer/components";
import { Divider, Input } from "antd";
import React from "react";
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps, ListRowRenderer } from "react-virtualized";
import "./style.css";
const Search = Input.Search;

function structType(struct: ThriftFile.IStruct) {
  switch (true) {
    case struct.isException:
      return "Exception";
    case struct.isUnion:
      return "Union";
    default:
      return "Struct";
  }
}

interface IProps {
  thrift: ThriftFile.IJSON;
}

interface IState {
  search: IUniq<string[]>;
}

type ItemRenderer = <T>(data: T[], renderItem: (item: T) => JSX.Element) => {
  count: number,
  rowRenderer: ListRowRenderer,
  cache: CellMeasurerCache,
};

export class Documentation extends React.PureComponent<IProps, IState> {
  public lists: IUniq<List> = {};
  public readonly initialSeach = {structs: [], enums: [], typedefs: []};

  constructor(props: IProps) {
    super(props);
    this.state = { search: this.initialSeach};
  }

  public render() {
    const { thrift } = this.props;
    const { search } = this.state;
    return (
      <div>
        <h2 id="Search">Search</h2>
        <Search placeholder="Search type" onChange={this.searchTypes} enterButton style={{ width: 400 }}/>
        {Object.entries(search).map(([key, val]) => {
          if (val.length > 0) {
            return (
              <div>
                <Divider orientation="left">{capitalize(key)}</Divider>
                <p>{joinElements(val.map((v) =>
                  <a onClick={this.handleClick} data-kind={key} data-name={v}>{v}</a>,
                ), ", ")}</p>
              </div>
            );
          }
          return null;
        })}
        <br />
        <br />
        <h2 id="services">Services</h2>
        {thrift.services.map(this.service)}
        <hr />
        <h2 id="structs">Data structures</h2>
        {this.renderList("structs", this.itemRenderer(thrift.structs, this.struct))}
        <hr />
        <h2 id="enums">Enumerations</h2>
        {this.renderList("enums", this.itemRenderer(thrift.enums, this.enum))}
        <hr />
        <h2 id="typedefs">Type declarations</h2>
        {this.renderList("typedefs", this.itemRenderer(thrift.typedefs, this.typedef))}
        <hr />
        <h2 id="constants">Constants</h2>
        {this.constants(thrift.constants)}
        <br />
        <br />
      </div>
    );
  }

  public searchTypes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target;
    if (value.length < 1 ) {
      return this.setState({...this.state, search: this.initialSeach});
    }
    const { thrift } = this.props;
    const result = mapValues(pick(thrift, "structs", "enums", "typedefs"), (val: Array<{name: string}>) =>
      val.map((v) => v.name).filter((v) => v.toLowerCase().includes(value.toLowerCase())),
    );
    this.setState({...this.state, search: result});
  }

  public itemRenderer: ItemRenderer = (data, renderItem) => {
    const cache = new CellMeasurerCache({
      defaultHeight: 300,
      fixedWidth: true,
    });
    return {
      count: data.length, cache,
      rowRenderer: ({key, parent, index, style}: ListRowProps) =>
        <CellMeasurer cache={cache} key={key} parent={parent} index={index}>
          <div style={style}>
            {renderItem(data[index])}
          </div>
        </CellMeasurer>,
    };
  }

  public renderList = (kind: keyof ThriftFile.IJSON, {cache, count, rowRenderer}: ReturnType<ItemRenderer>) =>
    <AutoSizer disableHeight>
      {({width}) => (
        <List
          height= {count > 0 ? 800 : 0}
          ref={(list) => list ? this.lists[kind] = list : null}
          width={width}
          rowRenderer={rowRenderer}
          rowCount={count}
          deferredMeasurementCache={cache}
          rowHeight={cache.rowHeight}
          overscanRowCount={2}
          scrollToAlignment="start"
        />
      )}
    </AutoSizer>

  public formatType = (
    typeId: string,
    type?: ThriftFile.Type,
    extra?: ThriftFile.IExtraType,
  ): JSX.Element | string => {
    if (extra) {
      switch (extra.typeId) {
        case "enum":
          return <a data-kind="enums" data-name={extra.class} onClick={this.handleClick}>{extra.class}</a>;
        case "typedef":
          return <a data-kind="typedefs" data-name={extra.class} onClick={this.handleClick}>{extra.class}</a>;
      }
    }
    if (type) {
      switch (type.typeId) {
        case "exception":
        case "struct":
        case "union":
          return <a data-kind="structs" data-name={type.class} onClick={this.handleClick}>{type.class}</a>;
        case "set":
          return <span>set&lt;{this.formatType(type.elemTypeId, type.elemType, type.extra)}&gt;</span>;
        case "list":
          return <span>list&lt;{this.formatType(type.elemTypeId, type.elemType, type.extra)}&gt;</span>;
        case "map":
          return <span>map&lt;
          {this.formatType(type.keyTypeId, type.keyType, type.keyExtra)},
          {this.formatType(type.valueTypeId, type.valueType, type.valueExtra)}
            &gt;</span>;
        default:
          throw new Error(`Can't handle "${typeId}" type yet`);
      }
    }
    return typeId;
  }

  public handleClick = ({currentTarget}: React.MouseEvent<HTMLAnchorElement>) => {
    const { kind, name } = currentTarget.dataset as {kind: keyof ThriftFile.IJSON, name?: string};
    const { thrift } = this.props;
    const el = document.getElementById(kind);
    if (el) { el.scrollIntoView(); }
    if (name) {
      const index = (thrift[kind] as any[]).findIndex((t) => t.name === name);
      this.lists[kind].scrollToRow(index);
    }
  }

  public service = (s: ThriftFile.IService, i: number) =>
    <div key={i}>
      <h3 id={`Svc_${s.name}`}>Service: {s.name}</h3>
      {s.extends ? this.extends(s.extends) : null}
      {s.doc ? <pre>{s.doc}</pre> : null}
      {s.functions.map((f, index) => this.func(s.name, f, index))}
      <br />
    </div>

  public extends = (ext: string) =>
    <div className="extends">
      <em>extends</em> <code><a data-kind={`Svc_${ext}`} onClick={this.handleClick}>{ext}</a></code>
    </div>

  public func = (service: string, f: ThriftFile.IFunction, i: number) =>
    <div className="definition" key={i}>
      <h4>Function: {service}.{f.name}</h4>
      <pre><code>{this.formatType(f.returnTypeId, f.returnType, f.returnExtra)}</code> {f.name}
        ({this.args(f.arguments)}) {f.exceptions.length > 0 ? "throws" : ""} {this.args(f.exceptions)}
      </pre>
      {f.doc ? <pre>{f.doc}</pre> : null}
      <br />
    </div>

  public args = (ar: ThriftFile.IArgument[]) =>
    ar.map((a, i) =>
      <span key={i}>
        {i === 0 ? "" : ", "}{this.formatType(a.typeId, a.type, a.extra)} {a.name}
      </span>,
    )

  public struct = (s: ThriftFile.IStruct) =>
    <div className="definition">
      <h3>{structType(s)}: {s.name}</h3>
      <table className="table-bordered table-striped table-condensed">
        <thead><tr>
          <th>Key</th>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
          <th>Requiredness</th>
          <th>Default value</th>
        </tr></thead>
        <tbody>
          {s.fields.map((f, index) =>
            <tr key={index}>
              <td>{f.key}</td>
              <td>{f.name}</td>
              <td><code>{this.formatType(f.typeId, f.type, f.extra)}</code></td>
              <td></td>
              <td>{["req_out", "required"].includes(f.required) ? "default" : "optional"}</td>
              <td>{f.hasOwnProperty("default") ? <code>{f.default}</code> : null}</td>
            </tr>,
          )}
        </tbody>
      </table>
      <br />
      {s.doc ? <pre>{s.doc}</pre> : null}
      <br />
    </div>

  public enum = (e: ThriftFile.IEnum) =>
    <div className="definition">
      <h3>Enumeration: {e.name}</h3>
      {e.doc ? <pre>{e.doc}</pre> : null}
      <br />
      <table className="table-bordered table-striped table-condensed">
        <tbody>
          {e.members.map((m, index) =>
            <tr key={index}>
              <td><code>{m.name}</code></td>
              <td><code>{m.value}</code></td>
            </tr>,
          )}
        </tbody>
      </table>
    </div>

  public constants = (con: ThriftFile.IConstant[]) => {
    const rows: JSX.Element[] = [];
    con.forEach((c, i) => {
      rows.push(
        <tr key={i}>
          <td><code>{c.name}</code></td>
          <td><code>{c.typeId}</code></td>
          <td><code>{JSON.stringify(c.value)}</code></td>
        </tr>);
      if (c.doc) {
        rows.push(
          <tr key={`${i}_doc`}>
            <td colSpan={3}><blockquote><pre>{c.doc}</pre><br /></blockquote></td>
          </tr>);
      }
    });
    return (
      <table className="table-bordered table-striped table-condensed">
        <thead><tr>
          <th>Constant</th>
          <th>Type</th>
          <th>Value</th>
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }

  public typedef = (td: ThriftFile.ITypeDef) =>
    <div className="definition">
      <h3>Typedef: {td.name}</h3>
      <p><strong>Base type:</strong>&nbsp;<code>{this.formatType(td.typeId, td.type, td.extra)}</code></p>
      {td.doc ? <pre>{td.doc}</pre> : null}
    </div>
}

export default Documentation;
