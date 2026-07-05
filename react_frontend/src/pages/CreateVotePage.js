import React from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import CreateVoteForm from "../components/CreateVoteForm";

const CreateVotePage = () => {
  const { account } = useWeb3();
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="page-title">Create Vote</h1>
      {!account ? (
        <div className="empty-state">
          <p>Connect your wallet to create a vote</p>
        </div>
      ) : (
        <CreateVoteForm onSuccess={() => navigate("/votes")} />
      )}
    </div>
  );
};

export default CreateVotePage;
