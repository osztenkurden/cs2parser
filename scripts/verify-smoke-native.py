#!/usr/bin/env python3
"""Developer oracle: unicorn==2.1.4 and pyelftools==0.33, plus a local game binary.

Emulates the pinned decoder and grid-to-world instructions. Stubs only byte
copying, the modern-format version query and static guards. Does not attach to
a running game. With --density, executes the simulation and checks every cell. See docs/smokes.md.
"""
import argparse
import base64
import hashlib
import json
import struct
from pathlib import Path

from elftools.elf.elffile import ELFFile
from unicorn import Uc, UC_ARCH_X86, UC_MODE_64, UC_HOOK_CODE
from unicorn.x86_const import (
    UC_X86_REG_RAX, UC_X86_REG_RDI, UC_X86_REG_RSI, UC_X86_REG_RDX,
    UC_X86_REG_RIP, UC_X86_REG_RSP, UC_X86_REG_RBP, UC_X86_REG_RCX,
    UC_X86_REG_XMM0, UC_X86_REG_XMM1,
)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--density", action="store_true", help="Also verify complete density journals")
parser.add_argument("client", help="Path to the matching Linux libclient.so")
options = parser.parse_args()
fixture_path = Path(__file__).resolve().parents[1] / "tests/fixtures/smoke-voxels.json"
fixtures = json.loads(fixture_path.read_text())
if hashlib.sha256(Path(options.client).read_bytes()).hexdigest() != fixtures["clientSha256"]:
    raise SystemExit("Client SHA-256 differs. Retrace the addresses before running on another build.")

cpu = Uc(UC_ARCH_X86, UC_MODE_64)
cpu.mem_map(0, 0x5000000)
with open(options.client, "rb") as binary:
    for segment in ELFFile(binary).iter_segments():
        if segment["p_type"] == "PT_LOAD":
            cpu.mem_write(segment["p_vaddr"], segment.data())
cpu.mem_map(0x10000000, 0x1000000)
OBJ, GRID, SEEDS, EXTRA = 0x10000000, 0x10100000, 0x10300000, 0x10310000
READER, INPUT, STACK, END = 0x10400000, 0x10410000, 0x10800000, 0x10900000


def read(address, size):
    return bytes(cpu.mem_read(address, size))


def put(address, fmt, *values):
    cpu.mem_write(address, struct.pack("<" + fmt, *values))


def get(address, fmt):
    return struct.unpack("<" + fmt, read(address, struct.calcsize("<" + fmt)))[0]


def return_from_stub(value=0):
    cpu.reg_write(UC_X86_REG_RAX, value)
    stack = cpu.reg_read(UC_X86_REG_RSP)
    cpu.reg_write(UC_X86_REG_RIP, get(stack, "Q"))
    cpu.reg_write(UC_X86_REG_RSP, stack + 8)


