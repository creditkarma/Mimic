import React from "react";
import { FormComponentProps } from 'antd/lib/form';
import Editor from 'react-simple-code-editor';

interface IProps extends FormComponentProps {
  value: string;
  onChange: (code: string) => void
}

export default class CodeEditor extends React.PureComponent<IProps> {
  render() {
    return (
      <Editor
        className='ant-input'
        value={this.props.value}
        padding={8}
        onValueChange={code => this.props.onChange(code || '')}
        highlight={(code) => code}
        style={{
          height: 380,
          lineHeight: 1.2,
          fontSize: 12,
          fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace'
        }}
      />
    );
  }
}
