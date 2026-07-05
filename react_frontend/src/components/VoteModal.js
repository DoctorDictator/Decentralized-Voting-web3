import React from "react";
import { useWeb3 } from "../context/Web3Context";
import { useVotes } from "../hooks/useVotes";
import { calcPercent, isExpired, truncateAddress } from "../utils/format";

const VoteModal = ({ vote, onClose }) => {
  const { account, addToast } = useWeb3();
  const { vote: castVote } = useVotes();
  const expired = isExpired(vote.endTime);
  const ended = expired || vote.cancelled;
  const total = vote.totalVotes;
  const isOwner = account && account.toLowerCase() === vote.owner.toLowerCase();

  const winnerIdx = (() => {
    if (!expired || total === 0) return -1;
    const max = Math.max(...vote.voteCounts);
    if (max === 0) return -1;
    const winners = vote.voteCounts.filter((v) => v === max);
    if (winners.length > 1) return -1;
    return vote.voteCounts.indexOf(max);
  })();

  const handleVote = async (optionIdx) => {
    try {
      await castVote(vote.id, optionIdx);
      addToast("Vote cast successfully", "success");
    } catch (err) {
      addToast(err.message || "Vote failed", "error");
    }
  };

  const statusText = vote.cancelled ? "Cancelled" : expired ? "Ended" : "Active";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="modal-title">{vote.description}</h2>

        <div className="modal-meta">
          <div className="meta-row">
            <span>Status</span>
            <span className={`badge badge-${statusText.toLowerCase()}`}>{statusText}</span>
          </div>
          <div className="meta-row">
            <span>Owner</span>
            <span>{truncateAddress(vote.owner)}{isOwner ? " (You)" : ""}</span>
          </div>
          <div className="meta-row">
            <span>Quorum</span>
            <span>{vote.quorum} votes</span>
          </div>
          <div className="meta-row">
            <span>Total Votes</span>
            <span>{total}</span>
          </div>
        </div>

        <div className="modal-options">
          {vote.options.map((opt, idx) => {
            const pct = calcPercent(vote.voteCounts[idx] || 0, total);
            const isWinner = idx === winnerIdx;
            return (
              <div key={idx} className={`vote-option-row ${isWinner ? "winner-row" : ""}`}>
                <div className="vote-option-label">
                  <span>{opt}</span>
                  <span>
                    {vote.voteCounts[idx] || 0} vote{vote.voteCounts[idx] !== 1 ? "s" : ""} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${isWinner ? "winner" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  className="vote-btn"
                  disabled={ended || vote.hasVoted}
                  onClick={() => handleVote(idx)}
                >
                  {vote.hasVoted ? "Voted" : "Vote"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
