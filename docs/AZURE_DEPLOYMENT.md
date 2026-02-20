# VeloSight v1.0 - Azure Production Deployment Guide

## Overview

This document outlines the production deployment architecture and procedures for VeloSight on Microsoft Azure.

**Target Environment:** Production
**Region:** Australia East (Sydney)
**Custom Domain:** velosight.fidere.au
**CI/CD:** GitHub Actions
**Estimated Monthly Cost:** ~$30-70 (excludes Azure OpenAI/AI Search)

---

## Architecture

| Component | Azure Service | SKU | Purpose |
|-----------|--------------|-----|---------|
| Frontend | Azure Static Web Apps | Free | React SPA hosting with CDN |
| Backend | Azure Container Apps | Consumption | Express.js API with auto-scaling |
| Registry | Azure Container Registry | Basic | Docker image storage |
| Secrets | Azure Key Vault | Standard | Centralized secrets management |
| Monitoring | Application Insights | Pay-as-you-go | Logging, metrics, alerts |
| Database | Supabase (external) | - | PostgreSQL + Auth + Storage |
| AI/ML | Azure OpenAI + AI Search | - | RAG pipeline (already provisioned) |

```
┌─────────────────────────────────────────────────────────────────┐
│                        velosight.fidere.au                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Azure Static Web Apps (Frontend)               │
│                        React SPA + CDN                           │
│                    staticwebapp.config.json                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                          /api/* proxy
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Azure Container Apps (Backend)                  │
│                     Express.js API (port 3001)                   │
│                    Managed Identity → Key Vault                  │
└─────────────────────────────────────────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Supabase     │  │  Azure OpenAI   │  │ Azure AI Search │
│   PostgreSQL    │  │   GPT-5-mini    │  │  Vector Search  │
│   + Auth        │  │   Embeddings    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Files Created

### Configuration
| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template (safe to commit) |
| `staticwebapp.config.json` | SPA routing, security headers, API proxy |
| `.dockerignore` | Docker build exclusions |

### Docker
| File | Purpose |
|------|---------|
| `server/Dockerfile` | Multi-stage Node 20 build with health checks |

### Infrastructure (Bicep)
| File | Purpose |
|------|---------|
| `infra/main.bicep` | Main orchestration template |
| `infra/parameters.prod.json` | Production parameters |
| `infra/modules/key-vault.bicep` | Secrets management with RBAC |
| `infra/modules/monitoring.bicep` | App Insights + alert rules |
| `infra/modules/container-registry.bicep` | ACR for Docker images |
| `infra/modules/container-app.bicep` | Backend with Key Vault integration |
| `infra/modules/static-web-app.bicep` | Frontend SPA hosting |

### CI/CD (GitHub Actions)
| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/deploy-backend.yml` | Push to `server/` or `shared/` | Build Docker, deploy to Container Apps |
| `.github/workflows/deploy-frontend.yml` | Push to `src/` | Build Vite, deploy to Static Web Apps |
| `.github/workflows/infrastructure.yml` | Push to `infra/` | Deploy Bicep templates |

---

## Deployment Phases

### Phase 1: Azure Resource Provisioning

```bash
# Login to Azure
az login

# Deploy all infrastructure
az deployment sub create \
  --location australiaeast \
  --template-file infra/main.bicep \
  --parameters infra/parameters.prod.json
```

**Resources created:**
- Resource Group: `rg-velosight-prod`
- Key Vault: `kv-velosight-prod`
- Container Registry: `acrvelosightprod`
- Container Apps Environment: `cae-velosight-prod`
- Container App: `ca-velosight-backend-prod`
- Static Web App: `swa-velosight-prod`
- Application Insights: `ai-velosight-prod`

### Phase 2: Populate Key Vault Secrets

After infrastructure deployment, populate secrets in Key Vault:

```bash
# Supabase
az keyvault secret set --vault-name kv-velosight-prod --name supabase-url --value "https://supabase.fidere.au"
az keyvault secret set --vault-name kv-velosight-prod --name supabase-anon-key --value "<your-anon-key>"
az keyvault secret set --vault-name kv-velosight-prod --name supabase-service-role-key --value "<your-service-role-key>"

# Azure OpenAI
az keyvault secret set --vault-name kv-velosight-prod --name azure-openai-endpoint --value "https://velosight-resource.openai.azure.com/"
az keyvault secret set --vault-name kv-velosight-prod --name azure-openai-key --value "<your-openai-key>"

# Azure AI Search
az keyvault secret set --vault-name kv-velosight-prod --name azure-search-endpoint --value "https://velosight-search.search.windows.net"
az keyvault secret set --vault-name kv-velosight-prod --name azure-search-admin-key --value "<your-search-key>"
```

