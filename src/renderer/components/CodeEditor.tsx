// import { FormComponentProps } from "antd/lib/form";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import React from "react";
import Editor from "react-simple-code-editor";

interface IProps {
  value: string;
  onChange: (code: string) => void;
  style?: React.CSSProperties;
}

export class CodeEditor extends React.PureComponent<IProps> {
  public static defaultProps = {
    value: "",
    onChange: () => null,
  };
  public render() {
    return <div className="code-editor-container ant-input" style={this.props.style}>
      <Editor
        value={this.props.value}
        padding={8}
        onValueChange={(code) => this.props.onChange(code)}
        highlight={(code) => this.insertLineNumbers(code)}
        style={{
          lineHeight: 1.2,
          fontSize: 16,
          overflow: "visible",
        }}
      />
    </div>;
  }

  private insertLineNumbers = (code: string = ""): string =>
    highlight(code, languages.json, "json")
      .split("\n").map((line) =>
        `<span class="code-editor-line-number">${line}</span>`,
      ).join("\n")
}

export default CodeEditor;
