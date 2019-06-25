#!/usr/bin/env python
# -*- coding: utf-8 -*-
# -*- coding: future_fstrings -*-
#
# trains.py
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
# 

import requests

PROGRAM = __file__
VERSION = '0.2'
DATE = '11.06.19'
AUTHOR= 'Mal Minhas'

def readCred(fname):
    with open(fname,'r') as f:
        return f.read()
    raise f'Issue finding cred from {f}'

APP_ID = readCred('.transportAppId')
APP_KEY = readCred('.transportAppKey')

def getTrainsCallingAt(station_code,dest_code,dest_name):
    # station_code is 3 letter string.  eg. 'TWY','PADD'
    # from_offset is one hour in past by default
    # to_offset is two hours into future by default
    # type can be arrival|departure|pass
    url = f'http://transportapi.com/v3/uk/train/station/{station_code}/live.json'
    params = {'app_id': APP_ID, 'app_key': APP_KEY, 'station_code':station_code, 'calling_at': dest_code, 'type': 'departure'}
    #if station_name:
    #    params['station_name'] = station_name
    r = requests.get(url, params)
    data = r.json()
    data['destination_code'] = dest_code
    data['destination_name'] = dest_name
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
    departure = f"{d.get('station_code')} {train.get('expected_departure_time')} -> {d.get('destination_code')}"
    departure += f" {dest.get('expected_arrival_time')} => {train.get('status')}\n"
    departure += f"\tTrain {train.get('train_uid')} ({train.get('operator')}) from {train.get('origin_name')}"
    departure += f" arriving at {d.get('station_name')} on platform {source.get('platform')}"
    departure += f" going to {d.get('destination_name')} platform {dest.get('platform')}. {len(route)} stops:"
    return departure

def formatTrains(d):
    # Keys: 'date', 'time_of_day', 'request_time', 'station_name', 'station_code', 'departures'
    # where 'departures' is a dict with one key 'all' which is a list of dicts of train departures
    printHeader(formatHeader(d))
    trains = d.get('departures').get('all')
    for train in trains:
        stops = getStops(train.get('service_timetable').get('id'),d.get('station_code'),d.get('destination_code'))
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
    ---------
    Usage:
    {} <from> <to> <dest_name>
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
        source = arguments.get('<from>')
        dest = arguments.get('<to>')
        dest_name = arguments.get('<dest_name>')
        assert(len(source) == 3 and len(dest) == 3)
        trains = getTrainsCallingAt(source,dest,dest_name)     # OK
        formatTrains(trains)