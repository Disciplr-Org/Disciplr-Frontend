export function truncateMiddle(
  value: string,
  head: number = 6,
  tail: number = 4
): string {
  if (!value) return '';
  if (value.length <= head + tail + 3) return value;
  return value.slice(0, head) + '...' + value.slice(-tail);
}
