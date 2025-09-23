package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/bitly/go-simplejson"
	"github.com/ghodss/yaml"
	"github.com/hyperledger/fabric-sdk-go/pkg/client/channel"
	"github.com/hyperledger/fabric-sdk-go/pkg/client/msp"
	"github.com/hyperledger/fabric-sdk-go/pkg/common/providers/context"
	mspapi "github.com/hyperledger/fabric-sdk-go/pkg/common/providers/msp"
	pmsp "github.com/hyperledger/fabric-sdk-go/pkg/common/providers/msp"
	contextImpl "github.com/hyperledger/fabric-sdk-go/pkg/context"
	"github.com/hyperledger/fabric-sdk-go/pkg/core/config"
	"github.com/hyperledger/fabric-sdk-go/pkg/fab"
	"github.com/hyperledger/fabric-sdk-go/pkg/fabsdk"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
)

// Global variable
var (
	sdk         *fabsdk.FabricSDK
	configFile  = "/root/gosdkdemo/config/gosdkdemo-channel-sdk-config.yaml"
	org         = "9103f17cb6b4f69d75982eb48bececcc51aa3125"
	sdkfile     *simplejson.Json
	chaincodeID string
	channelID   string
	privateKey  string
)

const emptyString = ""

func main() {
	// load config file to config
	err := loadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %s\n", err.Error())
		return
	}
	// initialize sdk
	initializeSdk()
	// insert data <testuser,100>
	_, err = insert("insert", [][]byte{
		[]byte("testuser"),
		[]byte("100"),
	})
	if err != nil {
		fmt.Printf("Failed to insert: %s\n", err)
		return
	}

	// query data, key="testuser"
	_, err = query("query",
		[][]byte{
			[]byte("testuser"),
		})
	if err != nil {
		fmt.Printf("Failed to query: %s\n", err)
		return
	}

}

// loadConfig load the config file to initialize some Global variable
func loadConfig() error {
	data, err := ioutil.ReadFile(configFile)
	if err != nil {
		return err
	}
	data, err = yaml.YAMLToJSON(data)
	if err != nil {
		return err
	}
	sdkfile, err = simplejson.NewJson(data)
	if err != nil {
		return err
	}
	channelID = GetDefaultChannel()
	chaincodeID = GetDefaultChaincodeId()
	return nil
}

// InitializeSdk initialize the sdk
func initializeSdk() {
	cnfg := config.FromFile(configFile)
	configProvider := cnfg
	var opts []fabsdk.Option
	opts, err := getOptsToInitializeSDK(configFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new SDK: %s", err))
	}

	/*
		We could use function getTlsCryptoKey to read tls key file(encrypted or not) from path specified by config file.
		For example:
		tlsKey,err := getTlsCryptoKey(org)
		if err !=nil{
			panic(fmt.Sprintf("Failed to get TlsCryptoKey: %s", err))

		}
		If such tls key is encrypted, you must use setClientTlsKey to update the tlskey in fabric-sdk after decrypting it.
		Or it will cause decode error.
		setClientTlsKey(decryptedTlsKey)
		After that if we need to reset tls key specified by config file, use function clearClientTlsKey please.
	*/

	sdk, err = fabsdk.New(configProvider, opts...)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new SDK: %s", err))
	}
}

// GetDefaultChaincodeId is a funtion to get the default chaincodeId
func GetDefaultChaincodeId() string {
	chaincodes := sdkfile.Get("channels").Get(channelID).Get("chaincodes").MustArray()
	if str, ok := chaincodes[0].(string); ok {
		return strings.Split(str, ":")[0]
	}
	return ""
}

// GetDefaultChannel is a funtion to get the default Channel
func GetDefaultChannel() string {
	channels := sdkfile.Get("channels").MustMap()
	for k, _ := range channels {
		return k
	}
	return ""
}

//GetCryptoPath get msp directory from sdk config file's path
func GetCryptoPath(orgId string) string {
	cryptoPath := sdkfile.Get("organizations").Get(orgId).Get("cryptoPath").MustString()
	return cryptoPath
}

