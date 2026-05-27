"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isConnected, getAddress, setAllowed, signTransaction, getNetwork } from "@stellar/freighter-api";
import { NETWORK_NAME, NETWORK_PASSPHRASE } from "@/constants";
import { getWalletRoles, type WalletRole } from "@/utils/soroban";
import { useToast } from "./ToastContext";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  error: string | null;
  networkMismatch: boolean;
  roles: WalletRole[];
  rolesLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (txXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "iln_wallet_address";

function extractConnectionState(result: unknown): boolean {
  if (typeof result === "boolean") {
    return result;
  }

  if (result && typeof result === "object" && "isConnected" in result) {
    return Boolean((result as { isConnected?: unknown }).isConnected);
  }

  return false;
}

function extractNetworkName(result: unknown): string | null {
  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object" && "network" in result) {
    const network = (result as { network?: unknown }).network;
    return typeof network === "string" ? network : null;
  }

  return null;
}

function extractAllowedState(result: unknown): boolean {
  if (typeof result === "boolean") {
    return result;
  }

  if (result && typeof result === "object" && "isAllowed" in result) {
    return Boolean((result as { isAllowed?: unknown }).isAllowed);
  }

  return false;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast, updateToast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [roles, setRoles] = useState<WalletRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const checkNetwork = useCallback(async () => {
    try {
      const network = extractNetworkName(await getNetwork());
      if (network && network.toUpperCase() !== NETWORK_NAME) {
        setNetworkMismatch(true);
        return false;
      }
      setNetworkMismatch(false);
      return true;
    } catch (e) {
      console.error("Failed to get network", e);
      return false;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const installed = extractConnectionState(await isConnected());
      setIsInstalled(installed);
      
      if (installed) {
        const savedAddress = localStorage.getItem(STORAGE_KEY);
        if (savedAddress) {
          const { address } = await getAddress();
          if (address && address === savedAddress) {
            setAddress(address);
            await checkNetwork();
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error("Check connection failed", e);
    }
  }, [checkNetwork]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    let cancelled = false;

    async function detectRoles(walletAddress: string) {
      setRolesLoading(true);
      try {
        const nextRoles = await getWalletRoles(walletAddress);
        if (!cancelled) setRoles(nextRoles);
      } catch (roleError) {
        console.error("Failed to detect wallet roles", roleError);
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    }

    if (!address || networkMismatch) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }

    void detectRoles(address);

    return () => {
      cancelled = true;
    };
  }, [address, networkMismatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (address) checkNetwork();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, checkNetwork]);

  const connect = async () => {
    setError(null);
    const toastId = addToast({ type: "pending", title: "Connecting to Freighter..." });
    
    try {
      const installed = extractConnectionState(await isConnected());
      if (!installed) {
        const msg = "Freighter not installed. Please install the extension.";
        setError(msg);
        updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
        window.open("https://www.freighter.app/", "_blank");
        return;
      }

      const isAllowed = extractAllowedState(await setAllowed());
      if (isAllowed) {
        const { address, error: freighterError } = await getAddress();
        
        if (freighterError) {
          setError(freighterError);
          updateToast(toastId, { type: "error", title: "Connection Failed", message: freighterError });
          return;
        }

        if (address) {
          setAddress(address);
          localStorage.setItem(STORAGE_KEY, address);
          
          const isCorrectNetwork = await checkNetwork();
          if (!isCorrectNetwork) {
            const networkMsg = `Please switch Freighter to ${NETWORK_NAME}`;
            setError(networkMsg);
            updateToast(toastId, { type: "error", title: "Network Mismatch", message: networkMsg });
          } else {
            updateToast(toastId, { type: "success", title: "Connected", message: `Connected as ${address.substring(0, 6)}...` });
          }
        }
      } else {
        const msg = "Connection rejected by user.";
        setError(msg);
        updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
      }
    } catch (e: any) {
      console.error("Connection error:", e);
      const msg = e.message || "Connection failed";
      setError(msg);
      updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
    }
  };

  const disconnect = () => {
    setAddress(null);
    setNetworkMismatch(false);
    setError(null);
    setRoles([]);
    setRolesLoading(false);
    localStorage.removeItem(STORAGE_KEY);
    addToast({ type: "success", title: "Disconnected" });
  };

  const signTx = async (txXdr: string) => {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const msg = `Network mismatch. Please switch to ${NETWORK_NAME}`;
      addToast({ type: "error", title: "Transaction Failed", message: msg });
      throw new Error(msg);
    }
    const signed = await signTransaction(txXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    if (typeof signed === "string") {
      return signed;
    }

    if (signed.error) {
      throw new Error(String(signed.error));
    }

    if (signed.signedTxXdr) {
      return signed.signedTxXdr;
    }

    throw new Error("Freighter did not return a signed transaction.");
  };

  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        isConnected: !!address, 
        isInstalled,
        error,
        networkMismatch,
        roles,
        rolesLoading,
        connect, 
        disconnect, 
        signTx 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
