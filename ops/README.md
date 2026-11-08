# ==============================================================================
# OUTPOST DEVOPS ARCHITECTURE: NAGIOS, PUPPET & ANSIBLE
# Enterprise Infrastructure as Code, Convergence & Real-Time Monitoring
# ==============================================================================

This document outlines the architectural reasoning, execution pipeline, state convergence model, and real-time operations for the **OUTPOST Enterprise Platform** across Puppet, Ansible, and Nagios, integrated directly with **Cloudflare Pages, Render Microservices, Supabase Database, and D.I.S.M.W Security Aegis**.

---

## 1. Architectural Reasoning & Separation of Concerns

Modern high-resilience systems fail when tools are misused. Outpost implements a strict **tri-pillar DevOps model**:

```
                         ┌────────────────────────────────────────────────────────┐
                         │                  INFRASTRUCTURE TEAMS                  │
                         └──────────────────────────┬─────────────────────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 ▼                                  ▼                                  ▼
      ┌─────────────────────┐            ┌─────────────────────┐            ┌─────────────────────┐
      │   PUPPET (State)    │            │  ANSIBLE (Actions)  │            │  NAGIOS (Telemetry) │
      ├─────────────────────┤            ├─────────────────────┤            ├─────────────────────┤
      │ • Declarative Model │            │ • Procedural Engine │            │ • Active Inspection │
      │ • Drift Detection   │            │ • Rolling Deploys   │            │ • D.I.S.M.W Audits  │
      │ • Baseline Security │            │ • Blue/Green Hooks  │            │ • SLA Alert Routing │
      │ • Daemon Enforcers  │            │ • Dynamic Inventory │            │ • Multi-cloud Heart │
      └─────────────────────┘            └─────────────────────┘            └─────────────────────┘
```

| Component | Nature | Primary Role in Outpost | Why It Was Chosen |
| :--- | :--- | :--- | :--- |
| **Puppet** | **Declarative State Engine** | Enforces the system baseline across nodes (OS limits, user permissions, systemd service descriptors, security config files). | Continuously corrects drift automatically without human intervention; if someone changes file permissions or disables a daemon, Puppet forces it back to compliant state. |
| **Ansible** | **Procedural Orchestrator** | Orchestrates releases, dependencies, Node.js packages, database migrations, and CI/CD rollouts. | Agentless, push-based via SSH. Perfect for step-by-step coordinated deployments across multiple cloud targets without lingering daemons. |
| **Nagios Core** | **Continuous Telemetry & SLA Sentinel** | Real-time monitoring of Outpost API endpoints, D.I.S.M.W security wall status, Supabase cloud latency, and process availability. | Robust active checks, battle-tested alert escalation, zero-overhead telemetry plugins, and strict exit code semantics (0=OK, 1=WARN, 2=CRITICAL). |

---

## 2. Real-Time Pipeline Workflow

```
[Developer Push to 'main']
       │
       ▼
 1. GitHub Actions CI (Automated Jest Tests & Security Test Suite)
       │
       ▼
 2. Infra-As-Code Validation (Ansible Syntax, Puppet Manifests, Plugin Shellcheck)
       │
       ▼
 3. Puppet Convergence Check (Node baseline, UFW, limits, systemd units enforced)
       │
       ▼
 4. Ansible Release Deployment (Orchestrates package install, D.I.S.M.W activation)
       │
       ▼
 5. Multi-Cloud Target Execution:
       ├── Cloudflare Pages  ──► Deploys Vite React SSR Frontend (`dist/`)
       ├── Render API Server ──► Deploys Express Backend + Socket.io Server
       └── Supabase Cloud    ──► Automated Schema Dumps, Backups & Sync
       │
       ▼
 6. Nagios Continuous Monitoring Loop (Runs 24/7):
       ├── Checks /api/health (Latency < 3000ms)
       ├── Checks /api/security/dismw/wall-status (ARMED_AEGIS verification)
       └── Checks Supabase REST/PostgreSQL connectivity
```

---

## 3. Directory Structure

