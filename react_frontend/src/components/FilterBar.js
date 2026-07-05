import React from "react";

const FilterBar = ({ filter, setFilter, search, setSearch, sort, setSort }) => {
  return (
    <div className="filter-bar">
      <div className="filter-tabs">
        {["All", "Active", "Ended"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <input
        className="filter-search"
        type="text"
        placeholder="Search votes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="most-votes">Most Votes</option>
      </select>
    </div>
  );
};

export default FilterBar;
