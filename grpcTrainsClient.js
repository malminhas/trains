#!/usr/bin/env node
/*
 grpcTrainsClient.js
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
transportAPI is documented here: https://developer.transportapi.com/docs?raml=https://transportapi.com/v3/raml/transportapi.raml
More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
The .csv used in this code is available here: https://www.nationalrail.co.uk/stations_destinations/48541.aspx 
A local utility module called stationNames.js uses this .csv to convert between three-letter codes and verbose station names.
Some examples are:
1. London Paddington = PAD
2. London Waterloo = WAT
3. London Bridge = LBG

Installation
------------
$ npm install node-fetch
$ npm install docopt

Version
-------
11.07.19  0.1   Initial version 
*/ 

'use strict';
const PROGRAM = 'grpcTrainsClient.js'
const VERSION = '0.4'
const DATE = '08.07.19'
const AUTHOR = 'Mal Minhas'

const PROTO_PATH = __dirname + '/trains.proto'
const SERVER_PORT = 8001

const fs = require('fs');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
					     PROTO_PATH,
					     {keepCase: true,
						  longs: String,
						  enums: String,
						  defaults: true,
						  oneofs: true
						 });
const trains_proto = grpc.loadPackageDefinition(packageDefinition).trains

function dumpObject(obj) {
	Object.keys(obj).forEach(key => {
		const value = obj[key]
		console.log(`key='${key}',value='${value}'`)
	})
}

let main = function(){
    // main code
    const doc = `
    ${PROGRAM}
    ---------
    Usage:
      ${PROGRAM} <from> <to>
      ${PROGRAM} -h | --help
      ${PROGRAM} --version
    
    Options:
      -h --help               Show this screen.
      -V --version            Show version.
    
    Examples
    1. trains from RDG to PAD:
    ${PROGRAM} RDG PAD
	`
	
    const {docopt} = require('docopt');
    
    // Can't use `arguments` here in strict mode
    let args = docopt(doc, {
      version: `${VERSION} ${DATE} ${AUTHOR}`
    })
    
    const station = args['<from>']
    const dest = args['<to>']
    //const dest_name = args['<dest_name>']

	console.log(`Invoking getTrains from=${station}, to=${dest}`)
	const client = new trains_proto.TrainService('localhost:8001', grpc.credentials.createInsecure());
	client.getTrains({from: station, to: dest}, function(err, response) {
		dumpObject(response);
	  });  
}
    
if (require.main === module) {
    main();
}