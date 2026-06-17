export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    very_low: 'risk-very_low',
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    very_high: 'risk-very_high',
  };
  return colors[level] || 'risk-medium';
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return '#00ff88';
  if (score >= 60) return '#00f5ff';
  if (score >= 40) return '#ff8800';
  if (score >= 20) return '#ff00ff';
  return '#ff3366';
}