### Phase 3: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | Service principal JSON (see below) |
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Static Web App deployment token |
| `VITE_SUPABASE_URL` | `https://supabase.fidere.au` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_BACKEND_API_URL` | Container App URL (after deployment) |

**Create Service Principal:**
```bash
az ad sp create-for-rbac \
  --name "velosight-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/rg-velosight-prod \
  --sdk-auth
```

### Phase 4: Configure Custom Domain

1. **Add DNS records** (in fidere.au DNS provider):
   ```
   velosight    CNAME    <static-web-app>.azurestaticapps.net
   ```

2. **Configure in Azure Portal:**
   - Navigate to Static Web Apps → `swa-velosight-prod`
   - Custom domains → Add → `velosight.fidere.au`
   - Azure will auto-provision SSL certificate

### Phase 5: Deploy Application

```bash
# Push to main branch to trigger CI/CD
git add .
git commit -m "Deploy v1.0 to Azure production"
git push origin main
```

Or manually trigger:
```bash
# Build and push Docker image
az acr build -r acrvelosightprod -t velosight-backend:v1.0 .

# Update Container App
az containerapp update \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --image acrvelosightprod.azurecr.io/velosight-backend:v1.0
```

---

## Local Development with Docker

```bash
# Build Docker image locally
npm run docker:build

# Run with local environment
npm run docker:run
```

---

## Rollback Procedures

### Backend Rollback

```bash
# List available revisions
az containerapp revision list \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --output table

# Activate previous revision
az containerapp revision activate \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --revision <previous-revision-name>

# Route 100% traffic to previous revision
az containerapp ingress traffic set \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --revision-weight <previous-revision>=100
```

### Frontend Rollback

Revert commit on `main` branch → automatic redeploy via GitHub Actions.

---

## Monitoring & Alerts

### Application Insights

Access via Azure Portal → Application Insights → `ai-velosight-prod`

**Pre-configured alerts:**
- Error rate > 5% for 5 minutes (Severity 2)
- P95 latency > 5 seconds (Severity 3)

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API response time (P50) | < 500ms | - |
| API response time (P95) | < 2s | > 5s |
| Error rate | < 1% | > 5% |
| Container restarts | 0 | > 2 in 10 min |

### Log Queries (Kusto)

```kusto
// Failed requests in last hour
requests
| where timestamp > ago(1h)
| where success == false
| summarize count() by name, resultCode

// Slow requests
requests
| where timestamp > ago(1h)
| where duration > 2000
| project timestamp, name, duration, resultCode
| order by duration desc
```

---

## Security Considerations

1. **Secrets Management**
   - All secrets stored in Azure Key Vault
   - Container App uses Managed Identity (no API keys in code)
   - Service role key never exposed to frontend

2. **Network Security**
   - CORS explicitly whitelists `velosight.fidere.au`
   - HTTPS enforced via Azure Static Web Apps
   - Security headers configured in `staticwebapp.config.json`

3. **Authentication**
   - Supabase JWT tokens for API authentication
   - Row Level Security (RLS) enabled in database

4. **Compliance**
   - All data stored in Australia East region
   - Soft delete enabled on Key Vault (90 days retention)

---

## Troubleshooting

### Container App not starting

```bash
# Check logs
az containerapp logs show \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --follow

# Check revision status
az containerapp revision show \
  --name ca-velosight-backend-prod \
  --resource-group rg-velosight-prod \
  --revision <revision-name>
```

### Key Vault access issues

```bash
# Verify managed identity has access
az role assignment list \
  --scope /subscriptions/<sub>/resourceGroups/rg-velosight-prod/providers/Microsoft.KeyVault/vaults/kv-velosight-prod \
  --output table
```

### CORS errors

Check that `FRONTEND_URL` environment variable in Container App matches the actual frontend domain.

---

## Cost Optimization

| Resource | Current | Optimization |
|----------|---------|--------------|
| Container Apps | Consumption | Scale to 0 during off-hours |
| Static Web Apps | Free tier | Sufficient for most traffic |
| Container Registry | Basic | Consider cleanup policies |
| Log Analytics | 30 days | Reduce if not needed |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-09 | Initial production deployment |
