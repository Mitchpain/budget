import { Bank } from "../bank";
import { CustomDate, Transaction } from "../common/models";
import { readCSV } from "../reader";
import { TangerineTransaction } from "./models";

export class Tangerine implements Bank {
  private transactions: Transaction[];

  public getTransactions = (): Transaction[] => {
    return this.transactions;
  };

  constructor(fileAsString: string) {
    const csv = readCSV(fileAsString, ",");
    this.transactions = this.convertCSVToTransactions(csv);
  }

  private parseCSV = (transactions: string[][]): TangerineTransaction[] => {
    const tangerineTransactions = [];
    for (const transaction of transactions) {
      tangerineTransactions.push(JSON.parse(`{${transaction.toString()}}`));
    }
    return tangerineTransactions;
  };

  private convertDate = (date: string): CustomDate => {
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const regDate = datePattern.exec(date);
    const Month = regDate[1];
    const Day = regDate[2];
    const Year = regDate[3];
    return { Day, Month, Year };
  };

  private tangerineTransactionToTransactions = (
    tangerineTransactions: TangerineTransaction[]
  ) => {
    const transactions: Transaction[] = [];
    for (const tangerineTransaction of tangerineTransactions) {
      transactions.push({
        Nom: tangerineTransaction.Nom,
        Date: this.convertDate(tangerineTransaction.Date),
        Montant: Number(tangerineTransaction.Montant),
      });
    }
    return transactions;
  };

  public convertCSVToTransactions = (csv: string[][]): Transaction[] => {
    const transactions = this.parseCSV(csv);
    return this.tangerineTransactionToTransactions(transactions);
  };
}
