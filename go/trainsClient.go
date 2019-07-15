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
}

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
		log.Fatalln("Unable to make request: ", err)
	}

	//if err := resp.JSON(TrainStruct); err != nil {
	//	t.Error("Cannot serialize cookie JSON: ", err)
	//}
	respStr := resp.String()
	journey := &TrainJourney{}
	if err := resp.JSON(journey); err != nil {
		log.Fatal("Cannot serialize JSON: ", err)
	}
	// Fill in these values
	journey.DestinationName = dest_name
	journey.DestinationCode = dest_code
	if verbose {
		fmt.Println(fmt.Sprintf("Base URL: %s", url))
		pdata, _ := json.Marshal(params)
		fmt.Println(fmt.Sprintf("Params: %s", string(pdata)))
		fmt.Println(fmt.Sprintf("Response:\n%s", respStr))
		fmt.Println(fmt.Sprintf("Journey:\n%s", journey))
	}
	return *journey
}

/*
func procStop(stop TrainStop) map[string]string {
    s = {}
    s['station_code'] = stop.get('station_code')
    s['station_name'] = stop.get('station_name')
    s['expected_arrival_time'] = stop.get('expected_arrival_time')
    s['platform'] = stop.get('platform')
    return s
}

func getStops(timetable_url,station_code,dest_code) {
    // We need to make a GET request on the timetable URL to retrieve array of stops.
    // We are then only interested in a subset of the details fields for each stop.
    // We also want to add whether that stop is on the designated journey or not.
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
}
*/

func formatHeader(d TrainJourney) string {
	header := fmt.Sprintf("==== Trains from %s (%s) to %s", d.StationName, d.StationCode, d.DestinationName)
	header += fmt.Sprintf("(%s) %s %s ====", d.DestinationCode, d.TimeOfDay, d.Date)
	return header
}

func formatDeparture(train TrainDeparture, stops []string, journey TrainJourney) string {
	//source = [stop for stop in stops if stop.get('station_code') == d.get('station_code')][0]
	//dest = [stop for stop in stops if stop.get('station_code') == d.get('destination_code')][0]
	//route = [stop.get('station_name') for stop in stops if stop.get('on_route')]
	route := []string{}
	deptime := train.ExpectedDeparture
	if len(deptime) == 0 {
		deptime = train.AimedDeparture
	}
	departure := fmt.Sprintf("%s %s -> %s", journey.StationCode, deptime, journey.DestinationCode)
	departure += fmt.Sprintf(" %s => %s\n", train.ExpectedArrival, train.Status)
	departure += fmt.Sprintf("\tTrain %s (%s) from %s", train.TrainUid, train.Operator, train.OriginName)
	departure += fmt.Sprintf(" arriving at %s on platform %s", journey.StationName, train.Platform)
	departure += fmt.Sprintf(" going to %s platform %s.  %d stops:", train.DestinationName, train.Platform, len(route))
	return departure
}

func formatTrains(journey TrainJourney, verbose bool) {
	// Keys: "date", "time_of_day", "request_time", "station_name", "station_code", "departures"
	// where "departures" is a dict with one key "all" which is a list of dicts of train departures
	printHeader(formatHeader(journey))
	departures := journey.Departures.All
	if verbose {
		fmt.Println(fmt.Sprintf("All departures:\n%s", departures))
	}
	/*
		    for train in departures{
		        stops = getStops(train.get('service_timetable').get('id'),d.get('station_code'),d.get('destination_code'))
		        verbose and print(f'Train {train.get("train_uid")} stopping point details:\n{stops}')
		        trainDetails = formatDeparture(train,stops,d)
		        printTrainDetails(trainDetails,stops)
			}
	*/
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
	//stopNames = ','.join([stop.get('station_name') for stop in stops if stop.get('on_route')])
	//print(f'\t{stopNames}')
	fmt.Println("Stops TBD")
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
