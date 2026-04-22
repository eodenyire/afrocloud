# 13_REAL_WORLD_COMPUTE_PROVISIONING.md

## 🎯 Goal

Move from simulated/prototype compute flows to **real provisioning** where tenants can create machines and reliably connect to them (SSH, API, private networking).

## What already exists in this repo

- Console compute flows already call a provider API (`/v1/resources/compute`) and persist `provider_id` + `ip_address`.
- A provider bearer token can already be configured in the Developers page for real control-plane calls.

This means we can operationalize a real backend without redesigning the frontend contract.

---

## Option A (Fastest MVP): Single-cloud adapter + public SSH

Best when you need real instances quickly.

### Provisioning design

1. Keep using `POST /v1/resources/compute` as the northbound API.
2. Implement provider adapter against one cloud first (e.g., AWS EC2 or Azure VM).
3. On create:
   - create VM from approved image
   - attach security group / NSG with least-privilege inbound rules
   - inject tenant SSH public key via cloud-init
   - return `provider_id`, `status`, `public_ip`, `private_ip`
4. Persist IP and provider ID in platform DB (already supported).

### How users connect

- Linux/macOS: `ssh -i ~/.ssh/<key> ubuntu@<public_ip>`
- Windows: OpenSSH/PowerShell with same key pair.

### Minimum guardrails

- Enforce per-tenant key management.
- Do not open `0.0.0.0/0` unless explicitly requested.
- Rotate ephemeral access (short-lived credentials).

---

## Option B (Recommended production baseline): Private mesh networking

Best for African edge realities (unstable links + security).

### Provisioning design

1. Provision VM privately (no required public IP).
2. Bootstrap node agent + WireGuard or Tailscale at first boot.
3. Register node with control plane and bind to org/project identity.
4. Expose a stable private endpoint (mesh IP / DNS name).

### How users connect

- Admin joins same mesh with org policy.
- SSH to private mesh identity (example: `ssh ubuntu@vm-123.mesh.ac`).
- Services can be reached privately without public exposure.

### Why this fits this platform

- Survives intermittent WAN conditions better than strict public ingress.
- Reduces attack surface for edge deployments.
- Gives consistent addressing across AWS/Azure/GCP/Oracle + on-prem nodes.

---

## Option C (Edge/offline sites): Bare-metal + K3s node enrollment

Best for branch sites, telco towers, and micro-DC deployments.

### Provisioning design

1. Prepare golden image (Ubuntu LTS + hardening + node agent).
2. On first boot, node calls `register` endpoint with bootstrap token.
3. Control plane assigns org/project/region metadata and desired workloads.
4. K3s joins country cluster when online; works local-first when offline.

### How users connect

- Local LAN access during offline periods.
- Mesh/VPN access when backhaul is available.
- Optional serial/ILO fallback for break-glass operations.

---

## Northbound API contract (keep stable)

Use this common envelope for all providers:

```json
{
  "provider_id": "vm-abc123",
  "status": "provisioning|running|stopped|failed",
  "public_ip": "x.x.x.x",
  "private_ip": "10.x.x.x",
  "access": {
    "ssh_user": "ubuntu",
    "ssh_port": 22,
    "connectivity": "public|private-mesh|site-local"
  }
}
```

This aligns with existing `providerApi.ts` return shape and only extends metadata.

---

## Implementation plan (practical)

### Phase 1 (1–2 weeks)

- Build one real provider adapter (start with AWS or Azure).
- Implement create/get/start/stop/delete for compute.
- Return real IP + status to existing frontend.
- Add basic SSH key flow and security-group templates.

### Phase 2 (2–4 weeks)

- Add private mesh bootstrap (WireGuard/Tailscale).
- Add "connect method" in compute details (public SSH vs mesh SSH).
- Add operation retries and exponential backoff in provisioning workers.

### Phase 3 (4+ weeks)

- Add second provider for failover portability.
- Add edge bare-metal registration flow.
- Add policy engine (approved regions/images/sizes per tenant).

---

## Connection UX to add in console

For each VM, surface:

- **Connection method**: Public SSH / Mesh SSH / Site-local
- **Host**: public IP, private IP, or mesh DNS name
- **User**: default OS user
- **Port**: usually 22
- **Copy command** button:
  - `ssh -i ~/.ssh/ac_org01 ubuntu@<host>`

For private resources, also show prerequisite:

- "Install mesh client and join org network before connecting."

---

## Suggested first real deployment choice

If speed matters most: **Option A now, Option B immediately after**.

- Option A gets you real customer-visible provisioning quickly.
- Option B gives the long-term secure and resilient access model needed for distributed African deployments.
