import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type WorkspaceContext = {
  userId: string;
  orgId: string;
  projectId: string | null;
};

type ResourceRegistryInput = {
  orgId: string;
  projectId: string | null;
  resourceType: string;
  resourceId: string;
  name: string;
  region?: string | null;
  provider?: string;
  status?: string;
  metadata?: Json;
};

type CostInput = {
  orgId: string;
  projectId: string | null;
  resourceId: string;
  resourceType: string;
  amountUsd: number;
  usageUnit?: string;
  usageQuantity?: number;
};

const recordAudit = async (
  ctx: WorkspaceContext,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details: Json = {}
) => {
  await supabase.from("audit_logs").insert({
    org_id: ctx.orgId,
    project_id: ctx.projectId,
    user_id: ctx.userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  });
};

const recordCost = async (input: CostInput) => {
  await supabase.from("cost_records").insert({
    org_id: input.orgId,
    project_id: input.projectId,
    resource_id: input.resourceId,
    resource_type: input.resourceType,
    amount_usd: input.amountUsd,
    usage_unit: input.usageUnit ?? "month",
    usage_quantity: input.usageQuantity ?? 1,
  });
};

const registerResource = async (input: ResourceRegistryInput) => {
  const { data, error } = await supabase
    .from("resources")
    .insert({
      org_id: input.orgId,
      project_id: input.projectId,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      provider: input.provider ?? "africa-cloud",
      name: input.name,
      region: input.region,
      status: input.status ?? "provisioning",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

const updateRegistryStatus = async (resourceId: string, status: string) => {
  await supabase
    .from("resources")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("resource_id", resourceId);
};

const createOperation = async (registryId: string, operationType: string, status = "queued") => {
  await supabase.from("resource_operations").insert({
    resource_id: registryId,
    operation_type: operationType,
    status,
  });
};

const deleteRegistry = async (resourceId: string) => {
  await supabase.from("resources").delete().eq("resource_id", resourceId);
};

export const createComputeInstance = async (
  ctx: WorkspaceContext,
  payload: {
    name: string;
    region: string;
    machine_type: string;
    vcpus: number;
    ram_gb: number;
    disk_gb: number;
    os_image: string;
    status: string;
    ip_address: string | null;
    tags?: Json;
    price: number;
  }
) => {
  const { data, error } = await supabase
    .from("virtual_machines")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      region: payload.region,
      machine_type: payload.machine_type,
      vcpus: payload.vcpus,
      ram_gb: payload.ram_gb,
      disk_gb: payload.disk_gb,
      os_image: payload.os_image,
      status: payload.status,
      ip_address: payload.ip_address,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: payload.tags ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "compute",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { machine_type: payload.machine_type, os_image: payload.os_image },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "compute.create", "compute", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "compute",
    amountUsd: payload.price,
  });

  return data;
};

export const listComputeInstances = async (userId: string) => {
  return supabase.from("virtual_machines").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const updateComputeStatus = async (ctx: WorkspaceContext, vmId: string, status: string) => {
  const { error } = await supabase
    .from("virtual_machines")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", vmId);
  if (error) throw error;
  await updateRegistryStatus(vmId, status);
  await recordAudit(ctx, "compute.update", "compute", vmId, { status });
};

export const deleteComputeInstance = async (ctx: WorkspaceContext, vmId: string) => {
  const { error } = await supabase.from("virtual_machines").delete().eq("id", vmId);
  if (error) throw error;
  await deleteRegistry(vmId);
  await recordAudit(ctx, "compute.delete", "compute", vmId);
};

export const createDatabaseInstance = async (
  ctx: WorkspaceContext,
  payload: {
    name: string;
    engine: string;
    version: string;
    region: string;
    plan: string;
    storage_gb: number;
    status: string;
    connection_string: string;
    port: number;
    price: number;
  }
) => {
  const { data, error } = await supabase
    .from("database_instances")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      engine: payload.engine,
      version: payload.version,
      region: payload.region,
      plan: payload.plan,
      storage_gb: payload.storage_gb,
      status: payload.status,
      connection_string: payload.connection_string,
      port: payload.port,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();

  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "database",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { engine: payload.engine, version: payload.version },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "database.create", "database", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "database",
    amountUsd: payload.price,
  });

  return data;
};

