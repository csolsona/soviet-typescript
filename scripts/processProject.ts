import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync, copyFileSync } from "fs";
import { join, relative, resolve } from "path";
import { Project } from "ts-morph";

import { changeTypes } from "./changeTypes";

import type { Paths } from "./resolvePaths";

export const processProject = (paths: Paths) => {
	const project = new Project({
		skipAddingFilesFromTsConfig: true,
	});

	processFiles({
		project,
		paths,
		recursivePath: paths.src
	});
};

/**
 * Get all .ts and .tsx project files (excluding node_modules files)
 */
const processFiles = (properties: {
	project: Project,
	paths: Paths,
	recursivePath: string,
}): void => {
	const entries = readdirSync(properties.recursivePath);

	for (const entry of entries) {
		const fullPath = resolve(properties.recursivePath, entry);
		const relPath = relative(properties.paths.src, fullPath);
		const destPath = join(properties.paths.out, relPath);

		const stats = statSync(fullPath);

		if (stats.isDirectory()) {
			// Exclude node_modules files
			if (entry === "node_modules") {
				continue;
			}

			if (!existsSync(destPath)) {
				mkdirSync(destPath, { recursive: true });
			}

			// Recursive call
			processFiles({
				project: properties.project,
				paths: {
					src: properties.paths.src,
					out: properties.paths.out,
				},
				recursivePath: fullPath,
			});
		// Process and copy .ts and .tsx files
		} else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
			const content = readFileSync(fullPath, "utf8");
			const sourceFile = properties.project.createSourceFile(fullPath, content, { overwrite: true });
			changeTypes(sourceFile);
			writeFileSync(destPath, sourceFile.getFullText(), "utf8");
		}
		// Copy other files
		else {
			copyFileSync(fullPath, destPath);
		}
	}
};