import { BankType } from "../models";
import {
  TransactionItem,
  BncInformation,
  CustomDate,
  TangerineInformation,
} from "../common/models";

const bncDateToCustomDate = (date: string): CustomDate => {
  const year = `${date[0]}${date[1]}${date[2]}${date[3]}`;
  const month = `${date[5]}${date[6]}`;
  const day = `${date[8]}${date[9]}`;
  return { Day: day, Year: year, Month: month };
};

const bncToGeneralBank = (bncInfos: BncInformation[]) => {
  const general: TransactionItem[] = [];
  for (const bncInfo of bncInfos) {
    const debit = Number(bncInfo.Debit);
    const credit = Number(bncInfo.Credit);
    const montant = debit === 0 ? credit : -debit;
    general.push({
      Nom: bncInfo.Description,
      Montant: montant,
      Date: bncDateToCustomDate(bncInfo.Date),
    });
  }
  return general;
};

const parseBncCSV = (bncStringInfo: string[][]): BncInformation[] => {
  const bncInfo = [];
  for (const info of bncStringInfo) {
    bncInfo.push(JSON.parse(`{${info.toString()}}`));
  }
  return bncInfo;
};

const parseTangerineCSV = (
  tangerineStringInfo: string[][]
): TangerineInformation[] => {
  const tangerineInfo = [];
  for (const info of tangerineStringInfo) {
    tangerineInfo.push(JSON.parse(`{${info.toString()}}`));
  }
  return tangerineInfo;
};

const convertTangerineDate = (date: string): CustomDate => {
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const regDate = datePattern.exec(date);
  const Month = regDate[1];
  const Day = regDate[2];
  const Year = regDate[3];
  return { Day, Month, Year };
};

const tangerineToGeneralBank = (tangerineInfos: TangerineInformation[]) => {
  const general: TransactionItem[] = [];
  for (const tangerineInfo of tangerineInfos) {
    general.push({
      Nom: tangerineInfo.Nom,
      Date: convertTangerineDate(tangerineInfo.Date),
      Montant: Number(tangerineInfo.Montant),
    });
  }
  return general;
};

export const parseCSV = (
  csvStringInfo: string[][],
  bankType: BankType
): TransactionItem[] => {
  switch (bankType) {
    case BankType.BNC:
      return bncToGeneralBank(parseBncCSV(csvStringInfo));
    case BankType.TANGERINE:
      return tangerineToGeneralBank(parseTangerineCSV(csvStringInfo));
  }
};