export const listDatabaseInstances = async (userId: string) => {
  return supabase.from("database_instances").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const updateDatabaseStatus = async (ctx: WorkspaceContext, dbId: string, status: string) => {
  const { error } = await supabase
    .from("database_instances")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", dbId);
  if (error) throw error;
  await updateRegistryStatus(dbId, status);
  await recordAudit(ctx, "database.update", "database", dbId, { status });
};

export const deleteDatabaseInstance = async (ctx: WorkspaceContext, dbId: string) => {
  const { error } = await supabase.from("database_instances").delete().eq("id", dbId);
  if (error) throw error;
  await deleteRegistry(dbId);
  await recordAudit(ctx, "database.delete", "database", dbId);
};

export const createStorageBucket = async (
  ctx: WorkspaceContext,
  payload: {
    name: string;
    region: string;
    visibility: string;
    storage_class: string;
    status: string;
    price: number;
  }
) => {
  const { data, error } = await supabase
    .from("storage_buckets")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      region: payload.region,
      visibility: payload.visibility,
      storage_class: payload.storage_class,
      status: payload.status,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();

  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "storage",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { visibility: payload.visibility, storage_class: payload.storage_class },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "storage.create", "storage", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "storage",
    amountUsd: payload.price,
  });

  return data;
};

export const listStorageBuckets = async (userId: string) => {
  return supabase.from("storage_buckets").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const deleteStorageBucket = async (ctx: WorkspaceContext, bucketId: string) => {
  const { error } = await supabase.from("storage_buckets").delete().eq("id", bucketId);
  if (error) throw error;
  await deleteRegistry(bucketId);
  await recordAudit(ctx, "storage.delete", "storage", bucketId);
};

export const listStorageObjects = async (bucketId: string) => {
  return supabase.from("storage_objects").select("*").eq("bucket_id", bucketId).order("created_at", { ascending: false });
};

export const createStorageObject = async (payload: {
  bucketId: string;
  userId: string;
  key: string;
  sizeBytes: number;
  contentType: string;
}) => {
  return supabase.from("storage_objects").insert({
    bucket_id: payload.bucketId,
    user_id: payload.userId,
    key: payload.key,
    size_bytes: payload.sizeBytes,
    content_type: payload.contentType,
  });
};

export const deleteStorageObject = async (objectId: string) => {
  return supabase.from("storage_objects").delete().eq("id", objectId);
};

export const updateStorageBucketStats = async (bucketId: string, payload: { objectCount: number; sizeBytes: number }) => {
  return supabase.from("storage_buckets").update({
    object_count: payload.objectCount,
    size_bytes: payload.sizeBytes,
    updated_at: new Date().toISOString(),
  }).eq("id", bucketId);
};

export const createEdgeNode = async (
  ctx: WorkspaceContext,
  payload: {
    name: string;
    region: string;
    node_type: string;
    vcpus: number;
    ram_gb: number;
    disk_gb: number;
    status: string;
    ip_address: string | null;
    sync_status: string;
    price: number;
  }
) => {
  const { data, error } = await supabase
    .from("edge_nodes")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      region: payload.region,
      node_type: payload.node_type,
      vcpus: payload.vcpus,
      ram_gb: payload.ram_gb,
      disk_gb: payload.disk_gb,
      status: payload.status,
      ip_address: payload.ip_address,
      sync_status: payload.sync_status,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();

  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "edge",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { node_type: payload.node_type },
  });

  await createOperation(registry.id, "deploy");
  await recordAudit(ctx, "edge.create", "edge", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "edge",
    amountUsd: payload.price,
  });

  return data;
};

