# Changelog

## [2.0.2-alpha.0](https://github.com/osztenkurden/cs2parser/compare/cs2parser-v2.0.1-alpha.0...cs2parser-v2.0.2-alpha.0) (2026-06-30)


### Bug Fixes

* add repository field to native sub-packages for provenance ([7438c17](https://github.com/osztenkurden/cs2parser/commit/7438c1724e30ff33ae6e782f8635424986feca68))

## [2.0.1-alpha.0](https://github.com/osztenkurden/cs2parser/compare/cs2parser-v2.0.0-alpha.0...cs2parser-v2.0.1-alpha.0) (2026-06-30)


### Bug Fixes

* resolve repo root cross-platform in sync-package-versions ([7daf917](https://github.com/osztenkurden/cs2parser/commit/7daf9179a38ed077a8348a538734c311f9205f7b))

## [2.0.0-alpha.0](https://github.com/osztenkurden/cs2parser/compare/cs2parser-v1.8.0...cs2parser-v2.0.0-alpha.0) (2026-06-30)


### ⚠ BREAKING CHANGES

* update packages for multiple targets

### Features

* added getAccountById ([e45e5b0](https://github.com/osztenkurden/cs2parser/commit/e45e5b0f8008474c6839109389bdc19a84659bd3))
* added header property ([fbd67af](https://github.com/osztenkurden/cs2parser/commit/fbd67aff285f6709082ca2fea164e5dd1a3085a5))
* added rank events and caching of teams / players, to allow for object comparison, ([94f8084](https://github.com/osztenkurden/cs2parser/commit/94f80844e7aa5f845edb37b288e3871c1276a143))
* added server info static method ([9f6f7ae](https://github.com/osztenkurden/cs2parser/commit/9f6f7aeda090b086adb3c1f45cb73836684f235c))
* added support for getting chat messages ([44b8aa6](https://github.com/osztenkurden/cs2parser/commit/44b8aa6e3210ba0218fa447744699bec3ee4b8cd))
* added support for http broadcast ([#19](https://github.com/osztenkurden/cs2parser/issues/19)) ([0195db7](https://github.com/osztenkurden/cs2parser/commit/0195db79e4d6badcf9250194bd4f00592776db1b))
* added tick interval ([c70ec88](https://github.com/osztenkurden/cs2parser/commit/c70ec88d2b0d8011195f75a49be2a4169285985d))
* added user messages, commands, pawn reference ([90222ff](https://github.com/osztenkurden/cs2parser/commit/90222ffa9a4823fb1f4660b26b2149e502d27daf))
* allow for fetching player entity from cmsgplayerinfo ([e16cc5b](https://github.com/osztenkurden/cs2parser/commit/e16cc5b4fa25f5e6657f306e51143225084cd356))
* fixed 14152 protocol compatibility ([b620a02](https://github.com/osztenkurden/cs2parser/commit/b620a02ba486968e8c52882113a3b80d363002fc))
* improve internal error surface ([#21](https://github.com/osztenkurden/cs2parser/issues/21)) ([bf514ec](https://github.com/osztenkurden/cs2parser/commit/bf514ec755e891f811c0ffa44b2b16e809ab6808))
* improved memory usage ([a58b26d](https://github.com/osztenkurden/cs2parser/commit/a58b26d573c0070da931f4b5c829850373e6320b))
* make all parsing options non blocking ([c86af17](https://github.com/osztenkurden/cs2parser/commit/c86af170b9c2f0b75a6cd2ae06c6ad2da317059c))
* more rewrite ([cdd4387](https://github.com/osztenkurden/cs2parser/commit/cdd438794053fcb3240ce0a38128b1bcd4555968))
* move entity parser into rust land ([e7dda39](https://github.com/osztenkurden/cs2parser/commit/e7dda396675f6db2048ecd9fe486dae015aec60d))
* move examples into specific directory, improve event handling, added data optional handlers ([6a152c7](https://github.com/osztenkurden/cs2parser/commit/6a152c7a67eb6fdaefcf78371536d87f69d1db18))
* rewrite parser in rust ([02667e8](https://github.com/osztenkurden/cs2parser/commit/02667e828492a637fa91f5c7b348a13b3b2b4424))
* update packages for multiple targets ([1793f0e](https://github.com/osztenkurden/cs2parser/commit/1793f0e532c17124f65a55d556c89da3334b589a))
* update rust branch for feature parity ([c5dc501](https://github.com/osztenkurden/cs2parser/commit/c5dc501da8529d4e8073640ce78f8a8d14ea45a6))
* updated demo protocol to 14161 ([958b9f9](https://github.com/osztenkurden/cs2parser/commit/958b9f96c8c6608b50bf57a3163c50512b2b0f98))
* updated entity types ([9d06e2d](https://github.com/osztenkurden/cs2parser/commit/9d06e2d59a389f145beb997664bf478cdd0fa4d4))
* updated protos ([5d00787](https://github.com/osztenkurden/cs2parser/commit/5d007870ed00c1b58075fbc036e6b881f9dd22df))


### Bug Fixes

* added all win round reason enums ([d0304ea](https://github.com/osztenkurden/cs2parser/commit/d0304ea161a6ba30c2bb4152ab9fbf54d1b6670f))
* cancellation events ([dd52a26](https://github.com/osztenkurden/cs2parser/commit/dd52a26d9cc96e00b5e3558b8d715db17ed97b8f))
* crate ref ([5a6dea6](https://github.com/osztenkurden/cs2parser/commit/5a6dea69c2c6f7b447d9cf2d18f9c9fc94b83273))
* custom svc ([2127ece](https://github.com/osztenkurden/cs2parser/commit/2127ece345627ff74751c2e750ebc3ceb8b546f6))
* fixed decoding non-ascii characters on entity properties ([266a416](https://github.com/osztenkurden/cs2parser/commit/266a41699ce487dc24092cefdde087f593bff608))
* fixed string tables not being properly updated ([2019b6e](https://github.com/osztenkurden/cs2parser/commit/2019b6e11233073b3827aa6e2431fd3c8fa655af))
* formatting ([ae0d504](https://github.com/osztenkurden/cs2parser/commit/ae0d504144067d99a0b1ef5758b3e5a5ced7ee5b))
* formatting ([349a5b6](https://github.com/osztenkurden/cs2parser/commit/349a5b6f5dd059289db599b52e855219a8d13dcc))
* memory & speed improvements ([bf6ac90](https://github.com/osztenkurden/cs2parser/commit/bf6ac902021ea3b9e8bcd3e3cabf07e67c82ac27))
* moved to proper node version ([51a90f2](https://github.com/osztenkurden/cs2parser/commit/51a90f2cca572c859296d6f841d5882a1ba6c164))
* order of tick / svc messages ([507b9b0](https://github.com/osztenkurden/cs2parser/commit/507b9b0c0d26c7a6c425d5a0586e22e107056105))
* publishing ([81c6ef1](https://github.com/osztenkurden/cs2parser/commit/81c6ef13b019c8ce8925753f26bdaa1807a19f82))
* publishing again ([4b5a662](https://github.com/osztenkurden/cs2parser/commit/4b5a66268842b8ae9fc40c1298d1e886049ea8c6))
* removed protobufjs ([c3a42b8](https://github.com/osztenkurden/cs2parser/commit/c3a42b8ca882ac1e1fb557c659ea5dc0556d650b))
* removed redundant interface ([b9ada9a](https://github.com/osztenkurden/cs2parser/commit/b9ada9a620d3227d7223f7ba2108895130d6e43b))
* rust tooling ([6969aea](https://github.com/osztenkurden/cs2parser/commit/6969aea1107f9f7a8fa81a7746f607a7e49fb0a5))
* small perf improvements ([e4cbd4f](https://github.com/osztenkurden/cs2parser/commit/e4cbd4f5a07a1d5bb12ce5cf8f694bfb0ec6ed42))
* type issue ([dd24ec9](https://github.com/osztenkurden/cs2parser/commit/dd24ec95d6e9311e34cb21afa4681ec40cd15da9))
* types ([e6fee83](https://github.com/osztenkurden/cs2parser/commit/e6fee83a2537a951f97a8d5fbc08889ce30cbf53))
* typo in TeamNumber enums ([#14](https://github.com/osztenkurden/cs2parser/issues/14)) ([d485bf5](https://github.com/osztenkurden/cs2parser/commit/d485bf585a6697e00b6d1f781ce321426a4e1d3a))
* unused update string table ([0f64421](https://github.com/osztenkurden/cs2parser/commit/0f64421b071e4aec1c50108b413fb9070ec4b3ee))
* updated default event descriptors ([fea96af](https://github.com/osztenkurden/cs2parser/commit/fea96aff3abe49a84f831bfc4dbed93a534fa100))
* updated permissions ([8436eb2](https://github.com/osztenkurden/cs2parser/commit/8436eb2be9c3d69bc89d778f414c821804f58663))
* updated workflow playouts ([e971306](https://github.com/osztenkurden/cs2parser/commit/e971306e1588b99ff1647b86dc3b1a54ebf35e93))
* use tsgo for typechecking ([1e8a6e2](https://github.com/osztenkurden/cs2parser/commit/1e8a6e2b0b33d3a3602925f1a25d403e7aaadeba))
* windows build ([ce28b29](https://github.com/osztenkurden/cs2parser/commit/ce28b29a99b86c182386c8635a524bb4e6ecefe9))


### Miscellaneous Chores

* release 2.0.0-alpha.0 ([2c5e4e7](https://github.com/osztenkurden/cs2parser/commit/2c5e4e711108bfec31c9373cc59e5354a550c394))

## [1.8.0](https://github.com/osztenkurden/cs2parser/compare/v1.7.0...v1.8.0) (2026-05-05)


### Features

* added support for getting chat messages ([44b8aa6](https://github.com/osztenkurden/cs2parser/commit/44b8aa6e3210ba0218fa447744699bec3ee4b8cd))

## [1.7.0](https://github.com/osztenkurden/cs2parser/compare/v1.6.0...v1.7.0) (2026-04-30)


### Features

* improve internal error surface ([#21](https://github.com/osztenkurden/cs2parser/issues/21)) ([bf514ec](https://github.com/osztenkurden/cs2parser/commit/bf514ec755e891f811c0ffa44b2b16e809ab6808))

## [1.6.0](https://github.com/osztenkurden/cs2parser/compare/v1.5.1...v1.6.0) (2026-04-28)


### Features

* added support for http broadcast ([#19](https://github.com/osztenkurden/cs2parser/issues/19)) ([0195db7](https://github.com/osztenkurden/cs2parser/commit/0195db79e4d6badcf9250194bd4f00592776db1b))

## [1.5.1](https://github.com/osztenkurden/cs2parser/compare/v1.5.0...v1.5.1) (2026-04-22)


### Bug Fixes

* small perf improvements ([e4cbd4f](https://github.com/osztenkurden/cs2parser/commit/e4cbd4f5a07a1d5bb12ce5cf8f694bfb0ec6ed42))

## [1.5.0](https://github.com/osztenkurden/cs2parser/compare/v1.4.4...v1.5.0) (2026-04-21)


### Features

* fixed 14152 protocol compatibility ([b620a02](https://github.com/osztenkurden/cs2parser/commit/b620a02ba486968e8c52882113a3b80d363002fc))
* updated entity types ([9d06e2d](https://github.com/osztenkurden/cs2parser/commit/9d06e2d59a389f145beb997664bf478cdd0fa4d4))
* updated protos ([5d00787](https://github.com/osztenkurden/cs2parser/commit/5d007870ed00c1b58075fbc036e6b881f9dd22df))

## [1.4.4](https://github.com/osztenkurden/cs2parser/compare/v1.4.3...v1.4.4) (2026-04-19)


### Bug Fixes

* removed protobufjs ([c3a42b8](https://github.com/osztenkurden/cs2parser/commit/c3a42b8ca882ac1e1fb557c659ea5dc0556d650b))
* updated workflow playouts ([e971306](https://github.com/osztenkurden/cs2parser/commit/e971306e1588b99ff1647b86dc3b1a54ebf35e93))
* use tsgo for typechecking ([1e8a6e2](https://github.com/osztenkurden/cs2parser/commit/1e8a6e2b0b33d3a3602925f1a25d403e7aaadeba))

## [1.4.3](https://github.com/osztenkurden/cs2parser/compare/v1.4.2...v1.4.3) (2026-04-11)


### Bug Fixes

* typo in TeamNumber enums ([#14](https://github.com/osztenkurden/cs2parser/issues/14)) ([d485bf5](https://github.com/osztenkurden/cs2parser/commit/d485bf585a6697e00b6d1f781ce321426a4e1d3a))

## [1.4.2](https://github.com/osztenkurden/cs2parser/compare/v1.4.1...v1.4.2) (2026-04-10)


### Bug Fixes

* added all win round reason enums ([d0304ea](https://github.com/osztenkurden/cs2parser/commit/d0304ea161a6ba30c2bb4152ab9fbf54d1b6670f))

## [1.4.1](https://github.com/osztenkurden/cs2parser/compare/v1.4.0...v1.4.1) (2026-04-10)


### Bug Fixes

* fixed decoding non-ascii characters on entity properties ([266a416](https://github.com/osztenkurden/cs2parser/commit/266a41699ce487dc24092cefdde087f593bff608))
* removed redundant interface ([b9ada9a](https://github.com/osztenkurden/cs2parser/commit/b9ada9a620d3227d7223f7ba2108895130d6e43b))
* types ([e6fee83](https://github.com/osztenkurden/cs2parser/commit/e6fee83a2537a951f97a8d5fbc08889ce30cbf53))

## [1.4.0](https://github.com/osztenkurden/cs2parser/compare/v1.3.0...v1.4.0) (2026-04-08)


### Features

* added getAccountById ([e45e5b0](https://github.com/osztenkurden/cs2parser/commit/e45e5b0f8008474c6839109389bdc19a84659bd3))
* added rank events and caching of teams / players, to allow for object comparison, ([94f8084](https://github.com/osztenkurden/cs2parser/commit/94f80844e7aa5f845edb37b288e3871c1276a143))

## [1.3.0](https://github.com/osztenkurden/cs2parser/compare/v1.2.0...v1.3.0) (2026-04-08)


### Features

* added header property ([fbd67af](https://github.com/osztenkurden/cs2parser/commit/fbd67aff285f6709082ca2fea164e5dd1a3085a5))
* added tick interval ([c70ec88](https://github.com/osztenkurden/cs2parser/commit/c70ec88d2b0d8011195f75a49be2a4169285985d))
* allow for fetching player entity from cmsgplayerinfo ([e16cc5b](https://github.com/osztenkurden/cs2parser/commit/e16cc5b4fa25f5e6657f306e51143225084cd356))
* move examples into specific directory, improve event handling, added data optional handlers ([6a152c7](https://github.com/osztenkurden/cs2parser/commit/6a152c7a67eb6fdaefcf78371536d87f69d1db18))


### Bug Fixes

* fixed string tables not being properly updated ([2019b6e](https://github.com/osztenkurden/cs2parser/commit/2019b6e11233073b3827aa6e2431fd3c8fa655af))

## [1.2.0](https://github.com/osztenkurden/cs2parser/compare/v1.1.1...v1.2.0) (2026-04-03)


### Features

* added server info static method ([9f6f7ae](https://github.com/osztenkurden/cs2parser/commit/9f6f7aeda090b086adb3c1f45cb73836684f235c))
* added user messages, commands, pawn reference ([90222ff](https://github.com/osztenkurden/cs2parser/commit/90222ffa9a4823fb1f4660b26b2149e502d27daf))


### Bug Fixes

* formatting ([ae0d504](https://github.com/osztenkurden/cs2parser/commit/ae0d504144067d99a0b1ef5758b3e5a5ced7ee5b))
* memory & speed improvements ([bf6ac90](https://github.com/osztenkurden/cs2parser/commit/bf6ac902021ea3b9e8bcd3e3cabf07e67c82ac27))
* type issue ([dd24ec9](https://github.com/osztenkurden/cs2parser/commit/dd24ec95d6e9311e34cb21afa4681ec40cd15da9))
* unused update string table ([0f64421](https://github.com/osztenkurden/cs2parser/commit/0f64421b071e4aec1c50108b413fb9070ec4b3ee))

## [1.1.1](https://github.com/osztenkurden/cs2parser/compare/v1.1.0...v1.1.1) (2026-04-03)


### Bug Fixes

* moved to proper node version ([51a90f2](https://github.com/osztenkurden/cs2parser/commit/51a90f2cca572c859296d6f841d5882a1ba6c164))

## [1.1.0](https://github.com/osztenkurden/cs2parser/compare/v1.0.2...v1.1.0) (2026-04-03)


### Features

* improved memory usage ([a58b26d](https://github.com/osztenkurden/cs2parser/commit/a58b26d573c0070da931f4b5c829850373e6320b))
* make all parsing options non blocking ([c86af17](https://github.com/osztenkurden/cs2parser/commit/c86af170b9c2f0b75a6cd2ae06c6ad2da317059c))


### Bug Fixes

* formatting ([349a5b6](https://github.com/osztenkurden/cs2parser/commit/349a5b6f5dd059289db599b52e855219a8d13dcc))
* publishing ([81c6ef1](https://github.com/osztenkurden/cs2parser/commit/81c6ef13b019c8ce8925753f26bdaa1807a19f82))
* publishing again ([4b5a662](https://github.com/osztenkurden/cs2parser/commit/4b5a66268842b8ae9fc40c1298d1e886049ea8c6))
* updated permissions ([8436eb2](https://github.com/osztenkurden/cs2parser/commit/8436eb2be9c3d69bc89d778f414c821804f58663))

## [1.0.2](https://github.com/osztenkurden/cs2parser/compare/v1.0.1...v1.0.2) (2026-04-03)


### Bug Fixes

* publishing again ([4b5a662](https://github.com/osztenkurden/cs2parser/commit/4b5a66268842b8ae9fc40c1298d1e886049ea8c6))

## [1.0.1](https://github.com/osztenkurden/cs2parser/compare/v1.0.0...v1.0.1) (2026-04-03)


### Bug Fixes

* publishing ([81c6ef1](https://github.com/osztenkurden/cs2parser/commit/81c6ef13b019c8ce8925753f26bdaa1807a19f82))

## 1.0.0 (2026-04-03)


### Features

* improved memory usage ([a58b26d](https://github.com/osztenkurden/cs2parser/commit/a58b26d573c0070da931f4b5c829850373e6320b))
* make all parsing options non blocking ([c86af17](https://github.com/osztenkurden/cs2parser/commit/c86af170b9c2f0b75a6cd2ae06c6ad2da317059c))


### Bug Fixes

* formatting ([349a5b6](https://github.com/osztenkurden/cs2parser/commit/349a5b6f5dd059289db599b52e855219a8d13dcc))
* updated permissions ([8436eb2](https://github.com/osztenkurden/cs2parser/commit/8436eb2be9c3d69bc89d778f414c821804f58663))
