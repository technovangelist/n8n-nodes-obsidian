// import { IExecuteFunctions } from "n8n-core";
import {
	ApplicationError,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { existsSync } from 'fs';
import * as path from 'path';
// import { readFileSync, writeFileSync } from "fs";
// import * as yaml from "js-yaml";
// import matter from "gray-matter";
import {
	getNote,
	isPathInside,
	parseFrontmatterInput,
	resolveVaultPath,
	writeNote,
} from './shared';

export class Obsidian implements INodeType {
	description: INodeTypeDescription = {
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Read Obsidian Note',
						value: 'read',
					},
					{
						name: 'Write Obsidian Note',
						value: 'write',
					},
				],
				default: 'read',
			},
			{
				displayName: 'Obsidian Vault Path',
				name: 'vaultPath',
				type: 'string',
				default: '',
				required: true,
				description: 'The path to your Obsidian vault',
			},
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				default: '',
				description: 'Path to the note inside the configured vault',
			},
			{
				displayName: 'Frontmatter Values To Save',
				name: 'frontmatterValuesToSave',
				description: 'JSON object of frontmatter values to save',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						operation: ['write'],
					},
				},
			},
			{
				displayName: 'Content',
				name: 'content',
				description: 'New note content to save. Leave blank to keep the existing content.',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 8,
				},
				displayOptions: {
					show: {
						operation: ['write'],
					},
				},
			},
		],
		displayName: 'Obsidian',
		name: 'obsidian',
		icon: 'file:obsidian.svg',
		group: ['transform'],
		version: 1,
		subtitle:
			'={{$parameter["filename"].split("/").pop() + ": " + $parameter["operation"] + " frontmatter" }}',
		description: 'Obsidian',
		defaults: {
			name: 'Obsidian',
		},
		inputs: ['main'],
		outputs: ['main'],
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = [];
		const vaultPath = this.getNodeParameter('vaultPath', 0) as string;
		const filename = this.getNodeParameter('filename', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const resolvedVaultPath = path.resolve(vaultPath);
		const resolvedFilename = resolveVaultPath(vaultPath, filename);

		if (!isPathInside(resolvedVaultPath, resolvedFilename)) {
			throw new ApplicationError('The note path must stay inside the configured Obsidian vault.');
		}

		const noteExists = existsSync(resolvedFilename);
		const noteData = noteExists
			? getNote(resolvedFilename)
			: {
					filename: resolvedFilename,
					content: '',
					frontmatter: {},
				};

		if (operation === 'write') {
			let valuesToSave: Record<string, unknown>;

			try {
				valuesToSave = parseFrontmatterInput(
					this.getNodeParameter('frontmatterValuesToSave', 0) as string,
				);
			} catch (error) {
				throw new ApplicationError(
					'Frontmatter Values To Save must be a JSON or YAML object, or JSON key/value pairs.',
					{ extra: { error: error instanceof Error ? error.message : String(error) }, tags: {} },
				);
			}

			const contentToSave = this.getNodeParameter('content', 0) as string;

			const newFrontmatter = { ...noteData.frontmatter, ...valuesToSave };
			const newContent = contentToSave === '' ? noteData.content : contentToSave;

			writeNote(resolvedFilename, newFrontmatter, newContent);
			returnData.push({
				filename: resolvedFilename,
				content: newContent,
				frontmatter: newFrontmatter,
			});
		} else {
			returnData.push(noteData);
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
