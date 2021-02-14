export interface BncTransactionBase {
  Date: string;
  Description: string;
  Categorie: string;
  Debit: string;
  Credit: string;
}

export interface BncTransaction extends BncTransactionBase {
  Solde: string;
}

export interface BncMastercardTransaction extends BncTransactionBase {
  Numero: string;
}
