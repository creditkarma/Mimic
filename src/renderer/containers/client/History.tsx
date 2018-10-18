import { IClientAction } from "@creditkarma/mimic-core";
import React from "react";
import { AutoSizer , List, ListRowProps } from "react-virtualized";

interface IProps {
  client: Array<Required<IClientAction>>;
  onChange: (index: number) => void;
}

export class History extends React.PureComponent<IProps, {}> {
  public render() {
    const { client } = this.props;
    return <AutoSizer disableWidth>
      {({ height }) => (
      <List
        className="history-list"
        height={height}
        width={300}
        rowRenderer={this.rowRenderer}
        rowCount={client.length}
        rowHeight={33}
      />
      )}
      </AutoSizer>;
  }
  public rowRenderer = ({index, key, style}: ListRowProps) => {
    const {client, onChange} = this.props;
    const {request: {func, host, path, port, time}, response: {error}} = client[index];
    const t = new Date(time!);
    return <div key={key} className="history-item" style={style} onClick={() => onChange(index)}>
      <span>{t.getHours()}:{t.getMinutes()}</span>
      <span className={error ? "error" : "success"}>{func}</span>
      <span>{`http://${host}:${port}${path ? path : ""}`}</span>
    </div>;
  }
}

export default History;
