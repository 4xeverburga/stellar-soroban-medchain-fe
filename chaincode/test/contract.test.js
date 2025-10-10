'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const DrugTraceabilityContract = require('../index');

describe('DrugTraceabilityContract', () => {
    let contract;
    let mockContext;
    let mockStub;

    beforeEach(() => {
        contract = new DrugTraceabilityContract();
        mockStub = {
            getState: sinon.stub(),
            putState: sinon.stub(),
            getTxID: sinon.stub().returns('mock-tx-id'),
            setEvent: sinon.stub(),
            getQueryResult: sinon.stub()
        };
        mockContext = {
            stub: mockStub
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('CommissionMedication', () => {
        it('should commission a new medication successfully', async () => {
            // Mock empty state (medication doesn't exist)
            mockStub.getState.resolves(Buffer.alloc(0));
            mockStub.putState.resolves();

            const result = await contract.CommissionMedication(
                mockContext,
                '7501001234567',
                'PCT2024001',
                '123456789',
                '2025-12-31',
                'Laboratorios Unidos S.A.',
                'Paracetamol 500mg',
                'Planta Lima'
            );

            const parsedResult = JSON.parse(result);
            expect(parsedResult.success).to.be.true;
            expect(parsedResult.medicationId).to.exist;
            expect(mockStub.putState.calledTwice).to.be.true; // Medication data + tracking event
        });

        it('should throw error if medication already exists', async () => {
            // Mock existing medication
            const existingMedication = {
                id: 'abc123',
                productName: 'Existing Product'
            };
            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingMedication)));

            try {
                await contract.CommissionMedication(
                    mockContext,
                    '7501001234567',
                    'PCT2024001',
                    '123456789',
                    '2025-12-31',
                    'Laboratorios Unidos S.A.',
                    'Paracetamol 500mg',
                    'Planta Lima'
                );
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('already exists');
            }
        });

        it('should throw error if required parameters are missing', async () => {
            try {
                await contract.CommissionMedication(
                    mockContext,
                    '', // Empty gtin
                    'PCT2024001',
                    '123456789',
                    '2025-12-31',
                    'Laboratorios Unidos S.A.',
                    'Paracetamol 500mg',
                    'Planta Lima'
                );
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('All parameters are required');
            }
        });
    });

    describe('AddTrackingEvent', () => {
        it('should add tracking event successfully', async () => {
            const existingMedication = {
                id: 'abc123',
                productName: 'Test Product',
                location: 'Old Location'
            };
            mockStub.getState
                .onFirstCall().resolves(Buffer.from(JSON.stringify(existingMedication))) // Medication exists
                .onSecondCall().resolves(Buffer.alloc(0)); // No existing events
            mockStub.putState.resolves();

            const result = await contract.AddTrackingEvent(
                mockContext,
                'abc123',
                'ship',
                'New Location',
                'Transport Company',
                'signature123'
            );

            const parsedResult = JSON.parse(result);
            expect(parsedResult.success).to.be.true;
            expect(mockStub.putState.calledTwice).to.be.true; // Updated medication + tracking event
        });

        it('should throw error if medication does not exist', async () => {
            mockStub.getState.resolves(Buffer.alloc(0)); // Medication doesn't exist

            try {
                await contract.AddTrackingEvent(
                    mockContext,
                    'nonexistent',
                    'ship',
                    'New Location',
                    'Transport Company'
                );
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('not found');
            }
        });
    });

    describe('VerifyMedication', () => {
        it('should verify medication successfully', async () => {
            const existingMedication = {
                id: 'abc123',
                productName: 'Test Product',
                status: 'commissioned',
                transactionHash: 'tx123'
            };
            const existingEvents = [
                {
                    event: 'commission',
                    location: 'Planta',
                    timestamp: '2024-01-01T00:00:00Z',
                    actor: 'Manufacturer'
                }
            ];

            mockStub.getState
                .onFirstCall().resolves(Buffer.from(JSON.stringify(existingMedication)))
                .onSecondCall().resolves(Buffer.from(JSON.stringify(existingEvents)));

            const result = await contract.VerifyMedication(mockContext, 'abc123');
            const parsedResult = JSON.parse(result);

            expect(parsedResult.isValid).to.be.true;
            expect(parsedResult.medicationData).to.exist;
            expect(parsedResult.trackingHistory).to.be.an('array');
            expect(parsedResult.currentHolder).to.equal('Manufacturer');
        });

        it('should return invalid for non-existent medication', async () => {
            mockStub.getState.resolves(Buffer.alloc(0)); // Medication doesn't exist

            const result = await contract.VerifyMedication(mockContext, 'nonexistent');
            const parsedResult = JSON.parse(result);

            expect(parsedResult.isValid).to.be.false;
            expect(parsedResult.medicationData).to.be.null;
            expect(parsedResult.trackingHistory).to.be.an('array').that.is.empty;
        });
    });

    describe('IssueMedicationRecall', () => {
        it('should issue recall successfully', async () => {
            const existingMedication = {
                id: 'abc123',
                productName: 'Test Product',
                status: 'commissioned'
            };

            mockStub.getState
                .onFirstCall().resolves(Buffer.from(JSON.stringify(existingMedication)))
                .onSecondCall().resolves(Buffer.alloc(0)); // No existing events
            mockStub.putState.resolves();

            const result = await contract.IssueMedicationRecall(
                mockContext,
                'abc123',
                'Quality issue detected',
                'DIGEMID'
            );

            const parsedResult = JSON.parse(result);
            expect(parsedResult.success).to.be.true;
            expect(mockStub.putState.calledTwice).to.be.true; // Updated medication + recall event
        });
    });

    describe('GetMedication', () => {
        it('should get medication successfully', async () => {
            const existingMedication = {
                id: 'abc123',
                productName: 'Test Product'
            };
            mockStub.getState.resolves(Buffer.from(JSON.stringify(existingMedication)));

            const result = await contract.GetMedication(mockContext, 'abc123');
            const parsedResult = JSON.parse(result);

            expect(parsedResult.id).to.equal('abc123');
            expect(parsedResult.productName).to.equal('Test Product');
        });

        it('should throw error for non-existent medication', async () => {
            mockStub.getState.resolves(Buffer.alloc(0));

            try {
                await contract.GetMedication(mockContext, 'nonexistent');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('not found');
            }
        });
    });

    describe('GetVerificationStats', () => {
        it('should return verification statistics', async () => {
            const mockQueryResult = {
                next: sinon.stub()
                    .onFirstCall().resolves({
                        value: { value: Buffer.from(JSON.stringify({ status: 'commissioned' })) },
                        done: false
                    })
                    .onSecondCall().resolves({
                        value: { value: Buffer.from(JSON.stringify({ status: 'recalled' })) },
                        done: false
                    })
                    .onThirdCall().resolves({ done: true }),
                close: sinon.stub()
            };

            mockStub.getQueryResult.resolves(mockQueryResult);

            const result = await contract.GetVerificationStats(mockContext);
            const parsedResult = JSON.parse(result);

            expect(parsedResult.total).to.equal(2);
            expect(parsedResult.auth).to.equal(1);
            expect(parsedResult.alerts).to.equal(1);
        });
    });

    describe('SearchMedications', () => {
        it('should search medications successfully', async () => {
            const mockQueryResult = {
                next: sinon.stub()
                    .onFirstCall().resolves({
                        value: { value: Buffer.from(JSON.stringify({ productName: 'Paracetamol' })) },
                        done: false
                    })
                    .onSecondCall().resolves({ done: true }),
                close: sinon.stub()
            };

            mockStub.getQueryResult.resolves(mockQueryResult);

            const result = await contract.SearchMedications(mockContext, 'Paracetamol');
            const parsedResult = JSON.parse(result);

            expect(parsedResult).to.be.an('array');
            expect(parsedResult[0].productName).to.equal('Paracetamol');
        });
    });
});
