import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useVotes } from "../hooks/useVotes";
import { formatTimeLeft, calcPercent, isExpired } from "../utils/format";
import VoteModal from "./VoteModal";

const VoteCard = ({ vote }) => {
  const { account, addToast } = useWeb3();
  const { vote: castVote } = useVotes();
  const [timeLeft, setTimeLeft] = useState("");
  const [showModal, setShowModal] = useState(false);
  const expired = isExpired(vote.endTime);
  const ended = expired || vote.cancelled;
  const isOwner = account && account.toLowerCase() === vote.owner.toLowerCase();
  const total = vote.totalVotes;

  useEffect(() => {
    const update = () => setTimeLeft(formatTimeLeft(vote.endTime));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [vote.endTime]);

  const handleVote = async (optionIdx) => {
    try {
      await castVote(vote.id, optionIdx);
      addToast("Vote cast successfully", "success");
    } catch (err) {
      addToast(err.message || "Vote failed", "error");
    }
  };

  const winnerIdx = (() => {
    if (!expired || total === 0) return -1;
    const max = Math.max(...vote.voteCounts);
    if (max === 0) return -1;
    const winners = vote.voteCounts.filter((v) => v === max);
    if (winners.length > 1) return -1;
    return vote.voteCounts.indexOf(max);
  })();

  return (
    <>
      <div className={`card vote-card ${ended ? "ended" : ""}`} onClick={() => setShowModal(true)}>
        <div className="vote-card-header">
          <div className="vote-card-title">{vote.description}</div>
          <div className="vote-card-badges">
            {isOwner && <span className="badge badge-owner">Owner</span>}
            {vote.cancelled && <span className="badge badge-cancelled">Cancelled</span>}
            {expired && !vote.cancelled && <span className="badge badge-ended">Ended</span>}
            {!ended && <span className="badge badge-active">Active</span>}
          </div>
        </div>

        <div className="vote-card-time">
          {vote.cancelled ? "Cancelled" : expired ? "Ended" : `${timeLeft} left`}
        </div>

        <div className="vote-card-options">
          {vote.options.slice(0, 4).map((opt, idx) => {
            const pct = calcPercent(vote.voteCounts[idx] || 0, total);
            const isWinner = idx === winnerIdx;
            return (
              <div key={idx} className="vote-option-row">
                <div className="vote-option-label">
                  <span>{opt}</span>
                  <span>{Math.round(pct)}%</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(idx);
                  }}
                >
                  {vote.hasVoted ? "Voted" : "Vote"}
                </button>
              </div>
            );
          })}
          {vote.options.length > 4 && (
            <div className="vote-more">+{vote.options.length - 4} more options</div>
          )}
        </div>
      </div>

      {showModal && <VoteModal vote={vote} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default VoteCard;
