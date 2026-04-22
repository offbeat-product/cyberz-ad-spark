import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 単一スナップショット型の Undo/Redo 履歴フック。
 *
 * - `state`: 現在の値
 * - `set(next, opts?)`:
 *     - 既定: 即時 commit（履歴に1エントリ追加）
 *     - `transient: true` → 履歴に積まずに値だけ更新（スクラブ中の中間値など）
 *     - `coalesceKey: string` → 同じキーでの連続呼び出しは 500ms 経過後に1エントリ統合
 * - `beginScrub()` / `endScrub()`: スクラブドラッグ中の値を1エントリ化
 * - `undo` / `redo` / `clear` / `replace(value)` (履歴を消さず値だけ差し替え)
 *
 * 上限: 50。古いものから順に破棄。
 */
export const HISTORY_LIMIT = 50;
const COALESCE_MS = 500;

export interface SetOptions {
  /** 履歴に積まず、現在値のみ更新する（ドラッグ中の中間値など） */
  transient?: boolean;
  /** 連続呼び出しを 500ms 統合して1エントリ化 */
  coalesceKey?: string;
}

export interface AppHistory<T> {
  state: T;
  set: (next: T | ((prev: T) => T), opts?: SetOptions) => void;
  /** 履歴を一切記録せず、値だけ置き換える（外部読み込み・初期化用） */
  replace: (next: T | ((prev: T) => T)) => void;
  beginScrub: () => void;
  endScrub: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useAppHistory<T>(initial: T): AppHistory<T> {
  const [state, setStateRaw] = useState<T>(initial);
  const stateRef = useRef<T>(initial);
  stateRef.current = state;

  // past / future stacks
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  // coalesce 管理
  const coalesceRef = useRef<{
    key: string;
    base: T; // 統合エントリの「変更前」値
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  // scrub 管理
  const scrubRef = useRef<{ base: T; active: boolean } | null>(null);

  const flushCoalesce = useCallback(() => {
    const c = coalesceRef.current;
    if (!c) return;
    if (c.timer) clearTimeout(c.timer);
    // current state と base が異なる場合のみエントリ確定
    if (!Object.is(c.base, stateRef.current)) {
      pastRef.current.push(c.base);
      if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
      futureRef.current = [];
    }
    coalesceRef.current = null;
    rerender();
  }, [rerender]);

  const pushHistoryEntry = useCallback((prev: T) => {
    pastRef.current.push(prev);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
  }, []);

  const set = useCallback<AppHistory<T>["set"]>((next, opts) => {
    const prev = stateRef.current;
    const value =
      typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    if (Object.is(value, prev)) return;

    // スクラブ中: 履歴に積まない（endScrub で確定）
    if (scrubRef.current?.active) {
      stateRef.current = value;
      setStateRaw(value);
      return;
    }

    if (opts?.transient) {
      stateRef.current = value;
      setStateRaw(value);
      return;
    }

    if (opts?.coalesceKey) {
      const key = opts.coalesceKey;
      const c = coalesceRef.current;
      if (c && c.key === key) {
        // 同じキーの継続: タイマーだけリセット
        if (c.timer) clearTimeout(c.timer);
        c.timer = setTimeout(() => flushCoalesce(), COALESCE_MS);
      } else {
        // 別キーの coalesce が走っていれば即確定してから新しい統合を開始
        if (c) flushCoalesce();
        coalesceRef.current = {
          key,
          base: prev,
          timer: setTimeout(() => flushCoalesce(), COALESCE_MS),
        };
      }
      stateRef.current = value;
      setStateRaw(value);
      return;
    }

    // 通常 commit: もし coalesce 中なら先に確定させてから新エントリ
    if (coalesceRef.current) flushCoalesce();
    pushHistoryEntry(prev);
    stateRef.current = value;
    setStateRaw(value);
    rerender();
  }, [flushCoalesce, pushHistoryEntry, rerender]);

  const replace = useCallback<AppHistory<T>["replace"]>((next) => {
    const value =
      typeof next === "function" ? (next as (p: T) => T)(stateRef.current) : next;
    stateRef.current = value;
    setStateRaw(value);
  }, []);

  const beginScrub = useCallback(() => {
    // coalesce 中なら確定
    if (coalesceRef.current) flushCoalesce();
    scrubRef.current = { base: stateRef.current, active: true };
  }, [flushCoalesce]);

  const endScrub = useCallback(() => {
    const s = scrubRef.current;
    scrubRef.current = null;
    if (!s) return;
    if (!Object.is(s.base, stateRef.current)) {
      pushHistoryEntry(s.base);
      rerender();
    }
  }, [pushHistoryEntry, rerender]);

  const undo = useCallback(() => {
    // coalesce 中なら先に確定させてから undo
    if (coalesceRef.current) flushCoalesce();
    if (scrubRef.current) {
      // 想定外：スクラブ中の undo は無視
      return;
    }
    const prev = pastRef.current.pop();
    if (prev === undefined) return;
    futureRef.current.push(stateRef.current);
    if (futureRef.current.length > HISTORY_LIMIT) futureRef.current.shift();
    stateRef.current = prev;
    setStateRaw(prev);
    rerender();
  }, [flushCoalesce, rerender]);

  const redo = useCallback(() => {
    if (coalesceRef.current) flushCoalesce();
    if (scrubRef.current) return;
    const next = futureRef.current.pop();
    if (next === undefined) return;
    pastRef.current.push(stateRef.current);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    stateRef.current = next;
    setStateRaw(next);
    rerender();
  }, [flushCoalesce, rerender]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    if (coalesceRef.current?.timer) clearTimeout(coalesceRef.current.timer);
    coalesceRef.current = null;
    scrubRef.current = null;
    rerender();
  }, [rerender]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coalesceRef.current?.timer) clearTimeout(coalesceRef.current.timer);
    };
  }, []);

  return {
    state,
    set,
    replace,
    beginScrub,
    endScrub,
    undo,
    redo,
    clear,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}