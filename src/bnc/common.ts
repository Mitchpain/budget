import { CustomDate, Transaction } from "../common/models";
import { readCSV } from "../reader";
import { BncTransactionBase } from "./models";

const bncDateToCustomDate = (date: string): CustomDate => {
  const year = `${date[0]}${date[1]}${date[2]}${date[3]}`;
  const month = `${date[5]}${date[6]}`;
  const day = `${date[8]}${date[9]}`;
  return { Day: day, Year: year, Month: month };
};

export const convertToCSV = (fileAsString: string): string[][] => {
  const separator = ";";
  return readCSV(fileAsString, separator);
};

const bncTransactionToTransaction = (
  transaction: BncTransactionBase
): Transaction => {
  const debit = Number(transaction.Debit);
  const credit = Number(transaction.Credit);
  const montant = debit === 0 ? credit : -debit;
  return {
    Nom: transaction.Description,
    Montant: montant,
    Date: bncDateToCustomDate(transaction.Date),
  };
};

export const bncTransactionstoTransactionItems = (
  transactions: BncTransactionBase[]
): Transaction[] => {
  const general: Transaction[] = [];
  for (const transaction of transactions) {
    general.push(bncTransactionToTransaction(transaction));
  }
  return general;
};
