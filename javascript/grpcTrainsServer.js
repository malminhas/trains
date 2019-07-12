#!/usr/bin/env node
/*
 grpcTrainsServer.js
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
10.07.19  0.1   Initial version 
*/ 

'use strict';
const PROTO_PATH = __dirname + './../trains.proto'
const SERVER_PORT = 8001
const VERSION = '0.1'

const fs = require('fs');
const trains = require('./trainsAsyncAwaitClient')
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
		const value = query[key]
		console.log(`key='${key}',value='${value}'`)
	})
}

async function startFlow(station,dest) {
    let payload = {
        station_code: station,
        dest_code: dest,
        //dest_name: dest_name
    }
    payload = await trains.getTrainsCallingAt(payload)
    payload = await trains.getAllTrainStops(payload)
    return payload
}

function getTrains(call,callback) {
	// Implements getTrains RPC method
	console.log(call)
	const station = call.request.from
	const dest = call.request.to
	console.log(station,dest)
	// Do the async stuff here
    startFlow(station,dest)
        .then(payload => {
			console.log(payload)
			/*let res = {expected_arrival: 
					   expected_departure:
					   uid: payload.uid,
					   operator:
						key='status',value=''
			key='origin_name',value=''
			key='start',value='null'
			key='destination',value='null'
			key='stops'}*/
			//dumpObject(payload)
            callback(null,payload)
        })
}

function main() {
    let server = new grpc.Server()
    server.addService(trains_proto.TrainService.service, {
	    getTrains: getTrains,
		})
	server.bind(`0.0.0.0:${SERVER_PORT}`, grpc.ServerCredentials.createInsecure())
    console.log(`grpcTrains.js version ${VERSION} listening on port ${SERVER_PORT}`)
	server.start()
}

if (require.main === module) {
	main()
}

exports.main = main;