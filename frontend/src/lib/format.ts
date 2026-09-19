// Departure and arrival times are stored as wall-clock times with a Z suffix
// (22:30 means 10:30 PM at the boarding point), so they are always read in UTC.

const CITY_CODES: Record<string, string> = {
  bangalore: 'BLR',
  bengaluru: 'BLR',
  chennai: 'MAA',
  mumbai: 'BOM',
  delhi: 'DEL',
  hyderabad: 'HYD',
  pune: 'PNQ',
  kolkata: 'CCU',
  kochi: 'COK',
  coimbatore: 'CJB',
  mysore: 'MYS',
  mysuru: 'MYS',
  goa: 'GOI',
  madurai: 'IXM',
  vijayawada: 'VGA',
};

export const cityCode = (city?: string) => {
  if (!city) return '···';
  return CITY_CODES[city.trim().toLowerCase()] ?? city.trim().slice(0, 3).toUpperCase();
};

export const formatTime = (iso?: string) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
};

export const formatDate = (value?: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  if (!value) return '';
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
};

export const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};

export const duration = (from?: string, to?: string) => {
  if (!from || !to) return '';
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const inr = (n?: number | null) => {
  const v = Number(n ?? 0);
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return formatDate(iso, { day: 'numeric', month: 'short' });
};

export const seatTypeLabel = (t?: string) => {
  if (!t) return '';
  const map: Record<string, string> = {
    UPPER_BERTH: 'Upper berth',
    LOWER_BERTH: 'Lower berth',
    SLEEPER: 'Sleeper',
    SEATER: 'Seater',
  };
  return map[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

export const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Show only the last four characters of an ID number. Already-masked values pass through. */
export const maskId = (v?: string | null) => {
  if (!v) return '';
  // Already masked by the API (e.g. "XXXX XXXX 4821"): four or more mask characters up front.
  if (/^[X•*](?:[\sX•*]){3,}/i.test(v.trim())) return v;
  const chars = v.replace(/\s/g, '');
  if (chars.length <= 4) return chars;
  return `${'•'.repeat(chars.length - 4).replace(/(.{4})/g, '$1 ').trim()} ${chars.slice(-4)}`;
};
