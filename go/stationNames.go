/*
 stationNames.go
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
15.07.19  0.1   First version
*/

package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
)

var (
	errInvalidJSON = errors.New("invalid JSON")
)

const STATION_NAMES_CSV = "station_codes.csv"

type StationCode struct {
	StationName string `json:"stationname"`
	CRSCode     string `json:"crscode"`
}

type StationName struct {
	CRSCode     string `json:"crscode"`
	StationName string `json:"stationname"`
}

func csvToJSONArray(csvFile string) []StationCode {
	// parse csvFile content and return JSON
	file, err := os.Open(csvFile)
	if err != nil {
		log.Fatalln("Couldn't open the csv file", err)
	}
	reader := csv.NewReader(file)
	var stations []StationCode
	for {
		record, error := reader.Read()
		if error == io.EOF {
			break
		} else if error != nil {
			log.Fatal(error)
		}
		stations = append(stations, StationCode{
			StationName: record[0],
			CRSCode:     record[1],
		})
	}
	return stations
}

func csvToJSONMap(csvfile string) map[string]string {
	stations := make(map[string]string)
	arr := csvToJSONArray(csvfile)
	for i := 0; i < len(arr); i++ {
		name := arr[i].StationName
		code := arr[i].CRSCode
		if len(name) > 0 {
			stations[code] = name
		}
	}
	return stations
}

func convertToString(stations map[string]string) string {
	//return JSON.stringify(jsdata); // JSON
	/*
		// Composed output string this way at first but it wasn't sorted
		var s string = "{"
		for key, val := range stations {
			// Convert each key/value pair in m to a string
			s += fmt.Sprintf("\"%s\"=\"%s\",", key, val)
			// Do whatever you want to do with the string;
			// in this example I just print out each of them.
		}
		s = s[:len(s)-1] + "}"
		return s
	*/
	jsdata, _ := json.Marshal(stations)
	fmt.Println(string(jsdata))
	return string(jsdata)
}

func validateInputs(station_code string, dest_code string) (string, string) {
	//fmt.Println(`Validating station_code='${station_code}', dest_code='${dest_code}'`)
	if len(station_code) != 3 {
		log.Fatal(`Invalid input parameter length for station_code`)
		//throw new Error(error);
	}
	if len(dest_code) != 3 {
		log.Fatal(`Invalid input parameter length for dest_code`)
		//throw new Error(error);
	}
	const csvFile = STATION_NAMES_CSV
	stations := csvToJSONMap(csvFile)

	stationName, ok := stations[station_code]
	if !ok {
		log.Fatal(`Invalid station_code`)
		//throw new Error(error);
	}
	destName, ok := stations[dest_code]
	if !ok {
		log.Fatal(`Invalid dest_code`)
		//throw new Error(error);
	}
	//return {"from":stations[station_code], "to":stations[dest_code]}
	return stationName, destName
}

func main() {
	const csv = STATION_NAMES_CSV // const is number, string or boolean only
	stations := csvToJSONMap(csv)
	fmt.Println(convertToString(stations))
	// test an individual station
	fmt.Println(stations["PAD"])
	fmt.Println(validateInputs("OXF", "PAD"))
	fmt.Println("---- PASSED -----")
}
