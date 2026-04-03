// import { IExecuteFunctions } from "n8n-core";
import {
	ApplicationError,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import * as path from 'path';
// import { readFileSync, writeFileSync } from "fs";
// import * as yaml from "js-yaml";
// import matter from "gray-matter";
import { getNote, isPathInside, resolveVaultPath, writeNote } from './shared';

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
				displayName: 'Values To Save',
				name: 'valuesToSave',
				description: 'JSON object of values to save',
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

		const noteData = getNote(resolvedFilename);
		returnData.push(noteData);

		if (operation === 'write') {
			const valuesToSave = JSON.parse(
				'{' + (this.getNodeParameter('valuesToSave', 0) as string) + '}',
			);

			const newFrontmatter = { ...noteData.frontmatter, ...valuesToSave };

			writeNote(resolvedFilename, newFrontmatter, noteData.content);
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
