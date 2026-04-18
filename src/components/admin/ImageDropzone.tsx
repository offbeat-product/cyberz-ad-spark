import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const ImageDropzone = ({ value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("PNG / JPG / WebP のみ対応しています");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    readFile(e.dataTransfer.files?.[0]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors min-h-[160px] ${
        dragOver
          ? "border-transparent bg-muted/40 [background:linear-gradient(white,white)_padding-box,linear-gradient(90deg,#409EEA,#6C81FC)_border-box]"
          : "border-border bg-muted/20 hover:bg-muted/40"
      }`}
    >
      {value ? (
        <>
          <img
            src={value}
            alt="preview"
            className="max-h-28 rounded object-contain"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background shadow hover:bg-foreground"
            aria-label="画像を削除"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            クリックまたはドラッグ&ドロップで画像をアップロード
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            PNG / JPG / WebP対応
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  );
};

export default ImageDropzone;
