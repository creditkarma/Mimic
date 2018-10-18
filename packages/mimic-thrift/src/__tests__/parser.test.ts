import * as fs from "fs";
import * as path from "path";
import ThriftParser from "../parser";

describe("ThriftParser", () => {
  let subject: ThriftParser;

  beforeEach(() => {
    subject = new ThriftParser({includes: []});
  });

  describe("parse()", () => {
    it("generates valid JSON", (done) => {
      const dirPath = path.join(__dirname, "__fixtures__");
      const thriftPath = path.join(dirPath, "tutorial.thrift");
      const jsonPath = path.join(dirPath, "tutorial.json");
      subject.parse(thriftPath, (err, data) => {
        expect(err).toEqual(null);
        fs.readFile(jsonPath, "utf8", (readErr, content) => {
          expect(readErr).toEqual(null);
          expect(data).toEqual(JSON.parse(content));
          done();
        });
      });
    });
  });
});
