const pulumi = require('@pulumi/pulumi');
const azure = require('@pulumi/azure-native');
const docker = require('@pulumi/docker');

const config = new pulumi.Config();

// the config value
const customMessage = config.require('MESSAGE');

const resourceGroup = new azure.resources.ResourceGroup('temp_rg_group');

const registry = new azure.containerregistry.Registry('tempregistry', {
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

const imageName = 'CSE_exercise';
const image = new docker.Image('CSE_exercise-image', {
    imageName: pulumi.interpolate`${registry.loginServer}/${imageName}:v1.0.0`,
    build: {
        context: '.',
    },
    registry: {
        server: registry.loginServer,
        username: adminUsername,
        password: adminPassword,
    },
});


