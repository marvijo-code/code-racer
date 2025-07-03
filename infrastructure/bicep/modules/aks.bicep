@description('The name of the AKS cluster')
param clusterName string

@description('The Azure region to deploy resources')
param location string

@description('The subnet ID for the AKS cluster')
param subnetId string

@description('The Log Analytics workspace ID')
param logAnalyticsWorkspaceId string

@description('The Container Registry ID')
param containerRegistryId string

@description('Resource tags')
param tags object = {}

@description('The Kubernetes version')
param kubernetesVersion string = '1.29.0'

@description('The VM size for the system node pool')
param systemNodeVmSize string = 'Standard_D2s_v3'

@description('The VM size for the user node pool')
param userNodeVmSize string = 'Standard_D4s_v3'

@description('The number of nodes in the system node pool')
param systemNodeCount int = 2

@description('The number of nodes in the user node pool')
param userNodeCount int = 3

// AKS Cluster
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-10-01' = {
  name: clusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: '${clusterName}-dns'
    enableRBAC: true
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '10.100.0.0/16'
      dnsServiceIP: '10.100.0.10'
      dockerBridgeCidr: '172.17.0.1/16'
    }
    agentPoolProfiles: [
      {
        name: 'system'
        count: systemNodeCount
        vmSize: systemNodeVmSize
        osType: 'Linux'
        mode: 'System'
        vnetSubnetID: subnetId
        enableAutoScaling: true
        minCount: 1
        maxCount: 5
        maxPods: 30
        type: 'VirtualMachineScaleSets'
        availabilityZones: [
          '1'
          '2'
          '3'
        ]
        nodeTaints: [
          'CriticalAddonsOnly=true:NoSchedule'
        ]
      }
    ]
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
      azurepolicy: {
        enabled: true
      }
      ingressApplicationGateway: {
        enabled: false
      }
    }
    autoScalerProfile: {
      'scale-down-delay-after-add': '10m'
      'scale-down-unneeded-time': '10m'
      'scale-down-utilization-threshold': '0.5'
    }
    servicePrincipalProfile: {
      clientId: 'msi'
    }
  }
}

// User Node Pool for application workloads
resource userNodePool 'Microsoft.ContainerService/managedClusters/agentPools@2023-10-01' = {
  parent: aksCluster
  name: 'user'
  properties: {
    count: userNodeCount
    vmSize: userNodeVmSize
    osType: 'Linux'
    mode: 'User'
    vnetSubnetID: subnetId
    enableAutoScaling: true
    minCount: 1
    maxCount: 10
    maxPods: 50
    type: 'VirtualMachineScaleSets'
    availabilityZones: [
      '1'
      '2'
      '3'
    ]
    nodeLabels: {
      'node-type': 'application'
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

// Network Contributor role for AKS to manage network resources
resource networkContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aksCluster.id, resourceGroup().id, 'NetworkContributor')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4d97b98b-1d4f-4787-a291-c67834d212e7') // Network Contributor
    principalId: aksCluster.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output clusterName string = aksCluster.name
output clusterId string = aksCluster.id
output clusterFqdn string = aksCluster.properties.fqdn
output principalId string = aksCluster.identity.principalId
output kubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId
output nodeResourceGroup string = aksCluster.properties.nodeResourceGroup 
