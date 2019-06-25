trains
======
Command line tools for getting UK train times from A to B using the [transportapi.com](transportapi.com) digital platform for transport.  Inspired by [this codebase](https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py) developed for [this really cool Raspberry Pi-powered train board](https://twitter.com/chrishutchinson/status/1136743837244768257) built by Chris Hutchinson (@chrishutchinson) which also uses the same [transportapi.com](transportapi.com) API.  The purpose of the script is to allow me to use the command line to conveniently determine the times of the next few trains to and from my London station which happens to be Paddington.

trains.py
---------
Python version.
```
$ python trains.py -h 
   trains.py
   ---------
   Usage:
   trains.py <from> <to> <dest_name>
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
$ python trains.py OXF PAD "London Paddington"
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

trains.js
---------
node.js version built using promise flow where code is daisy-chained in consecutive `.then()` method calls on promises and a `payload` object progressively added to along the way.  This allows a faster response than in the Python case where all the calls are made in serial.  However, the responses aren't currently time-ordered.  It's possible to improve the promise flow so that all output is deferred to the end when `payload` has completed and can be sorted.  That is tackled in the async-await version of the code:
```
$ node trains.js -h
trains.js
---------
Usage:
  trains.js <from> <to> <dest_name>
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
$ node trains.js OXF PAD "London Paddington"
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

trainsAsyncAwait.js
-------------------
node.js version built using async-await to make the code easier to follow in 'line by line' form.  Here's the same invocation as above for trains from Oxford to London Paddington this time with additional post-promise processing code to order the stations correctly:
```
$ node trainsAsyncAwait.js OXF PAD "London Paddington"
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

Installation
------------
* Python: see requirements.txt:
```
$ pip install > requirements.txt
```
* Node.js: see `package.json`

Notes on implementation
-----------------------
Both scripts share similar structure and use `docopt` for command line argument handling.  `requests` is used for invoking [transportapi.com](transportapi.com) from Python. `node-fetch` does the equivalent job in the node.js environment.   Multiple calls need to be made to [transportapi.com](transportapi.com) to generate the output.  A first call is made to get information about the trains in the next 2 hour window.  Further calls need to be made on each train to get information about where it is stopping.  The results are stitched together in the output.
