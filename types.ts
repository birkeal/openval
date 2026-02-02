
export interface Round {
  id: string;
  name: string;
  date: string;
  investmentAmount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  userOwnershipPercentage: number;
  userValue: number;
  isInitial?: boolean;
}

export interface InitialData {
  companyValuation: number;
  userOwnershipPercentage: number;
}

export interface AppState {
  initialData: InitialData | null;
  rounds: Round[];
  isDarkMode: boolean;
}
