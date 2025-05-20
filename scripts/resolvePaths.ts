import { statSync, existsSync, mkdirSync } from "fs";
import { resolveToPath } from "@/utils/resolveToPath";
import type { Args } from "./validateArgs";
import { resolve } from "path";

export type Paths = {
	src: string,
	out: string,
}

export const resolvePaths = (args: Args): Paths => {
	try {
		const srcPath = resolve(args.src);
		const outPath = resolve(args.out);

		if (!existsSync(srcPath)) {
			throw new Error(`The source directory does not exist: ${srcPath}`);
		}

		if (!statSync(srcPath).isDirectory()) {
			throw new Error(`The source path is not a directory: ${srcPath}`);
		}

		if (existsSync(outPath)) {
			const confirmed = confirm(
				`The output directory already exists: ${outPath}\nDo you want to continue and potentially overwrite files? (y/N):`
			);

			if (!confirmed) {
				console.log("Operation aborted.");
				process.exit(1);
			}
		} else {
			mkdirSync(outPath);
		}

		return {
			src: srcPath,
			out: outPath,
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
		}
		process.exit(1);
	}
	
}

const confirm = (message: string): boolean => {
	const answer = prompt(message);

	if (typeof answer !== "string") return false;
	
	return (answer.trim().toLowerCase() === "y");
}