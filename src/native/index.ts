// Phase 0: load the native addon at package init so any failure surfaces
// immediately (rather than at first parse). The Rust surface is still empty —
// real entity-decoder bindings land in later phases.
//
// Resolved via npm workspaces: see `crates/native/` for the Rust source and
// the @napi-rs/cli-generated `index.js` platform loader.

import * as native from 'cs2parser-native';

// Re-export the namespace so callers can pull typed entry points without
// re-resolving the path. Empty for now.
export { native };
