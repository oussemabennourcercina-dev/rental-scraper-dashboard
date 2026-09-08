"use client";

import { useEffect, useState, useCallback } from "react";

interface Stats {
  total: number;
  withPrice: number;
  newToday: number;
  avgPrice: number | null;
  withPhone: number;
  withPhotos: number;
  serviceStatus: "active" | "inactive" | "failed" | "unknown";
  lastJob: {
    id: number;
    status: string;
    new_listings: number;
    skipped: number;
    errors: number;
    pages_scraped: number;
    started_at: string;
    finished_at: string | null;
    duration_s: number;
  } | null;
}

interface Job {
  id: number;
  status: string;
  new_listings: number;
  updated_listings: number;
  skipped: number;
  errors: number;
  pages_scraped: number;
  started_at: string;
  finished_at: string | null;
  duration_s: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-zinc-500",
  failed: "bg-red-500",
  unknown: "bg-yellow-500",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  inactive: "Arrêté",
  failed: "En erreur",
  unknown: "Inconnu",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [controlling, setControlling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/jobs"),
      ]);
      if (!statsRes.ok) throw new Error(await statsRes.text());
      const s = await statsRes.json();
      const j = await jobsRes.json();
      setStats(s);
      setJobs(j.jobs ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  async function control(action: "start" | "stop" | "restart") {
    setControlling(true);
    try {
      await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchData, 2000);
    } catch {
      /* ignore */
    } finally {
      setControlling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Connexion à la base de données...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/30 p-6">
        <p className="font-semibold text-red-400">Erreur de connexion</p>
        <p className="text-sm text-zinc-400 mt-1">{error}</p>
        <p className="text-xs text-zinc-500 mt-3">
          Vérifiez que le tunnel SSH tourne : <code className="bg-zinc-800 px-1 rounded">ssh -L 25432:localhost:15432 -N root@37.187.39.209</code>
        </p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Kleinanzeigen · Location privée · Allemagne</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[s.serviceStatus]} animate-pulse`} />
            <span className="text-sm">{STATUS_LABEL[s.serviceStatus]}</span>
          </div>
          <button
            onClick={() => control("restart")}
            disabled={controlling}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            ↺ Restart
          </button>
          {s.serviceStatus === "active" ? (
            <button
              onClick={() => control("stop")}
              disabled={controlling}
              className="px-3 py-1.5 rounded-lg text-sm bg-red-900 hover:bg-red-800 disabled:opacity-40 transition-colors"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={() => control("start")}
              disabled={controlling}
              className="px-3 py-1.5 rounded-lg text-sm bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 transition-colors"
            >
              ▶ Start
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total annonces" value={s.total.toLocaleString("fr-FR")} />
        <StatCard label="Nouvelles 24h" value={s.newToday.toLocaleString("fr-FR")} accent="emerald" />
        <StatCard label="Prix moyen" value={s.avgPrice ? `${s.avgPrice.toLocaleString("fr-FR")} €` : "—"} />
        <StatCard label="Avec téléphone" value={`${s.withPhone ?? 0}`} accent="emerald" />
        <StatCard label="Avec photos" value={`${s.withPhotos ?? 0}`} />
        <StatCard label="Sans prix" value={`${s.total - s.withPrice}`} />
      </div>

      {/* Last job summary */}
      {s.lastJob && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Dernier job</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <Kv k="Statut" v={
              <span className={s.lastJob.status === "completed" ? "text-emerald-400" : "text-yellow-400"}>
                {s.lastJob.status}
              </span>
            } />
            <Kv k="Démarré" v={fmtDate(s.lastJob.started_at)} />
            <Kv k="Durée" v={fmtDuration(s.lastJob.duration_s)} />
            <Kv k="Nouvelles" v={<span className="text-emerald-400 font-semibold">{s.lastJob.new_listings}</span>} />
            <Kv k="Skippées" v={s.lastJob.skipped} />
            <Kv k="Erreurs" v={
              <span className={s.lastJob.errors > 0 ? "text-red-400" : ""}>{s.lastJob.errors}</span>
            } />
            <Kv k="Pages" v={s.lastJob.pages_scraped} />
          </div>
        </div>
      )}

      {/* Jobs history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Historique des jobs</h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Démarré</th>
                <th className="text-left px-4 py-3">Durée</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-right px-4 py-3">Nouvelles</th>
                <th className="text-right px-4 py-3">Skippées</th>
                <th className="text-right px-4 py-3">Erreurs</th>
                <th className="text-right px-4 py-3">Pages</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-500">{job.id}</td>
                  <td className="px-4 py-3">{fmtDate(job.started_at)}</td>
                  <td className="px-4 py-3 text-zinc-400">{fmtDuration(job.duration_s)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.status === "completed"
                        ? "bg-emerald-950 text-emerald-400"
                        : job.status === "running"
                        ? "bg-blue-950 text-blue-400"
                        : "bg-red-950 text-red-400"
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-medium">{job.new_listings}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{job.skipped}</td>
                  <td className={`px-4 py-3 text-right ${job.errors > 0 ? "text-red-400" : "text-zinc-400"}`}>
                    {job.errors}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">{job.pages_scraped}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <p className="text-center text-zinc-500 py-8 text-sm">Aucun job trouvé</p>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Actualisation automatique toutes les 30s · Prochain scraping à 03:00 heure de Berlin
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${accent === "emerald" ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <span className="text-zinc-500">{k} </span>
      <span className="text-white">{v}</span>
    </div>
  );
}