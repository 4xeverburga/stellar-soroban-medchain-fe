package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SmartContract defines the chaincode structure
type SmartContract struct {
}

// MedicationData represents a medication record
type MedicationData struct {
	ID              string `json:"id"`
	GTIN            string `json:"gtin"`
	Batch           string `json:"batch"`
	SerialNumber    string `json:"serialNumber"`
	ExpiryDate      string `json:"expiryDate"`
	Manufacturer    string `json:"manufacturer"`
	ProductName     string `json:"productName"`
	Location        string `json:"location"`
	Timestamp       int64  `json:"timestamp"`
	TransactionHash string `json:"transactionHash"`
	Status          string `json:"status"`
	CommissionTime  int64  `json:"commissionTime"`
	RecallReason    string `json:"recallReason,omitempty"`
}

// TrackingEvent represents a tracking event for medication
type TrackingEvent struct {
	ID           string `json:"id"`
	Event        string `json:"event"` // commission, ship, receive, dispense, recall
	Location     string `json:"location"`
	Timestamp    int64  `json:"timestamp"`
	Actor        string `json:"actor"`
	MedicationID string `json:"medicationId"`
	Signature    string `json:"signature,omitempty"`
}

// VerificationResult represents the result of medication verification
type VerificationResult struct {
	IsValid          bool            `json:"isValid"`
	MedicationData   *MedicationData `json:"medicationData"`
	TrackingHistory  []TrackingEvent `json:"trackingHistory"`
	CurrentHolder    string          `json:"currentHolder,omitempty"`
	VerificationTime int64           `json:"verificationTime"`
}

// Init initializes the chaincode
func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Drug Traceability Chaincode initialized")
	return shim.Success(nil)
}

// Invoke handles all function invocations
func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Printf("Function: %s, Args: %v\n", function, args)

	switch function {
	case "commissionMedication":
		return s.commissionMedication(stub, args)
	case "addTrackingEvent":
		return s.addTrackingEvent(stub, args)
	case "verifyMedication":
		return s.verifyMedication(stub, args)
	case "issueMedicationRecall":
		return s.issueMedicationRecall(stub, args)
	case "getMedication":
		return s.getMedication(stub, args)
	case "getTrackingHistory":
		return s.getTrackingHistory(stub, args)
	case "getMedicationsByManufacturer":
		return s.getMedicationsByManufacturer(stub, args)
	case "getVerificationStats":
		return s.getVerificationStats(stub, args)
	case "searchMedications":
		return s.searchMedications(stub, args)
	default:
		return shim.Error("Received unknown function invocation: " + function)
	}
}

// commissionMedication creates a new medication record
// Args: [gtin, batch, serialNumber, expiryDate, manufacturer, productName, location]
func (s *SmartContract) commissionMedication(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 7 {
		return shim.Error("Incorrect number of arguments. Expecting 7: gtin, batch, serialNumber, expiryDate, manufacturer, productName, location")
	}

	// Validate required fields
	if args[0] == "" || args[1] == "" || args[2] == "" || args[4] == "" || args[5] == "" {
		return shim.Error("Missing required fields: gtin, batch, serialNumber, manufacturer, productName")
	}

	// Create medication ID (batch + serialNumber)
	medicationID := args[1] + "-" + args[2]

	// Check if medication already exists
	existingData, err := stub.GetState(medicationID)
	if err != nil {
		return shim.Error("Failed to read from world state: " + err.Error())
	}
	if existingData != nil {
		return shim.Error("Medication already exists with ID: " + medicationID)
	}

	// Create medication data
	medication := MedicationData{
		ID:              medicationID,
		GTIN:            args[0],
		Batch:           args[1],
		SerialNumber:    args[2],
		ExpiryDate:      args[3],
		Manufacturer:    args[4],
		ProductName:     args[5],
		Location:        args[6],
		Timestamp:       time.Now().Unix(),
		TransactionHash: fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		Status:          "active",
		CommissionTime:  time.Now().Unix(),
	}

	// Marshal and store medication
	medicationJSON, err := json.Marshal(medication)
	if err != nil {
		return shim.Error("Failed to marshal medication: " + err.Error())
	}

	err = stub.PutState(medicationID, medicationJSON)
	if err != nil {
		return shim.Error("Failed to put medication to world state: " + err.Error())
	}

	// Create initial commission event
	commissionEvent := TrackingEvent{
		ID:           fmt.Sprintf("evt_%d", time.Now().UnixNano()),
		Event:        "commission",
		Location:     args[6],
		Timestamp:    time.Now().Unix(),
		Actor:        args[4], // manufacturer
		MedicationID: medicationID,
		Signature:    "",
	}

	// Store tracking event
	trackingKey := fmt.Sprintf("tracking_%s_%s", medicationID, commissionEvent.ID)
	eventJSON, err := json.Marshal(commissionEvent)
	if err != nil {
		return shim.Error("Failed to marshal tracking event: " + err.Error())
	}

	err = stub.PutState(trackingKey, eventJSON)
	if err != nil {
		return shim.Error("Failed to put tracking event to world state: " + err.Error())
	}

	fmt.Printf("Medication commissioned successfully: %s\n", medicationID)
	return shim.Success([]byte(medicationID))
}

