// Copied/adapted from client-map-generator/src/utils/hexUtils.ts
export function hexToPixel(q: number, r: number, size: number) {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x, y };
}

export function pixelToHex(x: number, y: number, size: number) {
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
    const r = ((2 / 3) * y) / size;
    return hexRound(q, r);
}

function hexRound(q: number, r: number) {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }

    return { q: rq, r: rr, s: rs };
}