//GetTlsCryptoKeyPath get tlsCryptoKeyPath from sdk config file's path with orgId
func GetTlsCryptoKeyPath(orgId string) string {
	tlsCryptoKeyPath := sdkfile.Get("organizations").Get(orgId).Get("tlsCryptoKeyPath").MustString()
	return tlsCryptoKeyPath
}

//GetSigncertsBytes can get Signcerts from sdk config file's path
//cryptoPath is get from function GetCryptoPath
func GetSigncertsBytes(orgId string) ([]byte, error) {
	cryptoPath := GetCryptoPath(orgId)
	signcertsPathdir := filepath.Join(cryptoPath, "signcerts")
	files, err := ioutil.ReadDir(signcertsPathdir)
	if len(files) != 1 || err != nil {
		return nil, errors.Errorf("file count invalid in the directory [%s]", signcertsPathdir)
	}

	f, err := ioutil.ReadFile(filepath.Join(signcertsPathdir, files[0].Name()))
	if err != nil {
		return nil, errors.Errorf("read signcerts from [%s] fail", files[0].Name())
	} else if f == nil {
		return nil, errors.Errorf("result of read signcerts file [%s] is null", files[0].Name())
	}

	return f, nil
}

//getPrivateKeyBytes can get privateKey from sdk config file's path
//cryptoPath is get from function GetCryptoPath
func getPrivateKeyBytes(orgId string) ([]byte, error) {
	cryptoPath := GetCryptoPath(orgId)
	keystorePathdir := filepath.Join(cryptoPath, "keystore")
	files, err := ioutil.ReadDir(keystorePathdir)
	if len(files) != 1 || err != nil {
		return nil, errors.Errorf("file count invalid in the directory [%s]", keystorePathdir)
	}

	f, err := ioutil.ReadFile(filepath.Join(keystorePathdir, files[0].Name()))
	if err != nil {
		return nil, errors.Errorf("read signcerts from [%s] fail", files[0].Name())
	} else if f == nil {
		return nil, errors.Errorf("result of read keystore file [%s] is null", files[0].Name())
	}

	return f, nil
}

//getTlsCryptoKey can get tlsCryptoKey content from tlsCryptoKeyPath
//tlsCryptoKeyPath is get from function GetTlsCryptoKeyPath
func getTlsCryptoKey(orgId string) (string, error) {
	tlsCryptoKeyPath := GetTlsCryptoKeyPath(orgId)
	f, err := ioutil.ReadFile(tlsCryptoKeyPath)
	if err != nil {
		return "", errors.Errorf("read tlsCryptoKey from [%s] fail", tlsCryptoKeyPath)
	} else if f == nil {
		return "", errors.Errorf("result of read tlsCryptoKey file [%s] is null", tlsCryptoKeyPath)
	}

	return string(f), nil
}

// getOptsToInitializeSDK is a function to initialize SDK
func getOptsToInitializeSDK(configFile string) ([]fabsdk.Option, error) {
	var opts []fabsdk.Option

	org := getOrgId(configFile)

	opts = append(opts, fabsdk.WithOrgid(org))

	opts = append(opts, fabsdk.WithUserName("Admin"))
	return opts, nil
}

// ChannelClient creates a new channel client
func ChannelClient(channelID string, user mspapi.SigningIdentity) (*channel.Client, error) {
	session := sdk.Context(fabsdk.WithIdentity(user))
	contextImpl.NewChannel(session, channelID)
	channelProvider := func() (context.Channel, error) {
		return contextImpl.NewChannel(session, channelID)
	}
	return channel.New(channelProvider)
}

// UserIdentityWithOrgAndName Identify users through org and Name,
// which can pass cert and private key with external variables
// if cert or pvtKey is empty, it will read from file path in sdk config file
func UserIdentityWithOrgAndName(orgID string, userName string, cert []byte, pvtKey string) (mspapi.SigningIdentity, error) {
	if userName == "" {
		return nil, errors.Errorf("No username specified")
	}

	mspClient, err := msp.New(sdk.Context(), msp.WithOrg(orgID))
	if err != nil {
		return nil, errors.Errorf("Error creating MSP client: %s", err)
	}

	if len(pvtKey) == 0 {
		user, err := mspClient.GetSigningIdentity(userName)
		if err != nil {
			return nil, errors.Errorf("GetSigningIdentity returned error: %v", err)
		}
		return user, nil

	} else {
		var certInside []byte

		if len(cert) == 0 {
			if certInside, err = GetSigncertsBytes(orgID); err != nil {
				return nil, err
			}
		} else {
			certInside = cert
		}

		// pvtKey must be decrypted when it is passed in function CreateSigningIdentity.
		user, err := mspClient.CreateSigningIdentity(pmsp.WithCert(certInside), pmsp.WithPrivateKey([]byte(pvtKey)))
		if err != nil {
			return nil, errors.Errorf("CreateSigningIdentity returned error: %v", err)
		}
		return user, nil
	}
	return nil, nil
}

