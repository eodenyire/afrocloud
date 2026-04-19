# 10_API_CLI_SDK.md

## 🔌 API, CLI, and SDK Strategy

### Public API Surface

Versioned REST/gRPC endpoints:

- `/v1/identity/*` (orgs, projects, roles, memberships)
- `/v1/resources/*` (compute, storage, networking, databases, edge)
- `/v1/iac/*` (templates, runs, policy checks)
- `/v1/audit/*` (audit logs, compliance exports)
- `/v1/billing/*` (costs, quotas)

### Authentication

- OAuth: GitHub, Google, Apple, Microsoft
- API tokens for CLI/SDK automation
- Enterprise SSO: SAML/OIDC

### CLI (acctl)

```
acctl login --token <API_TOKEN>
acctl compute create --name web --size ac-standard-2
acctl iac run --template web-stack
```

### SDKs

- `@africa-cloud/sdk` (TypeScript/JS)
- `africa-cloud-python`

SDKs map 1:1 to API endpoints and share auth flows.

### Provider Constraints

Adapters normalize provider differences:

- Regions and zones
- Instance families
- Storage classes
- Networking semantics (VPC/VNet/VCN)

