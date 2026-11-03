// El hall de entrada de un edificio (se entra por la puerta de calle).
// Casilleros con números, la escalera que sube en perspectiva por la pared
// izquierda, el ascensor con su indicador de piso que cambia (y que a veces
// llega y abre), el conserje en su mesón con la radio o el diario, el diario
// mural, el felpudo, una planta y un vecino que baja con el perro o las bolsas.
import { SP, R, sprite, frames, hash2, mirror, rumble, notes, hhmm } from './casa-kit.js';
import { walls, floor, edges, ceiling, hangingLamp, sideFrame, crosses, rosette } from './casa-shell.js';
import { OBJ, FRAMES, table } from './casa-muebles.js';
import { wallClock, walker } from './casa-cuartos.js';
import * as P from './casa-gente.js';

// el conserje sentado detrás del mesón: leyendo el diario o con la radio
const DOORMAN = frames(R`
    .-.
   (· ·)
  __)-(__
 /  |:|  \
/___|:|___\
--
    .-.
  _(· ·)_
 |:::::::|
 |:::::::|
 |_______|`);

// vecino bajando con un perro
const NEIGHBOR_DOG = {
  M: frames(R`
   .-.
  (·  )
   )-(
  .' ª.
 /|:::|
/ |:::|
' |___|
   / \
  /   \  __
 /     \(  )o
'-     ' ¨¨ ¨
--
   .-.
  (·  )
   )-(
  .' ª.
 /|:::|
/ |:::|
' |___|
   | |
   | |   __
   | |  (  )o
   '-'-  ¨ ¨¨`),
  S: frames(R`
  _
 (_)
 /|\
' | '  _
 / \  ( )o
/   \ ¨ ¨
--
  _
 (_)
 /|\
' | '  _
  |   ( )o
  |\  ¨¨`),
};

