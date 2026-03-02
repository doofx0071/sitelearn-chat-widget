import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const sourceFile = resolve(process.cwd(), "dist", "widget", "widget.iife.js");
const publicDir = resolve(process.cwd(), "public");
const targetFile = resolve(publicDir, "widget.iife.js");

mkdirSync(publicDir, { recursive: true });
copyFileSync(sourceFile, targetFile);

console.log(`Published widget bundle to ${targetFile}`);
