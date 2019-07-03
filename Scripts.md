# Command Line Scripts
Walk through each of the command line scripts.

## [trains.py](trains.py)
Python version.
```
$ python trains.py -h 
   trains.py
   ---------
   Usage:
   trains.py <from> <to>
   trains.py -h | --help
   trains.py -V | --version

   Options:
   -h --help               Show this screen.
   -V --version            Show version.

   Examples
   1. trains from RDG to PAD:
   trains.py RDG PAD
```
Here's an example invocation for trains from Oxford to London Paddington:
```
$ python trains.py OXF PAD
==============================================================================
==== Trains from Oxford (OXF) to London Paddington (PAD) 13:08 2019-06-25 ====
==============================================================================
OXF 13:31 -> PAD 14:27 => ON TIME
    Train C20803 (GW) from Worcester Foregate Street arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:01 -> PAD 14:57 => STARTS HERE
    Train C20804 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 11. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:31 -> PAD 15:35 => NO REPORT
    Train C20806 (GW) from Hereford arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 15:01 -> PAD 15:59 => STARTS HERE
    Train C20808 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 5. 4 stops:
    Oxford,Reading,Slough,London Paddington
```

## [trains.js](trains.js)
`node.js` version built using promise flow where code is daisy-chained in consecutive `.then()` method calls on promises and a `payload` object progressively added to along the way.  This allows a faster response than in the Python case where all the calls are made in serial.  However, the responses aren't currently time-ordered.  It's possible to improve the promise flow so that all output is deferred to the end when `payload` has completed and can be sorted.  That is tackled in the async-await version of the code:
```
$ node trains.js -h
trains.js
---------
Usage:
  trains.js <from> <to>
  trains.js -h | --help
  trains.js --version

Options:
  -h --help               Show this screen.
  -V --version            Show version.

Examples
1. trains from RDG to PAD:
trains.js RDG PAD
```
Here's the same invocation as above for trains from Oxford to London Paddington:
```
$ node trains.js OXF PAD
==============================================================================
==== Trains from Oxford (OXF) to London Paddington (PAD) 13:06 2019-06-25 ====
==============================================================================
OXF 15:01 -> PAD 15:59 => STARTS HERE
    Train C20808 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 5. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:01 -> PAD 14:57 => STARTS HERE
    Train C20804 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 11. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 13:31 -> PAD 14:27 => ON TIME
    Train C20803 (GW) from Worcester Foregate Street arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:31 -> PAD 15:35 => NO REPORT
    Train C20806 (GW) from Hereford arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
```

## [trainsAsyncAwait.js](trainsAsyncAwait.js)
`node.js` version built using async-await to make the code easier to follow in 'line by line' form.  Here's the same invocation as above for trains from Oxford to London Paddington this time with additional post-promise processing code to order the stations correctly:
```
$ node trainsAsyncAwait.js OXF PAD
==============================================================================
==== Trains from Oxford (OXF) to London Paddington (PAD) 13:07 2019-06-25 ====
==============================================================================
OXF 13:31 -> PAD 14:27 => ON TIME
    Train C20803 (GW) from Worcester Foregate Street arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:01 -> PAD 14:57 => STARTS HERE
    Train C20804 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 11. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 14:39 -> PAD 15:35 => LATE
    Train C20806 (GW) from Hereford arriving at Oxford on platform 3 going to London Paddington platform 9. 4 stops:
    Oxford,Reading,Slough,London Paddington
OXF 15:01 -> PAD 15:59 => STARTS HERE
    Train C20808 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 5. 4 stops:
    Oxford,Reading,Slough,London Paddington
```

## [expressTrains.js](expressTrains.js)
`express.js` version which creates a web server listening on localhost port 8001 for input with the following query parameter format in a browser where `from` and `to` are specified as three letter codes:
```
http://localhost:8001/?from=PAD&to=TWY
```
Executed as follows:
```
$ node expressTrains.js 
Example app listening on port 8001
```
This results in the same output as before being rendered in the browser window.

## Implementation notes
The command-line scripts [trains.py](trains.py), [trains.js](trains.js) and [trainsAsyncAwait.js](trainsAsyncAwait.js) share similar structure and use `docopt` for command line argument handling.  `requests` is used for invoking [transportapi.com](transportapi.com) from Python. `node-fetch` does the equivalent job in the `node.js` environment.   Multiple calls need to be made to [transportapi.com](transportapi.com) to generate the output.  A first call is made to get information about the trains in the next 2 hour window.  Further calls need to be made on each train to get information about where it is stopping.  The results are stitched together to form the output which is printed to the console.

The [expressTrains.js](expressTrains.js) script creates a server on localhost:8001 using `express.js`.  This implementation is suitable for Dockerisation.
