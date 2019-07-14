#!/usr/bin/env node
/*
 trainsAsyncAwaitClient.js
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
11.06.19  0.1   Initial version based on https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py
12.06.19  0.2   Added docopt support
30.06.19  0.2   Added input validation support and tweaked command line input to remove verbose destination station name
08.07.19  0.2   Added support to handle secrets from environment variables
*/ 

'use strict';

const PROGRAM = 'trainsAsyncAwaitClient.js'
const VERSION = '0.4'
const DATE = '08.07.19'
const AUTHOR = 'Mal Minhas'

const stationNames = require('./stationNames')
const fs = require('fs')
const fetch = require('node-fetch');
// See: https://stackoverflow.com/questions/52566578/url-is-not-defined-in-node-js
const URL = require('url').URL;

const APP_ID = readCred('.transportAppId')
const APP_KEY = readCred('.transportAppKey')

function readCred(fname) {
    // First we check if corresponding environment variable exists.  If it does, use it.
    const envvar = fname.substring(1).toUpperCase()
    const value = process.env[envvar]
    if (value){
        //console.log(`Found and reading cred '${value}' from environment variable '${envvar}'`)
        return value
    }
    // Second we check if there is a local file with cred in it.
    if (fs.existsSync(fname)) {
        const value = fs.readFileSync(fname, 'utf8')
        //console.log(`Found and read cred '${value}' from file '${fname}'`)
        return value
    }
    // Else we throw an error
    throw Error(`Could not find any cred for ${fname}`)
}

async function getTrainsCallingAt(payload) {
    // destructure payload
    const {station_code,dest_code} = payload
    // validate inputs - will throw error if there is a problem
    const sts = stationNames.validateInputs(station_code,dest_code)
    const stationName = sts.from
    const destName = sts.to
    //console.log(`from = '${stationName} (${station_code}) to = '${destName}' (${dest_code})`)
    //payload.station_name = stationName
    // get url with query params
    let url = new URL(`http://transportapi.com/v3/uk/train/station/${station_code}/live.json`)
    let params = {  'app_id': APP_ID, 
                    'app_key': APP_KEY, 
                    'station_name':stationName, 
                    'station_code':station_code, 
                    'calling_at': dest_code, 
                    'type': 'departure'}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const urlstring = url.toString()
    //console.log(`url:${url}`)
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
        payload.dest_name = destName
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

function formatTrains(payload){
    let trains = []
    let output = ''

    function formatHeader(payload){
        let header = `==== Trains from ${payload.station_name} (${payload.station_code}) to ${payload.dest_name} `
        header += `(${payload.dest_code}) ${payload.time_of_day} ${payload.date} ====`
        output += '='.repeat(header.length) + '\n'
        output += header  + '\n'
        output += '='.repeat(header.length) + '\n'
    }
    
    formatHeader(payload);
    payload.departures.forEach(train => {
        let stops = train.stops
        let source = stops.filter(stop => stop.station_code === payload.station_code)[0]
        let dest = stops.filter(stop => stop.station_code === payload.dest_code)[0]
        let route = stops.filter(stop => stop.on_route === true)
    
        let deptime = train.expected_departure_time
        if (deptime === null){
            deptime = train.aimed_departure_time
        }
        let departure = `${payload.station_code} ${deptime} -> ${payload.dest_code}`
        departure += ` ${dest.expected_arrival_time} => ${train.status}\n`
        departure += `\tTrain ${train.train_uid} (${train.operator}) from ${train.origin_name}`
        departure += ` arriving at ${payload.station_name} on platform ${source.platform}`
        departure += ` going to ${payload.dest_name} platform ${dest.platform}. ${route.length} stops:`
        trains.push({'time':deptime,'departure':departure,'stops': stops})
    })
    //console.log(trains)
    // Now we need to sort the trains in order of time
    trains.sort((a, b) => a.time.localeCompare(b.time));

    // And then print them
    function formatTrain(departure){
        output += departure + '\n'
    }
    function formatStopNames(stops){
        let stopNames = []
        let stopsOnRoute = stops.filter(stop => stop.on_route === true)
        stopsOnRoute.forEach(stop => {
            stopNames.push(stop.station_name)
        })
        output += `\t${stopNames.join(',')}` + '\n'
    }
    
    trains.forEach(train => {
        formatTrain(train.departure)
        formatStopNames(train.stops)
    })
    return output
}

// -----------------------

async function startFlow(station,dest) {
	let payload = {
        station_code: station,
        dest_code: dest,
        //dest_name: dest_name
    }
    payload = await getTrainsCallingAt(payload)
    payload = await getAllTrainStops(payload)
	return payload
}


let cli = function(){
    // main code
    const doc = `
${PROGRAM}
-------------------------
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
    
    // Can't use `arguments` here in strict mode or you get:
    // "SyntaxError: Unexpected eval or arguments in strict mode"
    // The names arguments and eval are special and forbidden as identifiers.
    let args = docopt(doc, {
      version: `${VERSION} ${DATE} ${AUTHOR}`
    })
    
    const station = args['<from>']
    const dest = args['<to>']
    //const dest_name = args['<dest_name>']
    
    startFlow(station,dest)
	.then(payload => {
        const output = formatTrains(payload)
        console.log(output)
	})
}
    
if (require.main === module) {
    cli();
}

module.exports = {cli,getTrainsCallingAt,getAllTrainStops,formatTrains};