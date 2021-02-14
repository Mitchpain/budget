import { Bnc } from "../bnc/bnc";
import { BncMastercard } from "../bnc/bncMastercard";
import { Transaction } from "../common/models";
import { BankType } from "../models";
import { readFile } from "../reader";
import { Tangerine } from "../tangerine/tangerine";

export interface Bank {
  getTransactions(): Transaction[];
}

export class BankFactory {
  static createBank = async (csvFilePath: string): Promise<Bank> => {
    const fileAsString = await readFile(csvFilePath);
    const bankType = BankFactory.identifyBankType(fileAsString);
    switch (bankType) {
      case BankType.BNC:
        return new Bnc(fileAsString);
      case BankType.TANGERINE:
        return new Tangerine(fileAsString);
      case BankType.BNC_MASTERCARD:
        return new BncMastercard(fileAsString);
    }
  };

  static identifyBankType = (file: string): BankType => {
    if (file.indexOf(`Date de l'op�ration`) !== -1) return BankType.TANGERINE;
    else if (file.indexOf("Numero de Carte") !== -1)
      return BankType.BNC_MASTERCARD;
    return BankType.BNC;
  };
}
