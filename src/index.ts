import { readJsonFile } from "./reader";
import { logger } from "./logger";
import { Root } from "./models";
import { Transaction } from "./common/models";
import { sheetService } from "./sheets";
import { filterAndCategorizeWantedTransactions, promptRatio } from "./prompt";
import { BankFactory } from "./bank";
import { Tangerine } from "./tangerine/tangerine";

const readRoot = async () => {
  try {
    return await readJsonFile("./secret/root.json");
  } catch (err) {
    console.error(err);
  }
};

const initiallizeLogger = async (root: Root) => {
  try {
    await logger.init("Budget", root.logFolder);
  } catch (err) {
    console.error("Error while initializing the logger", err);
  }
};

const getCSVPath = () => {
  if (process.argv[2] === undefined) logger.error("CSV path is undefined");
  return process.argv[2];
};

const getDefaultLau = () => {
  return process.argv[4] ?? "1";
};

const getDefaultMig = () => {
  return process.argv[3] ?? "1";
};

export const execute = async () => {
  const root = (await readRoot()) as Root;
  await initiallizeLogger(root);
  const csvPath = getCSVPath();
  const bank = await BankFactory.createBank(csvPath);
  const ratio =
    bank instanceof Tangerine
      ? await promptRatio(getDefaultMig(), getDefaultLau())
      : undefined;
  const allTransactionInfos = bank.getTransactions();
  const sheets = sheetService.classifyTransactionsByDate(allTransactionInfos);
  await sheetService.init(root.sheetId);

  const categories = await sheetService.fetchCategories();
  for (const sheetName in sheets) {
    const budgetItems = await sheetService.fetchBudgetItems(sheetName);
    const bankTransactions = sheets[sheetName] as Transaction[];
    const newTrasactions = sheetService.extractNewTransactions(
      bankTransactions,
      budgetItems,
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
      budgetItems.length,
      sheetName
    );
  }
};