// addTrackingEvent adds a tracking event for an existing medication
// Args: [medicationId, event, location, actor, signature]
func (s *SmartContract) addTrackingEvent(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5: medicationId, event, location, actor, signature")
	}

	medicationID := args[0]
	if medicationID == "" {
		return shim.Error("Missing medication ID")
	}

	// Check if medication exists
	medicationJSON, err := stub.GetState(medicationID)
	if err != nil {
		return shim.Error("Failed to read medication from world state: " + err.Error())
	}
	if medicationJSON == nil {
		return shim.Error("Medication not found: " + medicationID)
	}

	// Unmarshal medication data
	var medication MedicationData
	err = json.Unmarshal(medicationJSON, &medication)
	if err != nil {
		return shim.Error("Failed to unmarshal medication: " + err.Error())
	}

	// Create tracking event
	trackingEvent := TrackingEvent{
		ID:           fmt.Sprintf("evt_%d", time.Now().UnixNano()),
		Event:        args[1],
		Location:     args[2],
		Timestamp:    time.Now().Unix(),
		Actor:        args[3],
		MedicationID: medicationID,
		Signature:    args[4],
	}

	// Store tracking event
	trackingKey := fmt.Sprintf("tracking_%s_%s", medicationID, trackingEvent.ID)
	eventJSON, err := json.Marshal(trackingEvent)
	if err != nil {
		return shim.Error("Failed to marshal tracking event: " + err.Error())
	}

	err = stub.PutState(trackingKey, eventJSON)
	if err != nil {
		return shim.Error("Failed to put tracking event to world state: " + err.Error())
	}

	// Update medication location
	medication.Location = args[2]
	updatedMedicationJSON, err := json.Marshal(medication)
	if err != nil {
		return shim.Error("Failed to marshal updated medication: " + err.Error())
	}

	err = stub.PutState(medicationID, updatedMedicationJSON)
	if err != nil {
		return shim.Error("Failed to update medication in world state: " + err.Error())
	}

	fmt.Printf("Tracking event added successfully for medication: %s\n", medicationID)
	return shim.Success([]byte(trackingEvent.ID))
}

// verifyMedication verifies medication authenticity and returns tracking history
// Args: [medicationId]
func (s *SmartContract) verifyMedication(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: medicationId")
	}

	medicationID := args[0]
	if medicationID == "" {
		return shim.Error("Missing medication ID")
	}

	// Get medication data
	medicationJSON, err := stub.GetState(medicationID)
	if err != nil {
		return shim.Error("Failed to read medication from world state: " + err.Error())
	}
	if medicationJSON == nil {
		return shim.Error("Medication not found: " + medicationID)
	}

	var medication MedicationData
	err = json.Unmarshal(medicationJSON, &medication)
	if err != nil {
		return shim.Error("Failed to unmarshal medication: " + err.Error())
	}

	// Get all tracking events for this medication
	trackingHistory, err := s.getTrackingEventsForMedication(stub, medicationID)
	if err != nil {
		return shim.Error("Failed to get tracking history: " + err.Error())
	}

	// Determine current holder
	currentHolder := medication.Manufacturer
	if len(trackingHistory) > 0 {
		currentHolder = trackingHistory[len(trackingHistory)-1].Actor
	}

	// Check if medication is valid (not recalled)
	isValid := medication.Status != "recalled"
	for _, event := range trackingHistory {
		if event.Event == "recall" {
			isValid = false
			break
		}
	}

	// Create verification result
	verificationResult := VerificationResult{
		IsValid:          isValid,
		MedicationData:   &medication,
		TrackingHistory:  trackingHistory,
		CurrentHolder:    currentHolder,
		VerificationTime: time.Now().Unix(),
	}

	resultJSON, err := json.Marshal(verificationResult)
	if err != nil {
		return shim.Error("Failed to marshal verification result: " + err.Error())
	}

	return shim.Success(resultJSON)
}

