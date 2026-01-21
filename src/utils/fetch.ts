/**
 * Shared fetch implementation based on undici.
 */

import { fetch as undiciFetch } from 'undici';

export const fetch = undiciFetch;
