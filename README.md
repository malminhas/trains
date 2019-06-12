trains
======
Simple command line script for getting UK train times from A to B using the [transportapi.com](transportapi.com) digital platform for transport.  Inspired by [this codebase](https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py) developed for [a really cool Raspberry Pi-powered train board](https://twitter.com/chrishutchinson/status/1136743837244768257) by Chris Hutchinson (@chrishutchinson) which also uses the same API.  The purpose of the script is to allow me to use the command line to conveniently determine the times of the next few trains from my London station which happens to be Paddington.

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
   1. trains from TWY to PAD:
   trains.py TWY PAD
```
Here's an example invocation for trains from London Paddington to Reading:
```
$ python trains.py PAD RDG Reading
===============================================================================
==== Trains from London Paddington (PAD) to Reading (RDG) 01:28 2019-06-12 ====
===============================================================================
PAD 01:34 -> RDG 02:31 => STARTS HERE
	Train C23362 (GW) from London Paddington arriving at London Paddington on platform 5 going to Reading platform 14. 9 stops:
	London Paddington,Ealing Broadway,Southall,Hayes & Harlington,West Drayton,Slough,Maidenhead,Twyford,Reading
```

trains.js
---------
node.js version. 
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
1. trains from TWY to PAD:
trains.js TWY PAD
```
Here's the same invocation as above for trains from London Paddington to Reading:
```
$ node trains.js PAD RDG Reading
===============================================================================
==== Trains from London Paddington (PAD) to Reading (RDG) 01:34 2019-06-12 ====
===============================================================================
PAD 03:34 -> RDG 04:28 => STARTS HERE
	Train C23364 (GW) from London Paddington arriving at London Paddington on platform 3 going to Reading platform 13. 9 stops:
	London Paddington,Ealing Broadway,Southall,Hayes & Harlington,West Drayton,Slough,Maidenhead,Twyford,Reading
```

Notes on implementation
---------
Both scripts share similar structure and use `docopt` for command line argument handling.  `requests` is used for invoking transportapi.com from Python. `node-fetch` does the equivlent job in the node.js environment.
