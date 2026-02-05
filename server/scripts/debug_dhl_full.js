
require("dotenv").config();

async function testDHLXMLFull() {
    const dhlAccount = {
        siteId: process.env.DHL_API_KEY_1,
        password: process.env.DHL_API_SECRET_1,
        accountNumber: process.env.DHL_ACCOUNT_NUMBER_1
    };

    console.log("Testing DHL XML-PI Full Response");

    const dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<p:DCTRequest xmlns:p="http://www.dhl.com" xmlns:p1="http://www.dhl.com/datatypes" xmlns:p2="http://www.dhl.com/DCTRequestdatatypes" schemaVersion="2.0">
  <GetQuote>
    <Request>
      <ServiceHeader>
        <MessageTime>${timestamp}</MessageTime>
        <MessageReference>1234567890123456789012345678901</MessageReference>
        <SiteID>${dhlAccount.siteId}</SiteID>
        <Password>${dhlAccount.password}</Password>
      </ServiceHeader>
    </Request>
    <From>
      <CountryCode>IN</CountryCode>
      <Postalcode>110001</Postalcode>
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
          <Depth>20</Depth>
          <Width>15</Width>
          <Weight>5.0</Weight>
        </Piece>
      </Pieces>
      <PaymentAccountNumber>${dhlAccount.accountNumber}</PaymentAccountNumber>
      <IsDutiable>Y</IsDutiable>
      <NetworkTypeCode>AL</NetworkTypeCode>
    </BkgDetails>
    <To>
      <CountryCode>US</CountryCode>
      <Postalcode>10001</Postalcode>
    </To>
    <Dutiable>
      <DeclaredCurrency>USD</DeclaredCurrency>
      <DeclaredValue>200.0</DeclaredValue>
    </Dutiable>
  </GetQuote>
</p:DCTRequest>`;

    try {
        const res = await fetch("https://xmlpi-ea.dhl.com/XMLShippingServlet", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: xmlPayload
        });

        const text = await res.text();
        console.log("FULL XML RESPONSE:");
        console.log(text);
        console.log("\n--- PARSING TEST ---");

        const productMatch = text.match(/<ProductShortName>(.*?)<\/ProductShortName>/);
        const chargeMatch = text.match(/<ShippingCharge>([\d\.]+)<\/ShippingCharge>/);
        const currencyMatch = text.match(/<CurrencyCode>([A-Z]+)<\/CurrencyCode>/);
        const daysMatch = text.match(/<TotalTransitDays>(\d+)<\/TotalTransitDays>/);

        console.log("Product:", productMatch ? productMatch[1] : "NOT FOUND");
        console.log("Charge:", chargeMatch ? chargeMatch[1] : "NOT FOUND");
        console.log("Currency:", currencyMatch ? currencyMatch[1] : "NOT FOUND");
        console.log("Transit Days:", daysMatch ? daysMatch[1] : "NOT FOUND");

    } catch (err) {
        console.error("XML-PI Request Failed:", err);
    }
}

testDHLXMLFull();
