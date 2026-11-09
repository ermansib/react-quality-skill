const ELLIPSIS = '…';

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

export function useTruncate(text: string, maxLength: number): string {
  return truncate(text, maxLength);
}
