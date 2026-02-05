// Mock Payload Test

// Mock Payload Test
// This script simulates the payload construction logic we added to server/index.js
// to verify that the structure matches what FedEx expects.

const shipment = {
    origin_country: "IN",
    destination_country: "US",
    receiver_postcode: "10001",
    weight_kg: 5,
    length_cm: 20,
    width_cm: 15,
    height_cm: 10,
    currency: "USD",
    declared_value: 200,
    purpose: "SALE",
    hs_code: "620520",
    description: "Cotton Shirt",
    document_type: "NON_DOCUMENTS"
};

const fedexAccount = {
    accountNumber: "TEST_ACCOUNT"
};

function buildPayload(shipment, fedexAccount) {
    return {
        accountNumber: {
            value: fedexAccount.accountNumber
        },
        rateRequestControlParameters: {
            returnTransitTimes: true
        },
        requestedShipment: {
            shipper: {
                address: {
                    countryCode: shipment.origin_country,
                    postalCode: "110001"
                }
            },
            recipient: {
                address: {
                    countryCode: shipment.destination_country,
                    postalCode: shipment.receiver_postcode
                }
            },
            pickupType: "DROPOFF_AT_FEDEX_LOCATION",
            rateRequestType: ["ACCOUNT"],

            // REQUIRED FOR INTERNATIONAL
            customsClearanceDetail: {
                dutiesPayment: {
                    paymentType: "SENDER"
                },
                documentContent: shipment.document_type, // DOCUMENTS or NON_DOCUMENTS
                commodities: [
                    {
                        description: shipment.description,
                        countryOfManufacture: shipment.origin_country,
                        harmonizedCode: shipment.hs_code, // HS Code
                        quantity: 1,
                        quantityUnits: "PCS",
                        weight: {
                            units: "KG",
                            value: shipment.weight_kg
                        },
                        customsValue: {
                            currency: shipment.currency,
                            amount: shipment.declared_value
                        },
                        purpose: shipment.purpose
                    }
                ]
            },

            requestedPackageLineItems: [
                {
                    weight: {
                        units: "KG",
                        value: shipment.weight_kg
                    },
                    dimensions: {
                        length: shipment.length_cm,
                        width: shipment.width_cm,
                        height: shipment.height_cm,
                        units: "CM"
                    }
                }
            ]
        }
    };
}

const payload = buildPayload(shipment, fedexAccount);
console.log(JSON.stringify(payload, null, 2));

// Quick assertion
if (payload.requestedShipment.customsClearanceDetail.documentContent === "NON_DOCUMENTS" &&
    payload.requestedShipment.customsClearanceDetail.commodities[0].harmonizedCode === "620520" &&
    payload.requestedShipment.customsClearanceDetail.commodities[0].description === "Cotton Shirt") {
    console.log("✅ Payload structure verified");
} else {
    console.error("❌ Payload structure incorrect");
}
