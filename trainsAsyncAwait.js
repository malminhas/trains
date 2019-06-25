#!/usr/bin/env node
/*
 trainsAsyncAwait.js
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
transportAPI is documented here: https://developer.transportapi.com/docs?raml=https://transportapi.com/v3/raml/transportapi.raml
More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
Some examples are:
1. London Paddington = PAD
2. London Waterloo = WAT
3. London Bridge = LD

Installation
------------
$ npm install node-fetch
$ npm install docopt

Version
-------
11.06.19  0.1   Initial version based on https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py
12.06.19  0.2   Added docopt support
*/ 

'use strict';

const fs = require('fs')
const fetch = require('node-fetch');

const PROGRAM = 'trainsAsyncAwait.js'
const VERSION = '0.1'
const DATE = '11.06.19'
const AUTHOR = 'Mal Minhas'

const APP_ID = readCred('.transportAppId')
const APP_KEY = readCred('.transportAppKey')

function readCred(fname) {
    return fs.readFileSync(fname, 'utf8');
}

async function getTrainsCallingAt(payload) {
    // destructure payload
    const {station_code,dest_code,dest_name} = payload
    // validate input
    if (!station_code || station_code.length !== 3 || !dest_code || dest_code.length !== 3){
        console.log(`Invalid input parameters`)
        throw new Error(error);
    }
    // get url with query params
    let url = new URL(`http://transportapi.com/v3/uk/train/station/${station_code}/live.json`)
    let params = {  'app_id': APP_ID, 
                    'app_key': APP_KEY, 
                    //'station_name':station_name, 
                    'station_code':station_code, 
                    'calling_at': dest_code, 
                    'type': 'departure'}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const urlstring = url.toString()
    // line by line retrieve of response using await
    try {
        const response = await fetch(urlstring)
        const data = await response.json()
        // fixup and return payload to resolve promise
        // Note that 'departures' is a dict on one key 'all' which is a list of dicts of train departures. 
        payload.date = data.date
        payload.time_of_day = data.time_of_day
        payload.departures = data.departures.all
        payload.station_name = data.station_name
        //payload.data = data 
        return payload
    }
    catch (error){
        console.log(`CAUGHT ${error}`)
        throw new Error(error)
    }
}

async function getStopsForTrain(train,payload) {
    // We need to make a GET request on the timetable URL to retrieve array of stops.  
    // We are then only interested in a subset of the details fields for each stop.
    // We also want to add whether that stop is on the designated journey or not.

    let stops = []
    let timetable_url = train.service_timetable.id
    const response = await fetch(timetable_url)
    const data = await response.json()

    function procStop(stop) {
        let s = {}
        s.station_code = stop.station_code
        s.station_name = stop.station_name
        s.expected_arrival_time = stop.expected_arrival_time
        s.platform = stop.platform
        return s
    }
        
    let on_route = false
    data.stops.forEach(stop => {
        const s = procStop(stop)
        if (s.station_code === payload.station_code) {
            s.on_route = true
            on_route = true
        } else if (s.station_code === payload.dest_code) {
            s.on_route = true
            on_route = false
        } else {
            s.on_route = on_route
        }
        stops.push(s)
    })
    return stops
}

async function getAllTrainStops(payload) {
    // We want to iterate through every train in payload.departures array
    // However we can't use forEach if we want to wait for all promises to complete!
    // We need to use Promise.all with map of async-await mthod to get stops for train
    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop

    await Promise.all(payload.departures.map(async (train) => {
        let train_uid = train.train_uid
        const stops = await getStopsForTrain(train, payload)
        train.stops = stops
    }));

    return payload
}

function printTrains(payload){
    let trains = []

    function printHeader(payload){
        let header = `==== Trains from ${payload.station_name} (${payload.station_code}) to ${payload.dest_name} `
        header += `(${payload.dest_code}) ${payload.time_of_day} ${payload.date} ====`
        console.log('='.repeat(header.length))
        console.log(header)
        console.log('='.repeat(header.length))
    }
    
    printHeader(payload);
    payload.departures.forEach(train => {
        let stops = train.stops
        let source = stops.filter(stop => stop.station_code === payload.station_code)[0]
        let dest = stops.filter(stop => stop.station_code === payload.dest_code)[0]
        let route = stops.filter(stop => stop.on_route === true)
    
        let departure = `${payload.station_code} ${train.expected_departure_time} -> ${payload.dest_code}`
        departure += ` ${dest.expected_arrival_time} => ${train.status}\n`
        departure += `\tTrain ${train.train_uid} (${train.operator}) from ${train.origin_name}`
        departure += ` arriving at ${payload.station_name} on platform ${source.platform}`
        departure += ` going to ${payload.dest_name} platform ${dest.platform}. ${route.length} stops:`
        trains.push({'time':train.expected_departure_time,'departure':departure,'stops': stops})
    })
    // Now we need to sort the trains in order of time
    trains.sort((a, b) => a.time.localeCompare(b.time));

    // And then print them
    function printTrains(departure){
        console.log(departure)
    }
    function printStopNames(stops){
        let stopNames = []
        let stopsOnRoute = stops.filter(stop => stop.on_route === true)
        stopsOnRoute.forEach(stop => {
            stopNames.push(stop.station_name)
        })
        console.log(`\t${stopNames.join(',')}`)
    }
    
    trains.forEach(train => {
        printTrains(train.departure)
        printStopNames(train.stops)
    })
}

// -----------------------

const doc = `
${PROGRAM}
---------
Usage:
  ${PROGRAM} <from> <to> <dest_name>
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

// Can't use `arguments` here in strict mode or you get:
// "SyntaxError: Unexpected eval or arguments in strict mode"
// The names arguments and eval are special and forbidden as identifiers.
let args = docopt(doc, {
  version: `${VERSION} ${DATE} ${AUTHOR}`
})

const station = args['<from>']
const dest = args['<to>']
const dest_name = args['<dest_name>']

async function startFlow() {
	let payload = {
        station_code: station,
        dest_code: dest,
        dest_name: dest_name
    }
    payload = await getTrainsCallingAt(payload)
    payload = await getAllTrainStops(payload)
	return payload
}

startFlow()
	.then(payload => {
        printTrains(payload)
	})
