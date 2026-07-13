import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cloud, HardDrive, Plus, Trash2, Globe,
  RefreshCw, Lock, Unlock, FolderOpen, Upload, File, Download,
} from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  createStorageBucket,
  createStorageObject,
  deleteStorageBucket,
  deleteStorageObject,
  listStorageBuckets,
  listStorageObjects,
  updateStorageBucketStats,
} from "@/lib/controlPlane";

const STORAGE_BUCKET = "africloud";
const objectPath = (userId: string, bucketRowId: string, key: string) =>
  `${userId}/${bucketRowId}/${key.replace(/^\/+/, "")}`;

const REGIONS = [
  { value: "nairobi", label: "Nairobi, Kenya" },
  { value: "lagos", label: "Lagos, Nigeria" },
  { value: "cape-town", label: "Cape Town, South Africa" },
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "accra", label: "Accra, Ghana" },
  { value: "kigali", label: "Kigali, Rwanda" },
];

const STORAGE_CLASSES = [
  { value: "standard", label: "Standard", description: "Frequently accessed data", price: "$0.023/GB" },
  { value: "infrequent", label: "Infrequent Access", description: "Long-lived, less accessed", price: "$0.0125/GB" },
  { value: "archive", label: "Archive", description: "Rarely accessed, low cost", price: "$0.004/GB" },
];

type Bucket = {
  id: string;
  name: string;
  region: string;
  visibility: string;
  storage_class: string;
  size_bytes: number;
  object_count: number;
  status: string;
  created_at: string | null;
};

