/**
 * Safe workspace saves. Many requests can load the same team at once (a payment webhook, a teammate approving, the
 * morning pull). A plain "write the whole record" lets the slower one undo the faster one's change.
 *
 * Instead: remember each loaded record as it was; on save, send only the top-level fields this request changed, on top
 * of the latest record, guarded by a version number (`_v`). If someone saved in between, reload and retry.
 */
export type Data = Record<string, unknown>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Top-level fields that differ between what was loaded and what's being saved (`_v` ignored). */
export function changedKeys(before: Data, after: Data): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  keys.delete("_v");
  keys.delete("id");
  return [...keys].filter((k) => !same(before[k], after[k]));
}

/** Apply this request's changed fields onto the latest stored record. */
export function mergeOnto(latest: Data, mine: Data, keys: string[]): Data {
  const out: Data = { ...latest };
  for (const k of keys) {
    if (mine[k] === undefined) delete out[k];
    else out[k] = mine[k];
  }
  return out;
}

/** Remembers how each loaded record looked, keyed by the object handed to the caller. */
export class Snapshots {
  private m = new WeakMap<object, string>();
  remember<T extends object>(obj: T): T { this.m.set(obj, JSON.stringify(obj)); return obj; }
  before(obj: object): Data | null { const s = this.m.get(obj); return s ? (JSON.parse(s) as Data) : null; }
}
