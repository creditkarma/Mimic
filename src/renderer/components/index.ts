export { default as EditableCell } from "./EditableCell";
export { default as MenuSwitch } from "./MenuSwitch";
import * as logos from "./logos";
export { logos };

export const trimLines = (data: string, lines: number) => {
  let iter = 0;
  let result = "";
  for (const ch of data) {
    if (ch === "\n") {
      iter += 1;
    }
    result += ch;
    if (iter === lines) {
      return result + "... trimmed";
    }
  }
  return result;
};

export const joinElements = (elements: JSX.Element[], sep: string): JSX.Element =>
  (elements as any).reduce((a: any, v: any) => [ a, sep, v ]);

export const capitalize = (word: string) =>
  word[0].toUpperCase() + word.slice(1);
