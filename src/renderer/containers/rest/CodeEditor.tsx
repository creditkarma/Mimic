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
        padding={[8, 8, 8, 28]}
        onValueChange={code => this.props.onChange(code || '')}
        highlight={code  => this.insertLineNumbers(code)}
        style={{
          height: `calc(100vh - 420px)`,
          lineHeight: 1.2,
          fontSize: 12,
          fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace'
        }}
      />
    );
  }

  insertLineNumbers(code: string): string | null {
    if (!code) {
      return null;
    }
    return code.split('\n').map(line => {
      return `<span class="code-editor-line-number">${line}</span>`
    }).join('\n');
  }
}