export function lobby(K) {
  const { g, b, E, cols, Z, night } = K;
  const zone = K.zone;
  // la caja: zócalo alto de mármol, piso de damero o baldosas
  walls(K, zone === 'antiguo' ? 'papel' : zone === 'centro' ? 'hormigon' : 'puntos', { wainscot: zone === 'antiguo', cornice: zone === 'antiguo' });
  floor(K, zone === 'barrio' ? 'baldosa' : zone === 'antiguo' ? 'damero' : 'cemento', K.seed);
  ceiling(K, zone === 'antiguo' ? 'moldura' : zone === 'centro' ? 'spots' : 'liso');
  edges(K);
  const bw = b.x1 - b.x0;
  const zb = Z - 0.004;

  // --- el ascensor, a la derecha del fondo -------------------------------------
  const ex = Math.round(b.x0 + bw * (K.narrow ? 0.72 : 0.74));
  const ew = Math.max(8, Math.round(bw * (K.narrow ? 0.34 : 0.18)));
  const e0 = ex - Math.round(ew / 2);
  const e1 = e0 + ew;
  const et = Math.round(K.sy(2.25, Z));
  const ebt = Math.round(K.sy(0, Z)) - 1;
  const cage = zone === 'antiguo';
  K.at(Z - 0.002, () => {
    g.hline(e0 - 1, e1 + 1, et - 2, '_');
    g.vline(e0 - 1, et - 1, ebt, '|');
    g.vline(e1 + 1, et - 1, ebt, '|');
    g.hline(e0, e1, et - 1, '_');
    for (let r = et; r <= ebt; r++) for (let c = e0; c <= e1; c++) g.put(c, r, SP);
  });
  // indicador de piso arriba de la puerta
  const iy = et - 3;
  K.at(Z - 0.002, () => g.text(ex - 3, iy - 1, '.-----.'));
  const floors = K.place.floors || 8;
  // el ascensor sube y baja: cada 24 s llega a la planta baja y abre
  const elevPeriod = 24;
  const elevFloor = (t) => {
    const p = (t % elevPeriod) / elevPeriod;
    if (p < 0.4) return Math.round(1 + (floors - 1) * (p / 0.4));
    if (p < 0.55) return floors;
    if (p < 0.85) return Math.max(0, Math.round(floors * (1 - (p - 0.55) / 0.3)));
    return 0;
  };
  const doorOpen = (t) => {
    const p = (t % elevPeriod) / elevPeriod;
    if (p < 0.85) return 0;
    const q = (p - 0.85) / 0.15;
    return q < 0.2 ? q / 0.2 : q < 0.8 ? 1 : (1 - q) / 0.2;
  };
  K.anim((d, t) => {
    d.z = Z - 0.003;
    const f = elevFloor(t);
    const up = (t % elevPeriod) / elevPeriod < 0.4;
    const moving = f !== 0 && f !== floors;
    d.text(ex - 3, iy, `( ${moving ? (up ? '▲' : '▼') : ' '}${f === 0 ? 'PB' : String(f).padStart(2)} )`);
    d.text(ex - 3, iy + 1, "'-----'");
    // las puertas: se abren hacia los lados
    const o = doorOpen(t);
    const half = Math.round(ew / 2);
    const gap = Math.round(o * (half - 1));
    for (let r = et; r <= ebt; r++) {
      for (let c = e0; c <= e1; c++) {
        const k = c - e0;
        let ch = ' ';
        if (cage) {
          // reja plegable de fierro
          const inL = k < half - gap;
          const inR = k > half + gap;
          if (inL || inR) ch = (k + r) % 2 ? '/' : '\\';
          else ch = r === ebt ? '_' : ' ';
        } else {
          const inL = k <= half - gap - 1;
          const inR = k >= half + gap + 1;
          if (k === half - gap - 1 || k === half + gap + 1) ch = '|';
          else if (inL || inR) ch = r === et + 1 && (k === 2 || k === ew - 2) ? '.' : ' ';
          else ch = r === ebt ? '_' : r === ebt - 1 && gap > 2 ? '.' : ' ';
        }
        d.put(c, r, ch);
      }
    }
  });
  // botonera
  K.at(Z - 0.002, () => {
    g.text(e1 + 3, Math.round(K.sy(1.2, Z)), '[o]');
    g.text(e1 + 3, Math.round(K.sy(1.2, Z)) + 1, '[o]');
  });

  // --- los casilleros, al centro del fondo, bajo el título -------------------------
  const nb = Math.max(2, Math.min(floors, K.narrow ? 3 : 6));
  const cols4 = K.narrow ? 2 : 4;
  const bx0 = Math.round(K.vx - (cols4 * 5) / 2);
  const by0 = E + 2;
  const by1 = Math.min(Math.round(K.sy(0.9, Z)) - 1, by0 + nb * 2);
  K.at(Z - 0.002, () => {
    g.hline(bx0, bx0 + cols4 * 5, by0 - 1, '_');
    let fl = 1;
    for (let r = by0; r + 1 <= by1 && fl <= nb; r += 2, fl++) {
      for (let i = 0; i < cols4; i++) {
        const x = bx0 + i * 5;
        g.text(x, r, `|${fl}${'ABCD'[i]}.`);
        g.text(x, r + 1, '|___');
      }
      g.put(bx0 + cols4 * 5, r, '|');
      g.put(bx0 + cols4 * 5, r + 1, '|');
    }
  });
  // cartas que asoman
  K.anim((d, t) => {
    d.z = Z - 0.003;
    const k = Math.floor(t / 8);
    for (let i = 0; i < 3; i++) {
      const fl = Math.floor(hash2(k, i) * Math.min(nb, Math.floor((by1 - by0) / 2)));
      const c = Math.floor(hash2(k, i + 5) * cols4);
      d.put(bx0 + c * 5 + 3, by0 + fl * 2 + 1, '=');
    }
  });
  // arriba del título: el reloj y el letrero con el número
  wallClock(K, Math.round(K.vx), Math.round(K.sy(3.6, Z)), !K.narrow);
  K.at(Z - 0.002, () => g.text(Math.round(K.vx) - 3, Math.round(K.sy(3.0, Z)), `· ${K.place.number || 100} ·`));

  // diario mural a la izquierda del fondo
  if (!K.narrow) {
    const nx0 = Math.round(K.sx(Math.min(1.25 * K.MX, cols * 0.2), Z)) + 3;
    const nx1 = Math.min(nx0 + 20, Math.round(K.vx - 12));
    const ny0 = Math.round(K.sy(2.2, Z));
    const ny1 = Math.round(K.sy(1.2, Z));
    K.at(Z - 0.002, () => {
      g.hline(nx0, nx1, ny0 - 1, '_');
      g.vline(nx0, ny0, ny1, '|');
      g.vline(nx1, ny0, ny1, '|');
      g.hline(nx0 + 1, nx1 - 1, ny1, '_');
      g.text(nx0 + 2, ny0, 'AVISOS');
      const notes2 = ['[se vende bici]', '[gato perdido]', '[asamblea 20h]', '[clases piano]', '[gasfiter]'];
      let y = ny0 + 1;
      for (let i = 0; i < notes2.length && y < ny1; i++, y++) {
        const s = notes2[(i + K.seed) % notes2.length];
        g.text(nx0 + 2 + (i % 2) * 2, y, s.slice(0, nx1 - nx0 - 3 - (i % 2) * 2));
      }
    });
  }

  // --- la escalera que sube por la pared izquierda ------------------------------------
  const steps = 12;
  const sz0 = K.zf(0.12);
  const sz1 = K.zf(0.95);
  const sW = Math.min(1.25 * K.MX, cols * 0.2);
  const rise = 0.19;
  const stepZ = (sz1 - sz0) / steps;
  for (let i = steps - 1; i >= 0; i--) {
    const z0 = sz0 + i * stepZ;
    K.box(0, sW, (i + 1) * rise, z0, z0 + stepZ, {
      front: (c, r, u, v) => (v < 0.2 ? SP : (c + r) % 4 === 0 ? '.' : SP),
      side: (c, r, u, h) => (crosses(K, r, K.zAtCol(sW, c), rise, 0) ? '_' : SP),
    });
  }
  // baranda: pasamanos y barrotes
  const railH = 0.95;
  K.line3(sW, rise + railH, sz0 - 0.005, sW, steps * rise + railH, sz1 - 0.01);
  for (let i = 0; i < steps; i += 1) {
    const z = sz0 + (i + 0.5) * stepZ;
    const top = (i + 1) * rise + railH;
    const c = Math.round(K.sx(sW, z));
    K.at(z - 0.004, (gg) => gg.vline(c, Math.round(K.sy(top, z)) + 1, Math.round(K.sy((i + 1) * rise, z)) - 1, i % 3 === 0 ? '|' : ':'));
  }
  // el pilar del arranque con su bola
  const pc = Math.round(K.sx(sW, sz0 - 0.01));
  K.at(sz0 - 0.012, (gg) => {
    gg.vline(pc, Math.round(K.sy(rise + railH, sz0)), Math.round(K.sy(0, sz0)) - 1, '|');
    gg.put(pc, Math.round(K.sy(rise + railH, sz0)) - 1, 'o');
  });

  // --- el mesón del conserje, adelante a la derecha ---------------------------------------
  const cz0 = K.zf(0.2);
  const cX1 = cols - K.MX * 0.25;
  const cX0 = cX1 - Math.min(1.5 * K.MX, cols * 0.24);
  const desk = K.box(cX0, cX1, 1.05, cz0, cz0 + Math.min(K.dz(0.5), (Z - 1) * 0.18), {
    front: (c, r, u, v) => (v < 0.12 ? SP : Math.round(u * 8) % 2 === 0 && v > 0.25 ? ':' : SP),
    top: () => SP,
  });
  const dmz = cz0 + Math.min(K.dz(0.7), (Z - 1) * 0.26);
  const dmX = (cX0 + cX1) / 2;
  const dm = K.spot(DOORMAN[0], dmX, dmz, 0.9);
  const radio = K.spot(OBJ.radio, cX0 + (cX1 - cX0) * 0.8, cz0 + 0.004, 1.05);
  K.at(cz0 + 0.003, (gg) => {
    gg.blit(OBJ.radio, radio.x, radio.y);
    gg.blit(OBJ.phone, Math.round(K.sx(cX0 + (cX1 - cX0) * 0.15, cz0)), Math.round(K.sy(1.05, cz0)) - 1);
  });
  const withRadio = K.h(41) < 0.5;
  K.anim((d, t) => {
    const k = withRadio ? 0 : Math.floor(t / 4) % 2;
    d.blit(DOORMAN[k], dm.x, dm.y, dmz);
    if (withRadio) {
      d.z = cz0;
      notes(d, radio.x + 4, radio.y - 1, t, 3, 5, 4);
    }
  });
  // tablero con llaves en la pared derecha, detrás del conserje
  sideFrame(K, 1, K.zf(0.35), K.zf(0.5), 1.5, 2.2, 'afiche');
  K.side(cols, K.zf(0.36), K.zf(0.49), 1.55, 2.15, (c, r) => ((c + r) % 2 ? 'o' : SP));
  // espejo, extintor, citófono
  sideFrame(K, 1, K.zf(0.6), K.zf(0.8), 1.0, 2.6, 'espejo');
  K.stand(sprite(R`
 _
[_]
| |
|_|`), cols - K.MX * 0.18, K.zf(0.9), 0.6);
  // planta en el rincón y felpudo adelante
  K.stand(OBJ.palm, K.Xat(b.x1 - 3, zb - 0.02), zb - 0.02);
  K.stand(OBJ.plantL, cols * 0.58, K.zf(0.08));
  const mz = K.zf(0.06);
  const mat = ' BIENVENIDOS ';
  const mr = Math.min(K.rows - 4, Math.round(K.sy(0, mz)) - 1);
  const mc = Math.round(K.vx - mat.length / 2);
  K.at(mz, (gg) => {
    gg.text(mc - 1, mr - 1, '_'.repeat(mat.length + 2));
    gg.text(mc - 1, mr, '/' + mat + '\\');
  });
  // lámpara colgante (araña en el antiguo, globo en los otros)
  if (zone === 'antiguo') rosette(K, K.vx, K.zf(0.5));
  hangingLamp(K, K.vx, K.zf(0.5), zone === 'antiguo' ? 2.0 : 1.4, zone === 'antiguo' ? 'arana' : zone === 'centro' ? 'campana' : 'globo', { reach: 4 });

  // --- la gente: un vecino baja la escalera con el perro o con bolsas --------------------------
  const per = 21;
  const dogs = K.h(42) < 0.5;
  K.anim((d, t) => {
    const p = ((t + 4) % per) / per;
    if (p > 0.7) return;
    // baja por la escalera (0..0.45) y cruza hacia la puerta (0.45..0.7)
    let z;
    let h;
    let x;
    let dir = 1;
    if (p < 0.45) {
      const q = p / 0.45;
      const step = Math.floor((1 - q) * steps);
      z = sz0 + (step + 0.5) * stepZ;
      h = (step + 1) * rise;
      x = K.sx(sW * 0.5, z);
    } else {
      const q = (p - 0.45) / 0.25;
      z = sz0 - 0.02;
      h = 0;
      x = K.sx(sW * 0.5, z) + q * cols * 0.35;
    }
    const set = dogs ? NEIGHBOR_DOG : P.WALK_BAG;
    const fr = P.tier(K, z, set.M && set.S ? set : { M: set.M });
    const s = (dir > 0 ? fr : fr.map(mirror))[Math.floor(t * 3) % fr.length];
    d.blit(s, Math.round(x - s.w / 2), Math.round(K.sy(h, z)) - s.h, z - 0.006);
  });
  // y cuando el ascensor abre, sale alguien
  const ez = Z - 0.03;
  K.anim((d, t) => {
    const o = doorOpen(t);
    if (o < 0.6) return;
    const fr = P.tier(K, ez, P.STAND);
    d.blit(fr[0], ex - Math.floor(fr[0].w / 2), ebt + 1 - fr[0].h, ez);
  });
  // de noche, la luz de la escalera con temporizador se apaga y se prende
  if (night) {
    K.anim((d, t) => {
      if ((t % 30) < 26) return;
      d.z = 0.6;
      for (let r = 2; r < K.rows - 2; r++) for (let c = 0; c < Math.round(K.sx(sW, K.zf(0.5))); c++) if ((c + r) % 2) d.put(c, r, ' ');
    });
  }
  void hhmm;
  void rumble;
  void table;
  void FRAMES;
  void walker;
}