//Insert Function
func insert(fName string, args [][]byte) (channel.Response, error) {
	/*We can get private key(encrypted or not) using function getPrivateKeyBytes
	We recommend that you set the private key to be decrypted here using function SetPrivateKey.
	for example:
	encryptedbytekey,_:= getPrivateKeyBytes(org)
	decrypt the encryptedkey
	setPrivateKey(decryptedKey)
	if cert or privateKey is empty, anyone of them will read from file path in sdk config file*/
	user, err := UserIdentityWithOrgAndName(org, "Admin", nil, privateKey)
	if err != nil {
		return channel.Response{}, err
	}

	//Generating the Channel Context
	chClient, err := ChannelClient(channelID, user)
	if err != nil {
		return channel.Response{}, err
	}

	//The client need to send a requset to the channel Chaincode Name,Function Name, Parameter
	response, err := chClient.Execute(
		channel.Request{
			ChaincodeID: chaincodeID,
			Fcn:         fName,
			Args:        args,
		})
	if err != nil {
		return channel.Response{}, errors.Wrap(err, "insert failed")
	}
	fmt.Printf("insert new data <%s,%s> success\n", string(args[0]), string(args[1]))
	return response, nil
}

// Query Function
func query(fName string, args [][]byte) (channel.Response, error) {
	/*We can get private key(encrypted or not) using function getPrivateKeyBytes
	We recommend that you set the private key to be decrypted here using function setPrivateKey.
	for example:
	encryptedkey,_:= getPrivateKeyBytes(org)
	decrypt the encryptedkey
	setPrivateKey(decryptedKey)
	if cert or privateKey is empty, anyone of them will read from file path in sdk config file*/
	user, err := UserIdentityWithOrgAndName(org, "Admin", nil, privateKey)
	if err != nil {
		return channel.Response{}, err
	}

	chClient, err := ChannelClient(channelID, user)
	if err != nil {
		return channel.Response{}, err
	}

	// The client need to send a requset to the channel Chaincode Name,Function Name, Parameter
	queryRes, err := chClient.Query(channel.Request{
		ChaincodeID: chaincodeID,
		Fcn:         fName,
		Args:        args,
	})

	if err == nil {
		fmt.Printf("Query key <%s> value is %s\n", string(args[0]), string(queryRes.Payload))
	}
	return queryRes, err
}

//setPrivateKey update the privateKey used in ChannelClient
func setPrivateKey(key string) {
	privateKey = key
}

//clearPrivateKey set privateKey empty
func clearPrivateKey() {
	privateKey = ""
}

//setClientTlsKey update the tls key in fabric-sdk
func setClientTlsKey(tlsKey string) {
	orgID := getOrgId(configFile)

	//SetTlsClientKey can be used to update the tlskey in fabric-sdk
	fab.SetTlsClientKey(orgID, tlsKey)
}

//clearClientTlsKey reset the tls key in fabric-sdk with tls key file specified in config
func clearClientTlsKey() {
	orgID := getOrgId(configFile)
	fab.ResetTlsClientKeyWithOrgID(orgID)
}

func getOrgId(configFile string) string {
	vc := viper.New()
	vc.SetConfigFile(configFile)
	err := vc.ReadInConfig()
	if err != nil {
		panic(fmt.Sprintf("Failed to read configFile: %s", configFile))
	}

	orgID := vc.GetString("client.originalOrganization")
	if orgID == "" {
		orgID = vc.GetString("client.organization")
	}
	return orgID
}
