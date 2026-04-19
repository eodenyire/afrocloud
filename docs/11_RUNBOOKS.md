# 11_RUNBOOKS.md

## 🧰 Operations Runbooks

### Deployment

1. Provision control-plane Postgres + object storage
2. Deploy API gateway and orchestrator
3. Configure provider accounts (AWS/Azure/GCP/Oracle)
4. Enable OAuth providers + SSO domains
5. Deploy console + CLI distribution

### Onboarding Checklist

- Create organization + project
- Enable MFA and RBAC roles
- Register provider accounts
- Issue API tokens
- Validate quotas

### Incident Response

1. Review `audit_logs` and `resource_operations`
2. Identify failed provider adapter calls
3. Retry async jobs or roll back changes
4. Notify tenant and update status

### Compliance

- Export audit logs monthly
- Rotate API tokens quarterly
- Review IAM roles + access logs

