import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(tipo, dados) {
  const nome = Buffer.from(tipo);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([nome, dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function png(tamanho, pintar) {
  const cru = Buffer.alloc((tamanho * 4 + 1) * tamanho);
  for (let y = 0; y < tamanho; y += 1) {
    const linha = y * (tamanho * 4 + 1);
    cru[linha] = 0;
    for (let x = 0; x < tamanho; x += 1) {
      const [r, g, b, a] = pintar(x, y, tamanho);
      const i = linha + 1 + x * 4;
      cru[i] = r;
      cru[i + 1] = g;
      cru[i + 2] = b;
      cru[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([assinatura, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(cru)), chunk("IEND", Buffer.alloc(0))]);
}

function anel(margem) {
  return (x, y, tamanho) => {
    const centro = (tamanho - 1) / 2;
    const externo = tamanho * (0.5 - margem);
    const interno = externo - Math.max(2, tamanho * 0.045);
    const distancia = Math.hypot(x - centro, y - centro);
    if (distancia <= externo && distancia >= interno) return [231, 200, 122, 255];
    return [0, 0, 0, 255];
  };
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, anel(0.16)));
writeFileSync("public/icons/icon-512.png", png(512, anel(0.16)));
writeFileSync("public/icons/icon-maskable.png", png(512, anel(0.28)));
writeFileSync("public/icons/apple-touch-icon.png", png(180, anel(0.18)));
writeFileSync("app/icon.png", png(32, anel(0.14)));
writeFileSync("app/apple-icon.png", png(180, anel(0.18)));
