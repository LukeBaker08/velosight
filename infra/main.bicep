// VeloSight Infrastructure - Main Deployment Template
// Deploy with: az deployment sub create -l australiaeast -f main.bicep -p parameters.prod.json

targetScope = 'subscription'

// =============================================================================
// PARAMETERS
// =============================================================================

@description('Environment name (prod, staging, dev)')
@allowed(['prod', 'staging', 'dev'])
param environment string = 'prod'

@description('Azure region for resources')
param location string = 'australiaeast'

@description('Base name for resources')
param baseName string = 'velosight'

@description('Container image tag')
param imageTag string = 'latest'

@description('GitHub repository URL for Static Web App')
param repositoryUrl string = ''

@description('GitHub repository branch')
param repositoryBranch string = 'main'

// =============================================================================
// VARIABLES
// =============================================================================

var resourceGroupName = 'rg-${baseName}-${environment}'
var tags = {
  Application: 'VeloSight'
  Environment: environment
  ManagedBy: 'Bicep'
}

// =============================================================================
// RESOURCE GROUP
// =============================================================================

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// =============================================================================
// MODULES
// =============================================================================

// Key Vault for secrets management
module keyVault 'modules/key-vault.bicep' = {
  scope: rg
  name: 'keyVault'
  params: {
    baseName: baseName
    environment: environment
    location: location
    tags: tags
  }
}

// Application Insights for monitoring
module monitoring 'modules/monitoring.bicep' = {
  scope: rg
  name: 'monitoring'
  params: {
    baseName: baseName
    environment: environment
    location: location
    tags: tags
  }
}

// Container Registry
module acr 'modules/container-registry.bicep' = {
  scope: rg
  name: 'containerRegistry'
  params: {
    baseName: baseName
    environment: environment
    location: location
    tags: tags
  }
}

// Container Apps (Backend API)
module containerApp 'modules/container-app.bicep' = {
  scope: rg
  name: 'containerApp'
  params: {
    baseName: baseName
    environment: environment
    location: location
    tags: tags
    imageTag: imageTag
    acrLoginServer: acr.outputs.loginServer
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: monitoring.outputs.connectionString
  }
}

// Static Web App (Frontend)
module staticWebApp 'modules/static-web-app.bicep' = {
  scope: rg
  name: 'staticWebApp'
  params: {
    baseName: baseName
    environment: environment
    location: location
    tags: tags
    repositoryUrl: repositoryUrl
    repositoryBranch: repositoryBranch
    backendUrl: containerApp.outputs.fqdn
  }
}

// =============================================================================
// OUTPUTS
// =============================================================================

output resourceGroupName string = rg.name
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output acrLoginServer string = acr.outputs.loginServer
output containerAppFqdn string = containerApp.outputs.fqdn
output staticWebAppUrl string = staticWebApp.outputs.defaultHostname
output appInsightsConnectionString string = monitoring.outputs.connectionString
