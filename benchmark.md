# Benchmark Results

CPU: Apple M1

Demo: `demo.dem` (314 MB, 185,922 ticks)

## Entity Mode Comparison

| Mode | Throughput | Time | RSS | Heap | Entities |
| --- | --- | --- | --- | --- | --- |
| `EntityMode.NONE` | 577.4 MB/s | 0.5s | 119MB | 11MB | 0 |
| `EntityMode.ONLY_GAME_RULES` | 111.5 MB/s | 2.8s | 125MB | 31MB | 1 |
| `EntityMode.ALL` | 89.5 MB/s | 3.5s | 125MB | 50MB | 202 |

`ONLY_GAME_RULES` parses entities but only stores game rules — enables synthetic `round_start`/`round_end` events without full entity tracking overhead.

## Parse Method Comparison (EntityMode.ALL)

| Method | Throughput | Time | RSS | Heap |
| --- | --- | --- | --- | --- |
| `parseDemo(path)` | 89.6 MB/s | 3.5s | 129MB | 24MB |
| `parseDemo(path, {stream: false})` | 91.8 MB/s | 3.4s | 128MB | 20MB |
| `parseDemo(buffer)` | 92.9 MB/s | 3.4s | 705MB | 658MB |
| `parseDemo(stream)` | 90.2 MB/s | 3.5s | 132MB | 49MB |
