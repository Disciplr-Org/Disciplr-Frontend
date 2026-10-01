const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinuteOfDay(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidQuietTime(value: string): boolean {
  return toMinuteOfDay(value) !== null;
}

export function isValidQuietHoursRange(start: string, end: string): boolean {
  const startMinute = toMinuteOfDay(start);
  const endMinute = toMinuteOfDay(end);

  return (
    startMinute !== null && endMinute !== null && startMinute !== endMinute
  );
}

export function isQuietHoursActive(
  now: Date,
  start: string,
  end: string,
): boolean {
  const startMinute = toMinuteOfDay(start);
  const endMinute = toMinuteOfDay(end);

  if (startMinute === null || endMinute === null || startMinute === endMinute) {
    return false;
  }

  const currentMinute = now.getHours() * 60 + now.getMinutes();

  if (startMinute < endMinute) {
    return currentMinute >= startMinute && currentMinute < endMinute;
  }

  return currentMinute >= startMinute || currentMinute < endMinute;
}
