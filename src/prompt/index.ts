import * as prompts from "prompts";

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

const constructSchema = (transaction: SheetsInformation) => {
  return {
    properties: {
      wanted: {
        default: "t",
        message: `Nom: ${transaction.Nom} \n Montant: ${transaction.Montant} \n Data: ${transaction.Date}`,
      },
    },
  };
};

export const filterWantedTransactions = async (
  transactions: SheetsInformation[]
): Promise<SheetsInformation[]> => {
  const wanted: SheetsInformation[] = [];
  for (const transaction of transactions) {
    const response = await prompts([
      {
        type: "text",
        name: "wanted",
        message: `Nom: ${transaction.Nom} \n Montant: ${transaction.Montant} \n Data: ${transaction.Date}`,
        initial: "t",
      },
    ]);
    const isWanted = response.wanted === "t" ? true : false;
    if (isWanted) wanted.push(transaction);
  }
  return wanted;
};
