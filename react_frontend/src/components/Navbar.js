import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { truncateAddress } from "../utils/format";

const Navbar = () => {
  const { account, isMember, loading, connectWallet, becomeMember } = useWeb3();
  const isCorrectNetwork = true;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/votes" className="navbar-brand">
          <span className="brand-icon">&#9670;</span>
          Decentralized Voting
        </Link>

        <div className="navbar-links">
          <Link to="/votes" className="nav-link">Votes</Link>
          <Link to="/create-vote" className="nav-link">Create</Link>
        </div>

        <div className="navbar-right">
          {!account ? (
            <button className="btn-connect" onClick={connectWallet} disabled={loading}>
              {loading ? "Loading..." : "Connect Wallet"}
            </button>
          ) : (
            <>
              {!isMember && (
                <button className="btn-join" onClick={becomeMember}>
                  Become Member
                </button>
              )}
              <span className={`network-badge ${isCorrectNetwork ? "correct" : "wrong"}`}>
                Localhost
              </span>
              <span className="address-chip" title={account}>
                {truncateAddress(account)}
              </span>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
