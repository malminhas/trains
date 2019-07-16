# trains - command line tools
Walk through each of the command line tools that directly invoke an [transportapi.com](transportapi.com) endpoint.

## [trainsClient.py](python/trainsClient.py)
Python version built using [`requests`](https://pypi.org/project/requests/) which is invoked serially making this version noticeably slower than the asynchronous JavaScript one.  It is possible to make an asynchronous version using cooperative multitasking (coroutines) per the outline [here](https://stackoverflow.com/questions/16015749/in-what-way-is-grequests-asynchronous).
```
$ python trainsClient.py -h 
   trainsClient.py
   ---------------
   Usage:
   trainsClient.py <from> <to>
   trainsClient.py -h | --help
   trainsClient.py -V | --version

   Options:
   -h --help               Show this screen.
   -V --version            Show version.

   Examples
   1. trains from RDG to PAD:
   trainsClient.py RDG PAD
```
Here's an example invocation for trains from Oxford to London Paddington:
```
$ python trainsClient.py OXF PAD
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

## [trainsClient.js](javascript/trainsClient.js)
`node.js` version built using promise flow where code is daisy-chained in consecutive `.then()` method calls on promises and a `payload` object progressively added to along the way.  This allows a faster response than in the Python case where all the calls are made in serial.  However, the responses aren't currently time-ordered.  It's possible to improve the promise flow so that all output is deferred to the end when `payload` has completed and can be sorted.  That is tackled in the async-await version of the code covered next:
```
$ node trainsClient.js -h
trainsClient.js
---------------
Usage:
  trainsClient.js <from> <to>
  trainsClient.js -h | --help
  trainsClient.js --version

Options:
  -h --help               Show this screen.
  -V --version            Show version.

Examples
1. trains from RDG to PAD:
trainsClient.js RDG PAD
```
Here's the same invocation as above for trains from Oxford to London Paddington:
```
$ node trainsClient.js OXF PAD
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

## [trainsAsyncAwaitClient.js](javascript/trainsAsyncAwaitClient.js)
`node.js` version built using async-await to make the code easier to follow in 'line by line' form yet remain asynchronous.  Here's the same invocation as above for trains from Oxford to London Paddington this time with additional post-promise processing code to order the stations correctly:
```
$ node trainsAsyncAwaitClient.js OXF PAD
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

## [trainsClient.go](go/trainsClient.go)
Golang version built using [`grequests`](https://github.com/levigross/grequests) and leverages structs as well as go routines for asynchronous support.  It is still noticeably slower than the asynchronous JavaScript version indicating that further optimisation could be done.  The command line invocation here is required becasue the source directory contains two go files ([stationNames.go](go/stationNames.go) and [trainsClient.go](go/trainsClient.go)).
```
$ go run . -h
    trainsClient.go
    ---------
    Usage:
    trainsClient.go <from> <to>
    trainsClient.go -h | --help
    trainsClient.go -V | --version

    Options:
    -h --help               Show this screen.
    -V --version            Show version.

    Examples
    1. trains from RDG to PAD:
    trainsClient.go RDG PAD
```
Here's an example invocation for trains from Oxford to London Paddington:
```
$ go run . OXF PAD
=============================================================================
==== Trains from Oxford (OXF) to London Paddington(PAD) 12:19 2019-07-16 ====
=============================================================================
OXF 12:31 -> PAD 12:30 => ON TIME
	Train C20800 (GW) from Great Malvern arriving at Oxford on platform 3 going to London Paddington platform 5.  4 stops:
	Oxford, Reading, Slough, London Paddington
OXF 13:01 -> PAD  => STARTS HERE
	Train C20802 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 8.  4 stops:
	Oxford, Reading, Slough, London Paddington
OXF 13:31 -> PAD 13:24 => EARLY
	Train C20803 (GW) from Worcester Foregate Street arriving at Oxford on platform 3 going to London Paddington platform 9.  4 stops:
	Oxford, Reading, Slough, London Paddington
OXF 14:01 -> PAD  => STARTS HERE
	Train C20804 (GW) from Oxford arriving at Oxford on platform 3 going to London Paddington platform 11.  4 stops:
	Oxford, Reading, Slough, London Paddington
```

## Implementation notes
The command-line scripts [trainsClient.py](python/trainsClient.py), [trainsClient.js](javascript/trainsClient.js), [trainsAsyncAwaitClient.js](javascript/trainsAsyncAwaitClient.js) and [trainsClient.go](go/trainsClient.go) share similar structure and all use `docopt` for command line argument handling.  `requests` is used for invoking [transportapi.com](transportapi.com) from Python and `grequests` performs the same job from Go.  `node-fetch` does the equivalent job in the `node.js` environment.   Multiple calls need to be made to [transportapi.com](transportapi.com) to generate the output.  A first call is made to get information about the trains in the next 2 hour window.  Further calls need to be made on each train to get information about where it is stopping.  The results are stitched together to form the output which is printed to the console.
