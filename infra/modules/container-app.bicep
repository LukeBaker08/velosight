// Container App Module - Backend API

@description('Base name for resources')
param baseName string

@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('Container image tag')
param imageTag string

@description('ACR login server')
param acrLoginServer string

@description('Key Vault name for secrets')
param keyVaultName string

@description('Application Insights connection string')
param appInsightsConnectionString string

// =============================================================================
// VARIABLES
// =============================================================================

var containerAppEnvName = 'cae-${baseName}-${environment}'
var containerAppName = 'ca-${baseName}-backend-${environment}'
var imageName = '${acrLoginServer}/${baseName}-backend:${imageTag}'

// =============================================================================
// MANAGED IDENTITY
// =============================================================================

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${baseName}-${environment}'
  location: location
  tags: tags
}

// =============================================================================
// KEY VAULT ACCESS
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Assign Key Vault Secrets User role to managed identity
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentity.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// CONTAINER APPS ENVIRONMENT
// =============================================================================

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  tags: tags
  properties: {
    zoneRedundant: false
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// =============================================================================
// CONTAINER APP
// =============================================================================

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'https://velosight.fidere.au'
            'http://localhost:5173'
            'http://localhost:8080'
          ]
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      secrets: [
        {
          name: 'supabase-url'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/supabase-url'
          identity: managedIdentity.id
        }
        {
          name: 'supabase-anon-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/supabase-anon-key'
          identity: managedIdentity.id
        }
        {
          name: 'supabase-service-role-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/supabase-service-role-key'
          identity: managedIdentity.id
        }
        {
          name: 'azure-openai-endpoint'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/azure-openai-endpoint'
          identity: managedIdentity.id
        }
        {
          name: 'azure-openai-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/azure-openai-key'
          identity: managedIdentity.id
        }
        {
          name: 'azure-search-endpoint'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/azure-search-endpoint'
          identity: managedIdentity.id
        }
        {
          name: 'azure-search-admin-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/azure-search-admin-key'
          identity: managedIdentity.id
        }
      ]
      registries: [
        {
          server: acrLoginServer
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: imageName
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'BACKEND_PORT', value: '3001' }
            { name: 'FRONTEND_URL', value: 'https://velosight.fidere.au' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
            { name: 'VITE_SUPABASE_URL', secretRef: 'supabase-url' }
            { name: 'VITE_SUPABASE_ANON_KEY', secretRef: 'supabase-anon-key' }
            { name: 'SUPABASE_SERVICE_ROLE_KEY', secretRef: 'supabase-service-role-key' }
            { name: 'AZURE_OPENAI_ENDPOINT', secretRef: 'azure-openai-endpoint' }
            { name: 'AZURE_OPENAI_KEY', secretRef: 'azure-openai-key' }
            { name: 'AZURE_OPENAI_DEPLOYMENT_GPT4O', value: 'gpt-5-mini' }
            { name: 'AZURE_OPENAI_DEPLOYMENT_EMBEDDING', value: 'text-embedding-3-small' }
            { name: 'AZURE_SEARCH_ENDPOINT', secretRef: 'azure-search-endpoint' }
            { name: 'AZURE_SEARCH_ADMIN_KEY', secretRef: 'azure-search-admin-key' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 10
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 3001
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [
    kvRoleAssignment
  ]
}

// =============================================================================
// OUTPUTS
// =============================================================================

output containerAppName string = containerApp.name
output containerAppId string = containerApp.id
output fqdn string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output managedIdentityId string = managedIdentity.id
output managedIdentityClientId string = managedIdentity.properties.clientId
