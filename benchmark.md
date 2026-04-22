# Benchmark Results

CPU: Apple M1

Demo: `demo.dem` (318 MB, 136,812 ticks)

## Entity Mode Comparison

| Mode | Throughput | Time | RSS | Heap | Entities |
| --- | --- | --- | --- | --- | --- |
| `EntityMode.NONE` | 550.6 MB/s | 0.6s | 138MB | 29MB | 0 |
| `EntityMode.ONLY_GAME_RULES` | 145.4 MB/s | 2.2s | 144MB | 16MB | 1 |
| `EntityMode.ALL` | 124.1 MB/s | 2.6s | 153MB | 17MB | 248 |

`ONLY_GAME_RULES` parses entities but only stores game rules — enables synthetic `round_start`/`round_end` events without full entity tracking overhead.

## Parse Method Comparison (EntityMode.ALL)

| Method | Throughput | Time | RSS | Heap |
| --- | --- | --- | --- | --- |
| `parseDemo(path)` | 123.2 MB/s | 2.6s | 149MB | 23MB |
| `parseDemo(path, {stream: false})` | 123.5 MB/s | 2.6s | 157MB | 23MB |
| `parseDemo(buffer)` | 120.8 MB/s | 2.6s | 497MB | 699MB |
| `parseDemo(stream)` | 123.2 MB/s | 2.6s | 146MB | 27MB |
