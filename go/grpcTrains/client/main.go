/*
 main.go
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
Package main implements a grpc client for Trains service.

Installation
------------
$ export GOPATH=<full path to local directory>
$ go get -v github.com/docopt/docopt-go

$ go run -ldflags="-s -w" main.go

Version
-------
22.07.19  0.1   First version
*/

package main

import (
	"context"
	"log"
	"time"

	pb ".."
	"google.golang.org/grpc"
)

const (
	address = "localhost:8001"
)

func main() {
	// Set up a connection to the server.
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewTrainServiceClient(conn)

	// Contact the server and print out its response.
	//from := defaultFrom
	//if len(os.Args) > 1 {
	//	from = os.Args[1]
	//}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.GetTrains(ctx, &pb.TrainRequest{From: "TWY", To: "PAD"})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("From: %s (%s), To: %s", r.StationCode, r.StationName, r.DestCode)
}

/*
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
*/
