import { IUniq, mapValues } from "@creditkarma/mimic-core";
import { IGraphqlTypes } from "@creditkarma/mimic-graphql";
import { joinElements } from "@renderer/components";
import { Divider, Input } from "antd";
import * as gql from "graphql";
import React from "react";
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps, ListRowRenderer } from "react-virtualized";
const Search = Input.Search;

const typeMap: IUniq<string> = {
  OBJECT: "Objects",
  INPUT_OBJECT: "Input Objects",
  INTERFACE: "Interfaces",
  UNION: "Unions",
  ENUM: "Enums",
  SCALAR: "Scalars",
  ROOT: "Schema",
};

interface IProps {
  graphql: IGraphqlTypes;
}

interface IState {
  search: {
    [T in keyof IGraphqlTypes]: string[];
  };
}

type ItemRenderer = <T>(data: IUniq<T>, renderItem: (item: T) => JSX.Element) => {
  count: number,
  rowRenderer: ListRowRenderer,
  cache: CellMeasurerCache,
};

export class Documentation extends React.PureComponent<IProps, IState> {
  public lists: IUniq<List> = {};
  public readonly initialSeach: IState["search"];

  constructor(props: IProps) {
    super(props);
    this.initialSeach = mapValues(this.props.graphql, () => []);
    this.state = { search: this.initialSeach};
  }

