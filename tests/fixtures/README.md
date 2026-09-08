# Test Fixtures

## Demo files

Integration tests require a CS2 demo file (`.dem`). These are too large to store in the repository.

### For CI

Demo files are stored as GitHub Release Assets on the `test-fixtures/v2` tag. The CI workflow downloads them automatically.

### For local development

**Option A**: Set the `CS2_DEMO_PATH` environment variable:
```bash
CS2_DEMO_PATH=/path/to/your/demo.dem bun test
```

**Option B**: Place a demo file at `tests/fixtures/demo.dem` (this path is gitignored):
```bash
cp /path/to/your/demo.dem tests/fixtures/demo.dem
bun test
```

**Option C**: Download from GitHub Release Assets:
```bash
./scripts/download-test-fixtures.sh
bun test
```

### What happens without a demo file?

Integration tests are skipped gracefully. Unit tests always run without any demo file.

### Bot gameplay fixture

Bot identity has synthetic unit coverage that always runs in CI. The additional bot integration tests use `tests/fixtures/bot_gameplay.dem`, or a separate path:

```powershell
$env:CS2_BOT_DEMO_PATH = 'C:\steamcmd\bot_gameplay.dem'
bun test tests/integration/bot-players.test.ts --timeout 300000
```

This suite checks the complete bot recording, including TV identity, combat annotations, event K/D/A against final scores, and bot shot messages. Keep `CS2_DEMO_PATH` pointing at the human match fixture used by the other integration tests. The bot suite skips when its fixture is absent.