def hook(_cpu, address, _size, _data):
    if address == 0x137FD50:  # Select modern seed encoding.
        return_from_stub(99999)
    elif address == 0x20EE530:  # bf_read::ReadBytes; aligned in these fixtures.
        reader = cpu.reg_read(UC_X86_REG_RDI)
        destination = cpu.reg_read(UC_X86_REG_RSI)
        length = cpu.reg_read(UC_X86_REG_RDX)
        position = get(reader + 0x10, "I")
        assert position % 8 == 0 and position + length * 8 <= get(reader + 0xC, "I")
        cpu.mem_write(destination, read(get(reader, "Q") + position // 8, length))
        put(reader + 0x10, "I", position + length * 8)
        return_from_stub(1)
    elif address == 0xC6DA90:  # __cxa_guard_acquire
        return_from_stub(1)
    elif address == 0xC6DAB0:  # __cxa_guard_release
        cpu.mem_write(cpu.reg_read(UC_X86_REG_RDI), b"\x01")
        return_from_stub()
    elif address == 0x20EDA10:
        raise RuntimeError("Native input overflow")
    elif not (0x1427000 <= address < 0x1432D50):
        raise RuntimeError(f"Unstubbed call {address:#x}")


for stub in [0x137FD50, 0x20EE530, 0xC6DA90, 0xC6DAB0, 0x20EDA10]:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=stub, end=stub)


def clock_stub(_cpu, _address, _size, _data):
    # Recorded as a timestamp only; it does not enter the grid arithmetic.
    cpu.reg_write(UC_X86_REG_XMM0, 0)
    return_from_stub()


cpu.hook_add(UC_HOOK_CODE, clock_stub, begin=0x137CE00, end=0x137CE00)


def call(address, arguments):
    put(STACK - 8, "Q", END)
    cpu.reg_write(UC_X86_REG_RSP, STACK - 8)
    for register, value in zip((UC_X86_REG_RDI, UC_X86_REG_RSI, UC_X86_REG_RDX), arguments):
        cpu.reg_write(register, value)
    cpu.emu_start(address, END, count=20000000)
    assert cpu.reg_read(UC_X86_REG_RIP) == END, "Instruction budget exhausted"


def reset(origin):
    cpu.mem_write(OBJ, b"\0" * 0x200)
    cpu.mem_write(GRID, b"\0" * 0x10B010)
    # Preallocate vectors so no native allocator is needed.
    put(OBJ + 0x70, "Q", GRID)
    put(OBJ + 0x80, "Q", SEEDS)
    put(OBJ + 0x88, "I", 255)
    put(OBJ + 0x130, "Q", EXTRA)
    put(OBJ + 0x138, "I", 255)
    put(OBJ + 0xE8, "fff", *origin)
    put(OBJ + 8, "B", 1)  # First simulation step.
    put(OBJ + 0xC0, "Q", 0x10320000)
    put(OBJ + 0xC8, "I", 255)


def decode(payload):
    cpu.mem_write(INPUT, payload + b"\0" * 8)
    put(READER, "QIIII", INPUT, len(payload), len(payload) * 8, 0, 0)
    cpu.mem_write(READER + 0x22, b"\0")
    call(0x14324A0, [OBJ, READER, GRID])
    assert get(READER + 0x10, "I") == len(payload) * 8
    return {
        "seedsHex": read(SEEDS, get(OBJ + 0x78, "I") * 8).hex(),
        "blockedSha256": hashlib.sha256(read(GRID + 8, 4096)).hexdigest(),
        "stopSeeding": bool(get(GRID + 0x10B008, "B")),
        "extraHex": read(EXTRA, get(OBJ + 0x128, "I") * 20).hex(),
    }


for case in fixtures["cases"]:
    reset(case["origin"])
    journal = base64.b64decode(case["journalBase64"])
    offset = 0
    checkpoints = {entry["seq"]: entry for entry in case["expected"]}
    checked = set()
    while offset < len(journal):
        sequence, size = struct.unpack_from("<HH", journal, offset)
        payload = journal[offset + 4:offset + 4 + size]
        offset += 4 + size
        actual = decode(payload)
        if sequence not in checkpoints:
            continue
        expected = checkpoints[sequence]
        for key, value in actual.items():
            assert value == expected[key], (case["map"], sequence, key)
        for index, world in enumerate(expected["worldCentres"]):
            call(0x1427150, [OBJ, SEEDS + index * 8])
            xy = cpu.reg_read(UC_X86_REG_XMM0).to_bytes(16, "little")[:8]
            z = cpu.reg_read(UC_X86_REG_XMM1).to_bytes(16, "little")[:4]
            actual_world = list(struct.unpack("<ff", xy)) + list(struct.unpack("<f", z))
            assert actual_world == world, (actual_world, world)
        checked.add(sequence)
    assert offset == len(journal) and checked == set(checkpoints)
    print(case["map"], len(checked), "native reference checkpoints passed")

# Execute just the Morton calculation within the native density lookup.
# The preceding world-to-grid result is a packed X/Y/Z entry on its stack.
indices = bytearray()
cpu.reg_write(UC_X86_REG_RBP, STACK)
for x in range(32):
    for y in range(32):
        for z in range(32):
            put(STACK - 0x14, "BBBB", x, y, z, 5)
            cpu.emu_start(0x1429286, 0x1429328, count=200)
            assert cpu.reg_read(UC_X86_REG_RIP) == 0x1429328
            indices.extend(struct.pack("<I", cpu.reg_read(UC_X86_REG_RCX)))
assert hashlib.sha256(indices).hexdigest() == fixtures["mortonGridSha256"]
print("All 32768 native Morton indices passed")


if options.density:
    references = json.loads(fixture_path.with_name("smoke-density.json").read_text())
    assert references["clientSha256"] == fixtures["clientSha256"]
    for reference in references["cases"]:
        case = fixtures["cases"][reference["voxelFixture"]] if "voxelFixture" in reference else reference
        reset(case["origin"])
        journal = base64.b64decode(case["journalBase64"])
        offset = 0
        count = 0
        while offset < len(journal):
            sequence, size = struct.unpack_from("<HH", journal, offset)
            assert sequence == count
            decode(journal[offset + 4:offset + 4 + size])
            offset += 4 + size
            call(0x14320D0, [OBJ])
            buffer = get(OBJ + 0x100, "I")
            cells = read(GRID + 0x3008 + buffer * 32768 * 16, 32768 * 16)
            density = b"".join(cells[i:i + 4] for i in range(0, len(cells), 16))
            expected = reference["frames"][sequence]
            assert hashlib.sha256(cells).hexdigest() == expected["cellsSha256"], (reference["name"], sequence, "cells")
            assert hashlib.sha256(density).hexdigest() == expected["densitySha256"], (reference["name"], sequence, "density")
            count += 1
        assert offset == len(journal) and count == len(reference["frames"])
        print(reference["name"], count, "native density frames passed", flush=True)
