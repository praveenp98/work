/**
 * Captions: turn a script, an SRT file or a JSON file into lines of 3 to 5 words with a time for every word.
 * Pure functions, no Remotion imports, so the render script can use them too.
 */
export interface Word { text: string; start: number; end: number } // seconds from the start of the video
export interface Line { words: Word[]; start: number; end: number }
export interface Cue { text: string; start: number; end: number }

/** Spread a sentence over a time window. Longer words get more time. Leaves a short breath at the end. */
export function scriptToWords(text: string, start: number, end: number): Word[] {
  const tokens = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!tokens.length || end <= start) return [];
  const span = (end - start) * (tokens.length > 2 ? 0.94 : 1);
  const weight = (t: string) => t.length + 2 + (/[.,!?:]$/.test(t) ? 3 : 0);
  const total = tokens.reduce((n, t) => n + weight(t), 0);
  let at = start;
  return tokens.map((t) => {
    const d = (weight(t) / total) * span;
    const w = { text: t, start: at, end: at + d };
    at += d;
    return w;
  });
}

/** Group words into lines of `min` to `max` words, breaking early at punctuation and never leaving a 1 or 2 word tail. */
export function toLines(words: Word[], { min = 3, max = 5, maxChars = 26 }: { min?: number; max?: number; maxChars?: number } = {}): Line[] {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  const chars = (ws: Word[]) => ws.reduce((n, w) => n + w.text.length + 1, 0);
  for (const w of words) {
    if (cur.length >= max || (cur.length >= min && chars(cur) + w.text.length > maxChars)) { groups.push(cur); cur = []; }
    cur.push(w);
    if (cur.length >= min && /[.!?:]$/.test(w.text)) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  // Fix a short tail: borrow from the line before, or merge into it.
  const last = groups[groups.length - 1], prev = groups[groups.length - 2];
  if (prev && last && last.length < min) {
    if (prev.length + last.length <= max) { prev.push(...last); groups.pop(); }
    else while (last.length < min && prev.length > min) last.unshift(prev.pop() as Word);
  }
  return groups.map((ws) => ({ words: ws, start: ws[0].start, end: ws[ws.length - 1].end }));
}

const stamp = (s: string) => {
  const m = s.trim().match(/(?:(\d+):)?(\d+):(\d+)[,.](\d+)/);
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`);
};

export function parseSrt(srt: string): Cue[] {
  return srt.replace(/\r/g, "").split(/\n{2,}/).flatMap((block) => {
    const rows = block.split("\n").filter((r) => r.trim());
    const ti = rows.findIndex((r) => r.includes("-->"));
    if (ti < 0) return [];
    const [a, b] = rows[ti].split("-->");
    const text = rows.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    const start = stamp(a), end = stamp(b);
    return text && Number.isFinite(start) && Number.isFinite(end) ? [{ text, start, end }] : [];
  });
}

/** JSON captions: [{ text, start, end }] cues, or [{ word, start, end }] if you have real word timings (e.g. from Whisper). */
export function parseCaptionJson(data: unknown): { cues?: Cue[]; words?: Word[] } {
  if (!Array.isArray(data)) throw new Error("Caption JSON must be an array.");
  if (data.every((d) => typeof d?.word === "string")) return { words: data.map((d) => ({ text: String(d.word).trim(), start: Number(d.start), end: Number(d.end) })) };
  return { cues: data.map((d) => ({ text: String(d.text ?? ""), start: Number(d.start), end: Number(d.end) })) };
}

export function cuesToLines(cues: Cue[], opts?: Parameters<typeof toLines>[1]): Line[] {
  return cues.flatMap((c) => toLines(scriptToWords(c.text, c.start, c.end), opts));
}
