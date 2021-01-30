import { parseCSV, readCSV, readJsonFile } from "./reader";
import { logger } from "./logger";
import { BankType, Root } from "./models";
import { TransactionInfo } from "./common/models";
import { sheetService } from "./sheets";

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
  const root = (await readRoot()) as Root;
  await initiallizeLogger(root, bankType);
  const allTransactionInfos = await processCSV(bankType);
  const sheets = sheetService.classifyTransactionsByDate(allTransactionInfos);
  await sheetService.init(root.sheetId);

  for (const sheetName in sheets) {
    const sheetOnlineDatas = await sheetService.fetchSheetsData(sheetName);
    const bankTransactions = sheets[sheetName] as TransactionInfo[];
    const newTrasactions = sheetService.extractNewTransactions(
      bankTransactions,
      sheetOnlineDatas
    );
    //extract wanted / unwanted
    //set category
    await sheetService.publish(
      newTrasactions,
      sheetOnlineDatas.length,
      sheetName
    );
  }
};
