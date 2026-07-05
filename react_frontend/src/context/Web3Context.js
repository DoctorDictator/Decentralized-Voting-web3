import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import contractData from "../abi/Voting.json";

const Web3Context = createContext(null);

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkMember = useCallback(async (contract, address) => {
    try {
      const result = await contract.members(address);
      setIsMember(result);
    } catch {
      setIsMember(false);
    }
  }, []);

  const initContract = useCallback(async (provider) => {
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractData.address, contractData.abi, signer);
    setSigner(signer);
    setContract(contract);
    return { signer, contract };
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      addToast("Please install MetaMask", "error");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setNetwork(network);
      setAccount(accounts[0]);
      const { contract } = await initContract(provider);
      await checkMember(contract, accounts[0]);
      addToast("Wallet connected", "success");
    } catch (err) {
      addToast(err.message || "Failed to connect", "error");
    }
  }, [initContract, checkMember, addToast]);

  const becomeMember = useCallback(async () => {
    if (!contract) return;
    try {
      const tx = await contract.join();
      addToast("Joining...", "pending");
      await tx.wait();
      setIsMember(true);
      addToast("You are now a member", "success");
    } catch (err) {
      addToast(err.message || "Failed to join", "error");
    }
  }, [contract, addToast]);

  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false);
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    provider.send("eth_accounts", []).then(async (accounts) => {
      if (accounts.length > 0) {
        const network = await provider.getNetwork();
        setNetwork(network);
        setAccount(accounts[0]);
        const { contract } = await initContract(provider);
        await checkMember(contract, accounts[0]);
      }
      setLoading(false);
    });

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setContract(null);
        setIsMember(false);
        return;
      }
      setAccount(accounts[0]);
      const { contract } = await initContract(provider);
      await checkMember(contract, accounts[0]);
    };

    const handleChainChanged = async () => {
      const network = await provider.getNetwork();
      setNetwork(network);
      if (account) {
        const { contract } = await initContract(provider);
        await checkMember(contract, account);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [initContract, checkMember, account]);

  return (
    <Web3Context.Provider
      value={{
        account,
        signer,
        contract,
        isMember,
        network,
        loading,
        toasts,
        connectWallet,
        becomeMember,
        addToast,
        removeToast,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
