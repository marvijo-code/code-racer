@description('The name of the AKS cluster')
param clusterName string

@description('The Azure region to deploy resources')
param location string

@description('The subnet ID for the AKS cluster')
param subnetId string

@description('The Container Registry ID')
param containerRegistryId string

@description('Resource tags')
param tags object = {}

@description('The VM size for nodes')
param nodeVmSize string = 'Standard_B2s'

@description('The number of nodes')
param nodeCount int = 1

// AKS Cluster (Minimal configuration)
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-10-01' = {
  name: clusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: '1.28.9'
    dnsPrefix: '${clusterName}-dns'
    enableRBAC: true
    networkProfile: {
      networkPlugin: 'azure'
      serviceCidr: '10.100.0.0/16'
      dnsServiceIP: '10.100.0.10'
      dockerBridgeCidr: '172.17.0.1/16'
    }
    agentPoolProfiles: [
      {
        name: 'default'
        count: nodeCount
        vmSize: nodeVmSize
        osType: 'Linux'
        mode: 'System'
        vnetSubnetID: subnetId
        maxPods: 30
        type: 'VirtualMachineScaleSets'
      }
    ]
    servicePrincipalProfile: {
      clientId: 'msi'
    }
  }
}

// Role Assignment for AKS to pull from ACR
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aksCluster.id, containerRegistryId, 'AcrPull')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: aksCluster.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output clusterName string = aksCluster.name
output clusterId string = aksCluster.id
output clusterFqdn string = aksCluster.properties.fqdn
output principalId string = aksCluster.identity.principalId
output kubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId 
