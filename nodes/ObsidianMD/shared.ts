import matter from "gray-matter";
import { readFileSync, writeFileSync } from "fs";
import * as yaml from "js-yaml";

export const getNote = (filepath: string) => {
  const filecontent = readFileSync(filepath, "utf8");
  const { data, content } = matter(filecontent);

  return ({
    "filename": filepath,
    "content": content,
    "frontmatter": data,
  });
};

export const noteMeetsConditions = (
  frontmatter: { [key: string]: any },
  filter: string,
): boolean => {
  if (!filter || !frontmatter) return true;

  // Remove outer quotes if they exist
  const cleanFilter = filter.replace(/^["'](.+)["']$/, "$1");

  // Split the filter string by newlines to handle multiple conditions
  const conditions = cleanFilter.split("\n");

  // Check if all conditions are met
  return conditions.every((condition) => {
    console.log(`condition: ${condition}`);
    const [key, value] = condition.split(":").map((part) => part.trim());
    const targetValue = value.toLowerCase() === "true";
    console.log(`key: ${key}, value: ${value}, targetValue: ${targetValue}`);
    console.log(JSON.stringify(frontmatter));
    return frontmatter.hasOwnProperty(key) && frontmatter[key] === targetValue;
  });
};

export const writeNote = (
  filepath: string,
  frontmatter: object,
  content: string,
) => {
  const newFileContent: string = "---\n" + yaml.dump(frontmatter) +
    content.trimStart();

  writeFileSync(filepath, newFileContent, "utf-8");
};
