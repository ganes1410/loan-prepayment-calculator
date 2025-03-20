export const formatCurrency = (value: number): string => {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const numberToWords = (num: number): string => {
  if (num === 0) return "";
  if (num < 1000) return `${num}`;
  if (num < 100000) return `${(num / 1000).toFixed(1)} thousand`;
  if (num < 10000000) return `${(num / 100000).toFixed(1)} lakh`;
  return `${(num / 10000000).toFixed(1)} crore`;
};
