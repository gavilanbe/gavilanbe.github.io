// Cada modelo es una edición de plástico. El orden es el del catálogo (lo más reciente, primero).
//   plastic: color de la carcasa del cartucho · studio: fondo del plató · ink: tinta legible sobre `studio`
//   mat: material 3D del cartucho (stage.js) · dark: el plástico es oscuro (rótulos claros)
export const EDITIONS = {
  'fable-5.2': {model: 'Fable 5.2', name: 'Coral',        plastic: '#ff7a5c', studio: '#ffb9a3', ink: '#8f1f0c', mat: {rough: .5, coat: .25}},
  'opus-5.5':  {model: 'Opus 5.5',  name: 'Holográfico',  plastic: '#ebe4f7', studio: '#e6c3ee', ink: '#6a2a94', mat: {rough: .16, coat: 1, irid: 1}},
  'astra':     {model: 'Astra',     name: 'Fosforito',    plastic: '#b9f02a', studio: '#cdee7a', ink: '#2f5a06', mat: {rough: .3, coat: .7, glow: '#2c3d04'}},
  'fable-5.1': {model: 'Fable 5.1', name: 'Hielo',        plastic: '#9bd6f6', studio: '#b4def4', ink: '#0d5a80', mat: {rough: .1, coat: 1, opacity: .66, board: '#17506f'}},
  'fable':     {model: 'Fable 5',   name: 'Uva atómica',  plastic: '#7a4be6', studio: '#bba5f5', ink: '#43179a', mat: {rough: .12, coat: 1, opacity: .8, board: '#22104f'}, dark: true},
  'opus-4.8':  {model: 'Opus 4.8',  name: 'Oro',          plastic: '#d6a23c', studio: '#f0cb78', ink: '#6f4c08', mat: {rough: .3, coat: .6, metal: 1}},
  'opus-4.7':  {model: 'Opus 4.7',  name: 'Negro',        plastic: '#1f1e25', studio: '#b9b6c4', ink: '#1f1e25', mat: {rough: .34, coat: .6}, dark: true},
  'opus-4.6':  {model: 'Opus 4.6',  name: 'Gris clásico', plastic: '#c8c4bb', studio: '#d9d4c8', ink: '#55514a', mat: {rough: .52, coat: .1}},
};
const SPECIAL = {name: 'Edición especial', plastic: '#d8cbb3', studio: '#e2d8c4', ink: '#5e5a53', mat: {rough: .5}};
export const edition = id => EDITIONS[id] || (EDITIONS[id] = {...SPECIAL, model: id});

// Carcasas de la consola (SELECT las va cambiando).
export const SHELLS = [
  {id: 'crema',     name: 'Crema',     body: '#e7dfd0', face: '#efe9dd', pad: '#26242c', ab: '#ff5b35', dark: false},
  {id: 'tinta',     name: 'Tinta',     body: '#25232b', face: '#2e2c36', pad: '#0f0e13', ab: '#c6f432', dark: true},
  {id: 'mandarina', name: 'Mandarina', body: '#ff6a3d', face: '#ff7d55', pad: '#26242c', ab: '#f4efe4', dark: false},
  {id: 'menta',     name: 'Menta',     body: '#9fdcc0', face: '#b3e6cf', pad: '#26242c', ab: '#ff5b35', dark: false},
  {id: 'lila',      name: 'Lila',      body: '#a78df0', face: '#b7a1f5', pad: '#26242c', ab: '#c6f432', dark: false},
];

// «🧅 CEBA · La cebolla» → {emoji, label, sub}
export function splitTitle(t) {
  t = String(t);
  const m = t.match(/^(\S+)\s+(.+)$/);
  let emoji = '', rest = t;
  if (m && !/[\p{L}\p{N}]/u.test(m[1])) { emoji = m[1]; rest = m[2]; }
  const cut = rest.match(/^(.*?)\s+[·—–]\s+(.+)$/) || rest.match(/^(.*?)\s*\((.+)\)$/);
  return cut ? {emoji, label: cut[1], sub: cut[2], full: rest} : {emoji, label: rest, sub: '', full: rest};
}
