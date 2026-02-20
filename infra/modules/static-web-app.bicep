// Static Web App Module - Frontend SPA

@description('Base name for resources')
param baseName string

@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('GitHub repository URL')
param repositoryUrl string

@description('GitHub branch')
param repositoryBranch string

@description('Backend API URL')
param backendUrl string

// =============================================================================
// VARIABLES
// =============================================================================

var staticWebAppName = 'swa-${baseName}-${environment}'

// =============================================================================
// STATIC WEB APP
// =============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: repositoryBranch
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
    enterpriseGradeCdnStatus: 'Disabled'
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// =============================================================================
// APP SETTINGS
// =============================================================================

resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    BACKEND_URL: backendUrl
  }
}

// =============================================================================
// LINKED BACKEND (for /api/* proxying)
// =============================================================================

resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-01-01' = {
  parent: staticWebApp
  name: 'backend'
  properties: {
    backendResourceId: ''
    region: location
  }
}

// =============================================================================
// OUTPUTS
// =============================================================================

output staticWebAppName string = staticWebApp.name
output staticWebAppId string = staticWebApp.id
output defaultHostname string = 'https://${staticWebApp.properties.defaultHostname}'
output deploymentToken string = listSecrets(staticWebApp.id, staticWebApp.apiVersion).properties.apiKey
