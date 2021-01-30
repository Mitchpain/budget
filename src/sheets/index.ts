import { google } from "googleapis";
import { CustomDate, TransactionInfo } from "../common/models";
import { logger } from "../logger";
import authenticate from "./auth";
import { month, range } from "./constants";
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

const fetchSheetsData = async (sheetName: string) => {
  const auth = service.auth;
  const sheets = google.sheets({ version: "v4", auth });
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: service.sheetId,
    range: `${sheetName}!${range}`,
  });

  const sheetData: SheetsInformation[] = [];

  if (r) {
    const rows = r.data.values;
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
  }
  return sheetData;
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

export const sheetService = {
  init,
  computeSheetName,
  classifyTransactionsByDate,
  fetchSheetsData,
  transactionToSheet,
};