type StorageObject = {
  id: string;
  bucket_id: string;
  key: string;
  size_bytes: number;
  content_type: string;
  created_at: string | null;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const Storage = () => {
  const { user, loading } = useAuth();
  const { organization, project, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [region, setRegion] = useState("nairobi");
  const [visibility, setVisibility] = useState("private");
  const [storageClass, setStorageClass] = useState("standard");

  // Bucket detail view
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [fetchingObjects, setFetchingObjects] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadKey, setUploadKey] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchBuckets = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await listStorageBuckets(user.id);
    if (error) toast.error("Failed to load buckets");
    else setBuckets((data as Bucket[]) || []);
    setFetching(false);
  };

  const fetchObjects = async (bucketId: string) => {
    setFetchingObjects(true);
    const { data, error } = await listStorageObjects(bucketId);
    if (error) toast.error("Failed to load objects");
    else setObjects((data as StorageObject[]) || []);
    setFetchingObjects(false);
  };

  useEffect(() => {
    if (user) fetchBuckets();
  }, [user]);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Bucket name is required"); return; }
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name.trim())) {
      toast.error("Bucket name must be 3-63 chars, lowercase alphanumeric, dots, hyphens");
      return;
    }
    if (!organization?.id) {
      toast.error("Organization context missing");
      return;
    }
    setCreating(true);
    try {
      const selectedClass = STORAGE_CLASSES.find((sc) => sc.value === storageClass);
      const price = selectedClass ? parseFloat(selectedClass.price.replace(/[^\d.]/g, "")) : 0;
      await createStorageBucket(
        { userId: user!.id, orgId: organization.id, projectId: project?.id ?? null },
        {
          name: name.trim(),
          region,
          visibility,
          storage_class: storageClass,
          status: "active",
          price,
        }
      );
      toast.success("Bucket created");
      setShowCreate(false);
      setName("");
      fetchBuckets();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create bucket";
      toast.error(message.includes("duplicate") ? "Bucket name already exists" : "Failed to create bucket");
    }
    setCreating(false);
  };

  const deleteBucket = async (bucket: Bucket) => {
    try {
      if (!organization?.id || !user) throw new Error("Organization context missing");
      // Remove all storage files under this bucket's prefix first
      const prefix = `${user.id}/${bucket.id}`;
      const { data: files } = await supabase.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${prefix}/${f.name}`);
        await supabase.storage.from(STORAGE_BUCKET).remove(paths);
      }
      await deleteStorageBucket(
        { userId: user.id, orgId: organization.id, projectId: project?.id ?? null },
        bucket.id
      );
      toast.success("Bucket deleted");
      if (selectedBucket?.id === bucket.id) setSelectedBucket(null);
      fetchBuckets();
    } catch {
      toast.error("Failed to delete bucket");
    }
  };

  const handleUpload = async () => {
    if (!selectedBucket || !user) return;
    if (!uploadFile) { toast.error("Select a file to upload"); return; }
    const key = (uploadKey.trim() || uploadFile.name).replace(/^\/+/, "");
    if (!key) { toast.error("Object key is required"); return; }

    setUploading(true);
    const path = objectPath(user.id, selectedBucket.id, key);
    const contentType = uploadFile.type || "application/octet-stream";
    try {
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, uploadFile, { contentType, upsert: true });
      if (uploadErr) throw uploadErr;

      // Refresh metadata row (remove any prior entry for this key, then insert fresh)
      await supabase
        .from("storage_objects")
        .delete()
        .eq("bucket_id", selectedBucket.id)
        .eq("key", key);
      const { error: metaErr } = await createStorageObject({
        bucketId: selectedBucket.id,
        userId: user.id,
        key,
        sizeBytes: uploadFile.size,
        contentType,
      });
      if (metaErr) throw metaErr;

      await updateStorageBucketStats(selectedBucket.id, {
        objectCount: selectedBucket.object_count + 1,
        sizeBytes: selectedBucket.size_bytes + uploadFile.size,
      });
      toast.success("Object uploaded");
      setShowUpload(false);
      setUploadKey("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchObjects(selectedBucket.id);
      fetchBuckets();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload object";
      toast.error(message);
    }
    setUploading(false);
  };

  const downloadObject = async (obj: StorageObject) => {
    if (!user) return;
    try {
      const path = objectPath(user.id, obj.bucket_id, obj.key);
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, 60, { download: obj.key.split("/").pop() || obj.key });
      if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
      window.open(data.signedUrl, "_blank", "noopener");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download";
      toast.error(message);
    }
  };

  const deleteObject = async (obj: StorageObject) => {
    if (!user) return;
    try {
      const path = objectPath(user.id, obj.bucket_id, obj.key);
      const { error: rmErr } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      if (rmErr) throw rmErr;
      await deleteStorageObject(obj.id);
      if (selectedBucket) {
        await updateStorageBucketStats(selectedBucket.id, {
          objectCount: Math.max(0, selectedBucket.object_count - 1),
          sizeBytes: Math.max(0, selectedBucket.size_bytes - obj.size_bytes),
        });
      }
      toast.success("Object deleted");
      if (selectedBucket) fetchObjects(selectedBucket.id);
      fetchBuckets();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete object";
      toast.error(message);
    }
  };

  const openBucket = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    fetchObjects(bucket.id);
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <ConsoleLayout
      title="Storage"
      actions={
        !selectedBucket ? (
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Bucket
          </Button>
        ) : (
          <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Upload Object
          </Button>
        )
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Bucket Detail View */}
        {selectedBucket ? (
          <div>
            {/* Bucket info bar */}
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {selectedBucket.visibility === "public" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {selectedBucket.visibility}
              </span>
              <span>•</span>
              <span>{REGIONS.find(r => r.value === selectedBucket.region)?.label}</span>
              <span>•</span>
              <span>{formatBytes(selectedBucket.size_bytes)}</span>
              <span>•</span>
              <span>{selectedBucket.object_count} objects</span>
            </div>

            {/* Upload form */}
            {showUpload && (
              <Card className="mb-6 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" /> Upload Object
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">File</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setUploadFile(f);
                        if (f && !uploadKey.trim()) setUploadKey(f.name);
                      }}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatBytes(uploadFile.size)} · {uploadFile.type || "application/octet-stream"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Object Key (path)</label>
                    <input
                      value={uploadKey}
                      onChange={(e) => setUploadKey(e.target.value)}
                      placeholder="data/exports/report.csv"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Defaults to the file name. Use slashes for folders.</p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setShowUpload(false); setUploadFile(null); setUploadKey(""); }}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
                      {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Upload"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Objects list */}
            {objects.length === 0 && !fetchingObjects ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-foreground mb-2">Bucket is empty</h3>
                  <p className="text-sm text-muted-foreground mb-6">Upload your first object to get started.</p>
                  <Button onClick={() => setShowUpload(true)} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Object
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {objects.map((obj) => (
                  <Card key={obj.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{obj.key}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(obj.size_bytes)} · {obj.content_type}
                              {obj.created_at && ` · ${new Date(obj.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => downloadObject(obj)} title="Download">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <ConfirmDialog
                            title={`Delete object "${obj.key}"?`}
                            description="This permanently removes the object from the bucket. This action cannot be undone."
                            confirmLabel="Delete object"
                            onConfirm={() => deleteObject(obj)}
                            trigger={
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Create Bucket Form */}
            {showCreate && (
              <Card className="mb-8 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" /> New Bucket
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Bucket Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase())}
                      placeholder="my-data-bucket"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">3-63 characters, lowercase letters, numbers, dots, and hyphens</p>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Access</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "private", label: "Private", icon: Lock, desc: "Only you can access" },
                        { value: "public", label: "Public", icon: Unlock, desc: "Anyone with URL can read" },
                      ].map((v) => (
                        <button
                          key={v.value}
                          onClick={() => setVisibility(v.value)}
                          className={`rounded-lg border p-4 text-left text-sm transition-all ${
                            visibility === v.value
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <v.icon className="h-4 w-4 mb-1" />
                          <span className="font-medium block">{v.label}</span>
                          <span className="text-xs text-muted-foreground">{v.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">
                      <Globe className="h-3.5 w-3.5 inline mr-1" /> Region
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {REGIONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setRegion(r.value)}
                          className={`rounded-lg border p-3 text-left text-sm transition-all ${
                            region === r.value
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Storage Class */}
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">
                      <HardDrive className="h-3.5 w-3.5 inline mr-1" /> Storage Class
                    </label>
                    <div className="space-y-2">
                      {STORAGE_CLASSES.map((sc) => (
                        <button
                          key={sc.value}
                          onClick={() => setStorageClass(sc.value)}
                          className={`w-full rounded-lg border p-3 flex items-center justify-between text-sm transition-all ${
                            storageClass === sc.value
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <div>
                            <span className="font-medium">{sc.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{sc.description}</span>
                          </div>
                          <span className="text-xs text-primary font-semibold">{sc.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating}>
                      {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Create Bucket"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bucket List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold text-foreground">Your Buckets</h2>
                <Button variant="ghost" size="sm" onClick={fetchBuckets}>
                  <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {buckets.length === 0 && !fetching ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-semibold text-foreground mb-2">No buckets yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">Create your first storage bucket to start storing objects.</p>
                    <Button onClick={() => setShowCreate(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> Create Bucket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {buckets.map((bucket) => (
                    <Card key={bucket.id} className="hover:border-primary/30 transition-all cursor-pointer" onClick={() => openBucket(bucket)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                              {bucket.visibility === "public" ? (
                                <Unlock className="h-5 w-5 text-primary" />
                              ) : (
                                <Lock className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-heading font-semibold text-foreground">{bucket.name}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{REGIONS.find(r => r.value === bucket.region)?.label || bucket.region}</span>
                                <span>•</span>
                                <span>{bucket.object_count} objects</span>
                                <span>•</span>
                                <span>{formatBytes(bucket.size_bytes)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize text-green-400 bg-green-400/10">
                              {bucket.status}
                            </span>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ConfirmDialog
                                title={`Delete bucket "${bucket.name}"?`}
                                description="This permanently destroys the bucket and every object inside it. This action cannot be undone."
                                confirmLabel="Delete bucket"
                                onConfirm={() => deleteBucket(bucket)}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ConsoleLayout>
  );
};

export default Storage;
