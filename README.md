# trains
A variety of tools for getting UK train times from A to B using the [transportapi.com](transportapi.com) digital platform for transport.  Inspired by [this codebase](https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py) developed for [a really cool Raspberry Pi-powered train board](https://twitter.com/chrishutchinson/status/1136743837244768257) built by Chris Hutchinson (@chrishutchinson) which also uses the same [transportapi.com](transportapi.com) API.  The purpose of these tools is to allow users to conveniently determine the times of the next few trains to and from different train stations.  This can be supported either via the command line or via a web app container.  Train stations must be supplied in [standard three letter CRS codes](http://www.railwaycodes.org.uk/crs/CRS0.shtm).  For example OXF=Oxford and PAD=London Paddington. Here is an example of how one of the command line scripts works.  The first station is represents the origin and the second the destination:
```
$ node trainsAsyncAwait.js OXF PAD
```
In the web app, these stations are passed in as query parameters as in this case in which `expressTrains.js` is running locally:
```
http://localhost:8001/?from=OXF&to=PAD
```

## Prerequisites
* **[transportapi.com](transportapi.com)**: You will need to sign up with this service, create an app, obtain an API app Id plus corresponding app key and store them in `.transportAppId` and `.transportAppKey` respectively.  See [here](https://developer.transportapi.com/) for more information on how to obtain these credentials.
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

## Running the command line tools
See [here](Scripts.md) for more details on how to use each of the following tools from the command line:
* [`trains.py`](trains.py)
* [`trains.js`](trains.js)
* [`trainsAsyncAwait.js`](trainsAsyncAwait.js)
* [`expressTrains.js`](expressTrains.js)

## Running the web app locally
The [`expressTrains.js`](expressTrains.js) tool can also be converted into a web app running in a container that can be exposed either locally via localhost or in a Kubernetes cluster.  In both cases, the container must be built with `docker` first.  In order to support this you will need the [docker-compose.yaml](docker-compose.yaml) file and underlying [Dockerfile](Dockerfile).  Assuming you have local copies of `.transportAppId` and `.transportAppKey` you can build a `docker` container called `express-trains` exposed on port 8001 as follows:
```
$ docker-compose build
$ docker-compose up express-trains
```
You should now be able to hit this container thus:
```
$ curl "http://localhost:8001/?from=OXF&to=PAD"
```
## Running the web app in Kubernetes
Both [deployment](express-trains-deployment.yaml) and [service](express-trains-service.yaml) YAML files have been provided that can be applied to a Kubernetes cluster to expose the service via an HTTP endpoint without directly involving an Ingress resource:
```
$ kubectl apply -f express-trains-deployment.yaml
$ kubectl apply -f express-trains-service.yaml
```
