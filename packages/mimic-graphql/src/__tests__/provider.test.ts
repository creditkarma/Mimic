import { ResponseManager } from "@creditkarma/mimic-core";
import { GraphQLProvider } from "../provider";

describe("GraphQLProvider", () => {
  let respManager: ResponseManager;
  let subject: GraphQLProvider;

  beforeEach(() => {
    respManager = new ResponseManager();
    subject = new GraphQLProvider({}, respManager);
  });

  describe("validate()", () => {
    it("returns data", () => {
      expect(subject).toBeDefined();
    });
  });
});
