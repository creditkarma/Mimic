# Mimic
> Service Impersonator for the future :performing_arts:

![Mimic](./build/icon.png)


## What exactly is Mimic?

It’s a set of [NPM libraries](https://www.npmjs.com/search?q=@creditkarma/mimic), [CLI tool](https://www.npmjs.com/package/@creditkarma/mimic-cli) and [Desktop](../../releases) application built around the idea of faking real service by implementing its contract.

So why would you need this tool in the first place? Though faking services is pretty trivial, but you still need to provide responses for every endpoint. Mimic on the contrary can read your service definition and generate responses for you. Check out [Wiki](../../wiki) with detailed instructions.

Supported service protocols:
- [x] [GraphQL](https://www.graphql.org/)
- [x] [Apache Thrift](https://thrift.apache.org/)
- [x] [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) (to support legacy services)

Supported client protocols:
- [x] [Apache Thrift](https://thrift.apache.org/)

Supported proxy protocols:
- [x] [Apache Thrift](https://thrift.apache.org/)

## Development
If you want to help with the project, simply clone down this reposity, install dependencies, and get started on your application.
The use of the [yarn](https://yarnpkg.com/) package manager is **strongly** recommended, as opposed to using `npm`.

```bash
# clone the repo locally
git clone git@github.com:creditkarma/Mimic.git

# install dependencies
yarn

# Compile local packages
yarn lerna
```

### Development Scripts

```bash
# Project uses conventional commit linter. The easiest way to make a commit is by using this command
yarn commit

# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```

## Contributing
For more information about contributing new features and bug fixes, see our [Contribution Guidelines](./CONTRIBUTING.md).

## License
Mimic is licensed under [Apache License Version 2.0](./LICENSE)
