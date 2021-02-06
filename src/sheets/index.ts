import { google } from "googleapis";
import {
  CategoryCounter,
  CustomDate,
  TransactionCategories,
  TransactionInfo,
} from "../common/models";
import { logger } from "../logger";
import authenticate from "./auth";
import { categorySheetName, fullRange, month, range } from "./constants";
import * as hash from "object-hash";
import { RequestType, SheetService, BudgetItem } from "./models";

let service: SheetService = { sheetId: undefined, auth: undefined };

const computeSheetName = (transaction: TransactionInfo) => {
  return `${month[Number(transaction.Date.Month) - 1]}${transaction.Date.Year}`;
};

const classifyTransactionsByDate = (transactions: TransactionInfo[]) => {
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

const extractSheetsInformations = (results) => {
  return extractData(results, RequestType.Data);
  /* const sheetData: SheetsInformation[] = [];
  const rows = results.data.values;
  if (rows) {
    if (rows.length) {
      rows.map((row) => {
        sheetData.push({
          Hash: row[0],
          Nom: row[1],
          Montant: Number(row[2].replace(",", ".")),
          Date: row[3],
          Details: row[4],
          Categorie: row[5],
        });
      });
    } else {
      logger.error("No data found.");
    }
  }
  return sheetData;*/
};

const fetchSheetsData = async (sheetName: string) => {
  const results = await fetchData(sheetName, fullRange());
  if (!!results) return extractSheetsInformations(results);
  return [];
};

const formatNumber = (stringNumber: string) => {
  return stringNumber.length < 2 ? `0${stringNumber}` : `${stringNumber}`;
  //  return Number(stringNumber) < 10 ? `0${stringNumber}` : `${stringNumber}`;
};

const formatDate = (date: CustomDate) => {
  const day = formatNumber(date.Day);
  const month = formatNumber(date.Month);
  return `${day}/${month}/${date.Year}`;
};

const transactionToSheet = (
  transaction: TransactionInfo,
  ratio?: number
): BudgetItem => {
  const formattedDate = formatDate(transaction.Date);
  const montant = transaction.Montant * (ratio ?? 1);
  const hashed = hash([transaction.Nom, transaction.Date, transaction.Montant]);
  return {
    Nom: transaction.Nom,
    Montant: montant,
    Date: formattedDate,
    Hash: hashed,
  };
};

const extractCategory = (row): TransactionCategories => {
  return {
    Nom: row[0],
    Categories: JSON.parse(row[1]),
  };
};

const extractSheetInformation = (row): BudgetItem => {
  return {
    Hash: row[0],
    Nom: row[1],
    Montant: Number(row[2].replace(",", ".")),
    Date: row[3],
    Details: row[4],
    Categorie: row[5],
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
          case RequestType.Data:
          default:
            const sheetData = extractSheetInformation(row);
            sheetData ? data.push(sheetData) : () => {};
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
  /*const transactionCategories: TransactionCategories[] = [];
  const rows = results.data.values;
  if (rows) {
    if (rows.length) {
      rows.map((row) => {
        transactionCategories.push({
          Nom: row[0],
          Categories: JSON.parse(row[1]),
        });
      });
    } else {
      logger.error("No categories found.");
    }
  }
  return transactionCategories;*/
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
  bankTransactions: TransactionInfo[],
  sheetOnlineDatas: BudgetItem[],
  ratio?: number
) => {
  const newTransactions: BudgetItem[] = [];
  for (const bankTransaction of bankTransactions) {
    const transactionAsSheet = transactionToSheet(bankTransaction, ratio);
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

const computeNewTransactionCategories = (
  datas: BudgetItem[],
  transactionCategories: TransactionCategories[]
) => {
  const newTransactionCategories: TransactionCategories[] = [];
  for (const data of datas) {
    const filteredTransactionCategory = transactionCategories.filter(
      (value) => {
        return value.Nom === data.Nom;
      }
    );
    if (filteredTransactionCategory.length > 0) {
      const prevCategories = filteredTransactionCategory[0].Categories;
      const transactionName = filteredTransactionCategory[0].Nom;
      const newCatCounter = updateCategory(data.Categorie, prevCategories);
      newTransactionCategories.push({
        Nom: transactionName,
        Categories: newCatCounter,
      });
    } else {
      newTransactionCategories.push({
        Nom: data.Nom,
        Categories: [{ Name: data.Categorie, Count: 1 }],
      });
    }
  }
  return newTransactionCategories;
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
  fetchSheetsData,
  extractNewTransactions,
  publish,
  fetchCategories,
  updateDefaultCategories,
};
