import { google } from "googleapis";
import { CustomDate, TransactionInfo } from "../common/models";
import { logger } from "../logger";
import authenticate from "./auth";
import { categorySheetName, fullRange, month, range } from "./constants";
import * as hash from "object-hash";

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
  const sheetData: SheetsInformation[] = [];
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
  return sheetData;
};

const fetchSheetsData = async (sheetName: string) => {
  const results = await fetchData(sheetName, fullRange());
  if (!!results) return extractSheetsInformations(results);
  return [];
};

const formatNumber = (stringNumber: string) => {
  return Number(stringNumber) < 10 ? `0${stringNumber}` : `${stringNumber}`;
};

const formatDate = (date: CustomDate) => {
  const day = formatNumber(date.Day);
  const month = formatNumber(date.Month);
  return `${day}/${month}/${date.Year}`;
};

const transactionToSheet = (
  transaction: TransactionInfo,
  ratio?: number
): SheetsInformation => {
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

const fetchCategories = async () => {
  //const results = await fetchData(categorySheetName, "A1:B");
  return [];
};

const extractNewTransactions = (
  bankTransactions: TransactionInfo[],
  sheetOnlineDatas: SheetsInformation[],
  ratio?: number
) => {
  const newTransactions: SheetsInformation[] = [];
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

const formatSheetsInformation = (datas: SheetsInformation[]) => {
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

const publish = async (
  datas: SheetsInformation[],
  previousSize: number,
  sheetName: string
) => {
  const newRange = `${sheetName}!${range(previousSize)}`;
  const values = formatSheetsInformation(datas);
  const googleSheetApi = getGoogleSheetsApi();
  await googleSheetApi.spreadsheets.values.update({
    spreadsheetId: service.sheetId,
    range: newRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range: newRange,
      values: values,
    },
  });
};

export const sheetService = {
  init,
  computeSheetName,
  classifyTransactionsByDate,
  fetchSheetsData,
  extractNewTransactions,
  publish,
  fetchCategories,
};
