import React, { useState, useMemo } from "react";
import { useVotes } from "../hooks/useVotes";
import VoteCard from "../components/VoteCard";
import FilterBar from "../components/FilterBar";
import SkeletonCard from "../components/SkeletonCard";
import { isExpired } from "../utils/format";

const VotesPage = () => {
  const { votes, loading } = useVotes();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let result = [...votes];

    if (filter === "Active") result = result.filter((v) => !isExpired(v.endTime) && !v.cancelled);
    else if (filter === "Ended") result = result.filter((v) => isExpired(v.endTime) || v.cancelled);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) => v.description.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sort === "newest") return b.id - a.id;
      if (sort === "oldest") return a.id - b.id;
      return b.totalVotes - a.totalVotes;
    });

    return result;
  }, [votes, filter, search, sort]);

  return (
    <div className="page">
      <h1 className="page-title">Votes</h1>
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
      />

      {loading ? (
        <div className="cards-grid">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No votes found</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VotesPage;
