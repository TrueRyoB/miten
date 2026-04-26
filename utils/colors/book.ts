export const BOOKS_COLORS: string[] = [
    "#c8e6c0", // pale green
    "#b3cce8", // sky blue
    "#e8c8a0", // wheat
    "#d4b8e0", // lavender
    "#b8dada", // pale teal
    "#e8b8b8", // rose
    "#d4e0a8", // sage
    "#e0cca8", // tan
    "#a8c8e0", // steel blue
    "#e0b8a8", // peach
    "#b8e0c8", // mint
    "#c8b8e0", // periwinkle
    "#e0d4a8", // cream
    "#a8b8d4", // slate
    "#e8d0b0", // buff
    "#b0d4b8", // seafoam
];

let pool: number[] = [];
let lastPicked: number | null = null;

function shuffleInPlace(a: number[]): void {
    for (let i = a.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [a[i], a[j]] = [a[j], a[i]];
    }
}

function refillPool(n: number): void {
    pool = [];
    for (let i = 0; i < n; i++) pool.push(i);
    shuffleInPlace(pool);
    if (n > 1 && lastPicked != null) {
        const last = n - 1;
        if (pool[last] === lastPicked) {
            for (let k = 0; k < n; k++) {
                if (pool[k] !== lastPicked) {
                    [pool[last], pool[k]] = [pool[k], pool[last]];
                    break;
                }
            }
        }
    }
}

/**
 * Picks a color using a shuffled pool (without replacement) over the full palette
 * before reshuffling. Avoids the long “same color again” runs that i.i.d.
 * `Math.random` picks can show. O(1) per call, O(n) when the pool is refilled.
 */
export function nextBookColor(): string {
    const n = BOOKS_COLORS.length;
    if (n === 0) return "#888888";
    if (pool.length === 0) refillPool(n);
    const idx = pool.pop()!;
    lastPicked = idx;
    return BOOKS_COLORS[idx];
}
