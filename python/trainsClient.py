#!/usr/bin/env python
# -*- coding: utf-8 -*-
# -*- coding: future_fstrings -*-
#
# trainsClient.py
# (c) 2019 Mal Minhas, <mal@malm.co.uk>
#
# Licence
# --------
# Copyright 2019 Mal Minhas. All Rights Reserved.
#
# Description
# -----------
# transportAPI is documented here: https://developer.transportapi.com/docs?raml=https://transportapi.com/v3/raml/transportapi.raml
# More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
# Some examples are:
# 1. London Paddington = PAD
# 2. London Waterloo = WAT
# 3. London Bridge = LD
#
# Installation
# ------------
# $ pip install -r requirements.txt
#
# Version
# -------
# 10.06.19  0.1   Initial version based on https://github.com/chrishutchinson/train-departure-screen/blob/master/src/trains.py
# 11.06.19  0.2   Added docopt support
# 09.07.19  0.3   Updated to align with JavaScript versions (env variable support, incorporating station_codes.csv)
# 

import os
import requests
import stationNames

PROGRAM = __file__
VERSION = '0.3'
DATE = '09.07.19'
AUTHOR= 'Mal Minhas'

def readCred(fname):
    # First we check if corresponding environment variable exists.  If it does, use it.
    envvar = fname[1:].upper()
    value = os.environ.get(envvar)
    if value:
        #print(f'Found and reading cred "{value}" from environment variable "{envvar}"')
        return value
    # Second we check if there is a local file with cred in it.
    if os.path.exists(fname):    
        with open(fname,'r',encoding='utf-8') as f:
            value = f.read()
            #print(f'Found and read cred "{value}" from file "{fname}"')
            return value
    # Else we throw an error 
    raise f'Could not find any cred for {fname}'

APP_ID = readCred('.transportAppId')
APP_KEY = readCred('.transportAppKey')

def getTrainsCallingAt(station_code,station_name,dest_code,dest_name,verbose=False):
    # station_code is 3 letter string.  eg. 'TWY','PADD'
    # from_offset is one hour in past by default
    # to_offset is two hours into future by default
    # type can be arrival|departure|pass
    url = f'http://transportapi.com/v3/uk/train/station/{station_code}/live.json'
    params = {'app_id': APP_ID, 'app_key': APP_KEY, 'station_code':station_code, 'calling_at': dest_code, 'type': 'departure'}
    #if station_name:
    #    params['station_name'] = station_name
    verbose and print(url)
    r = requests.get(url, params)
    data = r.json()
    data['destination_code'] = dest_code
    data['destination_name'] = dest_name
    verbose and print(data)
    return data

def procStop(stop):
    s = {}
    s['station_code'] = stop.get('station_code')
    s['station_name'] = stop.get('station_name')
    s['expected_arrival_time'] = stop.get('expected_arrival_time')
    s['platform'] = stop.get('platform')
    return s

def getStops(timetable_url,station_code,dest_code):
    ''' We need to make a GET request on the timetable URL to retrieve array of stops.  
    We are then only interested in a subset of the details fields for each stop.
    We also want to add whether that stop is on the designated journey or not.
    '''
    arr = []
    r = requests.get(timetable_url)
    stops = r.json().get('stops')
    on_route = False
    for stop in stops:
        s = procStop(stop)
        if s.get('station_code') == station_code:
            s['on_route'] = True
            on_route = True
        elif s.get('station_code') == dest_code:
            s['on_route'] = True
            on_route = False
        else:
            s['on_route'] = on_route
        arr.append(s)
    return arr

def formatHeader(d):
    header = f"==== Trains from {d.get('station_name')} ({d.get('station_code')}) to {d.get('destination_name')} "
    header += f"({d.get('destination_code')}) {d.get('time_of_day')} {d.get('date')} ===="
    return header

def formatDeparture(train,stops,d):
    source = [stop for stop in stops if stop.get('station_code') == d.get('station_code')][0]
    dest = [stop for stop in stops if stop.get('station_code') == d.get('destination_code')][0]
    route = [stop.get('station_name') for stop in stops if stop.get('on_route')]    
    deptime = train.get('expected_departure_time')
    if not deptime:
        deptime = train.get('aimed_departure_time')
    departure = f"{d.get('station_code')} {deptime} -> {d.get('destination_code')}"
    departure += f" {dest.get('expected_arrival_time')} => {train.get('status')}\n"
    departure += f"\tTrain {train.get('train_uid')} ({train.get('operator')}) from {train.get('origin_name')}"
    departure += f" arriving at {d.get('station_name')} on platform {source.get('platform')}"
    departure += f" going to {d.get('destination_name')} platform {dest.get('platform')}. {len(route)} stops:"
    return departure

def formatTrains(d,verbose):
    # Keys: 'date', 'time_of_day', 'request_time', 'station_name', 'station_code', 'departures'
    # where 'departures' is a dict with one key 'all' which is a list of dicts of train departures
    printHeader(formatHeader(d))
    trains = d.get('departures').get('all')
    verbose and print(f'All trains:\n{trains}')
    for train in trains:
        stops = getStops(train.get('service_timetable').get('id'),d.get('station_code'),d.get('destination_code'))
        verbose and print(f'Train {train.get("train_uid")} stopping point details:\n{stops}')
        trainDetails = formatDeparture(train,stops,d)
        printTrainDetails(trainDetails,stops)

def printTrainDetails(trainDetails,stops):
    print(trainDetails)
    printStopNames(stops)

def printHeader(header):
    print('='*len(header))
    print(header)
    print('='*len(header))

def printStopNames(stops):
    stopNames = ','.join([stop.get('station_name') for stop in stops if stop.get('on_route')])
    print(f'\t{stopNames}')


if __name__ == '__main__':
    import docopt

    usage = """
    {}
    ---------------
    Usage:
    {} <from> <to> [-v]
    {} -h | --help
    {} -V | --version

    Options:
    -h --help               Show this screen.
    -V --version            Show version.

    Examples
    1. trains from RDG to PAD:
    {} RDG PAD
    
    """.format(
            *tuple([PROGRAM] * 5)
    )

    arguments = docopt.docopt(usage)
    # print(arguments)
    verbose = False
    force = False
    if arguments.get("--verbose") or arguments.get("-v"):
        verbose = True
    if arguments.get("--version") or arguments.get("-V"):
        print(f'{PROGRAM} version {VERSION}.  Author: {AUTHOR}')
    elif arguments.get("--help") or arguments.get("-h"):
        print(usage)
    else:
        stationCode = arguments.get('<from>')
        destCode = arguments.get('<to>')
        # validate inputs - will throw error if there is a problem
        stationName,destName = stationNames.validateInputs(stationCode,destCode)
        trains = getTrainsCallingAt(stationCode,stationName,destCode,destName,verbose)     # OK
        formatTrains(trains,verbose)