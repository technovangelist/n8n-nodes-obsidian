import matter from 'gray-matter';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

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

export const getNote = (filepath: string) => {
	const filecontent = readFileSync(filepath, 'utf8');
	const { data, content } = matter(filecontent);

	return {
		filename: filepath,
		content: content,
		frontmatter: data,
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
	const newFileContent = matter.stringify(content, frontmatter);

	writeFileSync(filepath, newFileContent, 'utf-8');
};
