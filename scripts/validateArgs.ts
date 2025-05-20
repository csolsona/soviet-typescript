import { parseArgs } from "util";


export type Args = {
	src: string,
	out: string,
}

export const validateArgs = (): Args => {
	try {
		const values = parse();

		if (values.help) {
			showHelp();
		}

		if (!values.src) {
			throw new Error("Missing required options: --src");
		}

		if (!values.out) {
			throw new Error("Missing required options: --out");
		}

		return {
			src: values.src,
			out: values.out,
		};

	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
		}
		console.log("Use --help to see usage.");
		process.exit(1);
	}
	
}

const parse = () => {
	try {
		const { values } = parseArgs({
			options: {
				src: {
					type: 'string',
				},
				out: {
					type: 'string',
				},
				help: {
					type: 'boolean',
					short: 'h',
				}
			},
			strict: true,
			allowPositionals: false,
		});

		return values;

	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
		}
		console.log("Use --help to see available options.");
		process.exit(1);
	}
}

const showHelp = () => {
	console.log(helpMessage);
	process.exit(0);
}

const helpMessage = `
Usage: bun run ruina-types.ts --src <source_directory> --out <output_directory>

Options:
--src     Path to the original TypeScript project directory
--out     Path to the directory in which the Soviet TypeScript project will be located
--help    Show this help message and exit

Example:
bun run ruina-types.ts --src ./my-app --out ./my-app-ruined
`