import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFlow } from "@/contexts/CreateFlowContext";
import { useMediaMasters } from "@/hooks/useMediaMasters";

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

const CreateBasic = () => {
  const navigate = useNavigate();
  const { basic, setBasic, reset, saveAsDraft } = useCreateFlow();
  const { media: mediaMasters } = useMediaMasters();
  const hasMedia = mediaMasters.length > 0;

  const handleCancel = () => {
    reset();
    navigate("/");
  };

  const handleMediaChange = (id: string) => {
    const selected = mediaMasters.find((m) => m.id === id);
    setBasic((p) => ({ ...p, mediaId: id, media: selected?.name ?? "" }));
  };

  const handleNext = () => {
    saveAsDraft({ step: 2, silent: true });
    navigate("/create/frames");
  };

  return (
    <>
      <PageHeader title="新規作成" description="案件の基本情報を入力します" />
      <div className="p-8 max-w-3xl">
        <StepIndicator steps={steps} current={0} />

        <div className="mt-10 space-y-6 rounded-lg border border-border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="title">作品名</Label>
            <Input
              id="title"
              placeholder="例：転生したら最強剣士だった件 第1話"
              value={basic.title}
              onChange={(e) => setBasic((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>媒体</Label>
            <Select
              value={basic.mediaId}
              onValueChange={handleMediaChange}
              disabled={!hasMedia}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasMedia ? "媒体を選択" : "媒体が登録されていません"} />
              </SelectTrigger>
              <SelectContent>
                {mediaMasters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasMedia && (
              <p className="text-xs text-muted-foreground">
                媒体が登録されていません。媒体マスターから追加してください。
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyright">コピーライト表記</Label>
            <Input
              id="copyright"
              placeholder="例：©作者名／出版社"
              value={basic.copyright}
              onChange={(e) => setBasic((p) => ({ ...p, copyright: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button variant="outline" onClick={() => saveAsDraft({ step: 1 })}>
            <Save className="h-4 w-4" /> 下書き保存
          </Button>
          <Button onClick={handleNext}>次へ</Button>
        </div>
      </div>
    </>
  );
};

export default CreateBasic;
