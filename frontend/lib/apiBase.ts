/**
 * Base URL for backend API calls.
 *
 * In development we call the Express backend directly (http://localhost:4000).
 * In production we route through Next.js rewrites so the browser only ever talks
 * to the same origin. This makes the session cookie a first-party cookie, which
 * works reliably in every browser (Chrome, Safari, Firefox, Edge, in-app browsers).
 */
export const apiBase = '/backend'
