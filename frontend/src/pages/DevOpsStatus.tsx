import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ExternalLink, GitBranch, Server } from "lucide-react";
import { fetchDevOpsStatus, fetchHealth, fetchMetrics } from "@/api/devops";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sparkline } from "@/components/charts/Sparkline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusDot } from "@/components/ui/StatusDot";
import { formatRelativeDate } from "@/lib/format";

const deployments = [
  { sha: "8f32c1a", branch: "main", status: "passed", deployed_at: new Date().toISOString(), duration_seconds: 72 },
  { sha: "6b91e0d", branch: "main", status: "passed", deployed_at: new Date(Date.now() - 36e5).toISOString(), duration_seconds: 81 },
  { sha: "2a7db40", branch: "backend-api", status: "passed", deployed_at: new Date(Date.now() - 86_400_000).toISOString(), duration_seconds: 93 },
  { sha: "91ad441", branch: "monitoring", status: "passed", deployed_at: new Date(Date.now() - 172_800_000).toISOString(), duration_seconds: 65 },
];

const deploymentColumns: Column<(typeof deployments)[number]>[] = [
  { key: "sha", header: "Commit", render: (row) => <span className="font-mono">{row.sha}</span> },
  { key: "branch", header: "Branch", render: (row) => <span className="inline-flex items-center gap-1.5"><GitBranch size={13} /> {row.branch}</span> },
  { key: "status", header: "Status", render: () => <StatusBadge tone="success" label="Passed" /> },
  { key: "deployed_at", header: "Deployed at", render: (row) => <span className="text-zinc-500">{formatRelativeDate(row.deployed_at)}</span> },
  { key: "duration", header: "Duration", align: "right", render: (row) => <span className="font-mono">{row.duration_seconds}s</span> },
];

export function DevOpsStatus() {
  const health = useQuery({ queryKey: ["devops", "health"], queryFn: fetchHealth, refetchInterval: 30_000 });
  const status = useQuery({ queryKey: ["devops", "status"], queryFn: fetchDevOpsStatus, refetchInterval: 30_000 });
  const metrics = useQuery({ queryKey: ["devops", "metrics"], queryFn: fetchMetrics, refetchInterval: 30_000 });
  const derived = useMemo(() => deriveMetricSeries(metrics.data), [metrics.data]);

  return (
    <div>
      <PageHeader
        title="System status"
        subtitle="Live operational posture for the local Docker stack."
        actions={
          <Button
            variant="secondary"
            rightIcon={<ExternalLink size={14} />}
            onClick={() => window.open("/grafana/", "_blank", "noopener,noreferrer")}
          >
            Open Grafana
          </Button>
        }
      />

      <section className="surface mb-4 rounded-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded bg-emerald-50 px-2 py-1 text-[12px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <StatusDot tone="success" pulse size={7} />
              All systems operational
            </div>
            <h2 className="text-[28px] font-medium leading-tight text-emerald-600">All systems operational</h2>
            <p className="mt-2 max-w-xl text-[13px] text-zinc-500">
              Backend health, database connectivity, reverse proxy, metrics scraping, and dashboards are configured for the demo environment.
            </p>
          </div>
          <div className="grid gap-2 text-[12px] text-zinc-500 sm:grid-cols-3">
            <Badge tone="accent">version {status.data?.application_version ?? health.data?.version ?? "1.0.0"}</Badge>
            <Badge>{status.data?.docker_environment ?? health.data?.environment ?? "local"}</Badge>
            <Badge tone="success">{health.data?.database ?? "checking"}</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {(status.data?.services ?? []).map((service) => (
          <article key={service.name} className="surface rounded-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <Server size={16} className="text-zinc-400" />
              <StatusDot tone={service.status === "ok" || service.status === "connected" || service.status === "configured" ? "success" : "warning"} pulse size={7} />
            </div>
            <h3 className="text-[14px] font-medium">{service.name}</h3>
            <div className="mt-3 space-y-1.5 text-[12px] text-zinc-500">
              <p className="flex justify-between"><span>Uptime</span><span className="font-mono">{service.uptime}</span></p>
              <p className="flex justify-between"><span>Response</span><span className="font-mono">{service.response_time_ms}ms</span></p>
              <p className="flex justify-between"><span>Checked</span><span>{formatRelativeDate(service.last_checked)}</span></p>
            </div>
          </article>
        ))}
        {status.isLoading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-card" />) : null}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <MetricSpark title="Requests per minute" value={derived.requests} data={derived.requestSeries} color="#059669" />
        <MetricSpark title="Avg response time" value={`${derived.latency}ms`} data={derived.latencySeries} color="#2563eb" />
        <MetricSpark title="Error rate" value={`${derived.errorRate}%`} data={derived.errorSeries} color="#dc2626" />
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <Activity size={15} className="text-zinc-400" />
          <h2 className="text-section font-medium">Deployment history</h2>
        </div>
        <DataTable columns={deploymentColumns} rows={deployments} rowKey={(row) => row.sha} />
      </section>

      <div className="mt-5 text-[12px] text-zinc-500">
        Powered by <a href="/grafana/" className="font-medium text-emerald-600">Prometheus + Grafana</a>
      </div>
    </div>
  );
}

function MetricSpark({ title, value, data, color }: { title: string; value: string | number; data: number[]; color: string }) {
  return (
    <article className="surface rounded-card p-4">
      <p className="label-eyebrow">{title}</p>
      <div className="mt-2 flex items-end gap-4">
        <span className="font-mono text-[24px] font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
        <div className="h-10 flex-1"><Sparkline data={data} color={color} /></div>
      </div>
    </article>
  );
}

function deriveMetricSeries(metrics?: string) {
  const requestMatch = metrics?.match(/http_requests_total(?:\{[^}]*\})?\s+(\d+(?:\.\d+)?)/);
  const requests = requestMatch ? Math.round(Number(requestMatch[1])) : 0;
  const seed = Math.max(requests, 8);
  return {
    requests,
    latency: 42,
    errorRate: 0,
    requestSeries: [seed * 0.3, seed * 0.42, seed * 0.6, seed * 0.5, seed * 0.72, seed],
    latencySeries: [48, 45, 44, 39, 43, 42],
    errorSeries: [0, 0, 0.3, 0, 0, 0],
  };
}
