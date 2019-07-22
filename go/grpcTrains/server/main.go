/*
 main.go
(c) 2019 Mal Minhas, <mal@malm.co.uk>

Licence
--------
Copyright 2019 Mal Minhas. All Rights Reserved.

Description
-----------
Package main implements a grpc server for Trains service.

Installation
------------
Install protoc compiler for your platform from here: https://github.com/google/protobuf/releases
$ export GOPATH=<full path to local go directory>
$ cd grpcTrains 																	# should be relative to GOPATH
$ go get google.golang.org/grpc														# installs gRPC
$ go get -u github.com/golang/protobuf/protoc-gen-go								# installs protoc plugin
$ go get -u github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway			# installs grpc gateway for swagger
$ go get -u github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger               # installs grpc gateway for swagger
$ export PATH=$PATH:$GOPATH/bin														# GOBIN is $GOPATH/bin by default.  Must be in PATH.
$ protoc -I../..																	# generate in current grpcTrains directory
		 -I$GOPATH/src
		 -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway
		 -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis
		 ../../trains.proto --go_out=plugins=grpc:.
$ go run -ldflags="-s -w" server/main.go											# run server in current grpcTrains directory

Version
-------
22.07.19  0.1   First version
*/

package main

import (
	"context"
	"log"
	"net"

	pb ".."

	"google.golang.org/grpc"
)

const (
	port = ":8001"
)

// server is used to implement trains.TrainService.
type server struct{}

// GetTrains implements trains.TrainService.GetTrains
func (s *server) GetTrains(ctx context.Context, in *pb.TrainRequest) (*pb.TrainResponse, error) {
	log.Printf("Received: %v", in)
	//return &pb.TrainResponse{station_name: "Test", station_code: "TST"}, nil
	return &pb.TrainResponse{}, nil
}

func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterTrainServiceServer(s, &server{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
