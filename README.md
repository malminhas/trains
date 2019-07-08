# trains
A collection of utilities for getting UK train times from A to B using the [transportapi.com](transportapi.com) digital platform for transport.  The original version was inspired by [this codebase](https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py) developed for [a really cool Raspberry Pi-powered train board](https://twitter.com/chrishutchinson/status/1136743837244768257) built by Chris Hutchinson (@chrishutchinson) which also uses the same [transportapi.com](transportapi.com) API.  During their development, they have been adapted to support a range of development and deployment paradigms from a simple command line interface that can be invoked in a terminal right the way to a web app hosted in a Docker container in a Kubernetes cluster.  The ultimate purpose of the various approaches undertaken nevertheless remains the same.  Namely to allow users a number of ways to conveniently determine the times of the next few trains to and from different train stations.  Train stations must be supplied in [standard three letter CRS codes](http://www.railwaycodes.org.uk/crs/CRS0.shtm).  For example OXF=Oxford and PAD=London Paddington. Here is an example of how one of the command line variants works.  The first station is represents the origin and the second the destination:
```
$ node trainsAsyncAwait.js OXF PAD
```
In the web app variant, these stations are passed in as query parameters as in this case in which `node expressTrains.js` has been invoked from the terminal to enable the web app to run locally:
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

## Running the command line tools
See [here](Scripts.md) for more details on how to use each of the following utilities from the command line:
* [`trains.py`](trains.py) - command line interface
* [`trains.js`](trains.js) - command line interface
* [`trainsAsyncAwait.js`](trainsAsyncAwait.js) - command line interface
* [`expressTrains.js`](expressTrains.js) - web app

## Running the web app locally
The [`expressTrains.js`](expressTrains.js) tool can also be converted into a web app running in a container that can be exposed either locally via localhost or in a Kubernetes cluster.  In both cases, the container must be built with `docker` first.  In order to support this you will need the [docker-compose.yaml](docker-compose.yaml) file and underlying [Dockerfile](Dockerfile).  Assuming you have local copies of `.transportAppId` and `.transportAppKey` you can build and test a `docker` container called `express-trains` exposed on port 8001 as follows:
```
$ docker-compose build
$ docker-compose up express-trains
```
You should now be able to hit this container on this url in a local browser window thus:
```
$ curl "http://localhost:8001/?from=OXF&to=PAD"
```
## Running the web app in Kubernetes
[secret](express-trains-secret.yaml), [deployment](express-trains-deployment.yaml) and [service](express-trains-service.yaml) YAML files have been provided that can be applied to a Kubernetes cluster to expose the service via an HTTP endpoint without directly involving an Ingress resource.  The secret YAML is used to pass on [transportapi.com](transportapi.com) credentials as environment variables to avoid their inclusion in the docker image itself.  The deployment YAML houses all container handling logic and the service YAML setups up networking:
```
$ kubectl apply -f express-trains-secret.yaml
$ kubectl apply -f express-trains-deployment.yaml
$ kubectl apply -f express-trains-service.yaml
```
You can find a lot more detail on the specifics of how to interact with a Kubernetes cluster using `kubectl` [in these comprehensive notes](KubernetesNotes.md).
