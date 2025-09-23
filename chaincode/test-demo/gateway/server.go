package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
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

// Configuration
var (
	sdk         *fabsdk.FabricSDK
	configFile  = "../config.yaml"
	org         = "3a9d7ece5855a73f17e597fa65a96a4c082254a1"
	sdkfile     *simplejson.Json
	channelID   string
	chaincodeID string
	privateKey  string
)

const pharmaPeerEndpoint = "peer-3a9d7ece5855a73f17e597fa65a96a4c082254a1-0.peer-3a9d7ece5855a73f17e597fa65a96a4c082254a1.default.svc.cluster.local:30605"

func main() {
	log.Println("🚀 Starting ChainMed BCS Gateway on :3001 ...")
	if err := loadConfig(); err != nil {
		log.Fatalf("failed to load config: %v", err)
	}
	initializeSdk()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))

	mux.HandleFunc("/api/commissionMedication", withCORS(postJSON(commissionMedicationHandler)))
	mux.HandleFunc("/api/addTrackingEvent", withCORS(postJSON(addTrackingEventHandler)))
	mux.HandleFunc("/api/verifyMedication", withCORS(getVerifyMedicationHandler))
	mux.HandleFunc("/api/getVerificationStats", withCORS(getVerificationStatsHandler))

	// Preflight
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			addCORS(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}
		http.NotFound(w, r)
	})

	log.Fatal(http.ListenAndServe(":3001", mux))
}

// Handlers
type commissionReq struct {
	GTIN         string `json:"gtin"`
	Batch        string `json:"batch"`
	SerialNumber string `json:"serialNumber"`
	ExpiryDate   string `json:"expiryDate"`
	Manufacturer string `json:"manufacturer"`
	ProductName  string `json:"productName"`
	Location     string `json:"location"`
}

func commissionMedicationHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	var body commissionReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		return nil, err
	}
	args := [][]byte{
		[]byte(body.GTIN),
		[]byte(body.Batch),
		[]byte(body.SerialNumber),
		[]byte(body.ExpiryDate),
		[]byte(body.Manufacturer),
		[]byte(body.ProductName),
		[]byte(body.Location),
	}
	resp, err := executeCC("commissionMedication", args)
	if err != nil {
		return nil, err
	}
	return map[string]string{"medicationId": string(resp.Payload)}, nil
}

type addEventReq struct {
	MedicationID string `json:"medicationId"`
	Event        string `json:"event"`
	Location     string `json:"location"`
	Actor        string `json:"actor"`
	Signature    string `json:"signature"`
}

func addTrackingEventHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	var body addEventReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		return nil, err
	}
	args := [][]byte{
		[]byte(body.MedicationID),
		[]byte(body.Event),
		[]byte(body.Location),
		[]byte(body.Actor),
		[]byte(body.Signature),
	}
	_, err := executeCC("addTrackingEvent", args)
	if err != nil {
		return nil, err
	}
	return map[string]string{"status": "ok"}, nil
}

func getVerifyMedicationHandler(w http.ResponseWriter, r *http.Request) {
	addCORS(w)
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	payload, err := queryCC("verifyMedication", [][]byte{[]byte(id)})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(payload)
}

