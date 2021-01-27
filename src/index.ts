import { parseCSV, readCSV, readJsonFile } from "./reader";
import { logger } from "./logger";
import { BankType, Root } from "./models";
import { BankInformation as TransactionInfo } from "./reader/models";

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

const processCSV = async (bankType: BankType): Promise<TransactionInfo[]> => {
  if (process.argv[2] === undefined) logger.error("CSV path is undefined");
  const pathToCSV = process.argv[2];
  const csvString = await readCSV(pathToCSV, bankType);
  return parseCSV(csvString, bankType);
};

export const execute = async (bankType: BankType) => {
  const root = await readRoot();
  await initiallizeLogger(root, bankType);
  const allTransactionInfos = await processCSV(bankType);
  //Filtre la date
  //Pousse le tout sur sheet
};
