import { IUniq } from "@creditkarma/mimic-core";

export interface IRouteMatch {
  route: string;
  params: { [key: string]: string };
  data: any;
}

export interface IRestResponse {
  method: string;
  path: string;
  data: any;
}

export class Segment {
  constructor(
    public name: string,
    public data: any = null,
    public children: IUniq<Segment> = {},
  ) {}

  public add = (segment: string) => {
    const name = segment.startsWith(":") ? ":" : segment;
    return this.children[name] = this.children[name] || new Segment(segment);
  }

  public find = (segments: string[]): IRouteMatch | null => {
    const segment = segments.shift();
    if (!segment) {
      return this.data ? { route: "/", params: {}, data: this.data } : null;
    }
    for (const node of [this.children[segment], this.children[":"]]) {
      if (!node) { continue; }
      const result = node.find(segments);
      if (result) {
        return {
          route: `/${node.name}${result.route}`,
          params: segment === node.name ? result.params : {...result.params, [node.name]: segment},
          data: result.data,
        };
      }
    }
    return null;
  }
}

export class RouterTree {
  constructor(
    routes: IRestResponse[],
    private root = new Segment(""),
  ) {
    routes.forEach(this.add);
  }

  public add = ({ method, path, data }: IRestResponse) => {
    let node = this.root;
    [method, ...path.split("/").filter((p) => p !== "")].forEach((segment) => {
      node = node.add(segment);
    });
    node.data = data;
  }

  public match = (method: string, path: string) => {
    const node = this.root.children[method];
    if (!node) { return null; }
    return node.find(path.split("/").filter((p) => p !== ""));
  }
}

export default RouterTree;
