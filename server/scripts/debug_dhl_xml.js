
require("dotenv").config();

async function testDHLXML() {
    const dhlAccount = {
        siteId: process.env.DHL_API_KEY_1, // reusing the ENV var for SiteID
        password: process.env.DHL_API_SECRET_1,
        accountNumber: process.env.DHL_ACCOUNT_NUMBER_1
    };

    console.log("Testing DHL XML-PI with SiteID:", dhlAccount.siteId);

    const dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<p:DCTRequest xmlns:p="http://www.dhl.com" xmlns:p1="http://www.dhl.com/datatypes" xmlns:p2="http://www.dhl.com/DCTRequestdatatypes" schemaVersion="2.0">
  <GetQuote>
    <Request>
      <ServiceHeader>
        <MessageTime>${new Date().toISOString()}</MessageTime>
        <MessageReference>1234567890123456789012345678901</MessageReference>
        <SiteID>${dhlAccount.siteId}</SiteID>
        <Password>${dhlAccount.password}</Password>
      </ServiceHeader>
    </Request>
    <From>
      <CountryCode>IN</CountryCode>
      <Postalcode>110001</Postalcode>
      <City>New Delhi</City>
    </From>
    <BkgDetails>
      <PaymentCountryCode>IN</PaymentCountryCode>
      <Date>${dateStr}</Date>
      <ReadyTime>PT10H00M</ReadyTime>
      <DimensionUnit>CM</DimensionUnit>
      <WeightUnit>KG</WeightUnit>
      <Pieces>
        <Piece>
          <PieceID>1</PieceID>
          <Height>10</Height>
          <Depth>10</Depth>
          <Width>10</Width>
          <Weight>1.0</Weight>
        </Piece>
      </Pieces>
      <PaymentAccountNumber>${dhlAccount.accountNumber}</PaymentAccountNumber>
      <IsDutiable>Y</IsDutiable>
      <NetworkTypeCode>AL</NetworkTypeCode>
    </BkgDetails>
    <To>
      <CountryCode>US</CountryCode>
      <Postalcode>10001</Postalcode>
      <City>New York</City>
    </To>
    <Dutiable>
      <DeclaredCurrency>USD</DeclaredCurrency>
      <DeclaredValue>100.0</DeclaredValue>
    </Dutiable>
  </GetQuote>
</p:DCTRequest>`;

    console.log("Using XML Payload...");

    try {
        const res = await fetch("https://xmlpi-ea.dhl.com/XMLShippingServlet", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: xmlPayload
        });

        const text = await res.text();
        console.log("XML Response Check:");
        if (text.includes("Error") || text.includes("ConditionData")) {
            // Simple check for error/success
            console.log(text.substring(0, 500)); // Log first 500 chars
        } else {
            console.log("Likely Success. Response Start:");
            console.log(text.substring(0, 500));
        }

    } catch (err) {
        console.error("XML-PI Request Failed:", err);
    }
}

testDHLXML();
