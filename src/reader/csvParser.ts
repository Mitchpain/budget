import { BncInformation } from "./models";

export const parseBncCSV = (bncStringInfo: string[][]): BncInformation[] => {
  const bncInfo = [];
  for (const info of bncStringInfo) {
    bncInfo.push(JSON.parse(`{${info.toString()}}`));
  }
  return bncInfo;
};
