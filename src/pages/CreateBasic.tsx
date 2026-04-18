import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

const mediaOptions = [
  "ピッコマ",
  "コミックシーモア",
  "MangaPlaza",
  "ヤンジャン＋",
  "Palcy",
  "コミックDAYS",
  "EbookRenta!",
  "サンデーうぇぶり",
  "まんが王国",
  "マンガPark",
];

const CreateBasic = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState("");
  const [copyright, setCopyright] = useState("");

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>媒体</Label>
            <Select value={media} onValueChange={setMedia}>
              <SelectTrigger>
                <SelectValue placeholder="媒体を選択" />
              </SelectTrigger>
              <SelectContent>
                {mediaOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyright">コピーライト表記</Label>
            <Input
              id="copyright"
              placeholder="例：©作者名／出版社"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            キャンセル
          </Button>
          <Button onClick={() => navigate("/create/frames")}>次へ</Button>
        </div>
      </div>
    </>
  );
};

export default CreateBasic;
