jest.mock("../config");
import { ResponseManager } from "../response_manager";

describe("ResponseManager", () => {
  const responses = {
    test: {
      func: "data",
    },
  };
  let subject: ResponseManager;

  beforeEach(() => {
    subject = new ResponseManager(responses);
  });

  describe("find()", () => {
    describe("with data", () => {
      it("returns data", () => {
        expect(subject.find("test")).toEqual(responses.test);
      });
    });

    describe("without data", () => {
      it("returns empty object", () => {
        expect(subject.find("nonexistent")).toEqual({});
      });
    });
  });

  describe("export()", () => {
    it("returns responses for selected services", () => {
      expect(subject.export(["test"])).toEqual(responses);
    });
  });

  describe("add()", () => {
    const id = "test1";
    const response = {new: "data"};
    const callback = jest.fn();

    beforeEach(() => {
      jest.spyOn(subject, "emit");
      subject.add({id, response}, callback);
    });

    it("adds response for the service", () => {
      expect(subject.find(id)).toEqual(response);
    });
    it("emits event for the update", () => {
      expect(subject.emit).toHaveBeenCalledWith("update", id);
    });
  });

  describe("delete()", () => {
    beforeEach(() => {
      subject.delete("test");
    });

    it("removes services responses from memory", () => {
      expect(subject.find("test")).toEqual({});
    });
  });
});
