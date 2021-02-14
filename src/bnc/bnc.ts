import { Bank } from "../bank";
import { Transaction } from "../common/models";
import { bncTransactionstoTransactionItems, convertToCSV } from "./common";
import { BncTransaction } from "./models";

export class Bnc implements Bank {
  private transactions: Transaction[];

  constructor(fileAsString: string) {
    const csv = convertToCSV(fileAsString);
    this.transactions = this.convertCSVToTransactions(csv);
  }

  public getTransactions = (): Transaction[] => {
    return this.transactions;
  };

  private parseCSV = (stringTransactions: string[][]): BncTransaction[] => {
    const bncTransaction = [];
    for (const transaction of stringTransactions) {
      bncTransaction.push(JSON.parse(`{${transaction.toString()}}`));
    }
    return bncTransaction;
  };

  public convertCSVToTransactions = (csv: string[][]): Transaction[] => {
    const bncTransactions = this.parseCSV(csv);
    return bncTransactionstoTransactionItems(bncTransactions);
  };
}
