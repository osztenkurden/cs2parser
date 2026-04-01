# Benchmark Results

CPU: Apple M1

Demo: `demo.dem` (318 MB, 136,812 ticks)

## Entity Mode Comparison

| Mode | Throughput | Time | RSS | Heap | Entities |
| --- | --- | --- | --- | --- | --- |
| `EntityMode.NONE` | 405.7 MB/s | 0.8s | 134MB | 32MB | 0 |
| `EntityMode.ONLY_GAME_RULES` | 125.8 MB/s | 2.5s | 174MB | 15MB | 1 |
| `EntityMode.ALL` | 109.8 MB/s | 2.9s | 187MB | 35MB | 248 |

`ONLY_GAME_RULES` parses entities but only stores game rules — enables synthetic `round_start`/`round_end` events without full entity tracking overhead.

## Parse Method Comparison (EntityMode.ALL)

| Method | Throughput | Time | RSS | Heap | Blocking |
| --- | --- | --- | --- | --- | --- |
| `parseDemo(path)` | 110.9 MB/s | 2.9s | 159MB | 13MB | no |
| `parseDemo(path, {stream: false})` | 115.6 MB/s | 2.7s | 583MB | 68MB | yes |
| `parseDemo(buffer)` | 117.3 MB/s | 2.7s | 2146MB | 964MB | yes |
| `parseDemo(stream)` | 110.9 MB/s | 2.9s | 158MB | 15MB | no |
