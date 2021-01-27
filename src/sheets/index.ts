import { google } from "googleapis";
import { TransactionInfo } from "../common/models";
import { logger } from "../logger";
import authenticate from "./auth";
import { month, range } from "./constants";

let service: SheetService = { sheetId: undefined, auth: undefined };

const computeSheetName = (transaction: TransactionInfo) => {
  return `${month[Number(transaction.Date.Month) - 1]}${transaction.Date.Year}`;
};

const classifySheets = (transactions: TransactionInfo[]) => {
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
            Nom: row[0],
            Montant: Number(row[1].replace(",", ".")),
            Date: row[2],
            Details: row[3],
            Categorie: row[4],
          });
        });
      } else {
        logger.error("No data found.");
      }
    }
  }
  return sheetData;
};

export const sheetService = {
  init,
  computeSheetName,
  classifySheets,
  fetchSheetsData,
};
