// Key Vault Module - Secrets Management

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

var keyVaultName = 'kv-${baseName}-${environment}'

// =============================================================================
// KEY VAULT
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// =============================================================================
// SECRET PLACEHOLDERS
// Note: Actual values must be set manually or via separate deployment
// =============================================================================

// Supabase secrets (set manually after deployment)
resource supabaseUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'supabase-url'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

resource supabaseAnonKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'supabase-anon-key'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

resource supabaseServiceRoleKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'supabase-service-role-key'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

// Azure OpenAI secrets
resource azureOpenaiEndpoint 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-openai-endpoint'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

resource azureOpenaiKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-openai-key'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

// Azure AI Search secrets
resource azureSearchEndpoint 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-search-endpoint'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

resource azureSearchKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'azure-search-admin-key'
  properties: {
    value: 'PLACEHOLDER-SET-AFTER-DEPLOYMENT'
    contentType: 'text/plain'
  }
}

// =============================================================================
// OUTPUTS
// =============================================================================

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultId string = keyVault.id
