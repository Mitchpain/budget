import { parseCSV, readCSV, readJsonFile } from "./reader";
import { logger } from "./logger";
import { BankType, Root } from "./models";
import { TransactionInfo } from "./common/models";
import { sheetService } from "./sheets";

const readRoot = async () => {
  try {
    return await readJsonFile("./secret/root.json");
  } catch (err) {
    console.error(err);
  }
};

const initiallizeLogger = async (root: Root, bankType: BankType) => {
  try {
    await logger.init(bankType, root.logFolder);
  } catch (err) {
    console.error("Error while initializing the logger", err);
  }
};

const processCSV = async (bankType: BankType): Promise<TransactionInfo[]> => {
  if (process.argv[2] === undefined) logger.error("CSV path is undefined");
  const pathToCSV = process.argv[2];
  const csvString = await readCSV(pathToCSV, bankType);
  return parseCSV(csvString, bankType);
};

export const execute = async (bankType: BankType) => {
  const root = (await readRoot()) as Root;
  await initiallizeLogger(root, bankType);
  const allTransactionInfos = await processCSV(bankType);
  const sheets = sheetService.classifyTransactionsByDate(allTransactionInfos);
  await sheetService.init(root.sheetId);

  for (const sheetName in sheets) {
    const sheetOnlineDatas = await sheetService.fetchSheetsData(sheetName);
    const newTransactions = sheets[sheetName] as TransactionInfo[];
    for (const newTransaction of newTransactions) {
      const transactionAsSheet = sheetService.transactionToSheet(
        newTransaction
      );
      console.log(transactionAsSheet.Hash);
      const found = sheetOnlineDatas.filter((value, index, array) => {
        return value.Hash == transactionAsSheet.Hash;
      });
      if (found.length > 0) console.log("found", found);
    }
    /* const found = newTransactions.some((transaction) =>
      sheetOnlineDatas.filter((element, index, array) => {
        console.log(element.Montant);
        console.log(transaction.Montant);
        if (element.Montant / 2 === transaction.Montant) console.log(element);
      })
    );
    console.log(found);*/
    //  const sheetDatas = await sheetService.fetchSheetsData(sheet);
    //    console.log(sheetDatas);
    /*sheetDatas.filter((element,index,array)=>{
      if(element.Montant)
    })*/
    // sheetData.console.log(await sheetService.fetchSheetsData(sheet));
    //On transform la trasaction en SheetsInformation
    //on check si notre transaction est la, si est pas la on l'ajoute a un array
    //note le next ligne de libre
    //push la data
  }

  //Filtre la date
  //Pousse le tout sur sheet
};
