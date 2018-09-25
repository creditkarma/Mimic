import { Icon, Input } from "antd";
import * as React from "react";

export interface IProps {
  value: string;
  children?: JSX.Element;
  onChange: (value: string) => void;
}

interface IState {
  value: string;
  editable: boolean;
}

export class EditableCell extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      value: props.value,
      editable: false,
    };
  }

  public handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ value });
  }

  public check = () => {
    this.setState({ editable: false });
    if (this.props.onChange) {
      this.props.onChange(this.state.value);
    }
  }
  public edit = () => {
    this.setState({ editable: true });
  }

  public render() {
    const { value, editable } = this.state;
    const { children } = this.props;
    return (<div className="editable-cell">
      {editable ?
        <div className="editable-cell-input-wrapper">
          <Input
            value={value}
            onChange={this.handleChange}
            onPressEnter={this.check}
          />
          <Icon
            type="check"
            className="editable-cell-icon-check"
            onClick={this.check}
          />
        </div>
        :
        <div className="editable-cell-text-wrapper">
          {children ? children : value}
          <Icon
            type="edit"
            className="editable-cell-icon"
            onClick={this.edit}
          />
        </div>}
      </div>);
  }
}

export default EditableCell;
