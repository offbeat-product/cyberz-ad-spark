import { Link, useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal, Trash2, FileEdit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { useProjects } from "@/hooks/useProjects";
import { useCreateFlow } from "@/contexts/CreateFlowContext";
import { toast } from "sonner";
import { useState } from "react";

type Status = "draft" | "review" | "done";

interface SampleProject {
  id: string;
  title: string;
  media: string;
  status: Status;
  createdAt: string;
}

const sampleProjects: SampleProject[] = [
  { id: "1", title: "転生したら最強剣士だった件 第1話", media: "ピッコマ", status: "done", createdAt: "2025-04-12" },
  { id: "2", title: "悪役令嬢ですが幸せになります 第3話", media: "コミックシーモア", status: "review", createdAt: "2025-04-15" },
  { id: "3", title: "辺境のテイマー 第2話", media: "まんが王国", status: "draft", createdAt: "2025-04-17" },
];

const sampleStatusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-muted text-muted-foreground hover:bg-muted" },
  review: { label: "確認中", className: "bg-secondary/15 text-secondary-foreground border border-secondary/40 hover:bg-secondary/15" },
  done: { label: "完了", className: "bg-brand text-primary-foreground border-transparent hover:opacity-90" },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
};

const stepRoutes = ["/create", "/create/frames", "/create/export"] as const;

const Index = () => {
  const navigate = useNavigate();
  const { projects: savedProjects, deleteProject } = useProjects();
  const { loadProject } = useCreateFlow();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleOpen = (id: string, lastStep: 1 | 2 | 3) => {
    const project = loadProject(id);
    if (!project) {
      toast.error("案件を読み込めませんでした");
      return;
    }
    navigate(stepRoutes[lastStep - 1] ?? "/create");
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteProject(pendingDeleteId);
    toast.success("案件を削除しました");
    setPendingDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="案件の作成・管理を行います"
        actions={
          <Button asChild>
            <Link to="/create">
              <Plus /> 新規作成
            </Link>
          </Button>
        }
      />
      <div className="p-8 space-y-8">
        {savedProjects.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              あなたの案件（{savedProjects.length}件）
            </h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>作品名</TableHead>
                    <TableHead>媒体名</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>更新日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedProjects
                    .slice()
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                    .map((p) => {
                      const isDraft = p.status === "draft";
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell className="text-muted-foreground">{p.mediaName || "-"}</TableCell>
                          <TableCell>
                            {isDraft ? (
                              <Badge variant="outline" className="gap-1">
                                <FileEdit className="h-3 w-3" /> 下書き
                              </Badge>
                            ) : (
                              <Badge className="bg-brand text-primary-foreground border-transparent hover:opacity-90 gap-1">
                                <CheckCircle2 className="h-3 w-3" /> 書き出し済み
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(p.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpen(p.id, p.lastEditedStep)}
                            >
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingDeleteId(p.id)}
                              aria-label="削除"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">サンプル案件（開発用）</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>作品名</TableHead>
                  <TableHead>媒体名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleProjects.map((p) => {
                  const s = sampleStatusConfig[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">{p.media}</TableCell>
                      <TableCell>
                        <Badge className={s.className}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/create/frames">編集</Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この案件を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除した案件は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