  public render() {
    const { graphql } = this.props;
    const { search } = this.state;
    return (
      <div>
        <h2 id="Search">Search</h2>
        <Search placeholder="input search text" onSearch={this.searchTypes} enterButton style={{ width: 400 }}/>
        {Object.entries(search).map(([key, val]) => {
          if (val.length > 0) {
            return (
              <div>
                <Divider orientation="left">{typeMap[key]}</Divider>
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
        <h2 id="Schema">Schema</h2>
        {this.renderSchema(graphql.ROOT)}
        <hr />
        <h2 id="OBJECT">Objects</h2>
        {this.renderList("OBJECT", this.itemRenderer(graphql.OBJECT, this.renderObject))}
        <hr />
        <h2 id="INPUT_OBJECT">Input Objects</h2>
        {this.renderList("INPUT_OBJECT", this.itemRenderer(graphql.INPUT_OBJECT, this.renderInputObject))}
        <hr />
        <h2 id="INTERFACE">Interfaces</h2>
        {this.renderList("INTERFACE", this.itemRenderer(graphql.INTERFACE, this.renderInteface))}
        <hr />
        <h2 id="UNION">Unions</h2>
        {this.renderList("UNION", this.itemRenderer(graphql.UNION, this.renderUnion))}
        <hr />
        <h2 id="ENUM">Enums</h2>
        {this.renderList("ENUM", this.itemRenderer(graphql.ENUM, this.renderEnum))}
        <hr />
        <h2 id="SCALAR">Scalars</h2>
        {this.renderList("SCALAR", this.itemRenderer(graphql.SCALAR, this.renderScalar))}
        <br />
        <br />
      </div>
    );
  }

  public handleClick = ({currentTarget}: React.MouseEvent<HTMLAnchorElement>) => {
    const { kind, name } = currentTarget.dataset as {kind: keyof IGraphqlTypes, name: string};
    const { graphql } = this.props;
    const el = document.getElementById(kind);
    if (el) { el.scrollIntoView(); }
    const index = Object.keys(graphql[kind]).indexOf(name);
    this.lists[kind].scrollToRow(index);
  }

  public searchTypes = (s: string) => {
    if (s.length < 3 ) {
      return this.setState({...this.state, search: this.initialSeach});
    }
    const { graphql } = this.props;
    const result = mapValues(graphql, (val) =>
      Object.keys(val).filter((k) => k.toLowerCase().includes(s.toLowerCase())),
    );
    this.setState({...this.state, search: result});
  }

  public formatType = (type: gql.IntrospectionOutputTypeRef | gql.IntrospectionInputTypeRef) => {
    switch (type.kind) {
      case "SCALAR":
      case "ENUM":
      case "OBJECT":
      case "INPUT_OBJECT":
      case "INTERFACE":
      case "UNION":
        return <a onClick={this.handleClick} data-kind={type.kind} data-name={type.name}>{type.name}</a>;
      case "LIST":
        return <span>[{this.formatType(type.ofType)}]</span>;
      case "NON_NULL":
        return <span>{this.formatType(type.ofType)}!</span>;
    }
  }

  public formatArg = (value: gql.IntrospectionInputValue, index: number) =>
    <span key={index}>
      {value.name}: {this.formatType(value.type)} {value.defaultValue ? ` = ${value.defaultValue}` : null}
    </span>

  public itemRenderer: ItemRenderer = (input, renderItem) => {
    const data = Object.values(input);
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

  public renderList = (kind: keyof IGraphqlTypes, {cache, count, rowRenderer}: ReturnType<ItemRenderer>) =>
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

  public implements = (ifs: ReadonlyArray<gql.IntrospectionNamedTypeRef<gql.IntrospectionInterfaceType>>) =>
    <div className="extends">
      <em>implements</em> <code>{
        joinElements(ifs.map((int, i) =>
          <a key={i} onClick={this.handleClick} data-kind="INTERFACE" data-name={int.name}>{int.name}</a>), ", ")
      }</code>
    </div>

  public implemented = (types: ReadonlyArray<gql.IntrospectionNamedTypeRef<gql.IntrospectionObjectType>>) =>
    <div className="extends">
      <em>implemented</em> <code>{
        joinElements(types.map((type, i) =>
          <a key={i} onClick={this.handleClick} data-kind="OBJECT" data-name={type.name}>{type.name}</a>), ", ")
      }</code>
    </div>

  public renderSchema = (t: IUniq<gql.IntrospectionNamedTypeRef<gql.IntrospectionObjectType>>) =>
    <div className="definition" key="schema">
      <h3 id="root">Root</h3>
      <table className="table-bordered table-striped table-condensed">
        <thead><tr>
          <th>Name</th>
          <th>Type</th>
        </tr></thead>
        <tbody>
          {Object.entries(t).map(([k, v], index) =>
            <tr key={index}>
              <td>{k}</td>
              <td>{v ? <a onClick={this.handleClick} data-kind="OBJECT" data-name={v.name}>{v.name}</a> : ""}</td>
            </tr>,
          )}
        </tbody>
      </table>
    </div>

  public renderObject = (t: gql.IntrospectionObjectType) =>
    <div className="definition">
      <h3 id={`OBJECT_${t.name}`}>Object: {t.name}</h3>
      {t.interfaces.length > 0 ? this.implements(t.interfaces) : null}
      <table className="table-bordered table-striped table-condensed">
        <thead><tr>
          <th>Field</th>
          <th>Type</th>
          <th>Args</th>
          <th>Description</th>
          <th>Deprecated</th>
          <th>Deprecation Reason</th>
        </tr></thead>
        <tbody>
          {t.fields.map((f, i) =>
            <tr key={i}>
              <td>{f.name}</td>
              <td>{this.formatType(f.type)}</td>
              <td>{f.args.length > 0 ? <span>({joinElements(f.args.map(this.formatArg), ", ")})</span> : null}</td>
              <td>{f.description}</td>
              <td>{f.isDeprecated.toString()}</td>
              <td>{f.deprecationReason}</td>
            </tr>,
          )}
        </tbody>
      </table>
      <br />
      {t.description ? <pre>{t.description}</pre> : null}
      <br />
    </div>

  public renderInputObject = (t: gql.IntrospectionInputObjectType) =>
    <div className="definition">
    <h3 id={`INPUT_OBJECT_${t.name}`}>Input Object: {t.name}</h3>
    <table className="table-bordered table-striped table-condensed">
      <thead><tr>
        <th>Field</th>
        <th>Type</th>
        <th>Description</th>
        <th>Default</th>
      </tr></thead>
      <tbody>
        {t.inputFields.map((f, i) =>
          <tr key={i}>
            <td>{f.name}</td>
            <td>{this.formatType(f.type)}</td>
            <td>{f.description}</td>
            <td>{f.defaultValue}</td>
          </tr>,
        )}
      </tbody>
    </table>
    <br />
    {t.description ? <pre>{t.description}</pre> : null}
    <br />
  </div>

  public renderInteface = (t: gql.IntrospectionInterfaceType) =>
    <div className="definition">
    <h3 id={`INTERFACE_${t.name}`}>Interface: {t.name}</h3>
    {t.possibleTypes.length > 0 ? this.implemented(t.possibleTypes) : null}
    <table className="table-bordered table-striped table-condensed">
      <thead><tr>
        <th>Field</th>
        <th>Type</th>
        <th>Args</th>
        <th>Description</th>
        <th>Deprecated</th>
        <th>Deprecation Reason</th>
      </tr></thead>
      <tbody>
        {t.fields.map((f, i) =>
          <tr key={i}>
            <td>{f.name}</td>
            <td>{this.formatType(f.type)}</td>
            <td>{f.args.length > 0 ? <span>({joinElements(f.args.map(this.formatArg), ", ")})</span> : null}</td>
            <td>{f.description}</td>
            <td>{f.isDeprecated.toString()}</td>
            <td>{f.deprecationReason}</td>
          </tr>,
        )}
      </tbody>
    </table>
    <br />
    {t.description ? <pre>{t.description}</pre> : null}
    <br />
  </div>

  public renderUnion = (t: gql.IntrospectionUnionType) =>
    <div className="definition">
    <h3 id={`UNION_${t.name}`}>Union: {t.name}</h3>
    {t.possibleTypes.length > 0 ? this.implemented(t.possibleTypes) : null}
    {t.description ? <pre>{t.description}</pre> : null}
  </div>

  public renderEnum = (e: gql.IntrospectionEnumType) =>
    <div className="definition">
    <h3 id={`ENUM_${e.name}`}>Enumeration: {e.name}</h3>
    {e.description ? <pre>{e.description}</pre> : null}
    <br />
    <table className="table-bordered table-striped table-condensed">
      <thead><tr>
        <th>Name</th>
        <th>Description</th>
        <th>Deprecated</th>
        <th>Deprecation Reason</th>
      </tr></thead>
      <tbody>
        {e.enumValues.map((m, i) =>
          <tr key={i}>
            <td><code>{m.name}</code></td>
            <td>{m.description}</td>
            <td>{m.isDeprecated}</td>
            <td>{m.deprecationReason}</td>
          </tr>,
        )}
      </tbody>
    </table>
  </div>

  public renderScalar = (s: gql.IntrospectionScalarType) =>
    <div className="definition">
      <h3 id={`SCALAR_${s.name}`}>Scalar: {s.name}</h3>
      {s.description ? <pre>{s.description}</pre> : null}
    </div>
}
