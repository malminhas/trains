# trains - server side tools
Walk through each of the server side utilities that encapsulate an [transportapi.com](transportapi.com) endpoint and allow you to access it through a web API.

## [expressTrainsServer.js](javascript/expressTrainsServer.js)
`express.js` version which creates a web server listening on localhost port 8001 for input with the following query parameter format in a browser where `from` and `to` are specified as three letter codes:
```
http://localhost:8001/?from=PAD&to=TWY
```
Alternatively can be `curled` as follows:
```
$ curl "http://localhost:8001/?from=PAD&to=TWY"
```
The server is instantiated as follows:
```
$ node expressTrainsServer.js 
Example app listening on port 8001
```
This results in the same simple output as in the command line cases in this instance rendered in the browser window.

## Implementation notes
The [expressTrainsServer.js](javascript/expressTrainsServer.js) script creates a server on localhost:8001 using `express.js`.  The [grpcTrainsServer.js](javascript/grpcTrainsServer.js) script provides a gRPC implementation of the service built on the [trains.proto](trains.proto) file which instantiates a [protocol buffer](https://developers.google.com/protocol-buffers/docs/proto) based definition of the interface between client and server. Both implementations are suitable for Dockerisation though [the example provided](javascript/Dockerfile) in this repository is for [expressTrainsServer.js](javascript/expressTrainsServer.js).

Under the hood both scripts leverage [trainsAsyncAwaitClient.js](javascript/trainsAsyncAwaitClient.js) functionality to encapsulate access to the underlying [transportapi.com](transportapi.com) API.  In the case of [expressTrainsServer.js](javascript/expressTrainsServer.js) responses are sent back to the client as a string to be displayed via `curl` or rendered in the browser window.  In the case of [grpcTrainsServer.js](javascript/grpcTrainsServer.js) the client needs to process the response according to the definition laid out in the [trains.proto](trains.proto) file.  An example client implementation, [grpcTrainsClient.js](javascript/grpcTrainsClient.js) is provided.
