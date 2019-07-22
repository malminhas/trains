# trains
A collection of utilities for getting UK train times from A to B using the [transportapi.com](transportapi.com) digital platform for transport.  The initial inspiration was [this codebase](https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py) developed for [a really cool Raspberry Pi-powered train board](https://twitter.com/chrishutchinson/status/1136743837244768257) built by Chris Hutchinson (@chrishutchinson) which also uses the [transportapi.com](transportapi.com) API.  During development, these utilities have been adapted to support a range of development and deployment paradigms from a simple command line interface that can be invoked in a terminal to a web app which can be run either in a standalone Docker container or in a pod in a Kubernetes cluster.  The reason for so doing was to learn about these different approaches using a practical example.

The ultimate purpose of the utilities nevertheless remains the same.  Namely to allow users an interface to conveniently determine the times of the next few trains to and from different train stations.  Train stations must be supplied in [standard three letter CRS codes](http://www.railwaycodes.org.uk/crs/CRS0.shtm).  For example `OXF`=Oxford and `PAD`=London Paddington. Here is an example of how one of the command line variants works.  The first three-letter station code represents the origin and the second the destination:
```
$ node trainsClient.js OXF PAD
```
In the web app variant, these stations are passed in as query parameters.  In this case, `node expressTrainsServer.js` has been invoked from the terminal to enable the web app to run locally on default port 8001:
```
http://localhost:8001/?from=OXF&to=PAD
```

## Prerequisites
* **[transportapi.com](transportapi.com)**: You will need to sign up with this service, create an app, obtain an API app Id plus corresponding app key and store them in two local files `.transportAppId` and `.transportAppKey` respectively.  See [here](https://developer.transportapi.com/) for more information on how to obtain these credentials.
* **node.js**: If you want to run any of the `node.js` scripts, you will need to install `npm` on your system.  The development environment used `npm` v6.9.0 and `node` v12.4.0.  By default, `npm install` will install all modules listed as dependencies in the [`package.json`](package.json).
```
$ npm install
```
* **Python**: If you want to run any of the Python scripts, you will need to install and activate a Python 3.7 virtual environment (virtualenv).  In this example it is called `tr`.  Once your are in your virtualenv you can `pip install` dependencies as follows:
```
(tr) $ pip install -r requirements.txt
```
* **Docker**: If you want to build the web app, you will need to install `docker` on your system.  The version used for development was as follows:
```
$ docker -v
Docker version 18.09.2, build 6247962
```
* **Kubernetes**: Kubernetes support was tested using a Kubernetes 1.14.1 cluster running on Digital Ocean:
```
$ kubectl version
Client Version: version.Info{Major:"1", Minor:"15", GitVersion:"v1.15.0", GitCommit:"e8462b5b5dc2584fdcd18e6bcfe9f1e4d970a529", GitTreeState:"clean", BuildDate:"2019-06-20T04:49:16Z", GoVersion:"go1.12.6", Compiler:"gc", Platform:"darwin/amd64"}
Server Version: version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.1", GitCommit:"b7394102d6ef778017f2ca4046abbaa23b88c290", GitTreeState:"clean", BuildDate:"2019-04-08T17:02:58Z", GoVersion:"go1.12.1", Compiler:"gc", Platform:"linux/amd64"}
```

## Running the client side command line tools
See [here](CommandLineScripts.md) for more details on how to use each of the following client-side utilities from the command line:
* [`trainsClient.py`](python/trainsClient.py) - Python command line interface using requests
* [`trainsClient.js`](javascript/trainsClient.js) - Javascript command line interface using promises
* [`trainsAsyncAwaitClient.js`](javascript/trainsAsyncAwaitClient.js) - Javascript command line interface using async/await
* [`trainsClient.go`](go/trainsClient.go) - Go command line interface using grequests and struct support

## Running the server side tools locally
See [here](ServerSideScripts.md) for more details on how to invoke and interface with each of the following server-side utilities:
* [`expressTrainsServer.js`](javascript/expressTrainsServer.js) - Javascript web app HTTP server invoked from command line with `curl` which uses [`trainsAsyncAwaitClient.js`](javascript/trainsAsyncAwaitClient.js) under the hood.
* [`grpcTrainsServer.js`](javascript/grpcTrainsServer.js) - Javascript gRPC server built using [`trainsAsyncAwaitClient.js`](javascript/trainsAsyncAwaitClient.js) under the hood and invoked from the command line using corresponding [`grpcTrainsClient.js`](javascript/grpcTrainsClient.js).
* [`grpcTrainsServer.go`](go/grpcTrainsServer.go) - Go gRPC server attempts to use [`trainsClient.go`](go/trainsClient.go) under the hood and is invoked from command line using the corresponding [`grpcTrainsClient.go`](javascript/grpcTrainsClient.go) Go gRPC client.  This implementation is currently incomplete.

[`expressTrainsServer.js`](javascript/expressTrainsServer.js) can be converted into a web app running in a container that can be exposed either locally via localhost or in a Kubernetes cluster.  In both cases, the container must be built with `docker` first.  In order to support this you will need the [docker-compose.yaml](javascript/docker-compose.yaml) file and underlying [Dockerfile](javascript/Dockerfile).  Assuming you have local copies of `.transportAppId` and `.transportAppKey` you can build and test a `docker` container called `express-trains` exposed on port 8001 as follows from within the `javascript` directory:
```
$ docker-compose build
$ docker-compose up express-trains
```
You should now be able to hit this container on this url in a local browser window thus:
```
$ curl "http://localhost:8001/?from=OXF&to=PAD"
```
## Running the server side tools in Kubernetes
[secret](kubernetes/express-trains-secret.yaml), [deployment](kubernetes/express-trains-deployment.yaml) and [service](kubernetes/express-trains-service.yaml) YAML files have been provided that can be applied to a Kubernetes cluster to expose the [`expressTrainsServer.js`](javascript/expressTrainsServer.js) service built into a docker container via an HTTP endpoint without directly involving an Ingress resource.  The secret YAML template is used to pass on base64-encoded [transportapi.com](transportapi.com) credentials as environment variables to avoid their inclusion within the public docker image [which is available here](https://cloud.docker.com/u/malminhas/repository/docker/malminhas/express-trains/general).  The deployment YAML houses all container handling logic and the service YAML setups up networking exposing the service on port 80.  Invoke these scripts as follows from within the `kubernetes` directory:
```
$ kubectl apply -f express-trains-secret.yaml
$ kubectl apply -f express-trains-deployment.yaml
$ kubectl apply -f express-trains-service.yaml
```
You can find a lot more detail on the specifics of how to interact with a Kubernetes cluster using `kubectl` [in these more comprehensive notes](KubernetesNotes.md).
