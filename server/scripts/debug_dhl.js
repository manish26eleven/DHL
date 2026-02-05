
require("dotenv").config();

async function testDHL() {
    const dhlAccount = {
        key: "DHL_1",
        apiKey: process.env.DHL_API_KEY_1,
        apiSecret: process.env.DHL_API_SECRET_1,
        accountNumber: process.env.DHL_ACCOUNT_NUMBER_1
    };

    console.log("Testing DHL Account:", dhlAccount.key);
    console.log("Account Number:", dhlAccount.accountNumber);
    // console.log("API Key:", dhlAccount.apiKey); // Don't log full secrets if sharing screen

    const plannedShippingDate = new Date(Date.now() + 86400000).toISOString();

    const payload = {
        plannedShippingDateAndTime: plannedShippingDate,
        pickup: { isRequested: false },
        productAndServices: [{ productCode: "P" }],
        accounts: [{ typeCode: "shipper", number: dhlAccount.accountNumber }],
        customerDetails: {
            shipperDetails: { postalCode: "110001", countryCode: "IN" },
            receiverDetails: { postalCode: "10001", countryCode: "US" }
        },
        contentDetails: {
            isCustomsDeclarable: true,
            declaredValue: 100,
            declaredValueCurrencyCode: "USD",
            packages: [{ weight: 1.0, dimensions: { length: 10, width: 10, height: 10 } }]
        }
    };

    const authString = Buffer.from(`${dhlAccount.apiKey}:${dhlAccount.apiSecret}`).toString("base64");

    // TRY PRODUCTION URL
    console.log("Trying Production URL...");
    try {
        const res = await fetch("https://express.api.dhl.com/mydhlapi/rates", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            console.log("Production URL failed:", JSON.stringify(data, null, 2));
            throw new Error("Prod failed");
        }
        console.log("Production URL SUCCESS:", JSON.stringify(data?.products?.[0]?.productName, null, 2));
    } catch (err) {
        console.log("Error with Prod URL:", err.message);

        // TRY TEST URL
        console.log("Trying Test URL...");
        try {
            const resTest = await fetch("https://express.api.dhl.com/mydhlapi/test/rates", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${authString}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const dataTest = await resTest.json();
            console.log("Test URL Response:", JSON.stringify(dataTest, null, 2));
        } catch (errTest) {
            console.error("Test URL also failed");
        }
    }
}

testDHL();
