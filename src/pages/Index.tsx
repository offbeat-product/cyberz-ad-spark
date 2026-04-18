import { Link } from "react-router-dom";
import { Plus, MoreHorizontal } from "lucide-react";
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
import PageHeader from "@/components/PageHeader";

type Status = "draft" | "review" | "done";

interface Project {
  id: string;
  title: string;
  media: string;
  status: Status;
  createdAt: string;
}

const projects: Project[] = [
  { id: "1", title: "転生したら最強剣士だった件 第1話", media: "ピッコマ", status: "done", createdAt: "2025-04-12" },
  { id: "2", title: "悪役令嬢ですが幸せになります 第3話", media: "コミックシーモア", status: "review", createdAt: "2025-04-15" },
  { id: "3", title: "辺境のテイマー 第2話", media: "まんが王国", status: "draft", createdAt: "2025-04-17" },
];

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-muted text-muted-foreground hover:bg-muted" },
  review: { label: "確認中", className: "bg-secondary/15 text-secondary-foreground border border-secondary/40 hover:bg-secondary/15" },
  done: { label: "完了", className: "bg-brand text-primary-foreground border-transparent hover:opacity-90" },
};

const Index = () => {
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
      <div className="p-8">
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
              {projects.map((p) => {
                const s = statusConfig[p.status];
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
      </div>
    </>
  );
};

export default Index;
