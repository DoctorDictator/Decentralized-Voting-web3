import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useContract } from "../hooks/useContract";

const CreateVoteForm = ({ onSuccess }) => {
  const { addToast } = useWeb3();
  const { contract } = useContract();
  const [description, setDescription] = useState("");
  const [optionFields, setOptionFields] = useState(["", ""]);
  const [endDate, setEndDate] = useState("");
  const [quorum, setQuorum] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (optionFields.length >= 8) return;
    setOptionFields([...optionFields, ""]);
  };

  const removeOption = (idx) => {
    if (optionFields.length <= 2) return;
    setOptionFields(optionFields.filter((_, i) => i !== idx));
  };

  const updateOption = (idx, value) => {
    const updated = [...optionFields];
    updated[idx] = value;
    setOptionFields(updated);
  };

  const buildDataUri = () => {
    const metadata = {
      description,
      options: optionFields,
    };
    const json = JSON.stringify(metadata);
    const base64 = btoa(json);
    return `data:application/json;base64,${base64}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return;
    }
    if (!description.trim()) {
      addToast("Description is required", "error");
      return;
    }
    if (optionFields.some((o) => !o.trim())) {
      addToast("All options must be filled", "error");
      return;
    }
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    if (endTimestamp <= Math.floor(Date.now() / 1000)) {
      addToast("End time must be in the future", "error");
      return;
    }

    setSubmitting(true);
    try {
      const uri = buildDataUri();
      const tx = await contract.createVote(uri, endTimestamp, optionFields.length, quorum);
      addToast("Creating vote...", "pending");
      await tx.wait();
      addToast("Vote created successfully", "success");
      setDescription("");
      setOptionFields(["", ""]);
      setEndDate("");
      setQuorum(0);
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast(err.message || "Failed to create vote", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <form className="create-vote-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          placeholder="What is this vote about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Options ({optionFields.length}/8)</label>
        {optionFields.map((opt, idx) => (
          <div key={idx} className="option-input-row">
            <input
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              required
            />
            {optionFields.length > 2 && (
              <button type="button" className="btn-icon" onClick={() => removeOption(idx)}>
                &times;
              </button>
            )}
          </div>
        ))}
        {optionFields.length < 8 && (
          <button type="button" className="btn-add-option" onClick={addOption}>
            + Add Option
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>End Date</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={minDate}
            required
          />
        </div>
        <div className="form-group">
          <label>Quorum (min votes)</label>
          <input
            type="number"
            min={0}
            value={quorum}
            onChange={(e) => setQuorum(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Creating..." : "Create Vote"}
      </button>
    </form>
  );
};

export default CreateVoteForm;
