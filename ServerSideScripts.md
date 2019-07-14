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
The command-line scripts [trainsClient.py](python/trainsClient.py), [trainsClient.js](javascript/trainsClient.js) and [trainsAsyncAwaitClient.js](javascript/trainsAsyncAwaitClient.js) share similar structure and use `docopt` for command line argument handling.  `requests` is used for invoking [transportapi.com](transportapi.com) from Python. `node-fetch` does the equivalent job in the `node.js` environment.   Multiple calls need to be made to [transportapi.com](transportapi.com) to generate the output.  A first call is made to get information about the trains in the next 2 hour window.  Further calls need to be made on each train to get information about where it is stopping.  The results are stitched together to form the output which is printed to the console.

The [expressTrainsServer.js](javascript/expressTrainsServer.js) script creates a server on localhost:8001 using `express.js`.  This implementation is suitable for Dockerisation.
