/**
 * Sleep utility function that waits for a specified number of seconds
 * @param seconds - The number of seconds to wait
 * @returns A Promise that resolves after the specified delay
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), seconds * 1000));
}

