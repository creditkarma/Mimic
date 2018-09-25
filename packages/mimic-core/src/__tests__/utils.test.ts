import * as path from "path";
import * as utils from "../utils";

describe("readRecursively()", () => {
  it("returns data", (done) => {
    const dirPath = path.join(__dirname, "__fixtures__");
    const expected = {
      [path.join(dirPath, "file1.ext1")]: "text1",
      [path.join(dirPath, "subdir/file3.ext1")]: "text3",
    };
    utils.readRecursively(dirPath, "ext1").then((value) => {
      expect(value).toEqual(expected);
      done();
    });
  });
});