export const listEdgeNodes = async (userId: string) => {
  return supabase.from("edge_nodes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const updateEdgeNodeStatus = async (ctx: WorkspaceContext, nodeId: string, status: string, sync_status: string) => {
  const { error } = await supabase
    .from("edge_nodes")
    .update({ status, sync_status, updated_at: new Date().toISOString() })
    .eq("id", nodeId);
  if (error) throw error;
  await updateRegistryStatus(nodeId, status);
  await recordAudit(ctx, "edge.update", "edge", nodeId, { status, sync_status });
};

export const deleteEdgeNode = async (ctx: WorkspaceContext, nodeId: string) => {
  const { error } = await supabase.from("edge_nodes").delete().eq("id", nodeId);
  if (error) throw error;
  await deleteRegistry(nodeId);
  await recordAudit(ctx, "edge.delete", "edge", nodeId);
};

export const createVpc = async (
  ctx: WorkspaceContext,
  payload: { name: string; region: string; cidr_block: string; status: string; price: number }
) => {
  const { data, error } = await supabase
    .from("vpcs")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      region: payload.region,
      cidr_block: payload.cidr_block,
      status: payload.status,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();
  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "network",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { cidr_block: payload.cidr_block },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "network.create", "network", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "network",
    amountUsd: payload.price,
  });
  return data;
};

