import { Icon } from "antd";
import * as React from "react";

interface IProps {
  value?: Array<[string, string]>;
  onChange?: (value: Array<[string, string]>) => void;
}

export class Headers extends React.PureComponent<IProps, {}> {
  public render() {
    const values = [...(this.props.value || []), ["", ""]];
    return <div>
      {values.map(([k, v], i) =>
        <div key={i} style={{display: "flex"}}>
          <input
            placeholder="Key" value={k}
            onChange={(e) => this.update(i, e.target.value, v)}
            style={{flexGrow: 1}}
          />
          <input
            placeholder="Value" value={v}
            onChange={(e) => this.update(i, k, e.target.value)}
            style={{flexGrow: 1}}
          />
          <a onClick={() => this.delete(i)}><Icon type="close" style={{padding: 10}}/></a>
        </div>,
      )}
  </div>;
  }
  public update = (index: number, key: string, value: string) => {
    const copy = [...this.props.value!];
    copy[index] = [key, value];
    if (this.props.onChange) {
      this.props.onChange(copy);
    }
  }
  public delete = (index: number) => {
    const copy = [...this.props.value!];
    copy.splice(index, 1);
    if (this.props.onChange) {
      this.props.onChange(copy);
    }
  }
}

export default Headers;
