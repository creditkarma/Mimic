import React from "react";
import renderer from "react-test-renderer";
import CodeEditor from "../CodeEditor";

const JSON_CODE = `{
  "id": 1,
  "name": "John",
  "items": ["one", "two"]
}`;

describe("CodeEditor", () => {
  it("can parse JSON code", () => {
    const component = renderer.create(<CodeEditor value={JSON_CODE}/>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
