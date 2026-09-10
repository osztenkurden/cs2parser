# Development and code generation

[Back to README](../README.md#documentation)

## Type Generation

Generate entity type interfaces from a demo file:

```bash
bun scripts/generate-entity-types.ts --demo path/to/demo.dem
bun scripts/generate-entity-types.ts --snapshot  # reuse saved snapshot
```

## Proto Generation

Fetch proto definitions from [SteamTracking/GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2) and generate TypeScript bindings:

```bash
bun scripts/generate-protos.ts
```

Then rebuild the network-message registry from the regenerated enums. It reports
any enum member it can't resolve to a protobuf class, so new messages surface
instead of being silently skipped:

```bash
bun run generate:messages         # writes src/parser/descriptors/generated/
bun run generate:messages:check   # CI: fail if the committed file is stale
```

The user-command delta decoder has its own generated table, derived from the
messages Valve marks with `option (codegen_delta_encoder)`:

```bash
bun run generate:delta-schema
bun run generate:delta-schema:check
```

`npm run build` runs both `:check` variants, so a stale generated file cannot be
published. `bun run generate` regenerates everything in order.
