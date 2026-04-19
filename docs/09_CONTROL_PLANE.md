# 09_CONTROL_PLANE.md

## 🧭 Control Plane Scope

This document defines the **unified control-plane** for Africa Cloud, spanning identity, resource orchestration, provider adapters, and async provisioning.

### Unified Resource Model

All resources are registered in `resources` with common fields:

- `resource_type` (compute, database, storage, edge, network, load-balancer, dns)
- `resource_id` (pointer to service table)
- `org_id`, `project_id`
- `provider`, `region`, `status`
- `metadata` (service-specific JSON)

### Core Control-Plane Services

1. **Identity & Access**
   - Organizations, projects, memberships, roles, and role bindings
   - MFA + SSO requests
2. **Resource Orchestration**
   - CRUD + lifecycle actions for compute/storage/networking/databases/edge
3. **Provider Adapters**
   - AWS, Azure, GCP, Oracle mapped behind provider accounts
4. **State & Eventing**
   - `resource_operations` captures provisioning workflows
   - Async status updates via polling or webhooks
5. **Audit & Cost**
   - `audit_logs`, `cost_records`, `quotas`

### Event Flow

```
API Gateway → Orchestrator → Provider Adapter → Resource Registry → Audit/Cost
```

### API Gateway Responsibilities

- Auth verification (OAuth + API tokens)
- Rate limiting + quotas
- Request routing to resource handlers
- Normalized error handling

### Control-Plane Storage

- Postgres: metadata, IAM, audit, costs, templates
- Object storage: templates, run artifacts

