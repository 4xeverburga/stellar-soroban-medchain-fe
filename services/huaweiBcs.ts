// ChainMed Huawei BCS service - HTTP gateway client
// Default base URL points to the local gateway started from chaincode/test-demo/gateway

const API_BASE: string = (typeof process !== 'undefined' && (process as any).env?.CHAINMED_GATEWAY_URL) || 'http://localhost:3001/api';

export interface CommissionParams {
  gtin: string;
  batch: string;
  serialNumber: string;
  expiryDate: string;
  manufacturer: string;
  productName: string;
  location: string;
}

export interface AddTrackingEventParams {
  medicationId: string;
  event: string; // commission | ship | receive | dispense | recall
  location: string;
  actor: string;
  signature?: string;
}

export interface MedicationData {
  id: string;
  gtin: string;
  batch: string;
  serialNumber: string;
  expiryDate: string;
  manufacturer: string;
  productName: string;
  location: string;
  timestamp: number;
  transactionHash: string;
  status: string;
  commissionTime: number;
  recallReason?: string;
}

export interface TrackingEvent {
  id: string;
  event: string;
  location: string;
  timestamp: number;
  actor: string;
  medicationId: string;
  signature?: string;
}

export interface VerificationResult {
  isValid: boolean;
  medicationData: MedicationData;
  trackingHistory: TrackingEvent[];
  currentHolder?: string;
  verificationTime: number;
}

export async function commissionMedication(params: CommissionParams): Promise<{ medicationId: string }>
{
  const res = await fetch(`${API_BASE}/commissionMedication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addTrackingEvent(params: AddTrackingEventParams): Promise<{ status: string }>
{
  const res = await fetch(`${API_BASE}/addTrackingEvent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, signature: params.signature ?? '' }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function verifyMedication(medicationId: string): Promise<VerificationResult>
{
  const res = await fetch(`${API_BASE}/verifyMedication?id=${encodeURIComponent(medicationId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getVerificationStats(): Promise<{ totalVerifications: number; authenticMedications: number; alertsActive: number }>
{
  const res = await fetch(`${API_BASE}/getVerificationStats`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const huaweiBCS = {
  commissionMedication,
  addTrackingEvent,
  verifyMedication,
  getVerificationStats,
};


