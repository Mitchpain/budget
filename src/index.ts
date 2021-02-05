import { parseCSV, readCSV, readJsonFile } from "./reader";
import { logger } from "./logger";
import { BankType, Root } from "./models";
import { TransactionCategories, TransactionInfo } from "./common/models";
import { sheetService } from "./sheets";
import { filterAndCategorizeWantedTransactions, promptRatio } from "./prompt";
import { SheetsInformation } from "./sheets/models";

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

const getDefaultLau = () => {
  return process.argv[4] ?? "1";
};

const getDefaultMig = () => {
  return process.argv[3] ?? "1";
};

export const execute = async (bankType: BankType) => {
  const root = (await readRoot()) as Root;
  await initiallizeLogger(root, bankType);
  const ratio =
    bankType === BankType.TANGERINE
      ? await promptRatio(getDefaultMig(), getDefaultLau())
      : undefined;
  const allTransactionInfos = await processCSV(bankType);
  const sheets = sheetService.classifyTransactionsByDate(allTransactionInfos);
  await sheetService.init(root.sheetId);

  const categories = (await sheetService.fetchCategories()) as TransactionCategories[];
  for (const sheetName in sheets) {
    const sheetOnlineDatas = (await sheetService.fetchSheetsData(
      sheetName
    )) as SheetsInformation[];
    const bankTransactions = sheets[sheetName] as TransactionInfo[];
    const newTrasactions = sheetService.extractNewTransactions(
      bankTransactions,
      sheetOnlineDatas,
      ratio
    );
    const filteredTransactions = await filterAndCategorizeWantedTransactions(
      newTrasactions,
      categories
    );
    await sheetService.updateDefaultCategories(
      filteredTransactions,
      categories
    );
    await sheetService.publish(
      filteredTransactions,
      sheetOnlineDatas.length,
      sheetName
    );
  }
};
