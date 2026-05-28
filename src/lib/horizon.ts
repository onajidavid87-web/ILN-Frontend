import { CONTRACT_ID, STELLAR_NETWORK } from "@/constants";

export function getHorizonBaseUrl(): string {
  return STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

export function getContractTransactionsStreamUrl(): string {
  const base = getHorizonBaseUrl();
  return `${base}/transactions?accounts=${CONTRACT_ID}&cursor=now`;
}
