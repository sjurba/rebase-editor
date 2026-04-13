export default function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;
  let args: Parameters<T>;
  let timestamp: number;

  function later(): void {
    const last = Date.now() - timestamp;
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      func(...args);
      timeout = null;
      args = [] as unknown as Parameters<T>
    }
  }

  return function debounced(...funcArgs: Parameters<T>): void {
    args = funcArgs;
    timestamp = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
    }
  };
}
