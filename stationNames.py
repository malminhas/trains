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
# Utility module to convert between three-letter codes and verbose station names.
# More on three letter train codes here: http://www.railwaycodes.org.uk/crs/CRS0.shtm
# The .csv used in this code is available here: https://www.nationalrail.co.uk/stations_destinations/48541.aspx 
# Some examples are:
# 1. London Paddington = PAD
# 2. London Waterloo = WAT
# 3. London Bridge = LBG
# 
# Installation
# ------------
# 
# Version
# -------
# 30.07.19  0.1   First version copied 
# 

import json
import pandas as pd

def csvToJSONArray(csvFile):
	# read csvFile content into csv string
	df = pd.read_csv(csvFile)
	return df.to_dict(orient='records')

def csvToJSONMap(csvfile):
	stations = {}
	jsdata = csvToJSONArray(csvfile)
	for station in jsdata:
		name = station.get('Station Name')
		code = station.get('CRS Code')
		if name:
			stations[code] = name
	return stations

def convertToString(jsdata):
    return json.dumps(jsdata); # input is JSON data

def validateInputs(station_code,dest_code):
    print(f'Validating station_code="{station_code}", dest_code="{dest_code}"')
    if not station_code or len(station_code) != 3:
        print('Invalid input parameter length for station_code')
        raise error
    if not dest_code or len(dest_code) != 3:
        print('Invalid input parameter length for dest_code')
        raise error
    csvFile = 'station_codes.csv'
    stations = csvToJSONMap(csvFile)
    if not stations[station_code]:
        print('Invalid station_code')
        raise error
    if not stations[dest_code]:
        print('Invalid dest_code')
        raise error
    return stations[station_code], stations[dest_code]

if __name__ == '__main__':
	csv = 'station_codes.csv'
	stations = csvToJSONMap(csv)
	print(convertToString(stations))
	# test an individual station
	assert(stations['PAD'] == 'London Paddington')	
	print(validateInputs('OXF','PAD'))
	print('---- PASSED -----')