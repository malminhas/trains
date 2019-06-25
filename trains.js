#!/usr/bin/env node
/*
 trains.js
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
// Needed for older node versions.  
// See: https://stackoverflow.com/questions/52566578/url-is-not-defined-in-node-js
const URL = require('url').URL;

const PROGRAM = 'trains.js'
const VERSION = '0.2'
const DATE = '11.06.19'
const AUTHOR = 'Mal Minhas'

const APP_ID = readCred('.transportAppId')
const APP_KEY = readCred('.transportAppKey')

function readCred(fname) {
    return fs.readFileSync(fname, 'utf8');
}

function getTrainsCallingAt(station_code,dest_code,dest_name) {
    let url = new URL(`http://transportapi.com/v3/uk/train/station/${station_code}/live.json`)
    let params = {  'app_id': APP_ID, 
                    'app_key': APP_KEY, 
                    //'station_name':station_name, 
                    'station_code':station_code, 
                    'calling_at': dest_code, 
                    'type': 'departure'}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const urlstring = url.toString()
    //console.log(urlstring)
    fetch(urlstring)
      .then(response => response.json())
      .then(data => {
        data['destination_code'] = dest_code
        data['destination_name'] = dest_name    
        formatTrains(data)
      })
      .catch(() => {
        console.log('Caught issue with getTrainsCallingAt fetch url')
      })
}

function procStop(stop) {
    let s = {}
    s.station_code = stop.station_code
    s.station_name = stop.station_name
    s.expected_arrival_time = stop.expected_arrival_time
    s.platform = stop.platform
    return s
}

function getStops(train,d) {
    // We need to make a GET request on the timetable URL to retrieve array of stops.  
    // We are then only interested in a subset of the details fields for each stop.
    // We also want to add whether that stop is on the designated journey or not.

    let arr = []
    let timetable_url = train.service_timetable.id
    fetch(timetable_url)
        .then(response => response.json())
        .then(data => {
            let stops = data.stops
            let on_route = false
            stops.forEach(stop => {
                const s = procStop(stop)
                if (s.station_code === d.station_code) {
                    s.on_route = true
                    on_route = true
                } else if (s.station_code === d.dest_code) {
                    s.on_route = true
                    on_route = false
                } else {
                    s.on_route = on_route
                }
                arr.push(s)
            })
            let trainDetails = formatDeparture(train,arr,d)
            printTrainDetails(trainDetails,arr)
        })
        .catch(() => {
            console.log('Caught issue with getStops fetch url')
        })    
}

function formatHeader(d){
    let header = `==== Trains from ${d.station_name} (${d.station_code}) to ${d.destination_name} `
    header += `(${d.destination_code}) ${d.time_of_day} ${d.date} ====`
    return header
}

function formatDeparture(train,stops,d){
    let source = stops.filter(stop => stop.station_code === d.station_code)[0]
    let dest = stops.filter(stop => stop.station_code === d.destination_code)[0]
    let route = stops.filter(stop => stop.on_route === true)

    let departure = `${d.station_code} ${train.expected_departure_time} -> ${d.destination_code}`
    departure += ` ${dest.expected_arrival_time} => ${train.status}\n`
    departure += `\tTrain ${train.train_uid} (${train.operator}) from ${train.origin_name}`
    departure += ` arriving at ${d.station_name} on platform ${source.platform}`
    departure += ` going to ${d.destination_name} platform ${dest.platform}. ${route.length} stops:`
    return departure
}

function formatTrains(data) {
    // Keys: 'date', 'time_of_day', 'request_time', 'station_name', 'station_code', 'departures'
    // where 'departures' is a dict with one key 'all' which is a list of dicts of train departures
    const header = formatHeader(data)
    printHeader(header)
    let trains = data.departures.all
    trains.forEach(train => {
        getStops(train, data)
    })
}

function printHeader(header){
    console.log('='.repeat(header.length))
    console.log(header)
    console.log('='.repeat(header.length))
}

function printStopNames(stops){
    let stopNames = []
    let stopsOnRoute = stops.filter(stop => stop.on_route === true)
    stopsOnRoute.forEach(stop => {
        stopNames.push(stop.station_name)
    })
    console.log(`\t${stopNames.join(',')}`)
}

function printTrainDetails(trainDetails,stops){
    console.log(trainDetails)
    printStopNames(stops)
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

// Can't use arguments here in strict mode or you get:
// "SyntaxError: Unexpected eval or arguments in strict mode"
// The names arguments and eval are special and forbidden as identifiers.
let args = docopt(doc, {
  version: `${VERSION} ${DATE} ${AUTHOR}`
})

const station = args['<from>']
const dest = args['<to>']
const dest_name = args['<dest_name>']
if (station && station.length === 3 && dest && dest.length === 3){
    getTrainsCallingAt(station,dest,dest_name)    // OK
}
