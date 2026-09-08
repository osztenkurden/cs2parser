/* Raw Snappy block decoder. No libc, allocator, WASI, threads, or imports.
 * Format: https://github.com/google/snappy/blob/main/format_description.txt
 * The caller owns both ranges. Return 0 for success, -1 for malformed input.
 */
typedef unsigned char u8;
typedef unsigned int u32;

int snappy_uncompress(const u8 *src, u32 src_len, u8 *dst, u32 dst_len) {
    u32 ip = 0, op = 0, expected = 0;
    for (u32 shift = 0; ; shift += 7) {
        if (ip == src_len || shift > 28) return -1;
        u32 byte = src[ip++];
        if (shift == 28 && byte > 15) return -1;
        expected |= (byte & 127) << shift;
        if (!(byte & 128)) break;
    }
    if (expected != dst_len) return -1;

    while (ip < src_len) {
        u32 tag = src[ip++], kind = tag & 3, length, offset;
        if (kind == 0) {
            length = tag >> 2;
            if (length >= 60) {
                u32 count = length - 59;
                if (count > src_len - ip) return -1;
                length = 0;
                for (u32 i = 0; i < count; i++) length |= (u32)src[ip++] << (8 * i);
            }
            /* Check len-1 before adding 1, which could overflow uint32. */
            if (length >= dst_len - op || length >= src_len - ip) return -1;
            length++;
            for (u32 i = 0; i < length; i++) dst[op + i] = src[ip + i];
            op += length;
            ip += length;
            continue;
        }

        if (kind == 1) {
            if (ip == src_len) return -1;
            length = 4 + ((tag >> 2) & 7);
            offset = ((tag & 224) << 3) | src[ip++];
        } else {
            u32 count = kind == 2 ? 2 : 4;
            if (count > src_len - ip) return -1;
            length = 1 + (tag >> 2);
            offset = 0;
            for (u32 i = 0; i < count; i++) offset |= (u32)src[ip++] << (8 * i);
        }
        if (!offset || offset > op || length > dst_len - op) return -1;
        /* Forward copying is intentional: Snappy permits overlapping copies. */
        for (u32 i = 0; i < length; i++) dst[op + i] = dst[op + i - offset];
        op += length;
    }
    return op == dst_len ? 0 : -1;
}
