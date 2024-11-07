// import { IExecuteFunctions } from "n8n-core";
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
// import { readFileSync, writeFileSync } from "fs";
// import * as yaml from "js-yaml";
// import matter from "gray-matter";
import { getNote, writeNote } from "./shared";

export class ObsidianMD implements INodeType {
  description: INodeTypeDescription = {
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        options: [
          {
            name: "Read Obsidian Note",
            value: "read",
          },
          {
            name: "Write Obsidian Note",
            value: "write",
          },
        ],
        default: "read",
      },
      {
        displayName: "Filename",
        name: "filename",
        type: "string",
        default: "",
      },
      {
        displayName: "Values To Save",
        name: "valuesToSave",
        description: "JSON object of values to save",
        type: "string",
        default: "",
        typeOptions: {
          rows: 5,
        },
        displayOptions: {
          show: {
            operation: ["write"],
          },
        },
      },
    ],
    displayName: "ObsidianMD",
    name: "ObsidianMD",
    icon: "file:obsidianmd.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      '={{$parameter["filename"].split("/").pop() + ": " + $parameter["operation"] + " frontmatter" }}',
    description: "ObsidianMD",
    defaults: {
      name: "ObsidianMD",
    },
    inputs: ["main"],
    outputs: ["main"],
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const returnData = [];
    const filename = this.getNodeParameter("filename", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;
  
    const noteData = getNote(filename);
    returnData.push(noteData);

    if (operation === "write") {
      const valuesToSave = JSON.parse(
        "{" +
          (this.getNodeParameter("valuesToSave", 0) as string) + "}",
      );

      const newFrontmatter = { ...noteData.frontmatter, ...valuesToSave };

      writeNote(filename, newFrontmatter, noteData.content )
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}
