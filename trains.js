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
$ pip install -r requirements.txt

Version
-------
11.06.19  0.1   Initial version based on https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py
*/ 

'use strict';

const fs = require('fs')
const fetch = require('node-fetch');

const APP_ID = readCred('.transportAppId')
const APP_KEY = readCred('.transportAppKey')

function readCred(fname) {
    return fs.readFileSync(fname, 'utf8');
}

function getTrainsTo(station_code,dest_code,station_name,dest_name) {
    console.log(`getTrainsTo() -> to ${station_code} (${station_name}) from ${dest_code} (${dest_name}))`)
    let url = new URL(`http://transportapi.com/v3/uk/train/station/${station_code}/live.json`)
    let params = { 'app_id': APP_ID,
                   'app_key': APP_KEY,
                   'station_name': station_name,
                   'station_code': station_code,
                   'destination': dest_code,
                   'type': 'departure'}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const urlstring = url.toString()
    //console.log(urlstring)
    fetch(urlstring)
      .then(response => response.json())
      .then(data => {
        data.destination_code = dest_code
        data.destination_name = dest_name
        formatTrains(data)
      })
      .catch(() => {
        console.log('Caught issue with getTrainsTo fetch url')
      })
}

function getTrainsCallingAt(station_code,dest_code,station_name,dest_name) {
    let url = new URL(`http://transportapi.com/v3/uk/train/station/${station_code}/live.json`)
    let params = {  'app_id': APP_ID, 
                    'app_key': APP_KEY, 
                    'station_name':station_name, 
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
    let header = `==== Trains from ${d.station_name} (${d.station_code}}) to ${d.destination_name} `
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

function formatTrains(d) {
    // Keys: 'date', 'time_of_day', 'request_time', 'station_name', 'station_code', 'departures'
    // where 'departures' is a dict with one key 'all' which is a list of dicts of train departures
    const header = formatHeader(d)
    printHeader(header)
    let trains = d.departures.all
    trains.forEach(train => {
        //console.log(`${element.textContent}`)
        let stops = []
        getStops(train, d)
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

const station = 'TWY'
const station_name = 'Twyford'
const dest = 'PAD'
const dest_name = 'London Paddington'
//console.log(getTrainsTo(source,dest))                    // OK
getTrainsTo(station,dest,station_name,dest_name)           // OK
getTrainsCallingAt(dest,station,dest_name,station_name)    // OK
