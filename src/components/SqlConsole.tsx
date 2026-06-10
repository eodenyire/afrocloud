import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Database, Table as TableIcon } from "lucide-react";
import { databaseInfo, runDatabaseQuery, type SqlResult } from "@/lib/dbConsole";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instance: { id: string; name: string; engine: string; schema_name: string | null } | null;
}

const SAMPLE = `-- Try it out:
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO users (email) VALUES ('ada@africloud.io')
ON CONFLICT (email) DO NOTHING;

SELECT * FROM users;`;

export const SqlConsole = ({ open, onOpenChange, instance }: Props) => {
  const [sql, setSql] = useState(SAMPLE);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SqlResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [tables, setTables] = useState<{ table_name: string; row_estimate: number }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const refreshTables = async () => {
    if (!instance) return;
    setLoadingTables(true);
    try {
      const info = await databaseInfo(instance.id);
      setTables(info.tables ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (open && instance) refreshTables();
  }, [open, instance?.id]);

  const run = async () => {
    if (!instance) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setDuration(null);
    try {
      const res: any = await runDatabaseQuery(instance.id, sql);
      setDuration(res.durationMs);
      if (res.ok) {
        setResults(res.results);
        toast.success(`Ran ${res.results.length} statement(s) in ${res.durationMs} ms`);
        refreshTables();
      } else {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e?.message ?? "Query failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Database className="h-5 w-5 text-primary" />
            SQL Console — {instance?.name}
            {instance?.schema_name && (
              <Badge variant="outline" className="ml-2 font-mono text-xs">{instance.schema_name}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[200px_1fr] gap-4 max-h-[70vh]">
          {/* Schema browser */}
          <div className="border border-border rounded-lg p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tables</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshTables}>
                <RefreshCw className={`h-3 w-3 ${loadingTables ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {tables.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tables yet.</p>
            ) : (
              <ul className="space-y-1">
                {tables.map((t) => (
                  <li key={t.table_name}>
                    <button
                      onClick={() => setSql(`SELECT * FROM ${t.table_name} LIMIT 100;`)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left hover:bg-muted text-foreground"
                    >
                      <TableIcon className="h-3 w-3 text-primary" />
                      <span className="truncate font-mono">{t.table_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Editor + results */}
          <div className="flex flex-col gap-3 min-w-0">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="font-mono text-xs h-40 resize-none"
              spellCheck={false}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {duration !== null && <>Last run: {duration} ms</>}
              </span>
              <Button onClick={run} disabled={running} size="sm" className="gap-2">
                {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Run
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-auto max-h-[40vh]">
              {error && (
                <div className="p-3 text-xs font-mono text-destructive bg-destructive/5 whitespace-pre-wrap">
                  {error}
                </div>
              )}
              {!error && results && results.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">No output.</p>
              )}
              {!error && results?.map((r, i) => (
                <div key={i} className="border-b border-border last:border-b-0">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted/30 flex gap-3">
                    <span>{r.command || "OK"}</span>
                    <span>{r.rowCount} row{r.rowCount === 1 ? "" : "s"}</span>
                  </div>
                  {r.rows.length > 0 && (
                    <div className="overflow-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="bg-muted/20">
                            {r.fields.map((f) => (
                              <th key={f} className="text-left px-3 py-1.5 font-semibold text-foreground border-b border-border">{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.rows.slice(0, 200).map((row, ri) => (
                            <tr key={ri} className="border-b border-border/40">
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-1 text-muted-foreground align-top">
                                  {cell === null ? <span className="italic opacity-60">NULL</span> : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {r.rows.length > 200 && (
                        <p className="px-3 py-1.5 text-[10px] text-muted-foreground">Showing first 200 of {r.rows.length} rows.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!results && !error && (
                <p className="p-3 text-xs text-muted-foreground">Run a query to see results here.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
