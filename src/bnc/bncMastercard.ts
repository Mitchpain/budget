import { Bank } from "../bank";
import { Transaction } from "../common/models";
import { bncTransactionstoTransactionItems, convertToCSV } from "./common";
import { BncMastercardTransaction } from "./models";

export class BncMastercard implements Bank {
  private transactions: Transaction[];

  constructor(fileAsString: string) {
    const csv = convertToCSV(
      fileAsString.replace(`"Numero de Carte"`, "Numero de Carte")
    );
    this.transactions = this.convertCSVToTransactions(csv);
  }

  public getTransactions = (): Transaction[] => {
    return this.transactions;
  };

  private parseCSV = (
    stringTransactions: string[][]
  ): BncMastercardTransaction[] => {
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
