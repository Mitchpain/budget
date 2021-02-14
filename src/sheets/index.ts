import { google } from "googleapis";
import { BudgetItemService } from "../budgetItem";
import {
  CategoryCounter,
  TransactionCategories,
  Transaction,
} from "../common/models";
import { logger } from "../logger";
import authenticate from "./auth";
import { categorySheetName, fullRange, month, range } from "./constants";
import { RequestType, SheetService, BudgetItem } from "./models";

let service: SheetService = { sheetId: undefined, auth: undefined };

const computeSheetName = (transaction: Transaction) => {
  return `${month[Number(transaction.Date.Month) - 1]}${transaction.Date.Year}`;
};

const classifyTransactionsByDate = (transactions: Transaction[]) => {
  const sheets = [];
  for (const transactionInfo of transactions) {
    const name = computeSheetName(transactionInfo);
    if (sheets[name] === undefined) sheets[name] = [];
    sheets[name] = [...sheets[name], transactionInfo];
  }
  return sheets;
};

const init = async (spreadsheetId: string) => {
  const auth = await authenticate();
  service = {
    auth,
    sheetId: spreadsheetId,
  };
};

const getGoogleSheetsApi = () => {
  const auth = service.auth;
  return google.sheets({ version: "v4", auth });
};

const fetchData = async (sheetName: string, requestedRange: string) => {
  const sheets = getGoogleSheetsApi();
  return await sheets.spreadsheets.values.get({
    spreadsheetId: service.sheetId,
    range: `${sheetName}!${requestedRange}`,
  });
};

const extractBudgetItems = (results) => {
  return extractData(results, RequestType.BudgetItems);
};

const fetchBudgetItems = async (sheetName: string) => {
  const results = await fetchData(sheetName, fullRange());
  if (!!results) return extractBudgetItems(results);
  return [];
};

const extractCategory = (row): TransactionCategories => {
  return {
    Nom: row[0],
    Categories: JSON.parse(row[1]),
  };
};

const extractData = (
  results,
  requestType: RequestType
): TransactionCategories[] | BudgetItem[] => {
  const data = [];
  const rows = results.data.values;
  if (rows) {
    if (rows.length) {
      rows.map((row) => {
        switch (requestType) {
          case RequestType.Category:
            const newData = extractCategory(row);
            newData ? data.push(newData) : () => {};
            break;
          case RequestType.BudgetItems:
          default:
            data.push(BudgetItemService.fromRow(row));
            break;
        }
      });
    } else {
      logger.error(`Error while extracting data for ${requestType}.`);
    }
  }
  return data;
};

const extractCategories = (results) => {
  return extractData(results, RequestType.Category);
};

const fetchCategories = async () => {
  try {
    const results = await fetchData(categorySheetName, "A1:B");
    if (!!results) return extractCategories(results);
  } catch (err) {
    logger.error(err);
  }
  return [];
};

const extractNewTransactions = (
  bankTransactions: Transaction[],
  sheetOnlineDatas: BudgetItem[],
  ratio?: number
) => {
  const newTransactions: BudgetItem[] = [];
  for (const bankTransaction of bankTransactions) {
    const transactionAsSheet = BudgetItemService.fromTransaction(
      bankTransaction,
      ratio
    );
    const found = sheetOnlineDatas.filter((value, index, array) => {
      return value.Hash == transactionAsSheet.Hash;
    });
    if (found[0] === undefined) newTransactions.push(transactionAsSheet);
  }
  return newTransactions;
};

const convertMontant = (montant: number) => {
  return montant.toString().replace(".", ",");
};

const formatSheetsInformation = (datas: BudgetItem[]) => {
  let values = [];
  for (const data of datas) {
    values.push([
      data.Hash,
      data.Nom,
      convertMontant(data.Montant),
      data.Date,
      data.Details ?? "",
      data.Categorie ?? "",
    ]);
  }
  return values;
};

const updateCategory = (catName: string, catCounters: CategoryCounter[]) => {
  const newCatCounter: CategoryCounter[] = [];
  for (const catCounter of catCounters) {
    if (catCounter.Name === catName) {
      newCatCounter.push({ Name: catName, Count: ++catCounter.Count });
    } else {
      newCatCounter.push(catCounter);
    }
  }
  return newCatCounter;
};

const updateTransactionCategory = (
  transactionCategory: TransactionCategories,
  categoryName: string
) => {
  const prevCategories = transactionCategory.Categories;
  const transactionName = transactionCategory.Nom;
  const newCatCounter = updateCategory(categoryName, prevCategories);
  return {
    Nom: transactionName,
    Categories: newCatCounter,
  };
};

const addBudgetItemCategory = (
  transactionCategories: TransactionCategories[],
  budgetItem: BudgetItem
) => {
  const newTransactionsCategories: TransactionCategories[] = [];
  let wasUpdated = false;
  transactionCategories.forEach((transactionCategory) => {
    if (transactionCategory.Nom === budgetItem.Nom) {
      newTransactionsCategories.push(
        updateTransactionCategory(transactionCategory, budgetItem.Categorie)
      );
      wasUpdated = true;
    } else {
      newTransactionsCategories.push(transactionCategory);
    }
  });
  if (!wasUpdated) {
    newTransactionsCategories.push({
      Nom: budgetItem.Nom,
      Categories: [{ Name: budgetItem.Categorie, Count: 1 }],
    });
  }
  return newTransactionsCategories;
};

const computeNewTransactionCategories = (
  budgetItems: BudgetItem[],
  previousTransactionCategories: TransactionCategories[]
) => {
  let updatedTransactionCategories: TransactionCategories[] = [
    ...previousTransactionCategories,
  ];
  for (const bugetItem of budgetItems) {
    updatedTransactionCategories = addBudgetItemCategory(
      updatedTransactionCategories,
      bugetItem
    );
  }
  return updatedTransactionCategories;
};

const formatTransactionCategories = (
  transactionCatories: TransactionCategories[]
) => {
  let values = [];
  for (const transactionCategory of transactionCatories) {
    values.push([
      transactionCategory.Nom,
      JSON.stringify(transactionCategory.Categories),
    ]);
  }
  return values;
};

const updateDefaultCategories = async (
  datas: BudgetItem[],
  transactionCategories: TransactionCategories[]
) => {
  const newTransactionCategories = computeNewTransactionCategories(
    datas,
    transactionCategories
  );
  const values = formatTransactionCategories(newTransactionCategories);
  const range = `${categorySheetName}!A1`;
  await writeSheet(values, range);
};

const writeSheet = async (values: any, range: string) => {
  const googleSheetApi = getGoogleSheetsApi();
  await googleSheetApi.spreadsheets.values.update({
    spreadsheetId: service.sheetId,
    range: range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range: range,
      values: values,
    },
  });
};

const publish = async (
  datas: BudgetItem[],
  previousSize: number,
  sheetName: string
) => {
  const newRange = `${sheetName}!${range(previousSize)}`;
  const values = formatSheetsInformation(datas);
  await writeSheet(values, newRange);
};

export const sheetService = {
  init,
  computeSheetName,
  classifyTransactionsByDate,
  fetchSheetsData: fetchBudgetItems,
  extractNewTransactions,
  publish,
  fetchCategories,
  updateDefaultCategories,
};
