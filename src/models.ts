export interface Root {
  logFolder: string;
  sheetId: string;
}

export enum BankType {
  BNC = "bnc",
  TANGERINE = "tangerine",
  BNC_MASTERCARD = "bnc mastercard",
}
