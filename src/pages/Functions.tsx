import { useEffect, useState } from "react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FunctionSquare, Plus, Play, Trash2, Copy, Code2, Clock, Activity, RefreshCw,
} from "lucide-react";

type Fn = {
  id: string;
  name: string;
  runtime: string;
  code: string;
  timeout_ms: number;
  memory_mb: number;
  status: string;
  last_invoked_at: string | null;
  invocation_count: number;
  created_at: string;
};

type Invocation = {
  id: string;
  status: string;
  duration_ms: number | null;
  logs: string | null;
  result: unknown;
  error: string | null;
  invoked_at: string;
};

const STARTER = `// Africa Cloud function. The default export receives the request input
// and can return any JSON-serializable value.
export default async (input) => {
  console.log("invoked with", input);
  return {
    message: "hello from africa cloud",
    at: new Date().toISOString(),
    echo: input,
  };
};`;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const Functions = () => {
  const { user } = useAuth();
  const [fns, setFns] = useState<Fn[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Fn | null>(null);
  const [deleting, setDeleting] = useState<Fn | null>(null);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [running, setRunning] = useState(false);
  const [invokeInput, setInvokeInput] = useState('{\n  "name": "kenya"\n}');
  const [lastResult, setLastResult] = useState<unknown>(null);

  const [form, setForm] = useState({ name: "", code: STARTER, timeout_ms: 5000, memory_mb: 128 });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as never as { from: (t: string) => any })
      .from("functions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setFns((data ?? []) as Fn[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const loadInvocations = async (fnId: string) => {
    const { data } = await (supabase as never as { from: (t: string) => any })
      .from("function_invocations")
      .select("*")
      .eq("function_id", fnId)
      .order("invoked_at", { ascending: false })
      .limit(20);
    setInvocations((data ?? []) as Invocation[]);
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("Name is required");
    const { error } = await (supabase as never as { from: (t: string) => any })
      .from("functions")
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        code: form.code,
        timeout_ms: form.timeout_ms,
        memory_mb: form.memory_mb,
      });
    if (error) return toast.error(error.message);
    toast.success("Function created");
    setCreateOpen(false);
    setForm({ name: "", code: STARTER, timeout_ms: 5000, memory_mb: 128 });
    load();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const { error } = await (supabase as never as { from: (t: string) => any })
      .from("functions")
      .update({
        code: editing.code,
        timeout_ms: editing.timeout_ms,
        memory_mb: editing.memory_mb,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const handleInvoke = async () => {
    if (!editing) return;
    setRunning(true);
    setLastResult(null);
    let parsed: unknown = null;
    try { parsed = invokeInput ? JSON.parse(invokeInput) : null; }
    catch { setRunning(false); return toast.error("Input must be valid JSON"); }

    const { data, error } = await supabase.functions.invoke("fn-invoke", {
      body: { action: "invoke", function_id: editing.id, input: parsed },
    });
    setRunning(false);
    if (error) { toast.error(error.message); return; }
    setLastResult(data);
    toast.success(`Ran in ${(data as { duration_ms?: number })?.duration_ms ?? 0}ms`);
    loadInvocations(editing.id);
    load();
  };

  const handleDelete = async (target: Fn) => {
    const { error } = await (supabase as never as { from: (t: string) => any })
      .from("functions").delete().eq("id", target.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Function deleted");
    if (editing?.id === target.id) setEditing(null);
    load();
  };

  const publicUrl = (id: string) => `${SUPABASE_URL}/functions/v1/fn-invoke?id=${id}`;

  return (
    <ConsoleLayout
      title="Functions"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New function
          </Button>
        </>
      }
    >
      <div className="p-4 md:p-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FunctionSquare className="h-4 w-4 text-primary" /> Your functions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && fns.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No functions yet. Create one to run real serverless code on Africa Cloud.
              </p>
            )}
            {fns.map((f) => (
              <button
                key={f.id}
                onClick={() => { setEditing({ ...f }); loadInvocations(f.id); setLastResult(null); }}
                className={`w-full text-left rounded-md border px-3 py-2 transition ${
                  editing?.id === f.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{f.name}</span>
                  <Badge variant="outline" className="text-[10px]">{f.status}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{f.timeout_ms}ms</span>
                  <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{f.invocation_count} runs</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="space-y-4">
          {!editing ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                Select a function on the left, or create a new one.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" /> {editing.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleSaveEdit}>Save</Button>
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title={`Delete function "${editing.name}"?`}
                      description="This permanently removes the function and its invocation history."
                      confirmLabel="Delete"
                      onConfirm={async () => { await handleDelete(editing); }}
                    />

                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                    className="font-mono text-xs h-72"
                    spellCheck={false}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Timeout (ms)</Label>
                      <Input type="number" value={editing.timeout_ms}
                        onChange={(e) => setEditing({ ...editing, timeout_ms: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label className="text-xs">Memory (MB)</Label>
                      <Input type="number" value={editing.memory_mb}
                        onChange={(e) => setEditing({ ...editing, memory_mb: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="rounded-md bg-secondary/50 p-2 flex items-center justify-between gap-2">
                    <code className="text-[11px] truncate">{publicUrl(editing.id)}</code>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(publicUrl(editing.id));
                      toast.success("Copied");
                    }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Invoke</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-xs">Input JSON</Label>
                  <Textarea value={invokeInput} onChange={(e) => setInvokeInput(e.target.value)}
                    className="font-mono text-xs h-24" spellCheck={false} />
                  <Button size="sm" onClick={handleInvoke} disabled={running}>
                    <Play className="h-3.5 w-3.5 mr-1" />
                    {running ? "Running…" : "Run"}
                  </Button>
                  {lastResult !== null && (
                    <pre className="text-[11px] bg-secondary/50 rounded-md p-3 overflow-auto max-h-64">
                      {JSON.stringify(lastResult, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent invocations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {invocations.length === 0 && (
                    <p className="text-xs text-muted-foreground">No runs yet.</p>
                  )}
                  {invocations.map((inv) => (
                    <div key={inv.id} className="border border-border rounded-md p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant={inv.status === "success" ? "outline" : "destructive"} className="text-[10px]">
                          {inv.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(inv.invoked_at).toLocaleTimeString()} · {inv.duration_ms ?? 0}ms
                        </span>
                      </div>
                      {inv.error && <div className="mt-1 text-destructive">{inv.error}</div>}
                      {inv.logs && (
                        <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-auto">
                          {inv.logs}
                        </pre>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New function</DialogTitle>
            <DialogDescription>Runs on Africa Cloud's native edge runtime.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-function" />
            </div>
            <div>
              <Label className="text-xs">Code</Label>
              <Textarea value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="font-mono text-xs h-64" spellCheck={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Timeout (ms)</Label>
                <Input type="number" value={form.timeout_ms}
                  onChange={(e) => setForm({ ...form, timeout_ms: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Memory (MB)</Label>
                <Input type="number" value={form.memory_mb}
                  onChange={(e) => setForm({ ...form, memory_mb: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </ConsoleLayout>
  );
};

export default Functions;
