import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Plus, Save, Trash2, Info, Download, FilePlus2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  defaultParams,
  encodingLabel,
  suggestions,
  type Encoding,
  type ParamRow,
} from "@/lib/edbo-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "优化工作台 · EDBO Web" },
      {
        name: "description",
        content: "配置实验参数与优化目标，运行贝叶斯优化并获得下一批实验推荐条件。",
      },
      { property: "og:title", content: "优化工作台 · EDBO Web" },
      { property: "og:description", content: "配置参数、运行优化、获得下一批实验推荐。" },
    ],
  }),
  component: Workbench,
});

function Workbench() {
  const [params, setParams] = useState<ParamRow[]>(defaultParams);
  const [engine, setEngine] = useState("ax");
  const [objective, setObjective] = useState("single");
  const [batch, setBatch] = useState("5");
  const [rounds, setRounds] = useState("3");
  const [observed, setObserved] = useState<Record<number, string>>({});

  const update = (id: string, patch: Partial<ParamRow>) =>
    setParams((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addParam = () =>
    setParams((rows) => [
      ...rows,
      { id: `p${Date.now()}`, name: "", encoding: "numeric", values: "" },
    ]);

  const budget = Number(batch) * (Number(rounds) + 1);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">优化工作台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            配置参数空间与优化目标，运行后获得下一批实验推荐条件；回填真实结果即可继续迭代。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="num">
            评估预算 {budget}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="size-4" /> 导出 CSV
          </Button>
          <Button size="sm" onClick={() => toast.success("已提交运行：Ax 引擎，5 × 3 轮")}>
            <Play className="size-4" /> 运行优化
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* 参数配置 */}
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">参数空间</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                numeric 填区间；ohe / resolve 填逗号分隔候选值（resolve 支持 SMILES 或化合物名）
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addParam}>
              <Plus className="size-4" /> 添加参数
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {params.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 gap-2 rounded-md border border-border bg-surface/60 p-3 sm:grid-cols-[minmax(0,1fr)_170px_minmax(0,1.4fr)_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">参数名</Label>
                  <Input
                    value={p.name}
                    placeholder="例如：反应温度"
                    onChange={(e) => update(p.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">编码</Label>
                  <Select
                    value={p.encoding}
                    onValueChange={(v) => update(p.id, { encoding: v as Encoding })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(encodingLabel) as Encoding[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {encodingLabel[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {p.encoding === "numeric" ? "取值范围（下限, 上限）" : "候选取值"}
                  </Label>
                  <Input
                    className="num text-[13px]"
                    value={p.values}
                    onChange={(e) => update(p.id, { values: e.target.value })}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="删除参数"
                    onClick={() => setParams((rows) => rows.filter((r) => r.id !== p.id))}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">优化引擎</Label>
              <Select value={engine} onValueChange={setEngine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ax">Ax / BoTorch</SelectItem>
                  <SelectItem value="mnl">MNL 离散选择</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">优化目标</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">单目标 · 最大化产率</SelectItem>
                  <SelectItem value="multi">多目标 · 产率 / 成本</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">批量大小</Label>
              <Input className="num" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">迭代轮数</Label>
              <Input className="num" value={rounds} onChange={(e) => setRounds(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-accent/40 p-3 text-xs leading-relaxed text-accent-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              域规模守卫：存在离散 / resolve 参数时，评估预算（批量 ×（迭代 + 1）+ 先验条数）不得超过离散组合数，否则无法推出足够的不重复组合。
            </p>
          </div>
        </section>

        {/* 推荐结果 */}
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">下一批推荐条件</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                第 6 批 · 按采集函数（EI）降序 · 回填实测值后保存并重新推荐
              </p>
            </div>
            <Badge variant="outline" className="num">
              Ax · 单目标
            </Badge>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface/70">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>温度 °C</TableHead>
                  <TableHead>催化剂 mol%</TableHead>
                  <TableHead>时间 h</TableHead>
                  <TableHead>碱</TableHead>
                  <TableHead>溶剂</TableHead>
                  <TableHead className="text-right">预测产率</TableHead>
                  <TableHead className="w-28">实测值</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="num text-muted-foreground">{s.id}</TableCell>
                    <TableCell className="num">{s.temp}</TableCell>
                    <TableCell className="num">{s.cat}</TableCell>
                    <TableCell className="num">{s.time}</TableCell>
                    <TableCell>{s.base}</TableCell>
                    <TableCell>{s.solvent}</TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="num font-medium">{s.predicted.toFixed(1)} %</span>
                        </TooltipTrigger>
                        <TooltipContent>期望提升 EI = {s.ei.toFixed(3)}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="num h-8 text-[13px]"
                        placeholder="—"
                        value={observed[s.id] ?? (s.observed ? String(s.observed) : "")}
                        onChange={(e) => setObserved((o) => ({ ...o, [s.id]: e.target.value }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              已累计 <span className="num text-foreground">5</span> 批次 ·{" "}
              <span className="num text-foreground">30</span> 条实验 · 当前最优{" "}
              <span className="num text-foreground">81.2 %</span>
            </p>
            <Button variant="secondary" onClick={() => toast.success("已保存实测值，正在重新推荐")}>
              <Save className="size-4" /> 保存并重新推荐
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