func getVerificationStatsHandler(w http.ResponseWriter, r *http.Request) {
	addCORS(w)
	payload, err := queryCC("getVerificationStats", [][]byte{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(payload)
}

// SDK glue
func executeCC(fcn string, args [][]byte) (channel.Response, error) {
	ensurePrivateKey()
	user, err := UserIdentityWithOrgAndName(org, "Admin", nil, privateKey)
	if err != nil {
		return channel.Response{}, err
	}
	chClient, err := ChannelClient(channelID, user)
	if err != nil {
		return channel.Response{}, err
	}
	return chClient.Execute(
		channel.Request{ChaincodeID: chaincodeID, Fcn: fcn, Args: args},
		channel.WithTargetEndpoints(pharmaPeerEndpoint),
	)
}

func queryCC(fcn string, args [][]byte) ([]byte, error) {
	ensurePrivateKey()
	user, err := UserIdentityWithOrgAndName(org, "Admin", nil, privateKey)
	if err != nil {
		return nil, err
	}
	chClient, err := ChannelClient(channelID, user)
	if err != nil {
		return nil, err
	}
	res, err := chClient.Query(
		channel.Request{ChaincodeID: chaincodeID, Fcn: fcn, Args: args},
		channel.WithTargetEndpoints(pharmaPeerEndpoint),
	)
	if err != nil {
		return nil, err
	}
	return res.Payload, nil
}

func ensurePrivateKey() {
	if privateKey != "" {
		return
	}
	if key, _ := getPrivateKeyBytes(org); len(key) > 0 {
		privateKey = string(key)
	}
}

// Helpers copied from demo
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

func initializeSdk() {
	cnfg := config.FromFile(configFile)
	configProvider := cnfg
	var opts []fabsdk.Option
	opts, err := getOptsToInitializeSDK(configFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new SDK: %s", err))
	}
	var err2 error
	sdk, err2 = fabsdk.New(configProvider, opts...)
	if err2 != nil {
		panic(fmt.Sprintf("Failed to create new SDK: %s", err2))
	}
}

func getOptsToInitializeSDK(configFile string) ([]fabsdk.Option, error) {
	var opts []fabsdk.Option
	org := getOrgId(configFile)
	opts = append(opts, fabsdk.WithOrgid(org))
	opts = append(opts, fabsdk.WithUserName("Admin"))
	return opts, nil
}

func getOrgId(configFile string) string {
	vc := viper.New()
	vc.SetConfigFile(configFile)
	if err := vc.ReadInConfig(); err != nil {
		return org
	}
	orgID := vc.GetString("client.originalOrganization")
	if orgID == "" {
		orgID = vc.GetString("client.organization")
	}
	if orgID == "" {
		return org
	}
	return orgID
}

func ChannelClient(channelID string, user mspapi.SigningIdentity) (*channel.Client, error) {
	session := sdk.Context(fabsdk.WithIdentity(user))
	contextImpl.NewChannel(session, channelID)
	channelProvider := func() (context.Channel, error) { return contextImpl.NewChannel(session, channelID) }
	return channel.New(channelProvider)
}

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
	}
	var certInside []byte
	if len(cert) == 0 {
		if certInside, err = GetSigncertsBytes(orgID); err != nil {
			return nil, err
		}
	} else {
		certInside = cert
	}
	user, err := mspClient.CreateSigningIdentity(pmsp.WithCert(certInside), pmsp.WithPrivateKey([]byte(pvtKey)))
	if err != nil {
		return nil, errors.Errorf("CreateSigningIdentity returned error: %v", err)
	}
	return user, nil
}

func GetDefaultChaincodeId() string {
	chaincodes := sdkfile.Get("channels").Get(channelID).Get("chaincodes").MustArray()
	if len(chaincodes) > 0 {
		if str, ok := chaincodes[0].(string); ok {
			return strings.Split(str, ":")[0]
		}
	}
	return "drugtraceability"
}
func GetDefaultChannel() string {
	channels := sdkfile.Get("channels").MustMap()
	for k := range channels {
		return k
	}
	return "medchainchannel"
}
func GetCryptoPath(orgId string) string {
	return sdkfile.Get("organizations").Get(orgId).Get("cryptoPath").MustString()
}
func GetSigncertsBytes(orgId string) ([]byte, error) {
	cryptoPath := GetCryptoPath(orgId)
	signcertsPathdir := filepath.Join(cryptoPath, "signcerts")
	files, err := ioutil.ReadDir(signcertsPathdir)
	if err != nil || len(files) == 0 {
		return nil, errors.Errorf("signcerts not found in %s", signcertsPathdir)
	}
	return ioutil.ReadFile(filepath.Join(signcertsPathdir, files[0].Name()))
}
func getPrivateKeyBytes(orgId string) ([]byte, error) {
	cryptoPath := GetCryptoPath(orgId)
	keystorePathdir := filepath.Join(cryptoPath, "keystore")
	files, err := ioutil.ReadDir(keystorePathdir)
	if err != nil || len(files) == 0 {
		return nil, errors.Errorf("keystore not found in %s", keystorePathdir)
	}
	return ioutil.ReadFile(filepath.Join(keystorePathdir, files[0].Name()))
}

// CORS helpers
func addCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}
func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		addCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h(w, r)
	}
}

// POST JSON wrapper
type handlerWithResp func(http.ResponseWriter, *http.Request) (interface{}, error)

func postJSON(h handlerWithResp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		resp, err := h(w, r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}
