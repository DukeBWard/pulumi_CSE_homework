const pulumi = require('@pulumi/pulumi');
const azure = require('@pulumi/azure-native');
const docker = require('@pulumi/docker');

const config = new pulumi.Config();

// the config value
const message = config.require('MESSAGE');

// temporary resource group
const resourceGroup = new azure.resources.ResourceGroup('temp-rg-group');

// temporary registry
const registry = new azure.containerregistry.Registry('tempregistry', {
    resourceGroupName: resourceGroup.name,
    sku: { name: 'Basic' },
    adminUserEnabled: true,
});

// get the registry credentials
const credentials = pulumi.all([registry.name, resourceGroup.name]).apply(
    ([registryName, rgName]) =>
        azure.containerregistry.listRegistryCredentials({
            registryName: registryName,
            resourceGroupName: rgName,
        })
);

// get the admin username and password
const adminUsername = credentials.apply((c) => c.username);
const adminPassword = credentials.apply((c) => c.passwords[0].value);

// build the image
const imageName = 'cse-exercise';
const image = new docker.Image('cse-exercise-image', {
    imageName: pulumi.interpolate`${registry.loginServer}/${imageName}:v1.0.0`,
    build: {
        // context is the current directory
        context: '.',
    },
    registry: {
        server: registry.loginServer,
        username: adminUsername,
        password: adminPassword,
    },
});

// container group
const containerGroup = new azure.containerinstance.ContainerGroup('temp-container-group', {
    resourceGroupName: resourceGroup.name,
    osType: 'Linux',
    containers: [{
        name: 'cse-exercise',
        image: image.imageName,
        ports: [{ port: 80 }],
        environmentVariables: [
            {
                name: 'MESSAGE',
                value: message,
            },
        ],
        resources: {
            requests: {
                cpu: 1,
                memoryInGB: 0.5,
            },
        },
    }],
    ipAddress: {
        ports: [{ port: 80, protocol: 'TCP' }],
        type: 'Public',
    },
    // added image registry credentials
    imageRegistryCredentials: [{
        server: registry.loginServer,
        username: adminUsername,
        password: adminPassword,
    }],
});

exports.url = containerGroup.ipAddress.apply(ip => `http://${ip.ip}:80`);