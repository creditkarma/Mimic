import { Server } from "net";
jest.mock("../config");
import { IServiceJson, IServiceProvider, ServiceManager } from "../service_manager";
import { IUniq } from "../utils";

const TestProvider = jest.fn<IServiceProvider>(() => ({
  create: jest.fn(),
  add: jest.fn(),
  on: jest.fn(),
}));

describe("ServiceManager", () => {
  let subject: ServiceManager;
  const services: IUniq<IServiceJson> = {};
  const servers: IUniq<Server> = {};
  const providers: IUniq<IServiceProvider> = {};
  const provider = new TestProvider();

  beforeEach(() => {
    subject = new ServiceManager(services, servers, providers);
  });

  describe("register()", () => {
    beforeEach(() => {
      subject.register("test", provider);
    });

    it("adds provider to the list", () => {
      expect(providers.test).toEqual(provider);
    });
  });
});
