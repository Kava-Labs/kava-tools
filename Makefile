#!/usr/bin/make -f

# VERSION := $(shell echo $(shell git describe --tags) | sed 's/^v//')
# COMMIT := $(shell git log -1 --format='%H')
# LEDGER_ENABLED ?= true

export GO111MODULE = on

install: go.sum
	go install -mod=readonly ./cmd/kvtools