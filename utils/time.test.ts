import { formatRelativeTime } from './time';

const NOW = new Date('2026-05-15T12:00:00Z').getTime();
const minutesAgo = (n: number) => NOW - n * 60 * 1000;
const hoursAgo = (n: number) => NOW - n * 60 * 60 * 1000;
const daysAgo = (n: number) => NOW - n * 24 * 60 * 60 * 1000;

describe('formatRelativeTime', () => {
  it('returns "just now" for < 60s', () => {
    expect(formatRelativeTime(NOW - 30 * 1000, NOW)).toBe('just now');
    expect(formatRelativeTime(NOW, NOW)).toBe('just now');
  });

  it('returns "Xm ago" for < 60 minutes', () => {
    expect(formatRelativeTime(minutesAgo(5), NOW)).toBe('5m ago');
    expect(formatRelativeTime(minutesAgo(59), NOW)).toBe('59m ago');
  });

  it('returns "Xh ago" for < 24 hours', () => {
    expect(formatRelativeTime(hoursAgo(3), NOW)).toBe('3h ago');
    expect(formatRelativeTime(hoursAgo(23), NOW)).toBe('23h ago');
  });

  it('returns "Xd ago" for < 7 days', () => {
    expect(formatRelativeTime(daysAgo(2), NOW)).toBe('2d ago');
    expect(formatRelativeTime(daysAgo(6), NOW)).toBe('6d ago');
  });

  it('returns absolute date for >= 7 days', () => {
    const result = formatRelativeTime(daysAgo(8), NOW);
    expect(result).toMatch(/\d{1,2} [A-Z][a-z]{2}/);
  });
});
