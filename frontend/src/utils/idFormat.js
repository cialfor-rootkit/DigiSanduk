export const formatDisplayId = (value, type = 'ID') => {
  if (value === null || value === undefined || value === '') return '--';
  const raw = String(value);
  if (raw.startsWith('DS#')) return raw;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const padded = String(Math.trunc(numeric)).padStart(3, '0');
    return `DS#${type}#${padded}`;
  }

  const match = raw.match(/\d+/);
  if (match) {
    const padded = String(match[0]).padStart(3, '0');
    return `DS#${type}#${padded}`;
  }

  return `DS#${type}#${raw}`;
};
