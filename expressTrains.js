#!/usr/bin/env node
/*
 expressTrains.js
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
expressTrains.js builds on the work done in trainsAsyncAwait.js and provides a web interface to underlying functionality.
You invoke funtionality as follows on an instance running on localhost:8001 for trains from Paddington to Oxford:
http://localhost:8001/?from=PAD&to=OXF
transportAPI is documented here: https://developer.transportapi.com/docs?raml=https://transportapi.com/v3/raml/transportapi.raml
More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
The .csv used in this code is available here: https://www.nationalrail.co.uk/stations_destinations/48541.aspx 
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
30.06.19  0.1   Initial version.
*/ 

'use strict';
const express = require('express')
const trains = require('./trainsAsyncAwait')

const DEFAULT_PORT = 8001

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

const app = express()
const port = DEFAULT_PORT
app.get('/', (req,res) => {
    // 
    console.log(`req.url = ${req.url}`)
    console.log(`req.query:`)
    const query = req.query
    Object.keys(query).forEach(key => {
        const value = query[key]
        console.log(`key='${key}',value='${value}'`)
    })
    /*console.log(`req.query.id = ${req.query.id}`)
    console.log(`req.params:`)
    const params = req.params
    Object.keys(params).forEach(key => {
        const value = params[key]
        console.log(`key='${key}',value='${value}'`)
    })
    */

    const station = query.from
    const dest = query.to
    startFlow(station,dest)
        .then(payload => {
            let output = trains.formatTrains(payload)
            output = output.replace(/\n/g, "<br>");
            console.log(`Writing back response of ${output.length} bytes`)
            res.send(output)
        })
})

app.listen(port, ()=> {
    console.log(`Example app listening on port ${port}`)
})
