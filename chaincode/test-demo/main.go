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
	"github.com/hyperledger/fabric-sdk-go/pkg/fabsdk"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
)

// Global variable
var (
	sdk         *fabsdk.FabricSDK
	configFile  = "./config.yaml"
	org         = "3a9d7ece5855a73f17e597fa65a96a4c082254a1"
	sdkfile     *simplejson.Json
	chaincodeID string
	channelID   string
	privateKey  string
)

// Force requests to PharmaOrg peer to avoid transient connection to other peers
const pharmaPeerEndpoint = "peer-3a9d7ece5855a73f17e597fa65a96a4c082254a1-0.peer-3a9d7ece5855a73f17e597fa65a96a4c082254a1.default.svc.cluster.local:30605"

func main() {
	fmt.Println("🧪 Testing ChainMed Drug Traceability Chaincode")
	fmt.Println(strings.Repeat("=", 50))

	// load config file to config
	err := loadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %s\n", err.Error())
		return
	}
	// initialize sdk
	initializeSdk()

	// Test 1: Get Verification Stats
	fmt.Println("\n📊 TEST 1: Get Verification Stats")
	_, err = query("getVerificationStats", [][]byte{})
	if err != nil {
		fmt.Printf("Failed to get stats: %s\n", err)
	}

	// Test 2: Commission Medication
	fmt.Println("\n📦 TEST 2: Commission Medication")
	_, err = insert("commissionMedication", [][]byte{
		[]byte("7501001234567"),
		[]byte("BATCH001"),
		[]byte("SN001"),
		[]byte("2025-12-31"),
		[]byte("PharmaCorp"),
		[]byte("Paracetamol 500mg"),
		[]byte("Manufacturing Plant A"),
	})
	if err != nil {
		fmt.Printf("Failed to commission: %s\n", err)
	}

	// Test 2.1: Add Tracking Event (ship)
	fmt.Println("\n🚚 TEST 2.1: Add Tracking Event (ship)")
	_, err = insert("addTrackingEvent", [][]byte{
		[]byte("BATCH001-SN001"),
		[]byte("ship"),
		[]byte("Distribution Center B"),
		[]byte("LogisticsCorp"),
		[]byte(""),
	})
	if err != nil {
		fmt.Printf("Failed to add tracking event: %s\n", err)
	}

	// Test 3: Verify Medication
	fmt.Println("\n🔍 TEST 3: Verify Medication")
	_, err = query("verifyMedication", [][]byte{
		[]byte("BATCH001-SN001"),
	})
	if err != nil {
		fmt.Printf("Failed to verify: %s\n", err)
	}

	fmt.Println("\n✅ All tests completed!")
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

	sdk, err = fabsdk.New(configProvider, opts...)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new SDK: %s", err))
	}
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

// UserIdentityWithOrgAndName Identify users through org and Name
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

// Insert Function
func insert(fName string, args [][]byte) (channel.Response, error) {
	// Ensure privateKey is loaded from MSP keystore if not provided
	if privateKey == "" {
		if keyBytes, _ := getPrivateKeyBytes(org); len(keyBytes) > 0 {
			privateKey = string(keyBytes)
		}
	}
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
		},
		channel.WithTargetEndpoints(pharmaPeerEndpoint),
	)
	if err != nil {
		return channel.Response{}, errors.Wrap(err, "insert failed")
	}
	fmt.Printf("✅ %s success: %s\n", fName, string(response.Payload))
	return response, nil
}

// Query Function
func query(fName string, args [][]byte) (channel.Response, error) {
	// Ensure privateKey is loaded from MSP keystore if not provided
	if privateKey == "" {
		if keyBytes, _ := getPrivateKeyBytes(org); len(keyBytes) > 0 {
			privateKey = string(keyBytes)
		}
	}
	user, err := UserIdentityWithOrgAndName(org, "Admin", nil, privateKey)
	if err != nil {
		return channel.Response{}, err
	}

	chClient, err := ChannelClient(channelID, user)
	if err != nil {
		return channel.Response{}, err
	}

	// The client need to send a requset to the channel Chaincode Name,Function Name, Parameter
	queryRes, err := chClient.Query(
		channel.Request{
			ChaincodeID: chaincodeID,
			Fcn:         fName,
			Args:        args,
		},
		channel.WithTargetEndpoints(pharmaPeerEndpoint),
	)

	if err == nil {
		fmt.Printf("✅ %s result: %s\n", fName, string(queryRes.Payload))
	}
	return queryRes, err
}

// GetCryptoPath get msp directory from sdk config file's path
func GetCryptoPath(orgId string) string {
	cryptoPath := sdkfile.Get("organizations").Get(orgId).Get("cryptoPath").MustString()
	return cryptoPath
}

// GetSigncertsBytes can get Signcerts from sdk config file's path
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

// getPrivateKeyBytes reads the MSP keystore private key bytes for the given org ID
func getPrivateKeyBytes(orgId string) ([]byte, error) {
	cryptoPath := GetCryptoPath(orgId)
	keystorePathdir := filepath.Join(cryptoPath, "keystore")
	files, err := ioutil.ReadDir(keystorePathdir)
	if err != nil || len(files) == 0 {
		return nil, errors.Errorf("keystore not found or empty in [%s]", keystorePathdir)
	}
	// Expect exactly one key file in keystore; take the first
	keyFile := filepath.Join(keystorePathdir, files[0].Name())
	f, err := ioutil.ReadFile(keyFile)
	if err != nil {
		return nil, errors.Errorf("read keystore from [%s] fail", keyFile)
	}
	return f, nil
}

// GetDefaultChaincodeId is a function to get the default chaincodeId
func GetDefaultChaincodeId() string {
	chaincodes := sdkfile.Get("channels").Get(channelID).Get("chaincodes").MustArray()
	if len(chaincodes) > 0 {
		if str, ok := chaincodes[0].(string); ok {
			return strings.Split(str, ":")[0]
		}
	}
	return "drugtraceability" // Fallback to our chaincode name
}

// GetDefaultChannel is a function to get the default Channel
func GetDefaultChannel() string {
	channels := sdkfile.Get("channels").MustMap()
	for k := range channels {
		return k
	}
	return "medchainchannel" // Fallback to our channel name
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
