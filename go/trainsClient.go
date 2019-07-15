// trainsClient.go
//
// Installation:
// ------------
// $ export GOPATH=<full path to local directory>
// $ go get -v github.com/docopt/docopt-go
// $ go build -ldflags="-s -w" trains.go

package main

import (
	"fmt"
	"os"
	"time"

	docopt "github.com/docopt/docopt-go"
)

// ---------- main  ----------
func procOpts(opts *docopt.Opts) {
	//opts, _ := docopt.ParseDoc(usage)
	//fmt.Println(typeof(opts))
	//fmt.Println(opts)
	var conf struct {
		StationCode     string `docopt:"<from>"`
		DestinationCode string `docopt:"<to>"`
	}
	opts.Bind(&conf)

	station := conf.StationCode
	dest := conf.DestinationCode

	if len(station) > 0 && len(dest) > 0 && len(dest_name) > 0 {
		start := time.Now()
		fmt.Println(fmt.Sprintf("Source='%s',Destination='%s'", station, dest))
		t := time.Now()
		elapsed := t.Sub(start)
		fmt.Printf("========== FINISHED ===========\nElapsed time = %s", elapsed)
	} else {
		fmt.Println("Either source or destination not passed in")
	}
}

func main() {
	usage := `
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
`
	// Process error handling
	version := "1.0"
	opts, _ := docopt.ParseArgs(usage, os.Args[1:], version)
	procOpts(&opts)
}
