import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  convergence,
  importance,
  paretoDominated,
  paretoFront,
  slice,
} from "@/lib/edbo-data";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "分析视图 · EDBO Web" },
      {
        name: "description",
        content: "查看收敛曲线、参数重要性、参数切片与多目标 Pareto 前沿等分析图表。",
      },
      { property: "og:title", content: "分析视图 · EDBO Web" },
      { property: "og:description", content: "收敛曲线、参数重要性、切片与 Pareto 前沿。" },
    ],
  }),
  component: Analysis,
});

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Analysis() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">分析视图</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            课题 EDBO-024 · 跨 5 个批次聚合的模型分析
          </p>
        </div>
        <Badge variant="outline" className="num">
          30 条实验 · 交叉验证 R² 0.91
        </Badge>
      </div>

      <Tabs defaultValue="convergence" className="mt-6">
        <TabsList>
          <TabsTrigger value="convergence">收敛</TabsTrigger>
          <TabsTrigger value="importance">参数重要性</TabsTrigger>
          <TabsTrigger value="slice">参数切片</TabsTrigger>
          <TabsTrigger value="pareto">Pareto 前沿</TabsTrigger>
        </TabsList>

        <TabsContent value="convergence" className="mt-4 grid gap-6 lg:grid-cols-2">
          <Panel title="最优值收敛" hint="每批次的最优产率与批次均值">
            <LineChart data={convergence} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="batch" {...axis} />
              <YAxis {...axis} unit="%" />
              <RTooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="best"
                name="批次最优"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="mean"
                name="批次均值"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </Panel>

          <Panel title="批次均值提升" hint="模型逐批学习后，整批实验质量的整体抬升">
            <AreaChart data={convergence} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="batch" {...axis} />
              <YAxis {...axis} unit="%" />
              <RTooltip {...tooltipStyle} />
              <Area
                type="monotone"
                dataKey="mean"
                name="批次均值"
                stroke="var(--color-chart-3)"
                fill="var(--color-chart-3)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </Panel>
        </TabsContent>

        <TabsContent value="importance" className="mt-4">
          <Panel title="参数重要性" hint="高斯过程长度尺度反推的相对影响权重（%）">
            <BarChart
              data={importance}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" {...axis} unit="%" />
              <YAxis type="category" dataKey="name" width={90} {...axis} />
              <RTooltip {...tooltipStyle} />
              <Bar dataKey="value" name="影响权重" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </Panel>
        </TabsContent>

        <TabsContent value="slice" className="mt-4">
          <Panel title="参数切片：反应温度" hint="其余参数固定在当前最优点，阴影为 95% 置信区间">
            <AreaChart data={slice} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="temp" {...axis} unit="°C" />
              <YAxis {...axis} unit="%" />
              <RTooltip {...tooltipStyle} />
              <Area
                type="monotone"
                dataKey="upper"
                name="上界"
                stroke="none"
                fill="var(--color-chart-1)"
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="lower"
                name="下界"
                stroke="none"
                fill="var(--color-background)"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="mean"
                name="预测均值"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </Panel>
        </TabsContent>

        <TabsContent value="pareto" className="mt-4">
          <Panel title="Pareto 前沿：产率 vs 成本" hint="蓝点为非支配解，灰点为被支配实验">
            <ScatterChart margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" dataKey="cost" name="成本" unit="¥" {...axis} />
              <YAxis type="number" dataKey="yield" name="产率" unit="%" {...axis} />
              <RTooltip {...tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="被支配解" data={paretoDominated} fill="var(--color-muted-foreground)" />
              <Scatter name="Pareto 前沿" data={paretoFront} fill="var(--color-chart-1)" />
            </ScatterChart>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
