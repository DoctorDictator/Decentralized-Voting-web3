import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export const useVotes = () => {
  const { contract, account } = useWeb3();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseMetadata = useCallback(async (uri) => {
    if (!uri) return { description: "No description", options: [] };
    try {
      if (uri.startsWith("data:")) {
        const base64 = uri.split(",")[1];
        const json = atob(base64);
        return JSON.parse(json);
      }
      const resp = await fetch(uri);
      return await resp.json();
    } catch {
      return { description: uri.slice(0, 50), options: [] };
    }
  }, []);

  const fetchVotes = useCallback(async () => {
    if (!contract) return;
    try {
      const count = (await contract.getVoteCount()).toNumber();
      const results = [];

      for (let i = 0; i < count; i++) {
        const voteData = await contract.getVote(i);
        const hasVoted = account ? await contract.didVote(account, i) : false;

        const metadata = await parseMetadata(voteData.uri);
        results.push({
          id: i,
          uri: voteData.uri,
          owner: voteData.owner,
          endTime: voteData.endTime.toNumber(),
          quorum: voteData.quorum.toNumber(),
          cancelled: voteData.cancelled,
          totalVotes: voteData.totalVotes.toNumber(),
          voteCounts: voteData.voteCounts.map((v) => v.toNumber()),
          options: metadata.options || [],
          description: metadata.description || `Vote #${i}`,
          hasVoted,
        });
      }

      setVotes(results);
    } catch (err) {
      console.error("Failed to fetch votes:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, account, parseMetadata]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    if (!contract) return;

    const handleVoteCreated = async () => {
      await fetchVotes();
    };

    const handleVoted = async () => {
      await fetchVotes();
    };

    contract.on("VoteCreated", handleVoteCreated);
    contract.on("Voted", handleVoted);

    return () => {
      contract.off("VoteCreated", handleVoteCreated);
      contract.off("Voted", handleVoted);
    };
  }, [contract, fetchVotes]);

  const vote = useCallback(async (voteId, option) => {
    if (!contract) return;
    const tx = await contract.vote(voteId, option);
    await tx.wait();
    await fetchVotes();
  }, [contract, fetchVotes]);

  const cancelVote = useCallback(async (voteId) => {
    if (!contract) return;
    const tx = await contract.cancelVote(voteId);
    await tx.wait();
    await fetchVotes();
  }, [contract, fetchVotes]);

  return { votes, loading, vote, cancelVote, refetch: fetchVotes };
};
