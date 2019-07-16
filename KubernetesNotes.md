# trains - Docker and Kubernetes (k8s)
Detailed notes on building a Docker image for trains and using it in a Kubernetes cluster.

## Creating a Docker image
1. Create minimal Dockerfile without creds being copied over:
```
FROM node:12
# 1. Make workdir as user `node`
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
# 2. A wildcard is used to ensure both package.json 
# AND package-lock.json are copied where available (npm@5+)
COPY package*.json ./
# 3. Bundle app source into docker image.  
# Avoid mounting host directories within containers.
#COPY . .
# NOTE: Here we are NOT copying API creds over.  They are handled separately
# NOTE also that you can only copy files in docker context
# https://www.jamestharpe.com/include-files-outside-docker-build-context/
COPY --chown=node:node expressTrainsServer.js .
COPY --chown=node:node trainsAsyncAwaitClient.js .
COPY --chown=node:node stationNames.js .
COPY --chown=node:node station_codes.csv .
# 4. expressTrains binds to port 8001 so use the EXPOSE instruction to have it 
# mapped by the docker daemon
EXPOSE 8001
# 5. Avoid running container processes as root and switch to user `node` here
# https://github.com/nodejs/docker-node/issues/740
USER node
# 6. Install package and its dependencies using either package.json if present 
# or package-lock.json.  Note that an updated package.json 
# can trump package-lock.json whenever a newer version is found for a 
# dependency in package.json. If you are building your code for production
# RUN npm ci --only=production
RUN npm install
# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "expressTrainsServer.js" ]
```
2. Create `docker-compose.yaml` which adds creds to the base docker image thus:
```
# Note that this will only work with 'docker-compose up'
# The underlying docker image above will NOT have them in.
version: "2"
services:
  express-trains:
    build: .
    image: malminhas/express-trains:composed
    ports:
        - 8001
    volumes:
        - ./.transportAppId:/usr/src/app/.transportAppId
        - ./.transportAppKey:/usr/src/app/.transportAppKey
        - ./README.md:/usr/src/app/README.md
```
3. Build docker image locally:
`$ docker-compose build --no-cache`
4. Test docker image works locally:
`$ docker-compose up --force-recreate`
5. Check what containers are running:
`$ docker ps
CONTAINER ID        IMAGE                               COMMAND                  CREATED             STATUS              PORTS                    NAMES
435ab2acc3dc        malminhas/express-trains:composed   "docker-entrypoint.s…"   10 hours ago        Up About a minute   0.0.0.0:8001->8001/tcp   transport_express-trains_1`
6. Log into docker image and check files have been added where expected:
 `$ docker exec -it 435ab2acc3dc /bin/bash
 root@435ab2acc3dc:/usr/src/app# ls -a
 .   .transportAppId   README.md        node_modules       package.json     station_codes.csv
 ..  .transportAppKey  expressTrains.js    package-lock.json  stationNames.js  trainsAsyncAwait.js`
7. Check local listed docker images:
`$ docker images`
8. Create local docker image that adds creds and push it to DockerHub.   Note that the image pushed to DockerHub will only work in Kubernetes if the `composed` Dockerfile had creds added.  Otherwise you need to add support for secrets to be handled using env variables in a `secrets.yaml`.  The image being modified with `docker-compose` per above will be pushed without those additional `docker-compose` modifications.
`$ docker push malminhas/express-trains:composed`
9. Check it is listed here: `https://hub.docker.com/r/malminhas/express-trains`
 
## Init Digital Ocean k8s Cluster
1. Start the cluster in DO control panel
2. Download the config file and copy it into `/CODE/kubernetes`
3. Set the `KUBECONFIG` env variable:
 `$ export KUBECONFIG=k8s-1-14-1-do-4-lon1-1562103885140-kubeconfig.yaml`
4. Set an alias for `kubectl`
5. List nodes in cluster:
`$ k get nodes
NAME                  STATUS   ROLES    AGE   VERSION
pool-s9ice2gtj-o5s4   Ready    <none>   21h   v1.14.1
pool-s9ice2gtj-o5sh   Ready    <none>   21h   v1.14.1`
6. Describe nodes in cluster:
`$ k describe nodes`
7. Check version of `kubectl`:
`$ k version`

