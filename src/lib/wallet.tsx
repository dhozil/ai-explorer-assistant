import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// GenLayer Studionet configuration
export const GENLAYER_STUDIONET = {
  id: 2024,
  name: 'GenLayer Studio',
  rpcUrl: 'https://studio.genlayer.com/api',
  chainId: '0x7e8', // 2024 in hex
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  blockExplorerUrl: 'https://explorer-studio.genlayer.com',
};

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToStudionet: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected
    if (typeof window !== 'undefined' && window.ethereum) {
      checkExistingConnection();
    }
  }, []);

  const checkExistingConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.log('No existing connection');
    }
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      setIsConnecting(false);
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);

        // Try to switch to GenLayer Studionet
        const switched = await switchToStudionet();
        if (!switched) {
          setError('Please switch to GenLayer Studionet network');
        }
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const switchToStudionet = async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GENLAYER_STUDIONET.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: GENLAYER_STUDIONET.chainId,
              chainName: GENLAYER_STUDIONET.name,
              rpcUrls: [GENLAYER_STUDIONET.rpcUrl],
              nativeCurrency: GENLAYER_STUDIONET.nativeCurrency,
              blockExplorerUrls: [GENLAYER_STUDIONET.blockExplorerUrl],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add GenLayer Studionet:', addError);
          return false;
        }
      }
      console.error('Failed to switch to GenLayer Studionet:', switchError);
      return false;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
        } else {
          setAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners?.('accountsChanged');
        window.ethereum.removeAllListeners?.('chainChanged');
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        error,
        connect,
        disconnect,
        switchToStudionet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (params: any) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
  }
}
