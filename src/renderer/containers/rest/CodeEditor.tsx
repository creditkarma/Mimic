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
      <div className="code-editor-container ant-input">
        <Editor
          value={this.props.value}
          padding={8}
          onValueChange={code => this.props.onChange(code || '')}
          highlight={code => this.insertLineNumbers(code)}
          style={{
            lineHeight: 1.2,
            fontSize: 12,
            overflow: 'visible',
            fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace'
          }}
        />
      </div>
    );
  }

  private insertLineNumbers(code: string = ''): string {
    return code.split('\n').map(line => {
      return `<span class="code-editor-line-number">${line}</span>`
    }).join('\n');
  }
}
