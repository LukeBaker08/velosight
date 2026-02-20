// Container Registry Module - ACR for Docker images

@description('Base name for resources')
param baseName string

@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

// =============================================================================
// VARIABLES
// =============================================================================

// ACR names must be alphanumeric only, 5-50 chars
var acrName = replace('acr${baseName}${environment}', '-', '')

// =============================================================================
// CONTAINER REGISTRY
// =============================================================================

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    policies: {
      retentionPolicy: {
        days: 7
        status: 'enabled'
      }
    }
  }
}

// =============================================================================
// OUTPUTS
// =============================================================================

output acrName string = acr.name
output acrId string = acr.id
output loginServer string = acr.properties.loginServer
