import * as React from "react";
import { Input } from "./input";
import { Textarea } from "./textarea";

/**
 * IME(日本語入力)対応の入力ラッパ。
 *
 * - 通常入力(英数字/Backspace/コピペ等)は通常通り onChange を発火する
 * - IME変換中(compositionstart 〜 compositionend)は onChange を抑制する
 * - compositionend で確定値を onChange として発火する
 */
export const IMEInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ onChange, onCompositionStart, onCompositionEnd, ...props }, ref) => {
  const [isComposing, setIsComposing] = React.useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      onChange={(e) => {
        if (!isComposing) onChange?.(e);
      }}
      onCompositionStart={(e) => {
        setIsComposing(true);
        onCompositionStart?.(e);
      }}
      onCompositionEnd={(e) => {
        setIsComposing(false);
        onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
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
  const [isComposing, setIsComposing] = React.useState(false);
  return (
    <Textarea
      ref={ref}
      {...props}
      onChange={(e) => {
        if (!isComposing) onChange?.(e);
      }}
      onCompositionStart={(e) => {
        setIsComposing(true);
        onCompositionStart?.(e);
      }}
      onCompositionEnd={(e) => {
        setIsComposing(false);
        onChange?.(e as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        onCompositionEnd?.(e);
      }}
    />
  );
});
IMETextarea.displayName = "IMETextarea";
