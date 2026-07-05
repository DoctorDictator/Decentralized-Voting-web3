import React from "react";

const SkeletonCard = () => (
  <div className="card skeleton-card">
    <div className="skeleton-line skeleton-title" />
    <div className="skeleton-line skeleton-text" />
    <div className="skeleton-line skeleton-bar" />
    <div className="skeleton-line skeleton-bar" />
  </div>
);

export default SkeletonCard;