// issueMedicationRecall issues a recall for a medication
// Args: [medicationId, reason, issuer]
func (s *SmartContract) issueMedicationRecall(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3: medicationId, reason, issuer")
	}

	medicationID := args[0]
	reason := args[1]
	issuer := args[2]

	if medicationID == "" {
		return shim.Error("Missing medication ID")
	}

	// Get medication data
	medicationJSON, err := stub.GetState(medicationID)
	if err != nil {
		return shim.Error("Failed to read medication from world state: " + err.Error())
	}
	if medicationJSON == nil {
		return shim.Error("Medication not found: " + medicationID)
	}

	var medication MedicationData
	err = json.Unmarshal(medicationJSON, &medication)
	if err != nil {
		return shim.Error("Failed to unmarshal medication: " + err.Error())
	}

	// Update medication status
	medication.Status = "recalled"
	medication.RecallReason = reason

	// Save updated medication
	updatedMedicationJSON, err := json.Marshal(medication)
	if err != nil {
		return shim.Error("Failed to marshal updated medication: " + err.Error())
	}

	err = stub.PutState(medicationID, updatedMedicationJSON)
	if err != nil {
		return shim.Error("Failed to update medication in world state: " + err.Error())
	}

	// Create recall tracking event
	recallEvent := TrackingEvent{
		ID:           fmt.Sprintf("evt_%d", time.Now().UnixNano()),
		Event:        "recall",
		Location:     medication.Location,
		Timestamp:    time.Now().Unix(),
		Actor:        issuer,
		MedicationID: medicationID,
		Signature:    "",
	}

	// Store recall event
	trackingKey := fmt.Sprintf("tracking_%s_%s", medicationID, recallEvent.ID)
	eventJSON, err := json.Marshal(recallEvent)
	if err != nil {
		return shim.Error("Failed to marshal recall event: " + err.Error())
	}

	err = stub.PutState(trackingKey, eventJSON)
	if err != nil {
		return shim.Error("Failed to put recall event to world state: " + err.Error())
	}

	fmt.Printf("Medication recall issued successfully for: %s\n", medicationID)
	return shim.Success([]byte(recallEvent.ID))
}

// Helper functions (getMedication, getTrackingHistory, etc.)
func (s *SmartContract) getMedication(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: medicationId")
	}

	medicationID := args[0]
	if medicationID == "" {
		return shim.Error("Missing medication ID")
	}

	medicationJSON, err := stub.GetState(medicationID)
	if err != nil {
		return shim.Error("Failed to read medication from world state: " + err.Error())
	}
	if medicationJSON == nil {
		return shim.Error("Medication not found: " + medicationID)
	}

	return shim.Success(medicationJSON)
}

func (s *SmartContract) getTrackingHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: medicationId")
	}

	medicationID := args[0]
	if medicationID == "" {
		return shim.Error("Missing medication ID")
	}

	trackingHistory, err := s.getTrackingEventsForMedication(stub, medicationID)
	if err != nil {
		return shim.Error("Failed to get tracking history: " + err.Error())
	}

	historyJSON, err := json.Marshal(trackingHistory)
	if err != nil {
		return shim.Error("Failed to marshal tracking history: " + err.Error())
	}

	return shim.Success(historyJSON)
}

