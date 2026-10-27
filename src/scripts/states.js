// src/scripts/states.js — the story objects, in morph order. Shared by the Three.js scene, the phone
// stills and the chapter director so a new model only has to be added here and to /models/manifest.json.
export const STATES = ['truck', 'computer', 'warehouse', 'canada', 'brain', 'pills', 'bot', 'handshake', 'ledger'];
export const LATTICE_INDEX = Object.fromEntries(STATES.map((name, i) => [name, i]));
