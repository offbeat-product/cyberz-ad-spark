import * as React from "react";
import { Input } from "./input";
import { Textarea } from "./textarea";

/**
 * IME(日本語入力)対応の入力ラッパ。
 *
 * 変換途中(compositionstart 〜 compositionend)は親の onChange を発火させず、
 * 確定時(compositionend)にまとめて発火する。
 * これにより controlled component の再レンダで IME 変換状態が壊れるのを防ぐ。
 */
function useIMEHandlers<E extends HTMLInputElement | HTMLTextAreaElement>(
  onChange?: React.ChangeEventHandler<E>,
) {
  const composingRef = React.useRef(false);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<E>) => {
      if (composingRef.current) return;
      onChange?.(e);
    },
    [onChange],
  );

  const handleCompositionStart = React.useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = React.useCallback(
    (e: React.CompositionEvent<E>) => {
      composingRef.current = false;
      // 確定値で onChange を発火（合成イベントを ChangeEvent として再ディスパッチ）
      onChange?.({
        ...e,
        target: e.currentTarget,
        currentTarget: e.currentTarget,
      } as unknown as React.ChangeEvent<E>);
    },
    [onChange],
  );

  return { handleChange, handleCompositionStart, handleCompositionEnd };
}

export const IMEInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ onChange, onCompositionStart, onCompositionEnd, ...props }, ref) => {
  const { handleChange, handleCompositionStart, handleCompositionEnd } =
    useIMEHandlers<HTMLInputElement>(onChange);
  return (
    <Input
      ref={ref}
      {...props}
      onChange={handleChange}
      onCompositionStart={(e) => {
        handleCompositionStart();
        onCompositionStart?.(e);
      }}
      onCompositionEnd={(e) => {
        handleCompositionEnd(e);
        onCompositionEnd?.(e);
      }}
    />
  );
});
IMEInput.displayName = "IMEInput";

export const IMETextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ onChange, onCompositionStart, onCompositionEnd, ...props }, ref) => {
  const { handleChange, handleCompositionStart, handleCompositionEnd } =
    useIMEHandlers<HTMLTextAreaElement>(onChange);
  return (
    <Textarea
      ref={ref}
      {...props}
      onChange={handleChange}
      onCompositionStart={(e) => {
        handleCompositionStart();
        onCompositionStart?.(e);
      }}
      onCompositionEnd={(e) => {
        handleCompositionEnd(e);
        onCompositionEnd?.(e);
      }}
    />
  );
});
IMETextarea.displayName = "IMETextarea";