import { CustomDate, Transaction } from "../common/models";
import * as hash from "object-hash";
import { BudgetItem } from "../sheets/models";

const formatNumber = (stringNumber: string) => {
  return stringNumber.length < 2 ? `0${stringNumber}` : `${stringNumber}`;
};

const formatDate = (date: CustomDate) => {
  const day = formatNumber(date.Day);
  const month = formatNumber(date.Month);
  return `${day}/${month}/${date.Year}`;
};

const fromTransaction = (transaction: Transaction, ratio?: number) => {
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

const fromRow = (row): BudgetItem => {
  return {
    Hash: row[0],
    Nom: row[1],
    Montant: Number(row[2].replace(",", ".")),
    Date: row[3],
    Details: row[4],
    Categorie: row[5],
  };
};

export const BudgetItemService = {
  fromTransaction,
  fromRow,
};
