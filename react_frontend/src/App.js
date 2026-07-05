import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import VotesPage from "./pages/VotesPage";
import CreateVotePage from "./pages/CreateVotePage";
import "./styles/index.css";

function App() {
  return (
    <Web3Provider>
      <Router>
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/" element={<Navigate to="/votes" replace />} />
          <Route path="/votes" element={<VotesPage />} />
          <Route path="/create-vote" element={<CreateVotePage />} />
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;
