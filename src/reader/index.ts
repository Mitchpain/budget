import * as fs from "fs";
import { logger } from "../logger";

export const readJsonFile = async (filePath: string) => {
  try {
    const stringData = await readFile(filePath);
    return JSON.parse(stringData);
  } catch (err) {
    logger.error(err);
  }
};

const formatData = (data: string) => {
  return data[0] === '"' ? data : `"${data}"`;
};

export const readCSV = async (filePath: string): Promise<string[][]> => {
  const allText = await readFile(filePath);
  console.log("Path", filePath);
  var allTextLines = allText.split(/\r\n|\n/);
  var headers = allTextLines[0].split(";");
  var lines = [];

  for (var i = 1; i < allTextLines.length; i++) {
    var data = allTextLines[i].split(";");
    if (data.length == headers.length) {
      var tarr = [];
      for (var j = 0; j < headers.length; j++) {
        tarr.push(`"${headers[j]}"` + ":" + formatData(data[j]));
      }
      lines.push(tarr);
    }
  }
  return lines;
};

export const readFile = async (filePath: string): Promise<string> => {
  try {
    const data = await fs.promises.readFile(filePath);
    return data.toString();
  } catch (err) {
    logger.error(`readFile : ${err}`);
  }
};

export * from "./csvParser";
