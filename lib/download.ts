// Native fallback -- this app ships as a web export, but keep imports safe everywhere.
// The real implementation is download.web.ts, which Metro picks automatically on web.
export function downloadTextFile(_filename: string, _content: string, _mimeType: string): void {
  // no-op on native
}
