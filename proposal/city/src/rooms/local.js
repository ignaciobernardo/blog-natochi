// Interior de un local: se entra por la puerta, así que se ve el local de
// frente, con el mesón y el vendedor detrás, la mercadería en la pared del
// fondo y en las paredes de los costados, y clientes que entran desde atrás de
// la cámara, piden algo y se van.
//
// Cada tipo de local tiene su plano en local-comida.js, local-tiendas.js o
// local-oficios.js; las piezas comunes están en local-kit.js y la gente en
// local-gente.js.
import { crearCtx, cerrar } from './local-kit.js';
import { COMIDA, generico } from './local-comida.js';
import { TIENDAS } from './local-tiendas.js';
import { OFICIOS } from './local-oficios.js';

const PLANOS = { ...COMIDA, ...TIENDAS, ...OFICIOS };

export function buildShop(room, place, target, night, rng) {
  const shop = place.shop || { name: 'ALMACÉN', goods: ['[] ()', '[][]'] };
  room.name = shop.name;
  room.sub = `${place.street} ${place.number}`;
  const ctx = crearCtx(room, { ...place, shop }, night, rng);
  const plano = PLANOS[shop.name] || generico;
  plano(ctx);
  return cerrar(ctx);
}
