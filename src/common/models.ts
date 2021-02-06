export enum Classes {
  "Investissement",
  "Paye",
  "Boni",
  "Energie",
  "Assurance",
  "Consommation",
  "Restaurant",
  "Épicerie",
  "Biens",
  "Auto",
  "Hypothèque",
  "Frais Bancaire",
  "Cadeaux",
  "Bus",
  "Croc",
  "Internet",
  "Cell",
  "Divertissement",
  "Pret etudiant",
  "Coiffeur",
  "Taxe",
  "Entretien",
  "Distribution",
  "Santé",
}

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

export interface TransactionItem {
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

export interface CategoryCounter {
  Name: string;
  Count: number;
}

export interface TransactionCategories {
  Nom: string;
  Categories: CategoryCounter[];
}
