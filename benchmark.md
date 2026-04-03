# Benchmark Results

CPU: Apple M1

Demo: `demo.dem` (318 MB, 136,812 ticks)

## Entity Mode Comparison

| Mode | Throughput | Time | RSS | Heap | Entities |
| --- | --- | --- | --- | --- | --- |
| `EntityMode.NONE` | 527.8 MB/s | 0.6s | 133MB | 30MB | 0 |
| `EntityMode.ONLY_GAME_RULES` | 138.9 MB/s | 2.3s | 175MB | 32MB | 1 |
| `EntityMode.ALL` | 120.8 MB/s | 2.6s | 177MB | 32MB | 248 |

`ONLY_GAME_RULES` parses entities but only stores game rules — enables synthetic `round_start`/`round_end` events without full entity tracking overhead.

## Parse Method Comparison (EntityMode.ALL)

| Method | Throughput | Time | RSS | Heap |
| --- | --- | --- | --- | --- |
| `parseDemo(path)` | 119.2 MB/s | 2.7s | 144MB | 37MB |
| `parseDemo(path, {stream: false})` | 122.1 MB/s | 2.6s | 150MB | 38MB |
| `parseDemo(buffer)` | 119.2 MB/s | 2.7s | 488MB | 702MB |
| `parseDemo(stream)` | 122.8 MB/s | 2.6s | 137MB | 15MB |
