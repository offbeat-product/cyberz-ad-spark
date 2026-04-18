import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Media {
  id: string;
  name: string;
  width: number;
  height: number;
  note: string;
}

const initial: Media[] = [
  { id: "1", name: "ピッコマ", width: 1080, height: 1350, note: "縦型4:5" },
  { id: "2", name: "コミックシーモア", width: 1080, height: 1080, note: "正方形" },
  { id: "3", name: "まんが王国", width: 1080, height: 1920, note: "縦型9:16" },
];

const AdminMedia = () => {
  const [media, setMedia] = useState<Media[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", width: 1080, height: 1350, note: "" });

  const handleAdd = () => {
    if (!form.name) {
      toast.error("媒体名を入力してください");
      return;
    }
    setMedia((prev) => [...prev, { id: String(Date.now()), ...form }]);
    setForm({ name: "", width: 1080, height: 1350, note: "" });
    setOpen(false);
    toast.success("媒体を追加しました");
  };

  const handleDelete = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    toast.success("媒体を削除しました");
  };

  return (
    <>
      <PageHeader
        title="媒体マスター管理"
        description="広告媒体の登録・編集を行います"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> 媒体を追加
          </Button>
        }
      />
      <div className="p-8">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>媒体名</TableHead>
                <TableHead>サイズ</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.width} × {m.height}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.note}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>媒体を追加</DialogTitle>
            <DialogDescription>新しい広告媒体を登録します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>媒体名</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：LINEマンガ"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>幅 (px)</Label>
                <Input
                  type="number"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>高さ (px)</Label>
                <Input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="例：縦型4:5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAdd}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMedia;