## Create and delete k8s Deployment using image from public DockerHub registry
1. Create a deployment.yaml as follows.  This is for `express-trains` which is a `simple express.js` web app.
The docker image was built and tested locally before being pushed to DockerHub as a public image.
Note you MUST have labels and selector and that the docker image:
```
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  labels:
    app: express-trains
  name: express-trains
spec:
  replicas: 1
  selector:
    matchLabels:
      app: express-trains
  template:
    metadata:
      labels:
        app: express-trains
    spec:
      containers:
      - name: express-trains
        image: malminhas/express-trains:composed
        imagePullPolicy: IfNotPresent|Always
        ports:
        - containerPort: 8001
          protocol: TCP
```
2. Now you can apply this config as follows:
`$ k apply -f deployment.yaml`
3. Check the deployment worked:
`$ k get deployments`
`$ k describe deployments`
4. To delete a deployment, find it via kubectl:
`$ k get deployment`
`$ k delete deployment express-trains`

## Create and delete k8s Service 
1. Create a service.yaml as follows.  Note the LoadBalancer is an alternative to Ingress for exposing the service externally:
```
apiVersion: v1
kind: Service
metadata:
  labels:
    app: express-trains
  name: express-trains
spec:
  type: LoadBalancer
  selector:
    app: express-trains
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8001
      name: http
```
2. Now you can apply this config as follows:
`$ k apply -f service.yaml`
3. Check the service worked:
`$ k get svc
NAME             TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
express-trains   LoadBalancer   10.245.134.92   67.207.69.119   80:31668/TCP   21h
kubernetes       ClusterIP      10.245.0.1      <none>          443/TCP        21h`
4. Check the LoadBalancer Ingress IP:
`$ k describe svc express-trains
Name:                     express-trains
Namespace:                default
Labels:                   app=express-trains
Annotations:              kubectl.kubernetes.io/last-applied-configuration:
{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app":"express-trains"},"name":"express-trains","namespace":"de...
Selector:                 app=express-trains
Type:                     LoadBalancer
IP:                       10.245.134.92
LoadBalancer Ingress:     67.207.69.119
Port:                     http  80/TCP
TargetPort:               8001/TCP
NodePort:                 http  31668/TCP
Endpoints:                10.244.1.199:8001
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>`
5. You can check logs from the container:
`$ k logs svc/express-trains`
`$ k logs -f svc/express-trains`
6. You can get a [shell into the container](https://kubernetes.io/docs/tasks/debug-application-cluster/get-shell-running-container/) as follows:
`$ k exec -it svc/express-trains -- /bin/bash`
7. To delete a service, find it via kubectl:
`$ k get svc`
`$ k delete svc express-trains`
8. To test the service endpoint go to this URL: `http://67.207.69.119/?from=TWY&to=PAD`

## Update image from public DockerHub registry
1. A second PUBLIC image with creds included in the image and with Dockerfile tagged as `composed2` can be switched in as follows:
`$ k set image deployment/express-trains express-trains=malminhas/express-trains:composed2`
`$ k rollout status deployment.v1.apps/nginx-deployment`
2. This image should not be left available and listed here: `https://hub.docker.com/r/malminhas/express-trains`
Instead we want to update our deployment.yaml to include a `secrets` section for the `composed` image that adds in creds as 
environment variables per the next section.

## Updated k8s Deployment to include environment variables via secret file
1. Note that it is possible to pass env variables through to docker containers at build time as described here:
`https://vsupalov.com/docker-arg-env-variable-guide/`
We're not going to do that but use a different approach that involves creating environment variables in our Kubernetes deployment.yaml.
2. First create a secret.yaml file as follows.  You will need to replace the placeholders with corresponding base64-encoded creds for Opaque type:
```
apiVersion: v1
kind: Secret
metadata:
  name: express-trains-credentials
type: Opaque
data:
  appId: <base64-encoded appId>
  appKey: <base64-encoded appKey>
```
This command will get you a base64-encoded string from the `.transportAppId` file.
`$ cat .transportAppId | base64`
3. Now you can apply this secret as follows:
`$ k apply -f secret.yaml`
4. Check the secret was properly applied:
`$ k get secrets
k get secrets
NAME                         TYPE                                  DATA   AGE
default-token-hbsbn          kubernetes.io/service-account-token   3      5d15h
express-trains-credentials   Opaque                                2      17s
regcred                      kubernetes.io/dockerconfigjson        1      4d18h`
5. Now we are all set to include the secret within our deployment.yaml as follows.  This snippet shows the relevant `containers` section:
```
      containers:
      - name: express-trains
        image: malminhas/express-trains:composed
        imagePullPolicy: Always
        ports:
        - containerPort: 8001
          protocol: TCP
        securityContext:
          #runAsUser: node # complains about this being a string not a number
          #runAsGroup: 3000
          #fsGroup: 2000
          allowPrivilegeEscalation: false
        env:
          - name: TRANSPORTAPPID
            valueFrom:
              secretKeyRef:
                name: express-trains-credentials
                key: appId
          - name: TRANSPORTAPPKEY
            valueFrom:
              secretKeyRef:
                name: express-trains-credentials
                key: appKey

```
7. Now you can apply this config as follows:
`$ k apply -f deployment.yaml`
8. Check the deployment worked:
`$ k get deployments`
`$ k describe deployment express-trains`
```
Name:                   express-trains
Namespace:              default
CreationTimestamp:      Mon, 08 Jul 2019 14:40:30 +0100
Labels:                 app=express-trains
Annotations:            deployment.kubernetes.io/revision: 1
                        kubectl.kubernetes.io/last-applied-configuration:
                          {"apiVersion":"extensions/v1beta1","kind":"Deployment","metadata":{"annotations":{},"labels":{"app":"express-trains"},"name":"express-trai...
Selector:               app=express-trains
Replicas:               1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  1 max unavailable, 1 max surge
Pod Template:
  Labels:  app=express-trains
  Containers:
   express-trains:
    Image:      malminhas/express-trains:composed
    Port:       8001/TCP
    Host Port:  0/TCP
    Environment:
      TRANSPORTAPPID:   <set to the key 'appId' in secret 'express-trains-credentials'>   Optional: false
      TRANSPORTAPPKEY:  <set to the key 'appKey' in secret 'express-trains-credentials'>  Optional: false
    Mounts:             <none>
  Volumes:              <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
OldReplicaSets:  <none>
NewReplicaSet:   express-trains-6c6c6b5d4f (1/1 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  3m15s  deployment-controller  Scaled up replica set express-trains-6c6c6b5d4f to 1
```
9. You can check logs from the container:
`$ k logs svc/express-trains`
`$ k logs -f svc/express-trains`
10. You can get a [shell into the container](https://kubernetes.io/docs/tasks/debug-application-cluster/get-shell-running-container/) as follows:
`$ k exec -it svc/express-trains -- /bin/bash`

## Pulling an image from a private DockerHub registry
1. For completeness, as a final alternative, we could build the docker image with credentials included 
but switch to making the repository PRIVATE inside DockerHub.  The instructions below should work but haven't been verified yet.
2. Log into Docker
`$ docker login`
3. Check you have a docker config.json here:
`$ cat ~/.docker/config.json`
4. Create a Secret by providing credentials on the command line
`$ k create secret docker-registry regcred --docker-server='https://index.docker.io/v1/' --docker-username=malminhas --docker-password=<passwd> --docker-email=mal@malm.co.uk
secret/regcred created`
5. Inspect the Secret regcred:
`$ k get secret regcred --output=yaml`
6. To understand what is in the .dockerconfigjson field, convert the secret data to a readable format:
`$ k get secret regcred --output="jsonpath={.data.\.dockerconfigjson}" | base64 --decode`
7. Here is config for your deployment.yaml for gaining access to your Docker credentials in regcred:
```
containers:
- name: private-reg-container
  image: <your-private-image>
imagePullSecrets:
- name: regcred
```
8. Now you should be able to push your docker image as a private one:
`$ docker push malminhas/express-trains:composed`
