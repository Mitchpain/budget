import { Classes } from "../classification/classes";

export interface BncInformation {
  Date: string;
  Description: string;
  Categorie: string;
  Debit: string;
  Credit: string;
  Solde: string;
}

export interface TangerineInformation {
  Date: string;
  Transaction: string;
  Nom: string;
  Description: string;
  Montant: string;
}

export interface BankInformation {
  Date: CustomDate;
  Montant: number;
  Nom: string;
  Categorie?: Classes;
}

export interface CustomDate {
  Month: string;
  Day: string;
  Year: string;
}
