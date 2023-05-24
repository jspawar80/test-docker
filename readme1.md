## Preriqisites  ( This document refered for ubuntu linux only )

This Github Action pipeline setups and deploys the NodeJs app with PM2 and also setups the nginx configuration for the given domain.

* Install NodeJs, NPM, Docker, Docker-compose, Nginx
* Make sure you point the IP to correct domain/subdomain

### 1. Create Github Action file in repo path `.github/workflows/deploy.yaml`

```
name: Deploy to Docker

on:
  push:
    branches: [ dev, new-prod ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Extract branch name
        shell: bash
        run: echo "BRANCH_NAME=$(echo ${GITHUB_REF#refs/heads/} | sed 's/\//\-/g')" >> $GITHUB_ENV

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
          tags: ${{ secrets.DOCKER_USERNAME }}/${{ secrets.APP_NAME }}:${{ env.BRANCH_NAME }}

            
      - name: Deploy to Docker
        uses: appleboy/ssh-action@v0.1.2
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_PRIVATE_KEY }}
          port: ${{ secrets.DEPLOY_PORT }}
          script: |
            BRANCH_NAME=${{ env.BRANCH_NAME }}
            if [ "$BRANCH_NAME" == "dev" ]; then
              PORT=3018
            elif [[ "$BRANCH_NAME" == "new-prod" ]]; then
              PORT=3019
            elif [[ "$BRANCH_NAME" == "new-uat" ]]; then
              PORT=3020
            else
              PORT=3018
            fi
            echo $PORT
            CURRENT_BRANCH="${{ github.ref }}"
            CURRENT_BRANCH=${CURRENT_BRANCH#refs/heads/}

            REPOSITORY_NAME="${{ secrets.REPOSITORY_NAME }}"

            if [ -d "$REPOSITORY_NAME" ]; then
              cd $REPOSITORY_NAME
              git checkout $CURRENT_BRANCH
              git pull
            else
              git clone git@github.com:infonextsolutions/$REPOSITORY_NAME.git
              cd $REPOSITORY_NAME
              git checkout $CURRENT_BRANCH
            fi
            sed -e "s/branchname/${{ env.BRANCH_NAME }}/g" docker-compose-template.yml > docker-compose.yml
            sed -i -e "s/imagename/${{ secrets.APP_NAME }}/g" docker-compose.yml
            sed -i -e "s/username/${{ secrets.DOCKER_USERNAME }}/g" docker-compose.yml
            sed -i -e "s/portnumber/$PORT/g" docker-compose.yml
            docker-compose down
            docker-compose pull
            docker-compose up -d
```

### 3. Setup Action secrets in Github Repo

* `DOCKER_USERNAME` >> Username of Docker Account
* `DOCKER_PASSWORD` >> Password of Docker Account
* `APP_NAME` >> Same as PM2 APP Name
* `DEPLOY_HOST` >> Host/IP of the server
* `DEPLOY_USER` >>  SSH username i.e (ubuntu,root)
* `DEPLOY_PRIVATE_KEY` >>  SSH Private Key 
* `DEPLOY_PORT` >> Application port ( can be found in Application Index file )
* `DEPLOY_USER` >>  SSH username i.e (ubuntu,root)
* `REPOSITORY_NAME` >>  Nanme of the Github repository you want deploy

### Workflow Customization
 
* Branches: By default, the workflow is configured to trigger on pushes to the dev and new-prod branches. You can modify the branches section under the on configuration to specify different branch names.
```
branches: [ dev, new-prod, "branch-name" ]
```
* Docker Hub credentials: Update the DOCKER_USERNAME and DOCKER_PASSWORD secrets in the workflow with your Docker Hub credentials.
* SSH credentials: Update the DEPLOY_HOST, DEPLOY_USER, DEPLOY_PRIVATE_KEY, and DEPLOY_PORT secrets in the workflow with your SSH credentials for the remote Docker host.
* Port mapping: The deployment script sets the appropriate port number based on the branch name. Modify the port assignments in the script section of the "Deploy to Docker" step if needed.
* Repository name: Update the REPOSITORY_NAME secret with the name of your GitHub repository in the deployment script.
* Docker Compose customization: The deployment script uses a docker-compose-template.yml file as a template and modifies it to create the docker-compose.yml file. Customize the template file according to your Docker Compose configuration needs.

### 3. Change the port in nginx config for domain
```
server {
  listen 80;
  server_name example.com;
        return 301 https://$host$request_uri;
server_tokens off;
}
 
server {
  listen 443 ssl;
  server_name example.com;
  server_tokens off;
  location / {
      proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
  }
        ssl_certificate         /etc/nginx/ssl/nextsolutions.in/server.crt;
        ssl_certificate_key     /etc/nginx/ssl/nextsolutions.in/server.key;
        ssl_dhparam  /etc/nginx/ssl/dhparam.pem;
        ssl_session_cache shared:SSL:50m;
        ssl_session_timeout 1440m;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;

        ssl_ciphers "ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS";
}
```

Run this command after changing the port in Nginx conf

```
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo docker-compose up -d
```
