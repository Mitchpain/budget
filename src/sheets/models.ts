export interface SheetService {
  sheetId: string;
  auth: any;
}

export interface SheetsInformation {
  Hash: string;
  Nom: string;
  Montant: number;
  Date: string;
  Details?: string;
  Categorie?: string;
}

export enum RequestType {
  Category,
  Data,
}
