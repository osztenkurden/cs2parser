/* Update-only entity packets. JS owns lifecycle and property storage. Any
 * unsupported, malformed, or oversized packet is retried in JS before effects
 * are committed. Tables are populated from this demo's class-local field plans.
 * No imports, allocator, or per-field JS calls. Floating-point contraction must
 * be disabled: quantized values preserve the JS reference's evaluation order. */
typedef unsigned char u8;
typedef unsigned short u16;
typedef unsigned int u32;
typedef signed int i32;
typedef unsigned long long u64;
typedef struct {
    i32 decoder, index_depth;
    u32 children, count, element, retained, flags, bits;
    double low, high, mul;
} Node;
typedef struct {
    u32 plan, entity;
    double index;
    u32 kind, lo, hi, pad;
    double x, y, z;
} Update;
static Node nodes[65536];
static u32 edges[262144], roots[2048];
static i32 entities[100001];
static u16 codes[256], long_codes[131072];
static Update output[65536];
static u8 input[1048576], blob[1048576];
static u32 plans[8192];
static double indices[8192];
static u32 position, size, bad, used, blob_used, fields;

u32 ptr(u32 which) {
    switch (which) {
    case 0:
        return (u32)nodes;
    case 1:
        return (u32)edges;
    case 2:
        return (u32)roots;
    case 3:
        return (u32)entities;
    case 4:
        return (u32)codes;
    case 5:
        return (u32)long_codes;
    case 6:
        return (u32)output;
    case 7:
        return (u32)input;
    case 8:
        return (u32)blob;
    case 9:
        return (u32)&fields;
    case 10:
        return (u32)&position;
    }
    return 0;
}
static u32 peek(u32 n) {
    u32 off = position >> 3, shift = position & 7;
    u64 word = 0;
    if (off + 8 <= size)
        __builtin_memcpy(&word, input + off, 8);
    else
        for (u32 i = 0; i < 8 && off + i < size; i++)
            word |= (u64)input[off + i] << (i * 8);
    return (u32)((word >> shift) & ((1ULL << n) - 1));
}
static u32 bits(u32 n) {
    if (n > 32 || position + n > size * 8) {
        bad = 3;
        return 0;
    }
    u32 value = peek(n);
    position += n;
    return value;
}
static u32 varint(void) {
    u32 value = 0;
    for (u32 i = 0; i < 5; i++) {
        u32 b = bits(8);
        value |= (b & 127) << (i * 7);
        if (b < 128)
            break;
    }
    return value;
}
static i32 signed_varint(void) {
    u32 v = varint();
    return (i32)((v >> 1) ^ -(v & 1));
}
static u32 ubit(void) {
    u32 v = bits(6), tag = v & 48;
    return tag ? (v & 15) | (bits(tag == 16 ? 4 : tag == 32 ? 8 : 28) << 4) : v;
}
static u32 fpvar(void) {
    if (bits(1))
        return bits(2);
    if (bits(1))
        return bits(4);
    if (bits(1))
        return bits(10);
    if (bits(1))
        return bits(17);
    return bits(31);
}
static int push(double *p, int *last, double value, int add) {
    if (*last >= 6) {
        bad = 2;
        return 0;
    }
    ++*last;
    if (add)
        p[*last] += value;
    else
        p[*last] = value;
    return 1;
}
static int pop(double *p, int *last, u32 n) {
    if (n > (u32)*last) {
        bad = 2;
        return 0;
    }
    while (n--) {
        p[*last] = 0;
        --*last;
    }
    return 1;
}
static void op(u32 symbol, double *p, int *last) {
    u32 n = 0, packed = 0, add = 1;
    if (symbol < 4) {
        p[*last] += symbol + 1;
        return;
    }
    switch (symbol) {
    case 4:
        p[*last] += fpvar() + 5.0;
        return;
    case 5:
        push(p, last, 0, 0);
        return;
    case 6:
        push(p, last, fpvar(), 1);
        return;
    case 7:
        p[*last]++;
        push(p, last, 0, 0);
        return;
    case 8:
        p[*last]++;
        push(p, last, fpvar(), 0);
        return;
    case 9:
        p[*last] += fpvar();
        push(p, last, 0, 0);
        return;
    case 10:
        p[*last] += fpvar() + 2.0;
        push(p, last, fpvar() + 1.0, 0);
        return;
    case 11:
        p[*last] += bits(3) + 2;
        push(p, last, bits(3) + 1, 0);
        return;
    case 12:
        p[*last] += bits(4) + 2;
        push(p, last, bits(4) + 1, 0);
        return;
    case 13:
        n = 2;
        break;
    case 14:
        n = 2;
        packed = 5;
        add = 0;
        break;
    case 15:
        n = 3;
        break;
    case 16:
        n = 3;
        packed = 5;
        add = 0;
        break;
    case 17:
        p[*last]++;
        n = 2;
        break;
    case 18:
        p[*last]++;
        n = 2;
        packed = 5;
        break;
    case 19:
        p[*last]++;
        n = 3;
        break;
    case 20:
        p[*last]++;
        n = 3;
        packed = 5;
        break;
    case 21:
        p[*last] += ubit() + 2.0;
        n = 2;
        break;
    case 22:
        p[*last] += ubit() + 2.0;
        n = 2;
        packed = 5;
        break;
    case 23:
        p[*last] += ubit() + 2.0;
        n = 3;
        break;
    case 24:
        p[*last] += ubit() + 2.0;
        n = 3;
        packed = 5;
        break;
    case 25:
        n = ubit();
        p[*last] += ubit();
        break;
    case 26:
        for (int i = 0; i <= *last; i++)
            if (bits(1))
                p[i] += signed_varint() + 1.0;
        n = ubit();
        add = 0;
        break;
    case 27:
        if (pop(p, last, 1))
            p[*last]++;
        return;
    case 28:
        if (pop(p, last, 1))
            p[*last] += fpvar() + 1.0;
        return;
    case 29:
        pop(p, last, *last);
        p[0]++;
        return;
    case 30:
        pop(p, last, *last);
        p[0] += fpvar() + 1.0;
        return;
    case 31:
        pop(p, last, *last);
        p[0] += bits(3) + 1;
        return;
    case 32:
        pop(p, last, *last);
        p[0] += bits(6) + 1;
        return;
    case 33:
        if (pop(p, last, fpvar()))
            p[*last]++;
        return;
    case 34:
        if (pop(p, last, fpvar()))
            p[*last] += signed_varint();
        return;
    case 35:
        if (!pop(p, last, fpvar()))
            return;
    case 36:
        for (int i = 0; i <= *last; i++)
            if (bits(1))
                p[i] += signed_varint();
        return;
    case 37:
        if (*last < 1) {
            bad = 2;
            return;
        }
        p[*last - 1]++;
        return;
    case 38:
        for (int i = 0; i <= *last; i++)
            if (bits(1))
                p[i] += (i32)bits(4) - 7;
        return;
    default:
        bad = 2;
        return;
    }
    if (n > 6 - (u32)*last) {
        bad = 2;
        return;
    }
    while (n--)
        push(p, last, packed ? bits(packed) : fpvar(), add);
}
static double f32(void) {
    union {
        float f;
        u32 u;
    } v;
    v.u = bits(32);
    return v.f;
}
static double coord(void) {
    u32 i = bits(1), f = bits(1);
    if (!i && !f)
        return 0;
    u32 neg = bits(1);
    double a = i ? bits(14) + 1 : 0, b = f ? bits(5) : 0;
    double value = (float)(a + b * (1.0 / 32));
    return neg ? -value : value;
}
static double normal(void) {
    u32 neg = bits(1);
    double value = bits(11) * (1.0 / 2048 - 1);
    return neg ? -value : value;
}
static void value(Node *node, Update *out) {
    out->kind = 0;
    out->x = out->y = out->z = 0;
    switch (node->decoder) {
    case 0:
        if ((node->flags & 1) && bits(1)) {
            out->x = node->low;
            return;
        }
        if ((node->flags & 2) && bits(1)) {
            out->x = node->high;
            return;
        }
        if ((node->flags & 4) && bits(1))
            return;
        out->x = node->low + (node->high - node->low) * (double)bits(node->bits) * node->mul;
        return;
    case 1: {
        out->kind = 2;
        u32 x = bits(1), y = bits(1);
        if (x)
            out->x = normal();
        if (y)
            out->y = normal();
        u32 neg = bits(1);
        double sum = out->x * out->x + out->y * out->y;
        out->z = sum < 1 ? __builtin_sqrt(1 - sum) : 0;
        if (neg)
            out->z = -out->z;
        return;
    }
    case 2:
        out->kind = 2;
        out->x = f32();
        out->y = f32();
        out->z = f32();
        return;
    case 3:
        out->kind = 2;
        out->x = coord();
        out->y = coord();
        out->z = coord();
        return;
    case 4: {
        out->kind = 3;
        out->lo = out->hi = 0;
        for (u32 i = 0; i < 10; i++) {
            u32 b = bits(8);
            if (i < 4)
                out->lo |= (b & 127) << (i * 7);
            else if (i == 4) {
                out->lo |= (b & 15) << 28;
                out->hi = (b & 112) >> 4;
            } else {
                if (i == 9 && b > 1) {
                    bad = 3;
                    return;
                }
                out->hi |= (b & 127) << (i * 7 - 32);
            }
            if (b < 128)
                return;
        }
        bad = 3;
        return;
    }
    case 5:
    case 10:
    case 18:
        out->x = varint();
        return;
    case 6:
        out->x = f32();
        return;
    case 7:
    case 11:
        out->kind = 1;
        out->x = bits(1);
        return;
    case 8: {
        out->kind = 4;
        out->x = blob_used;
        u32 b;
        while ((b = bits(8)) != 0 && !bad) {
            if (blob_used == 1048576) {
                bad = 7;
                return;
            }
            blob[blob_used++] = b;
        }
        out->y = blob_used - (u32)out->x;
        return;
    }
    case 9:
        out->x = signed_varint();
        return;
    case 12:
        out->x = coord();
        return;
    case 13:
        out->x = varint() * (1.0 / 30);
        return;
    case 14:
        out->kind = 3;
        out->lo = bits(32);
        out->hi = bits(32);
        return;
    case 15:
        out->kind = 2;
        out->x = bits(32);
        out->y = bits(32);
        out->z = bits(32);
        return;
    case 16:
        out->kind = 2;
        out->x = f32();
        out->y = f32();
        out->z = f32();
        return;
    case 17: {
        out->kind = 2;
        u32 flags = bits(3);
        if (flags & 1)
            out->x = coord();
        if (flags & 2)
            out->y = coord();
        if (flags & 4)
            out->z = coord();
        return;
    }
    case 19: {
        u32 n = varint();
        out->x = n ? n - 1 : 0;
        return;
    }
    case 20: {
        out->kind = 2;
        u32 flags = bits(3);
        if (flags & 1)
            out->x = bits(20) * (360.0 / 1048576) - 180;
        if (flags & 2)
            out->y = bits(20) * (360.0 / 1048576) - 180;
        if (flags & 4)
            out->z = bits(20) * (360.0 / 1048576) - 180;
        return;
    }
    case 21:
        out->x = bits(7);
        return;
    case 22: {
        u32 n = varint();
        if (n > 1048576 - blob_used || n > (size * 8 - position) / 8) {
            bad = 7;
            return;
        }
        out->kind = 5;
        out->x = blob_used;
        out->y = n;
        while (n--)
            blob[blob_used++] = bits(8);
        return;
    }
    default:
        bad = 4;
        return;
    }
}
i32 packet(u32 length, u32 count, u32 pvs) {
    if (length > 1048576)
        return -3;
    size = length;
    position = bad = used = blob_used = fields = 0;
    double id = -1;
    for (u32 entry = 0; entry < count && !bad; entry++) {
        id += 1.0 + ubit();
        if (id > 100000) {
            bad = 2;
            break;
        }
        u32 control = bits(2);
        if (control != 0) {
            bad = 1;
            break;
        }
        if (pvs && (bits(2) & 1))
            continue;
        i32 cls = entities[(u32)id];
        if (cls < 0 || cls >= 1024) {
            bad = 2;
            break;
        }
        double path[7] = {-1, 0, 0, 0, 0, 0, 0};
        int last = 0;
        u32 n = 0;
        while (!bad) {
            u32 code = codes[peek(8)];
            if (!code)
                code = long_codes[peek(17)];
            if (!code) {
                bad = 2;
                break;
            }
            bits(code >> 6);
            u32 symbol = code & 63;
            if (symbol == 39)
                break;
            op(symbol, path, &last);
            if (bad)
                break;
            if (n >= 8192 || path[0] < 0 || path[0] >= roots[cls * 2 + 1]) {
                bad = 2;
                break;
            }
            u32 index = edges[roots[cls * 2] + (u32)path[0]];
            if (!index || index >= 65536) {
                bad = 2;
                break;
            }
            for (int depth = 1; depth <= last; depth++) {
                Node *node = &nodes[index];
                if (node->element)
                    index = node->element;
                else {
                    if (path[depth] < 0 || path[depth] >= node->count) {
                        bad = 2;
                        break;
                    }
                    index = edges[node->children + (u32)path[depth]];
                }
                if (!index || index >= 65536) {
                    bad = 2;
                    break;
                }
            }
            if (bad)
                break;
            if (nodes[index].index_depth > 6) {
                bad = 2;
                break;
            }
            plans[n] = index;
            indices[n++] = nodes[index].index_depth < 0 ? -1 : path[nodes[index].index_depth];
        }
        for (u32 i = 0; i < n && !bad; i++) {
            if (used >= 65536) {
                bad = 7;
                break;
            }
            Update *out = &output[used];
            Node *node = &nodes[plans[i]];
            out->plan = plans[i];
            out->entity = (u32)id;
            out->index = indices[i];
            value(node, out);
            fields++;
            if (node->retained)
                used++;
        }
    }
    return bad ? -(i32)bad : (i32)used;
}
