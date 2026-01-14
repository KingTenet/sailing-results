
# Technical Notes & Known Debt

## Google Auth Library & Polyfills
We are using `google-auth-library` (via `google-spreadsheet`) on the client-side. This library is designed for Node.js environments and expects certain Node.js globals to exist.
- **Issue**: The library checks `process.stdout.isTTY`, which causes a crash in the browser.
- **Fix**: We polyfill `process` and `process.stdout.isTTY = false` in `index.html` and `src/polyfills.ts`.

## Client-side Service Tokens
The application uses Google Service Account tokens directly in the client to access Google Sheets.
- **Context**: This allows direct read/write access to sheets without a backend proxy.
- **Security**: Service account keys are typically server-side secrets. To mitigate risk, we do not embed keys in the source code. Keys are loaded via encoded URLs (which are practically impossible to guess or generate) and stored in LocalStorage.
