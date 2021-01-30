interface SheetService {
  sheetId: string;
  auth: any;
}

interface SheetsInformation {
  Hash: string;
  Nom: string;
  Montant: number;
  Date: string;
  Details?: string;
  Categorie?: string;
}
