import * as prompts from "prompts";
import {
  CategoryCounter,
  Classes,
  TransactionCategories,
} from "../common/models";
import { SheetsInformation } from "../sheets/models";

export const promptRatio = async (defaultMig: string, defaultLau: string) => {
  const response = await prompts([
    {
      type: "number",
      name: "mig",
      message: "Total Mig?",
      initial: defaultMig,
    },
    {
      type: "number",
      name: "lau",
      message: "Total Lau?",
      initial: defaultLau,
    },
  ]);

  const mig = response.mig;
  const lau = response.lau;
  const ratio = mig / (mig + lau);
  return ratio;
};

const getMaxCategory = (categories: CategoryCounter[]): string => {
  let max = 0;
  let cat = undefined;
  for (const category of categories) {
    if (category.Count > max) {
      max = category.Count;
      cat = category.Name;
    }
  }
  return cat;
};

const getDefaultCategory = (
  transactionName: string,
  transactions: TransactionCategories[]
) => {
  for (const transaction of transactions) {
    if (transaction.Nom === transactionName) {
      return getMaxCategory(transaction.Categories);
    }
  }
  return undefined;
};

const categorize = async (
  transaction: SheetsInformation,
  categories: TransactionCategories[]
): Promise<SheetsInformation> => {
  const defaultCategory = getDefaultCategory(transaction.Nom, categories);
  const selectedCat = await promptCategory(defaultCategory);
  return { ...transaction, Categorie: selectedCat };
};

export const filterAndCategorizeWantedTransactions = async (
  transactions: SheetsInformation[],
  categories: TransactionCategories[]
): Promise<SheetsInformation[]> => {
  const wanted: SheetsInformation[] = [];
  for (const transaction of transactions) {
    const response = await prompts([
      {
        type: "text",
        name: "wanted",
        message: `Nom: ${transaction.Nom} \n Montant: ${transaction.Montant} \n Date: ${transaction.Date}`,
        initial: "t",
      },
    ]);
    const isWanted = response.wanted === "t" ? true : false;
    if (isWanted) wanted.push(await categorize(transaction, categories));
  }
  return wanted;
};

const choices = [];

for (const cat in Classes) {
  if (isNaN(cat as any)) {
    choices.push({ title: cat, value: cat });
  }
}
export const promptCategory = async (defaultCategory: string | undefined) => {
  const response = await prompts([
    {
      type: "autocomplete",
      name: "category",
      message: "A quelle categorie appartient cette transaction?",
      choices: choices,
      initial: defaultCategory ?? "",
    },
  ]);
  return response.category;
};
