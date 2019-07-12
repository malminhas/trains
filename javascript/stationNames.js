#!/usr/bin/env node
/*
 stationNames.js
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
Utility module to convert between three-letter codes and verbose station names.
More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
The .csv used in this code is available here: https://www.nationalrail.co.uk/stations_destinations/48541.aspx 
Some examples are:
1. London Paddington = PAD
2. London Waterloo = WAT
3. London Bridge = LBG

Installation
------------

Version
-------
30.06.19  0.1   First version
*/ 

'use strict'
const fs = require('fs')
const STATION_NAMES_CSV = 'station_codes.csv'

function csvToJSONArray(csvFile){
	// read csvFile content into csv string
	const csv = fs.readFileSync(csvFile, 'utf-8');
	// process csv string
    let lines=csv.split("\n");
    let jsdata = [];
	let headers = []
	lines[0].split(",").forEach(header => {
		headers.push(header.trim())
	})
    lines.slice(1).forEach(line => {
		let cell = {};
		let values = line.split(",");
		let j = 0
		headers.forEach(header => {
			let value = values[j++]
			value = value ? value.trim() : value 
			cell[header] = value
			})
		jsdata.push(cell)
	})
	return jsdata
}

function csvToJSONMap(csvfile){
	let stations = {}
	const jsdata = csvToJSONArray(csvfile)
	jsdata.forEach(station => {
		const name = station['Station Name']
		const code = station['CRS Code']
		if (name){
			stations[code] = name
		}
	})
	return stations
}

function convertToString(jsdata){
    return JSON.stringify(jsdata); //JSON
}

function validateInputs(station_code,dest_code){
    //console.log(`Validating station_code='${station_code}', dest_code='${dest_code}'`)
    if (!station_code || station_code.length !== 3){
        console.log(`Invalid input parameter length for station_code`)
        throw new Error(error);
    }
    if (!dest_code || dest_code.length !== 3){
        console.log(`Invalid input parameter length for dest_code`)
        throw new Error(error);
    }
    const csvFile = STATION_NAMES_CSV
    const stations = csvToJSONMap(csvFile)
    if (!stations[station_code]){
        console.log(`Invalid station_code`)
        throw new Error(error);
    }
    if (!stations[dest_code]){
        console.log(`Invalid dest_code`)
        throw new Error(error);
    }
    return {'from':stations[station_code], 'to':stations[dest_code]}
}

let main = function(){
	// main code
	const csv = STATION_NAMES_CSV
	const stations = csvToJSONMap(csv)
	console.log(convertToString(stations))
	// test an individual station
	console.log(stations['PAD'])	
	console.log(validateInputs('OXF','PAD'))
	console.log('---- PASSED -----')
}

if (require.main === module) {
    main();
}

module.exports = {validateInputs,csvToJSONArray,csvToJSONMap};