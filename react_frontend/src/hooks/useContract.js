import { useWeb3 } from "../context/Web3Context";

export const useContract = () => {
  const { contract, signer } = useWeb3();
  return { contract, signer };
};
