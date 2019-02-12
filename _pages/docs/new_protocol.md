---
title: Develop new protocol
permalink: /docs/new_protocol
categories: [docs]
---

**Mimic is a multi-package [Electron](https://electronjs.org/) application, written in [TypeScript](https://www.typescriptlang.org/) and managed by [Lerna](https://lernajs.io/).**

## Service
Every service in Mimic project implements `IServiceProvider` interface from `@creditkarma/mimic-core` package:
```typescript
export interface IServiceProvider {
  // Create a server from existing config
  create(service: IServiceJson): Server;
  // Add a new server
  add(service: IServiceJson, callback: (err: Error | null, server?: Server) => void): void;
  // Events
  emit(event: "request", request: IMimicRequest): boolean;
  emit(event: "delete", id: string): boolean;
  on(event: "request", callback: (request: IMimicRequest) => void): this;
  on(event: "delete", callback: (id: string) => void): this;
}

export interface IServiceJson {
  id: string;
  type: string;
  alias: string;
  port: number;
  enabled: boolean;
}

export interface IMimicRequest {
  type: string;
  serviceId: string;
  request: string;
  response: string;
  requestValue: any;
  responseValue: any;
}

export interface IClientAction {
  request: {
    id: string;
    host: string;
    port: number;
    path?: string;
    func: string;
    args: any;
    headers?: IUniq<string>;
    time?: number;
  };
  response?: {
    error?: any;
    success?: any;
    headers?: IUniq<string>;
    time: number;
  };
}
```
