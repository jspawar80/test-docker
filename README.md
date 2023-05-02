To create a GitAction workflow for a Node.js application with Docker and docker-compose, you can follow the steps below:

1. Create a new file named .github/workflows/deploy.yml in the root of your repository.

2. Paste the following YAML code into the file:

```
name: Deploy to Docker

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: username/repo:${{ github.sha }}

      - name: Deploy to Docker
        uses: appleboy/ssh-action@v0.4.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          password: ${{ secrets.DEPLOY_PASSWORD }}
          script: |
            cd /path/to/project
            docker-compose down
            docker-compose pull
            docker-compose up -d
```
3. Replace username/repo with the name of your Docker Hub repository.

4. Replace /path/to/project with the path to your project on the deployment server.

5. Create secrets for DOCKER_USERNAME, DOCKER_PASSWORD, DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PASSWORD in your repository settings. The DOCKER_USERNAME and   DOCKER_PASSWORD secrets are used to log in to Docker Hub. The DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PASSWORD secrets are used to log in to the deployment   server.

6. Commit the changes and push to your repository.

This workflow will build and push a Docker image to Docker Hub on every push to the main branch. It will then deploy the latest image to the deployment server using docker-compose. If the container already exists, it will be redeployed with the pull policy set to "always".


# Docker-compose.yaml

```
version: '3.8'

services:
  app:
    image: jspawar80/test-docker:latest
    restart: always
    ports:
      - 3000:3000
    environment:
      - NODE_ENV=production
    command: npm start
```
------------------------------------------------------------

#create sample node app with dockerfile

1. First, create a new directory for your project and navigate to it:

```
mkdir my-node-app
cd my-node-app
```
2. Create a new file named app.js with the following code:

```
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World!');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```
This creates a simple HTTP server that listens on port 3000 and responds with "Hello World!" to any request.


3. Create a new file named package.json with the following code:
```
{
  "name": "my-node-app",
  "version": "1.0.0",
  "description": "A sample Node.js app",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {}
}
```
4. Create a new file named Dockerfile with the following code:

```
# Use the official Node.js 16 image as the base image
FROM node:16

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to /app
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to /app
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
```
This sets up a Dockerfile that will create a new image based on the official Node.js 16 image, sets up the working directory, installs dependencies, copies the rest of the application code, and sets up the command to start the application.

5. Build the Docker image by running the following command in the terminal:
```
docker build -t my-node-app .
```
This will create a new Docker image named my-node-app.

6. Run the Docker container by running the following command in the terminal:
```
docker run -p 3000:3000 my-node-app
```
This will start the container and map port 3000 from the container to port 3000 on the host machine
7. Open a web browser and navigate to http://localhost:3000 to see the "Hello World!" message.

That's it! You've now created a Node.js application with a Dockerfile and run it in a Docker container.

---------------------------
#azure AKS runner

To set up self-hosted auto-scaling GitHub Runners on Azure Kubernetes Service (AKS), you can follow these steps:

1. Create an Azure Kubernetes Service (AKS) cluster:

If you don't have an AKS cluster, create one using the Azure Portal, Azure CLI, or Terraform. For example, using Azure CLI:

```
az login
az group create --name myResourceGroup --location eastus
az aks create --resource-group myResourceGroup --name myAKSCluster --node-count 1 --generate-ssh-keys
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster
```

2 .Install kubectl and Helm:

Ensure you have both kubectl and helm installed on your local machine. You can install them using package managers like Homebrew, Chocolatey, or apt.

3 .Create a GitHub personal access token:

Create a personal access token on GitHub with the repo, admin:org, and admin:repo_hook scopes. Save the token, as you'll need it later.

4. Deploy the GitHub Runner using Helm:

Add the Helm repository for the GitHub Actions Runner:

```
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm repo update
```
Create a values.yaml file for your Helm deployment with the following content:

```
controllerManager:
  env:
    - name: GITHUB_TOKEN
      value: "<your_github_token>"

runners:
  repository: <your_github_repository>
  minReplicas: 1
  maxReplicas: 4
  resources:
    limits:
      cpu: "2"
      memory: "4Gi"
    requests:
      cpu: "1"
      memory: "2Gi"
```
Replace <your_github_token> with your GitHub personal access token and <your_github_repository> with the repository where the runners will be used.

Deploy the GitHub Runner using Helm:

```
helm install --namespace actions-runner-system --create-namespace github-runner actions-runner-controller/actions-runner-controller -f values.yaml
```
5. Configure GitHub Runner autoscaling:

The runner will auto-scale based on the provided minReplicas and maxReplicas values in the values.yaml file.

Test the GitHub Runner:

6. Create a GitHub Actions workflow in your repository with the following content:

```
name: CI

on: [push]

jobs:
  build:
    runs-on: self-hosted

    steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Run a one-line script
      run: echo "Hello, world!"
```

Commit and push the workflow to your repository. The self-hosted runner should pick up the job and execute it. You can view the progress in the "Actions" tab of your GitHub repository.

The ephemeral GitHub Runners should now be set up and will auto-scale based on the workload, up to 4 nodes.

