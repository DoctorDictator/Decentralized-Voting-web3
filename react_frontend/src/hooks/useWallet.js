import { useWeb3 } from "../context/Web3Context";

export const useWallet = () => {
  const { account, network, loading, connectWallet, becomeMember, isMember } = useWeb3();
  return { account, network, loading, connectWallet, becomeMember, isMember };
};
