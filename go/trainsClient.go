// trainsClient.go
//
// Installation:
// ------------
// $ export GOPATH=<full path to local directory>
// $ go get -v github.com/docopt/docopt-go
// $ go build -ldflags="-s -w" trains.go

package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"

	//"time"

	docopt "github.com/docopt/docopt-go"
	grequests "github.com/levigross/grequests"
)

const PROGRAM = "trainsClient.go"
const VERSION = "0.1"
const DATE = "15.07.19"
const AUTHOR = "Mal Minhas"

var APP_ID = ""
var APP_KEY = ""

type TrainStop struct {
	StationCode     string `json:"station_code"`
	StationName     string `json:"station_name"`
	ExpectedArrival string `json:"expected_arrival_time"`
	Platform        string `json:"platform"`
	OnRoute         bool   `json:"on_route"`
}

type TrainStops struct {
	Service  string      `json:"service"`
	TrainUid string      `json:"train_uid"`
	Stops    []TrainStop `json:"stops"`
}

/*
{"service":"25516005",
"train_uid":"C23362",
"headcode":"",
"toc":{"atoc_code":"GW"},
"train_status":"P",
"origin_name":"London Paddington",
"destination_name":"Reading",
"stop_of_interest":null,
"date":"2019-07-16",
"time_of_day":null,
"mode":"train",
"request_time":"2019-07-16T01:28:19+01:00",
"category":"OO",
"operator":"GW",
"operator_name":"Great Western Railway",
"stops":[{
	"station_code":"PAD",
	"tiploc_code":"PADTON",
	"station_name":"London Paddington",
	"stop_type":"LO",
	"platform":"14",
	"aimed_departure_date":"2019-07-16",
	"aimed_departure_time":"01:34",
	"aimed_arrival_date":null,
	"aimed_arrival_time":null,
	"aimed_pass_date":null,
	"aimed_pass_time":null,
	"expected_departure_date":"2019-07-16",
	"expected_departure_time":"01:34",
	"expected_arrival_date":null,
	"expected_arrival_time":null,
	"expected_pass_date":null,
	"expected_pass_time":null,
	"status":"STARTS HERE"}, ...]
*/

type TrainTimetable struct {
	Url string `json:"id"`
}

type TrainDeparture struct {
	Mode                  string         `json:"mode"`
	Service               string         `json:"service"`
	TrainUid              string         `json:"train_uid"`
	Platform              string         `json:"platform"`
	Operator              string         `json:"operator"`
	OperatorName          string         `json:"operator_name"`
	AimedDeparture        string         `json:"aimed_departure_time"`
	AimedArrival          string         `json:"aimed_arrival_time"`
	AimedPass             string         `json:"aimed_pass_time"`
	OriginName            string         `json:"origin_name"`
	DestinationName       string         `json:"destination_name"`
	Source                string         `json:"source"`
	Category              string         `json:"category"`
	ServiceTimetable      TrainTimetable `json:"service_timetable"`
	Status                string         `json:"status"`
	ExpectedArrival       string         `json:"expected_arrival_time"`
	ExpectedDeparture     string         `json:"expected_departure_time"`
	BestArrivalEstimate   int            `json:"best_arrival_estimate_mins"`
	BestDepartureEstimate int            `json:"best_departure_estimate_mins"`
}

type TrainDepartures struct {
	All []TrainDeparture `json:"all"`
}

/*
{"all":[{
	"mode":"train",
	"service":"25516005",
	"train_uid":"C23294","
	platform":"4",
	"operator":"GW",
	"operator_name":"Great Western Railway",
	"aimed_departure_time":"20:26",
	"aimed_arrival_time":"20:26",
	"aimed_pass_time":null,
	"origin_name":"Reading",
	"destination_name":"London Paddington",
	"source":"Network Rail",
	"category":"OO",
	"service_timetable":{
		"id":"http://transportapi.com/v3/uk/train/service/train_uid:C23294/2019-07-15/timetable.json?app_id=32b9c17c\u0026app_key=f5bd3e5219eb9a6522e769099b2f5d0a\u0026live=true"},
	"status":"ON TIME",
	"expected_arrival_time":"20:26",
	"expected_departure_time":"20:26",
	"best_arrival_estimate_mins":10,
	"best_departure_estimate_mins":10} ... ]
*/

type TrainJourney struct {
	Date            string          `json:"date"`
	TimeOfDay       string          `json:"time_of_day"`
	RequestTime     string          `json:"request_time"`
	StationName     string          `json:"station_name"`
	StationCode     string          `json:"station_code"`
	Departures      TrainDepartures `json:"departures"`
	DestinationName string          `json:"destination_name"`
	DestinationCode string          `json:"destination_code"`
}

