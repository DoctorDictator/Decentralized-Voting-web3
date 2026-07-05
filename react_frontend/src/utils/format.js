export const truncateAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimeLeft = (endTime) => {
  const now = Math.floor(Date.now() / 1000);
  if (endTime <= now) return "Ended";
  const diff = endTime - now;
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const calcPercent = (votes, total) => {
  if (total === 0) return 0;
  return (votes / total) * 100;
};

export const isExpired = (endTime) => {
  return Math.floor(Date.now() / 1000) > endTime;
};
