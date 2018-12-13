# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="2.1.0"></a>
# [2.1.0](https://github.com/creditkarma/Mimic/compare/v2.0.3...v2.1.0) (2018-12-13)


### Bug Fixes

* **mimic-cli:** added mimic-graphql dependency ([#19](https://github.com/creditkarma/Mimic/issues/19)) ([658251c](https://github.com/creditkarma/Mimic/commit/658251c)), closes [#15](https://github.com/creditkarma/Mimic/issues/15)
* **mimic-graphql:** fixed interface and union definitions ([#21](https://github.com/creditkarma/Mimic/issues/21)) ([e85e6a0](https://github.com/creditkarma/Mimic/commit/e85e6a0))
* **mimic-thrift:** fixed incorrect exception encoding in response ([83e02fd](https://github.com/creditkarma/Mimic/commit/83e02fd))
* fix keys with the same name in tree-view ([#22](https://github.com/creditkarma/Mimic/issues/22)) ([4764ba4](https://github.com/creditkarma/Mimic/commit/4764ba4)), closes [#11](https://github.com/creditkarma/Mimic/issues/11)


### Code Refactoring

* return exception when mimic response is not found ([911a69d](https://github.com/creditkarma/Mimic/commit/911a69d))


### BREAKING CHANGES

* The behavior has been altered to raise an exception when a call to an unregistered method is placed to a mimic service.





<a name="2.0.3"></a>
## [2.0.3](https://github.com/creditkarma/Mimic/compare/v2.0.2...v2.0.3) (2018-10-25)


### Bug Fixes

* **mimic-cli:** fixed package content ([ae4f6e6](https://github.com/creditkarma/Mimic/commit/ae4f6e6)), closes [#12](https://github.com/creditkarma/Mimic/issues/12)
* fixed auto-update ([52c9038](https://github.com/creditkarma/Mimic/commit/52c9038)), closes [#13](https://github.com/creditkarma/Mimic/issues/13)





<a name="2.0.2"></a>
## [2.0.2](https://github.com/creditkarma/Mimic/compare/v2.0.0...v2.0.2) (2018-10-24)

### Bug Fixes

* Upgraded Electron version to resolve [CVE-2018-15685](https://nvd.nist.gov/vuln/detail/CVE-2018-15685) vulnerability