// ---------- code -----------

// ExistsFile check whether the file exists
func ExistsFile(filename string) bool {
	if _, err := os.Stat(filename); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}

// ReadFile open and read file and return contents as a []byte
func ReadFile(filename string) (data []byte) {
	data, _ = ioutil.ReadFile(filename)
	//check("readFile", err)
	return
}

func readCred(fname string) string {
	// First we check if corresponding environment variable exists.  If it does, use it.
	//fmt.Println(fmt.Sprintf("readCred('%s')", fname))
	envvar := strings.ToUpper(fname[1:])
	value := os.Getenv(envvar)
	if len(value) > 0 {
		//fmt.Println(fmt.Sprintf("Found and reading cred '%s' from environment variable '%s'", value, envvar))
	} else if ExistsFile(fname) {
		// Second we check if there is a local file with cred in it.
		value = string(ReadFile(fname))
		//fmt.Println(fmt.Sprintf("Found and read cred %s from file '%s'", value, fname))
	} else {
		// Else we throw an error
		log.Fatal(fmt.Sprintf("Could not find any cred for %s", fname))
	}
	return value
}

func getTrainsCallingAt(station_code string, station_name string, dest_code string, dest_name string, verbose bool) TrainJourney {
	// station_code is 3 letter string.  eg. 'TWY','PAD'
	// from_offset is one hour in past by default
	// to_offset is two hours into future by default
	// type can be arrival|departure|pass
	url := fmt.Sprintf("http://transportapi.com/v3/uk/train/station/%s/live.json", station_code)
	params := make(map[string]string)
	params["app_id"] = APP_ID
	params["app_key"] = APP_KEY
	params["station_code"] = station_code
	params["calling_at"] = dest_code
	params["type"] = "departure"

	// You can modify the request by passing an optional RequestOptions struct
	resp, err := grequests.Get(url, &grequests.RequestOptions{Params: params})
	if err != nil {
		log.Fatalln("Unable to make journey request: ", err)
	}
	respStr := resp.String()
	journey := &TrainJourney{}
	if err := resp.JSON(journey); err != nil {
		log.Fatal("Cannot serialize JSON: ", err)
	}
	// Fill in these two values
	journey.DestinationName = dest_name
	journey.DestinationCode = dest_code
	if verbose {
		fmt.Println(fmt.Sprintf("Base URL: %s", url))
		pdata, _ := json.Marshal(params)
		fmt.Println(fmt.Sprintf("Params: %s", string(pdata)))
		fmt.Println(fmt.Sprintf("Response:\n%s", respStr))
		fmt.Println(fmt.Sprintf("Journey:\n%+v", journey))
	}
	return *journey
}

func StopProducer(timetable_url string, station_code string, dest_code string, verbose bool, ch chan<- []TrainStop) {
	var arr []TrainStop
	resp, err := grequests.Get(timetable_url, nil)
	if err != nil {
		log.Fatalln("Unable to make stops request: ", err)
	}
	respStr := resp.String()
	stops := &TrainStops{}
	if err := resp.JSON(stops); err != nil {
		log.Fatal("Cannot serialize JSON: ", err)
	}
	on_route := false
	for i := 0; i < len(stops.Stops); i++ {
		stop := stops.Stops[i]
		stationCode := stop.StationCode
		if stationCode == station_code {
			stop.OnRoute = true
			on_route = true
		} else if stationCode == dest_code {
			stop.OnRoute = true
			on_route = false
		} else {
			stop.OnRoute = on_route
		}
		arr = append(arr, stop)
	}
	if verbose {
		fmt.Println(fmt.Sprintf("Base URL: %s", timetable_url))
		fmt.Println(fmt.Sprintf("Response:\n%s", respStr))
		fmt.Println(fmt.Sprintf("Stops:\n%+v", stops))
	}
	ch <- arr
}

func StopConsumer(ch <-chan []TrainStop) []TrainStop {
	return <-ch
}

func formatHeader(d TrainJourney) string {
	header := fmt.Sprintf("==== Trains from %s (%s) to %s", d.StationName, d.StationCode, d.DestinationName)
	header += fmt.Sprintf("(%s) %s %s ====", d.DestinationCode, d.TimeOfDay, d.Date)
	return header
}

