export enum ActionType {
  BUY = 'Buy',
  SELL = 'Sell',
}

export interface ParsedEntry {
  date: Date;
  tokenSymbol: string;
  token: string;
  price: number;
  fee: number;
  amountOfToken: number;
  type: ActionType;
}