func (s *SmartContract) getMedicationsByManufacturer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: manufacturer")
	}

	manufacturer := args[0]
	if manufacturer == "" {
		return shim.Error("Missing manufacturer name")
	}

	resultsIterator, err := stub.GetStateByRange("", "")
	if err != nil {
		return shim.Error("Failed to get state by range: " + err.Error())
	}
	defer resultsIterator.Close()

	var medications []MedicationData
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("Failed to get next result: " + err.Error())
		}

		// Skip tracking events (they have tracking_ prefix)
		if len(queryResponse.Key) > 9 && queryResponse.Key[:9] == "tracking_" {
			continue
		}

		var medication MedicationData
		err = json.Unmarshal(queryResponse.Value, &medication)
		if err != nil {
			continue // Skip invalid records
		}

		if medication.Manufacturer == manufacturer {
			medications = append(medications, medication)
		}
	}

	medicationsJSON, err := json.Marshal(medications)
	if err != nil {
		return shim.Error("Failed to marshal medications: " + err.Error())
	}

	return shim.Success(medicationsJSON)
}

func (s *SmartContract) getVerificationStats(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 0 {
		return shim.Error("Incorrect number of arguments. Expecting 0")
	}

	resultsIterator, err := stub.GetStateByRange("", "")
	if err != nil {
		return shim.Error("Failed to get state by range: " + err.Error())
	}
	defer resultsIterator.Close()

	var stats = struct {
		TotalVerifications   int `json:"totalVerifications"`
		AuthenticMedications int `json:"authenticMedications"`
		AlertsActive         int `json:"alertsActive"`
	}{
		TotalVerifications:   0,
		AuthenticMedications: 0,
		AlertsActive:         0,
	}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("Failed to get next result: " + err.Error())
		}

		// Skip tracking events
		if len(queryResponse.Key) > 9 && queryResponse.Key[:9] == "tracking_" {
			continue
		}

		var medication MedicationData
		err = json.Unmarshal(queryResponse.Value, &medication)
		if err != nil {
			continue // Skip invalid records
		}

		stats.TotalVerifications++
		if medication.Status == "active" {
			stats.AuthenticMedications++
		} else if medication.Status == "recalled" {
			stats.AlertsActive++
		}
	}

	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return shim.Error("Failed to marshal stats: " + err.Error())
	}

	return shim.Success(statsJSON)
}

func (s *SmartContract) searchMedications(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: query")
	}

	query := args[0]
	if query == "" {
		return shim.Error("Missing search query")
	}

	resultsIterator, err := stub.GetStateByRange("", "")
	if err != nil {
		return shim.Error("Failed to get state by range: " + err.Error())
	}
	defer resultsIterator.Close()

	var matchingMedications []MedicationData
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("Failed to get next result: " + err.Error())
		}

		// Skip tracking events
		if len(queryResponse.Key) > 9 && queryResponse.Key[:9] == "tracking_" {
			continue
		}

		var medication MedicationData
		err = json.Unmarshal(queryResponse.Value, &medication)
		if err != nil {
			continue // Skip invalid records
		}

		// Simple search implementation - check if query matches any field
		searchableText := fmt.Sprintf("%s %s %s %s %s %s",
			medication.ProductName, medication.Manufacturer, medication.Batch,
			medication.GTIN, medication.SerialNumber, medication.Location)

		if s.containsIgnoreCase(searchableText, query) {
			matchingMedications = append(matchingMedications, medication)
		}
	}

	medicationsJSON, err := json.Marshal(matchingMedications)
	if err != nil {
		return shim.Error("Failed to marshal medications: " + err.Error())
	}

	return shim.Success(medicationsJSON)
}

// Helper function to get all tracking events for a medication
func (s *SmartContract) getTrackingEventsForMedication(stub shim.ChaincodeStubInterface, medicationID string) ([]TrackingEvent, error) {
	resultsIterator, err := stub.GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var trackingEvents []TrackingEvent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// Only process tracking events for this medication
		if len(queryResponse.Key) > 9 && queryResponse.Key[:9] == "tracking_" {
			var event TrackingEvent
			err = json.Unmarshal(queryResponse.Value, &event)
			if err != nil {
				continue // Skip invalid records
			}

			if event.MedicationID == medicationID {
				trackingEvents = append(trackingEvents, event)
			}
		}
	}

	return trackingEvents, nil
}

// Helper function for case-insensitive string search
func (s *SmartContract) containsIgnoreCase(str, substr string) bool {
	return len(str) >= len(substr) &&
		(str == substr ||
			len(str) > len(substr) &&
				(str[:len(substr)] == substr ||
					str[len(str)-len(substr):] == substr ||
					bytes.Contains([]byte(str), []byte(substr))))
}

// Main function
func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error starting Drug Traceability chaincode: %s", err)
	}
}
