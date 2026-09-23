import { execFileSync } from 'node:child_process';

/**
 * Exact clang release the embedded WASM is built with. Different clang versions emit different
 * bytes for the same source, so builds refuse any other version and `--check` rejects headers that
 * were not produced by it. 20.1.8 is the final LLVM 20 release (apt.llvm.org `clang-20`, or the
 * LLVM GitHub release binaries). Use `CLANG=/path/to/clang` when it is not first on PATH.
 */
export const CLANG_VERSION = '20.1.8';
export const clangHeader = `// Built with clang ${CLANG_VERSION}`;

export function pinnedClang(): string {
	const clang = process.env.CLANG ?? 'clang';
	let banner: string;
	try {
		banner = execFileSync(clang, ['--version'], { encoding: 'utf8' });
	} catch {
		throw new Error(`clang not found (${clang}); install clang ${CLANG_VERSION} or set CLANG`);
	}
	const found = /clang version (\d+\.\d+\.\d+)/.exec(banner)?.[1];
	if (found !== CLANG_VERSION)
		throw new Error(
			`WASM must be built with clang ${CLANG_VERSION}, found ${found ?? 'unknown'} (${clang}); set CLANG`
		);
	return clang;
}

export function checkClangHeader(generated: string, rebuild: string) {
	if (!generated.includes(`${clangHeader}\n`))
		throw new Error(`Embedded WASM was not built with clang ${CLANG_VERSION}; run ${rebuild}`);
}
