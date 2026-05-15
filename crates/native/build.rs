use std::path::PathBuf;

/// Normalise a path to a string protoc accepts on Windows. `Path::canonicalize`
/// returns UNC `\\?\...` paths that protoc rejects with "File not found";
/// instead we resolve manually from CARGO_MANIFEST_DIR (which is already a
/// plain absolute path on every supported host).
fn proto_path(manifest_dir: &PathBuf, rel: &str) -> PathBuf {
	let mut p = manifest_dir.clone();
	for seg in rel.split('/') {
		match seg {
			".." => {
				p.pop();
			}
			"." | "" => {}
			s => p.push(s),
		}
	}
	p
}

fn main() {
	napi_build::setup();

	// Point prost-build at the vendored protoc so CI doesn't need protoc on PATH.
	let protoc = protoc_bin_vendored::protoc_bin_path().expect("vendored protoc");
	std::env::set_var("PROTOC", protoc);

	let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
	let proto_root = proto_path(&manifest_dir, "../../src/proto");
	assert!(proto_root.is_dir(), "src/proto not found at {}", proto_root.display());

	let protos = [
		"demo.proto",
		"netmessages.proto",
		"networkbasetypes.proto",
		"network_connection.proto",
		"source2_steam_stats.proto",
	];

	let proto_paths: Vec<PathBuf> = protos.iter().map(|p| proto_root.join(p)).collect();
	for p in &proto_paths {
		println!("cargo:rerun-if-changed={}", p.display());
	}

	prost_build::Config::new()
		.compile_protos(&proto_paths, &[&proto_root])
		.expect("prost compile");
}
