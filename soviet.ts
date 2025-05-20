#!/usr/bin/env bun
import { validateArgs } from "./scripts/validateArgs";
import { resolvePaths } from "./scripts/resolvePaths";
import { processProject } from "./scripts/processProject";

const params = validateArgs();
const paths = resolvePaths(params);
const soviet = processProject(paths) as unknown as any;