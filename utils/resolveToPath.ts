import { fileURLToPath } from "bun";

export const resolveToPath = (specifier: string) => {
	const url = import.meta.resolve(specifier);
	return fileURLToPath(url);
}