export const listVpcs = async (userId: string) => {
  return supabase.from("vpcs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const deleteVpc = async (ctx: WorkspaceContext, vpcId: string) => {
  const { error } = await supabase.from("vpcs").delete().eq("id", vpcId);
  if (error) throw error;
  await deleteRegistry(vpcId);
  await recordAudit(ctx, "network.delete", "network", vpcId);
};

export const createLoadBalancer = async (
  ctx: WorkspaceContext,
  payload: {
    name: string;
    region: string;
    lb_type: string;
    protocol: string;
    port: number;
    status: string;
    dns_name: string | null;
    price: number;
  }
) => {
  const { data, error } = await supabase
    .from("load_balancers")
    .insert({
      user_id: ctx.userId,
      name: payload.name,
      region: payload.region,
      lb_type: payload.lb_type,
      protocol: payload.protocol,
      port: payload.port,
      status: payload.status,
      dns_name: payload.dns_name,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();
  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "load-balancer",
    resourceId: data.id,
    name: payload.name,
    region: payload.region,
    status: payload.status,
    metadata: { lb_type: payload.lb_type, protocol: payload.protocol },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "load-balancer.create", "load-balancer", data.id, { name: payload.name });
  await recordCost({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceId: data.id,
    resourceType: "load-balancer",
    amountUsd: payload.price,
  });
  return data;
};

export const listLoadBalancers = async (userId: string) => {
  return supabase.from("load_balancers").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const deleteLoadBalancer = async (ctx: WorkspaceContext, lbId: string) => {
  const { error } = await supabase.from("load_balancers").delete().eq("id", lbId);
  if (error) throw error;
  await deleteRegistry(lbId);
  await recordAudit(ctx, "load-balancer.delete", "load-balancer", lbId);
};

export const createDnsRecord = async (
  ctx: WorkspaceContext,
  payload: { zone: string; record_type: string; name: string; value: string; ttl: number; status: string }
) => {
  const { data, error } = await supabase
    .from("dns_records")
    .insert({
      user_id: ctx.userId,
      zone: payload.zone,
      record_type: payload.record_type,
      name: payload.name,
      value: payload.value,
      ttl: payload.ttl,
      status: payload.status,
      org_id: ctx.orgId,
      project_id: ctx.projectId,
      provider: "africa-cloud",
      tags: {},
    })
    .select("*")
    .single();
  if (error) throw error;

  const registry = await registerResource({
    orgId: ctx.orgId,
    projectId: ctx.projectId,
    resourceType: "dns",
    resourceId: data.id,
    name: payload.name,
    status: payload.status,
    metadata: { zone: payload.zone, record_type: payload.record_type },
  });

  await createOperation(registry.id, "provision");
  await recordAudit(ctx, "dns.create", "dns", data.id, { name: payload.name });
  return data;
};

export const listDnsRecords = async (userId: string) => {
  return supabase.from("dns_records").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const deleteDnsRecord = async (ctx: WorkspaceContext, recordId: string) => {
  const { error } = await supabase.from("dns_records").delete().eq("id", recordId);
  if (error) throw error;
  await deleteRegistry(recordId);
  await recordAudit(ctx, "dns.delete", "dns", recordId);
};

export const listOrganizationMembers = async (orgId: string) => {
  return supabase.from("memberships").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const addOrganizationMember = async (orgId: string, userId: string, role: string) => {
  return supabase.from("memberships").insert({ org_id: orgId, user_id: userId, role });
};

export const updateOrganizationMemberRole = async (memberId: string, role: string) => {
  return supabase.from("memberships").update({ role }).eq("id", memberId);
};

export const removeOrganizationMember = async (memberId: string) => {
  return supabase.from("memberships").delete().eq("id", memberId);
};

export const listRoles = async (orgId: string) => {
  return supabase.from("roles").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const createRole = async (orgId: string, name: string, description: string, permissions: Json) => {
  return supabase.from("roles").insert({ org_id: orgId, name, description, permissions });
};

export const listAuditLogs = async (orgId: string) => {
  return supabase.from("audit_logs").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const listCostRecords = async (orgId: string) => {
  return supabase.from("cost_records").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const listIacTemplates = async (orgId: string) => {
  return supabase.from("iac_templates").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const createIacTemplate = async (
  ctx: WorkspaceContext,
  payload: { name: string; description: string; template: string; language: string }
) => {
  return supabase.from("iac_templates").insert({
    org_id: ctx.orgId,
    project_id: ctx.projectId,
    name: payload.name,
    description: payload.description,
    template: payload.template,
    language: payload.language,
  });
};

export const listIacRuns = async (orgId: string) => {
  return supabase.from("iac_runs").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
};

export const createIacRun = async (
  ctx: WorkspaceContext,
  payload: { templateId: string; plan: Json; policyViolations: Json }
) => {
  return supabase.from("iac_runs").insert({
    org_id: ctx.orgId,
    project_id: ctx.projectId,
    template_id: payload.templateId,
    status: "queued",
    triggered_by: ctx.userId,
    plan: payload.plan,
    policy_violations: payload.policyViolations,
  }).select("*");
};

export const listIacRunSteps = async (runId: string) => {
  return supabase.from("iac_run_steps").select("*").eq("run_id", runId).order("step_order", { ascending: true });
};

export const createIacRunStep = async (runId: string, stepOrder: number, action: string, status: string, details: Json) => {
  return supabase.from("iac_run_steps").insert({
    run_id: runId,
    step_order: stepOrder,
    action,
    status,
    details,
  });
};

export const listApiTokens = async (userId: string) => {
  return supabase.from("api_tokens").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const createApiToken = async (
  ctx: WorkspaceContext,
  payload: { name: string; tokenHash: string; expiresAt?: string | null }
) => {
  return supabase.from("api_tokens").insert({
    user_id: ctx.userId,
    org_id: ctx.orgId,
    project_id: ctx.projectId,
    name: payload.name,
    token_hash: payload.tokenHash,
    expires_at: payload.expiresAt ?? null,
  });
};

export const revokeApiToken = async (tokenId: string) => {
  return supabase.from("api_tokens").delete().eq("id", tokenId);
};

export const listSsoRequests = async (userId: string) => {
  return supabase.from("sso_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
};

export const createSsoRequest = async (
  ctx: WorkspaceContext,
  payload: { companyDomain: string; provider: string }
) => {
  return supabase.from("sso_requests").insert({
    user_id: ctx.userId,
    org_id: ctx.orgId,
    company_domain: payload.companyDomain,
    provider: payload.provider,
  });
};
