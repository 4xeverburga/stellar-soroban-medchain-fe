module main

go 1.16

require (
	github.com/bitly/go-simplejson v0.5.0
	github.com/bmizerany/assert v0.0.0-20160611221934-b7ed37b82869 // indirect
	github.com/ghodss/yaml v1.0.0
	github.com/hyperledger/fabric-sdk-go v1.0.0
	github.com/pkg/errors v0.9.1
	github.com/spf13/viper v1.7.1
)

replace github.com/hyperledger/fabric-sdk-go => ./fabric-sdk-go