```
ops/
├── ansible/
│   ├── ansible.cfg                    # Ansible default parameters & role paths
│   ├── inventory/
│   │   └── hosts.ini                  # Edge, API, and Monitoring host definitions
│   ├── site.yml                       # Multi-phase master orchestration playbook
│   └── roles/
│       ├── outpost_app/tasks/main.yml # Git sync, npm ci, systemd unit provisioning
│       ├── security_dismw/tasks/main.yml # D.I.S.M.W status verification & enforcement
│       └── monitoring_agent/tasks/main.yml # NRPE setup and Nagios integration hooks
├── puppet/
│   ├── manifests/
│   │   └── site.pp                    # Node classification rules
│   └── modules/outpost/manifests/
│       └── init.pp                    # Declarative classes: base, app, security, monitoring, edge
├── nagios/
│   ├── etc/
│   │   ├── nagios.cfg                 # Core Nagios daemon configuration
│   │   └── objects/
│   │       ├── outpost-hosts.cfg      # Edge, API, and Supabase host definitions
│   │       └── outpost-services.cfg   # Health, D.I.S.M.W, and DB service definitions
│   └── plugins/
│       ├── check_outpost_api.sh       # Custom API health & latency check
│       ├── check_dismw_security.sh    # Custom D.I.S.M.W ARMED_AEGIS state validator
│       └── check_supabase_health.sh   # Custom Supabase HTTPS heartbeat validator
├── docker/
│   └── Dockerfile.nagios              # Self-contained Nagios 4 container image
└── pipeline/
    └── run-pipeline.sh                # Local & CI end-to-end pipeline runner
```

---

## 4. How to Operate & Run in Real-Time

### Running the End-to-End Pipeline Locally
```bash
# Set execute permissions on pipeline scripts
chmod +x ops/pipeline/run-pipeline.sh ops/nagios/plugins/*.sh

# Run full pipeline verification
./ops/pipeline/run-pipeline.sh
```

### Running Ansible Orchestration
```bash
# Verify playbook syntax
ansible-playbook -i ops/ansible/inventory/hosts.ini ops/ansible/site.yml --syntax-check

# Execute playbook in dry-run mode
ansible-playbook -i ops/ansible/inventory/hosts.ini ops/ansible/site.yml --check

# Execute full live deployment
ansible-playbook -i ops/ansible/inventory/hosts.ini ops/ansible/site.yml
```

### Running Puppet Manifests
```bash
# Validate Puppet syntax
puppet parser validate ops/puppet/manifests/site.pp
puppet parser validate ops/puppet/modules/outpost/manifests/init.pp

# Apply local declarative state (Dry run)
puppet apply --noop --modulepath=ops/puppet/modules ops/puppet/manifests/site.pp
```

### Starting Nagios Monitoring via Docker Compose
```bash
# Start all services including the new Nagios container
docker-compose up -d nagios

# Access the Nagios Web Interface:
# URL: http://localhost:8085/nagios4
# User: nagiosadmin
# Pass: outpost_secure_admin_2026
```

### Running Custom Nagios Plugins Directly
```bash
# Check Outpost API health
./ops/nagios/plugins/check_outpost_api.sh 127.0.0.1 5000 /api/health

# Check D.I.S.M.W Security Frontier Wall status
./ops/nagios/plugins/check_dismw_security.sh 127.0.0.1 5000

# Check Supabase Cloud database connectivity
./ops/nagios/plugins/check_supabase_health.sh idivdegwxgwudgxcuaso.supabase.co
```

---

## 5. Cloud Platform Alignment

1. **Cloudflare Pages (Frontend)**:
   - Configured in `.github/workflows/production-deployment.yml` and `wrangler.toml`.
   - Compiles Vite React SSR into `dist/` and deploys globally with edge caching.
2. **Render Microservices (Backend)**:
   - Configured in `render.yaml` and `.github/workflows/production-deployment.yml`.
   - Runs `node server/server.js` with D.I.S.M.W frontier security protection.
3. **Supabase Cloud (Persistence & Sync)**:
   - Configured via `server/supabaseClient.js` (`https://idivdegwxgwudgxcuaso.supabase.co`).
   - Automatically receives message backups from the chat services and has automated CI database dumps.
