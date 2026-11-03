export const now = () => Date.now();
export function elapsedSeconds(since, current = now()) {
  if (!Number.isSafeInteger(since) || since < 0 || !Number.isSafeInteger(current) || current < since) throw new RangeError('Invalid UTC timestamp');
  return (current - since) / 1000;
}
