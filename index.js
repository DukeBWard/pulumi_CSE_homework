const pulumi = require('@pulumi/pulumi');
const azure = require('@pulumi/azure-native');
const docker = require('@pulumi/docker');

const config = new pulumi.Config();

// the config value
const customMessage = config.require('customMessage');

const resourceGroup = new azure.resources.ResourceGroup('resourceGroup');

const registry = new azure.containerregistry.Registry('registry', {
    resourceGroupName: resourceGroup.name,
    sku: { name: 'Basic' },
    adminUserEnabled: true,
});

const credentials = pulumi.all([registry.name, resourceGroup.name]).apply(
    ([registryName, rgName]) =>
        azure.containerregistry.listRegistryCredentials({
            registryName: registryName,
            resourceGroupName: rgName,
        })
);

const adminUsername = credentials.apply((c) => c.username);
const adminPassword = credentials.apply((c) => c.passwords[0].value);
