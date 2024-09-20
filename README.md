Local deployment:
`docker build -t myapp .`
`docker run -p 80:80 myapp`

Pulumi deployment (Azure Container Instance):
`pulumi up`

Adjusting config value:
`pulumi config set MESSAGE "xyz"`

