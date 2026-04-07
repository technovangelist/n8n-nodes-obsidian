import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import YAML from 'yaml';

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n?/;

const parseFilterValue = (value: string): string | number | boolean | null => {
	const trimmedValue = value.trim();

	if (/^['"].*['"]$/.test(trimmedValue)) {
		return trimmedValue.slice(1, -1);
	}

	if (trimmedValue === 'true') return true;
	if (trimmedValue === 'false') return false;
	if (trimmedValue === 'null') return null;
	if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) return Number(trimmedValue);

	return trimmedValue;
};

export const isPathInside = (parentPath: string, childPath: string): boolean => {
	const relativePath = path.relative(parentPath, childPath);

	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

export const resolveVaultPath = (vaultPath: string, notePath: string): string => {
	return path.resolve(path.resolve(vaultPath), notePath);
};

export const parseFrontmatterInput = (input: string): Record<string, unknown> => {
	const trimmedInput = input.trim();

	if (trimmedInput === '') {
		return {};
	}

	let parsedInput: unknown;

	try {
		const normalizedJsonInput = trimmedInput.startsWith('{') ? trimmedInput : `{${trimmedInput}}`;
		parsedInput = JSON.parse(normalizedJsonInput);
	} catch {
		parsedInput = YAML.parse(trimmedInput);
	}

	if (!parsedInput || typeof parsedInput !== 'object' || Array.isArray(parsedInput)) {
		throw new Error('Frontmatter values must be a JSON or YAML object.');
	}

	return parsedInput as Record<string, unknown>;
};

export const getNote = (filepath: string) => {
	const filecontent = readFileSync(filepath, 'utf8');
	const match = filecontent.match(FRONTMATTER_PATTERN);
	const rawFrontmatter = match?.[1];
	const parsedFrontmatter = rawFrontmatter ? YAML.parse(rawFrontmatter) : {};
	const frontmatter =
		parsedFrontmatter && typeof parsedFrontmatter === 'object' ? parsedFrontmatter : {};
	const content = match ? filecontent.slice(match[0].length) : filecontent;

	return {
		filename: filepath,
		content,
		frontmatter,
	};
};

export const noteMeetsConditions = (
	frontmatter: { [key: string]: any },
	filter: string,
): boolean => {
	if (!filter) return true;
	if (!frontmatter) return false;

	// Remove outer quotes if they exist
	const cleanFilter = filter.replace(/^["'](.+)["']$/, '$1');

	// Split the filter string by newlines to handle multiple conditions
	const conditions = cleanFilter
		.split('\n')
		.map((condition) => condition.trim())
		.filter(Boolean);

	// Check if all conditions are met
	return conditions.every((condition) => {
		const separatorIndex = condition.indexOf(':');

		if (separatorIndex === -1) {
			return false;
		}

		const key = condition.slice(0, separatorIndex).trim();
		const value = condition.slice(separatorIndex + 1);

		if (!key) {
			return false;
		}

		return (
			Object.prototype.hasOwnProperty.call(frontmatter, key) &&
			frontmatter[key] === parseFilterValue(value)
		);
	});
};

export const writeNote = (
	filepath: string,
	frontmatter: Record<string, unknown>,
	content: string,
) => {
	const hasFrontmatter = Object.keys(frontmatter).length > 0;
	const serializedFrontmatter = hasFrontmatter
		? `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n`
		: '';
	const newFileContent = `${serializedFrontmatter}${content}`;

	writeFileSync(filepath, newFileContent, 'utf-8');
};
