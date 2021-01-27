import { parseBncCSV, readCSV, readJsonFile } from "./reader";
import { logger } from "./logger";
import { BankType, Root } from "./models";

const readRoot = async () => {
  try {
    return await readJsonFile("./secret/root.json");
  } catch (err) {
    console.error(err);
  }
};

const initiallizeLogger = async (root: Root, bankType: BankType) => {
  try {
    await logger.init(bankType, root.logFolder);
  } catch (err) {
    console.error("Error while initializing the logger", err);
  }
};

export const execute = async (bankType: BankType) => {
  const root = await readRoot();
  await initiallizeLogger(root, bankType);
  if (process.argv[2] === undefined) logger.error("CSV path is undefined");
  const pathToCSV = process.argv[2];
  const csvString = await readCSV(pathToCSV);
  switch (bankType) {
    case BankType.BNC:
      const bankInfo = parseBncCSV(csvString);
  }
};