func formatDeparture(train TrainDeparture, stops []TrainStop, journey TrainJourney) string {
	var source TrainStop
	var dest TrainStop
	var route []TrainStop
	for i := 0; i < len(stops); i++ {
		stop := stops[i]
		if stop.StationCode == journey.StationCode {
			source = stop
		}
		if stop.StationCode == journey.DestinationCode {
			dest = stop
		}
		if stop.OnRoute {
			route = append(route, stop)
		}
	}
	deptime := train.ExpectedDeparture
	if len(deptime) == 0 {
		deptime = train.AimedDeparture
	}
	departure := fmt.Sprintf("%s %s -> %s", journey.StationCode, deptime, journey.DestinationCode)
	departure += fmt.Sprintf(" %s => %s\n", train.ExpectedArrival, train.Status)
	departure += fmt.Sprintf("\tTrain %s (%s) from %s", train.TrainUid, train.Operator, train.OriginName)
	departure += fmt.Sprintf(" arriving at %s on platform %s", journey.StationName, source.Platform)
	departure += fmt.Sprintf(" going to %s platform %s.  %d stops:", journey.DestinationName, dest.Platform, len(route))
	return departure
}

func formatTrains(journey TrainJourney, verbose bool) {
	// Keys: "date", "time_of_day", "request_time", "station_name", "station_code", "departures"
	// where "departures" is a dict with one key "all" which is a list of dicts of train departures
	printHeader(formatHeader(journey))
	departures := journey.Departures.All
	if verbose {
		fmt.Println(fmt.Sprintf("All departures:\n%+v", departures))
	}
	ch := make(chan []TrainStop)
	for _, train := range departures {
		// We need to make a GET request on the timetable URL to retrieve array of stops.
		// We are then only interested in a subset of the details fields for each stop.
		// We also want to add whether that stop is on the designated journey or not.
		// You can modify the request by passing an optional RequestOptions struct
		//r = requests.get(timetable_url)
		go StopProducer(train.ServiceTimetable.Url, journey.StationCode, journey.DestinationCode, verbose, ch)
		stops := StopConsumer(ch)
		//stops := getStops(train.ServiceTimetable.Url, journey.StationCode, journey.DestinationCode, verbose)
		if verbose {
			fmt.Println(fmt.Sprintf("Train %s stopping point details:\n%+v", train.TrainUid, stops))
		}
		trainDetails := formatDeparture(train, stops, journey)
		printTrainDetails(trainDetails, stops)
	}
	fmt.Println()
}

func printTrainDetails(trainDetails string, stops []TrainStop) {
	fmt.Println(trainDetails)
	printStopNames(stops)
}

func printHeader(header string) {
	headerBlock := strings.Repeat("=", len(header))
	fmt.Println(headerBlock)
	fmt.Println(header)
	fmt.Println(headerBlock)
}

func printStopNames(stops []TrainStop) {
	stopsOnRoute := ""
	for i := 0; i < len(stops); i++ {
		stop := stops[i]
		if stop.OnRoute {
			stopsOnRoute += fmt.Sprintf("%s, ", stop.StationName)
		}
	}
	fmt.Println(fmt.Sprintf("\t%s", stopsOnRoute[:len(stopsOnRoute)-2]))
}

// ---------- main  ----------
func procOpts(opts *docopt.Opts) {
	var conf struct {
		StationCode     string `docopt:"<from>"`
		DestinationCode string `docopt:"<to>"`
	}
	opts.Bind(&conf)

	stationCode := conf.StationCode
	destCode := conf.DestinationCode
	verbose := false

	if len(stationCode) == 3 && len(destCode) == 3 {
		var stationName, destName = validateInputs(stationCode, destCode)
		trains := getTrainsCallingAt(stationCode, stationName, destCode, destName, verbose)
		formatTrains(trains, verbose)
	} else {
		fmt.Println("Either source or destination not passed in")
	}
}

func main() {
	usage := fmt.Sprintf(`
    %s
    ---------
    Usage:
    %s <from> <to>
    %s -h | --help
    %s -V | --version

    Options:
    -h --help               Show this screen.
    -V --version            Show version.

    Examples
    1. trains from RDG to PAD:
    %s RDG PAD
`, PROGRAM, PROGRAM, PROGRAM, PROGRAM, PROGRAM)
	APP_ID = readCred(".transportAppId")
	APP_KEY = readCred(".transportAppKey")

	// Process error handling
	version := fmt.Sprintf("%s %s %s", VERSION, DATE, AUTHOR)
	opts, _ := docopt.ParseArgs(usage, os.Args[1:], version)
	procOpts(&opts)
}
