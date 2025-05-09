// Source: https://github.com/sveltejs/kit/issues/10040#issuecomment-2599028458

const { readdir, stat, readFile, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const fs = require("node:fs/promises");

async function* walkFiles(dir) {
	const files = await readdir(dir);
	for (const file of files) {
		const path = resolve(dir, file);
		const info = await stat(path);
		if (info.isDirectory()) {
			yield* walkFiles(path);
		} else {
			yield path;
		}
	}
}

(async () => {
	// Fix source paths being wrong by one directory level
	for await (const file of walkFiles(".svelte-kit/adapter-node")) {
		if (!file.endsWith(".js.map")) {
			continue;
		}

		const content = await readFile(file, "utf-8");
		const json = JSON.parse(content);
		json.sources = json.sources.map((source) => {
			if (source.startsWith("../../../")) {
				return source.slice("../".length);
			}
			return source;
		});
		await writeFile(file, JSON.stringify(json));
	}

	// Amazingly horrific hack to avoid sorcery complaining about missing files
	const originalReadFile = fs.readFile;
	fs.readFile = async (...args) => {
		try {
			return await originalReadFile(...args);
		} catch (error) {
			console.warn("ignoring issue reading file", args[0]);
			return "";
		}
	};

	// Run sorcery over everything to get ✨ working sourcemaps ✨
	const sorcery = await import("sorcery");
	for await (const file of walkFiles("build/server")) {
		if (!file.endsWith(".js")) {
			continue;
		}

		try {
			const chain = await sorcery.load(file);
			if (chain) {
				await chain.write();
			}
		} catch (err) {
			console.warn("failed to write chain", file, err);
		}
	}
})();