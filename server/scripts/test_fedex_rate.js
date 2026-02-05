// using native fetch
// Since this is likely Node 18+, fetch is global.
const path = require('path');
const fs = require('fs');
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const fedexTokens = {};

const fedexAccounts = [
    {
        key: "FEDEX_1",
        clientId: process.env.FEDEX_CLIENT_ID_1,
        clientSecret: process.env.FEDEX_CLIENT_SECRET_1,
        accountNumber: "338574002"
    }
];

// DEBUG: Check for spaces in env vars
console.log(`ClientID Length: ${process.env.FEDEX_CLIENT_ID_1?.length}`);
console.log(`ClientID First Char: '${process.env.FEDEX_CLIENT_ID_1?.[0]}'`);
console.log(`ClientSecret Length: ${process.env.FEDEX_CLIENT_SECRET_1?.length}`);


async function getFedexToken(accountKey, clientId, clientSecret) {
    const cached = fedexTokens[accountKey];

    if (cached && Date.now() < cached.expiry) {
        return cached.token;
    }

    const res = await fetch("https://apis.fedex.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    const data = await res.json();
    console.log("Token Response:", data);

    fedexTokens[accountKey] = {
        token: data.access_token,
        expiry: Date.now() + (data.expires_in - 60) * 1000,
    };

    return data.access_token;
}

async function callFedExRate(shipment, fedexAccount) {
    const token = await getFedexToken(
        fedexAccount.key,
        fedexAccount.clientId,
        fedexAccount.clientSecret
    );

    const payload = {
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

            customsClearanceDetail: {
                dutiesPayment: {
                    paymentType: "SENDER"
                },
                commodities: [
                    {
                        description: "General Merchandise",
                        countryOfManufacture: shipment.origin_country,
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

    console.log("Request Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(
        "https://apis.fedex.com/rate/v1/rates/quotes",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );

    const data = await res.json();

    // LOGGING THE FULL RESPONSE (Just the first rate detail to avoid truncation)
    // console.log("FedEx Rate Detail [0]:", JSON.stringify(data.output.rateReplyDetails?.[0], null, 2));
    fs.writeFileSync(path.join(__dirname, "fedex_response.json"), JSON.stringify(data, null, 2));
    console.log("Written response to fedex_response.json");

    if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || "FedEx API error");
    }

    const detail =
        data.output.rateReplyDetails?.[0]?.ratedShipmentDetails?.[0];

    return {
        service: data.output.rateReplyDetails?.[0]?.serviceType,
        amount: detail?.totalNetCharge, // It is a number, not an object
        currency: detail?.currency,     // Currency is at the shipment details level
        transitDays: data.output.rateReplyDetails?.[0]?.operationalDetail?.deliveryDate // Use deliveryDate instead
    };
}

// Test Data
const shipment = {
    origin_country: "IN",
    destination_country: "US",
    weight_kg: 5,
    length_cm: 20,
    width_cm: 15,
    height_cm: 10,
    receiver_postcode: "10001",
    purpose: "SALE",
    declared_value: 200,
    currency: "USD"
};

(async () => {
    try {
        const result = await callFedExRate(shipment, fedexAccounts[0]);
        console.log("Parsed Result:", result);
    } catch (err) {
        console.error("Error:", err);
    }
})();
