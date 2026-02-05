



const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db/sqlite");
const multer = require("multer");
const XLSX = require("xlsx");
// const { CLIENT_RENEG_LIMIT } = require("tls");
require("dotenv").config();
// const PORT = process.env.PORT || 5000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files allowed"));
    }
  },
});



const fedexTokens = {};



const fedexAccounts = [
  {
    key: "FEDEX_1",
    clientId: process.env.FEDEX_CLIENT_ID_1,
    clientSecret: process.env.FEDEX_CLIENT_SECRET_1,
    accountNumber: "338574002"
  },
  {
    key: "FEDEX_2",
    clientId: process.env.FEDEX_CLIENT_ID_2,
    clientSecret: process.env.FEDEX_CLIENT_SECRET_2,
    accountNumber: "274185376"
  },
  {
    key: "FEDEX_3",
    clientId: process.env.FEDEX_CLIENT_ID_3,
    clientSecret: process.env.FEDEX_CLIENT_SECRET_3,
    accountNumber: "291194681"
  }
];

const dhlAccounts = [
  {
    key: "DHL_1",
    apiKey: process.env.DHL_API_KEY_1,
    apiSecret: process.env.DHL_API_SECRET_1,
    accountNumber: process.env.DHL_ACCOUNT_NUMBER_1
  },
  {
    key: "DHL_2",
    apiKey: process.env.DHL_API_KEY_2,
    apiSecret: process.env.DHL_API_SECRET_2,
    accountNumber: process.env.DHL_ACCOUNT_NUMBER_2
  },
  {
    key: "DHL_3",
    apiKey: process.env.DHL_API_KEY_3,
    apiSecret: process.env.DHL_API_SECRET_3,
    accountNumber: process.env.DHL_ACCOUNT_NUMBER_3
  }
];





const app = express();
// require("dotenv").config();

// ========================================
// 🌐 CORS Configuration
// ========================================
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Helper function to calculate transit days from delivery date
function calculateTransitDays(deliveryDate) {
  if (!deliveryDate) return null;
  try {
    const delivery = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);
    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}



function normalizeShipment(row) {
  return {
    shipment_id: row.shipment_id || row.ShipmentID || null,

    origin_country: row.shipper_country || "IN",
    destination_country: row.receiver_country,

    weight_kg: Number(row.weight_kg || 1),
    length_cm: Number(row.length_cm || 10),
    width_cm: Number(row.width_cm || 10),
    height_cm: Number(row.height_cm || 10),

    receiver_name: row.receiver_name || "Unknown",
    receiver_city: row.receiver_city || "",
    receiver_postcode: row.receiver_postcode || "",

    purpose: row.purpose || "SALE",
    declared_value: Number(row.declared_value || 100),
    declared_value: Number(row.declared_value || 100),
    currency: row.currency || "USD",

    // New fields for Duties/Taxes
    hs_code: row.hs_code || "",
    description: row.description || "General Merchandise",
    document_type: row.document_type || "NON_DOCUMENTS" // DOCUMENTS or NON_DOCUMENTS
  };
}
function validateShipment(shipment) {
  if (!shipment.destination_country) {
    return "Destination country missing";
  }
  if (!shipment.weight_kg || shipment.weight_kg <= 0) {
    return "Invalid weight";
  }
  return null;
}



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

  // const payload = {
  //   accountNumber: {
  //     value: fedexAccount.accountNumber
  //   },
  //   rateRequestControlParameters: {
  //     returnTransitTimes: true
  //   },
  //   requestedShipment: {
  //     shipper: {
  //       address: {
  //         countryCode: shipment.origin_country,
  //         postalCode: "110001" // can come from excel later
  //       }
  //     },
  //     recipient: {
  //       address: {
  //         countryCode: shipment.destination_country,
  //         postalCode: shipment.receiver_postcode
  //       }
  //     },
  //     pickupType: "DROPOFF_AT_FEDEX_LOCATION",
  //     rateRequestType: ["ACCOUNT"],
  //     // rateRequestType: ["LIST"],

  //     requestedPackageLineItems: [
  //       {
  //         weight: {
  //           units: "KG",
  //           value: shipment.weight_kg
  //         },
  //         dimensions: {
  //           length: shipment.length_cm,
  //           width: shipment.width_cm,
  //           height: shipment.height_cm,
  //           units: "CM"
  //         }
  //       }
  //     ]
  //   }
  // };



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

      // 👇 REQUEST DUTIES AND TAXES
      variableOptions: ["DUTIES_AND_TAXES"],

      // 👇 REQUIRED FOR INTERNATIONAL
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
  console.log(data);

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "FedEx API error");
  }

  const detail =
    data.output.rateReplyDetails?.[0]?.ratedShipmentDetails?.[0];

  const deliveryDate = data.output.rateReplyDetails?.[0]?.operationalDetail?.deliveryDate;

  // Use totalNetChargeWithDutiesAndTaxes for landed cost (freight + duty + tax)
  // Falls back to totalNetCharge if duties/taxes not available
  const landedCost = detail?.totalNetChargeWithDutiesAndTaxes || detail?.totalNetCharge;

  return {
    service: data.output.rateReplyDetails?.[0]?.serviceType,
    amount: landedCost,
    currency: detail?.currency,
    transitDays: calculateTransitDays(deliveryDate)
  };
}

async function callDHLRate(shipment, dhlAccount) {
  // ISO date string for tomorrow
  // Format: YYYY-MM-DD
  const dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const timestamp = new Date().toISOString();

  // Map credentials
  const siteId = dhlAccount.apiKey;
  const password = dhlAccount.apiSecret;

  const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<p:DCTRequest xmlns:p="http://www.dhl.com" xmlns:p1="http://www.dhl.com/datatypes" xmlns:p2="http://www.dhl.com/DCTRequestdatatypes" schemaVersion="2.0">
  <GetQuote>
    <Request>
      <ServiceHeader>
        <MessageTime>${timestamp}</MessageTime>
        <MessageReference>1234567890123456789012345678901</MessageReference>
        <SiteID>${siteId}</SiteID>
        <Password>${password}</Password>
      </ServiceHeader>
    </Request>
    <From>
      <CountryCode>${shipment.origin_country || "IN"}</CountryCode>
      <Postalcode>110001</Postalcode>
    </From>
    <BkgDetails>
      <PaymentCountryCode>${shipment.origin_country || "IN"}</PaymentCountryCode>
      <Date>${dateStr}</Date>
      <ReadyTime>PT10H00M</ReadyTime>
      <DimensionUnit>CM</DimensionUnit>
      <WeightUnit>KG</WeightUnit>
      <Pieces>
        <Piece>
          <PieceID>1</PieceID>
          <Height>${shipment.height_cm}</Height>
          <Depth>${shipment.length_cm}</Depth>
          <Width>${shipment.width_cm}</Width>
          <Weight>${shipment.weight_kg}</Weight>
        </Piece>
      </Pieces>
      <PaymentAccountNumber>${dhlAccount.accountNumber}</PaymentAccountNumber>
      <IsDutiable>Y</IsDutiable>
      <NetworkTypeCode>AL</NetworkTypeCode>
    </BkgDetails>
    <To>
      <CountryCode>${shipment.destination_country}</CountryCode>
      <Postalcode>${shipment.receiver_postcode}</Postalcode>
    </To>
    <Dutiable>
      <DeclaredCurrency>${shipment.currency}</DeclaredCurrency>
      <DeclaredValue>${shipment.declared_value}</DeclaredValue>
    </Dutiable>
  </GetQuote>
</p:DCTRequest>`;

  const res = await fetch("https://xmlpi-ea.dhl.com/XMLShippingServlet", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: xmlPayload
  });


  const text = await res.text();

  // Log first 1000 chars for debugging
  console.log(`DHL XML Response (first 1000 chars): ${text.substring(0, 1000)}...`);

  if (text.includes("<ConditionData>") || text.includes("<Note>")) {
    // Check for errors
    const errorMatch = text.match(/<ConditionData>(.*?)<\/ConditionData>/);
    if (errorMatch && !text.includes("<TotalNetCharge>")) { // Only throw if no rate found
      console.error("DHL XML Error:", errorMatch[1]);
      throw new Error(errorMatch[1]);
    }
  }

  // Parse using Regex for simplicity (robust enough for this standard XML)
  const productMatch = text.match(/<ProductShortName>(.*?)<\/ProductShortName>/);
  const shippingChargeMatch = text.match(/<ShippingCharge>([\d\.]+)<\/ShippingCharge>/);
  const currencyMatch = text.match(/<CurrencyCode>([A-Z]+)<\/CurrencyCode>/);
  const daysMatch = text.match(/<TotalTransitDays>(\d+)<\/TotalTransitDays>/);

  // Extract duty and tax charges for landed cost
  const dutyChargeMatch = text.match(/<DutyCharge>([\d\.]+)<\/DutyCharge>/);
  const taxChargeMatch = text.match(/<TaxCharge>([\d\.]+)<\/TaxCharge>/);

  if (!shippingChargeMatch) {
    throw new Error("No DHL Rate Found");
  }

  // Calculate total landed cost = shipping + duty + tax
  const shippingCharge = parseFloat(shippingChargeMatch[1]);
  const dutyCharge = dutyChargeMatch ? parseFloat(dutyChargeMatch[1]) : 0;
  const taxCharge = taxChargeMatch ? parseFloat(taxChargeMatch[1]) : 0;
  const landedCost = shippingCharge + dutyCharge + taxCharge;

  console.log(`DHL Parsed - Service: ${productMatch ? productMatch[1] : 'N/A'}, Shipping: ${shippingCharge}, Duty: ${dutyCharge}, Tax: ${taxCharge}, Total: ${landedCost}, Currency: ${currencyMatch ? currencyMatch[1] : 'N/A'}`);

  return {
    service: productMatch ? productMatch[1] : "DHL Express",
    amount: landedCost.toFixed(3),
    currency: currencyMatch ? currencyMatch[1] : "USD",
    transitDays: daysMatch ? daysMatch[1] : "N/A"
  };
}





app.use(express.json());

// TEMP in-memory users (later → DB)
const users = [];
// const PORT = 5000;


/* ------------------------
   SIGNUP
------------------------- */
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (user) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
  ).run(name, email, hashedPassword);

  res.status(201).json({ message: "Signup successful" });
});


/* ------------------------
   LOGIN
------------------------- */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "48h" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});


/* ------------------------
   TEST API
------------------------- */
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend" });
});



// shipment
app.post(
  "/api/upload-shipments",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      // 1️⃣ Check file exists
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBuffer = req.file.buffer;

      // 2️⃣ Read Excel file
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      // 3️⃣ Get required sheet
      console.log(workbook);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        return res.status(400).json({
          message: "Sheet named 'Shipments' not found",
        });
      }

      // 4️⃣ Convert sheet to JSON rows
      const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: "", // keeps empty cells instead of undefined
      });

      if (rows.length === 0) {
        return res.status(400).json({
          message: "Excel sheet is empty",
        });
      }

      // 5️⃣ Process each shipment row
      const results = [];
      console.log(rows);
      // for (const row of rows) {
      // A. Normalize input
      // const shipment = normalizeShipment(row);

      // B. Validate mandatory fields
      // const error = validateShipment(shipment);

      // if (error) {
      //   results.push({
      //     shipment_id: shipment.shipment_id,
      //     status: "ERROR",
      //     message: error,
      //   });
      //   continue;
      // }

      // C. Call carrier APIs (placeholder)
      // const dhlRates = await callDHL(shipment);
      // const fedexRates = await callFedEx(shipment);

      // D. Calculate landed cost + transit time
      // const enriched = calculateLandedCost(
      //   shipment,
      //   dhlRates,
      //   fedexRates
      // );
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const shipment = normalizeShipment(row);
        const error = validateShipment(shipment);

        // Iterate through all fedex accounts
        for (let j = 0; j < fedexAccounts.length; j++) {
          const fedexAccount = fedexAccounts[j];
          const suffix = `_${j + 1}`; // e.g. _1, _2, _3

          if (error) {
            row[`FEDEX_STATUS${suffix}`] = "ERROR";
            row[`FEDEX_ERROR${suffix}`] = error;
            continue;
          }

          try {
            const fedexRate = await callFedExRate(shipment, fedexAccount);
            console.log(`Rate for account ${j + 1}:`, fedexRate);

            // ✅ ADD NEW COLUMNS TO SAME ROW WITH SUFFIX
            row[`FEDEX_ACCOUNT${suffix}`] = fedexAccount.accountNumber;
            row[`FEDEX_SERVICE${suffix}`] = fedexRate.service;
            row[`FEDEX_RATE${suffix}`] = fedexRate.amount;
            row[`FEDEX_CURRENCY${suffix}`] = fedexRate.currency;
            row[`FEDEX_TRANSIT_DAYS${suffix}`] = fedexRate.transitDays;
            row[`FEDEX_STATUS${suffix}`] = "SUCCESS";

          } catch (err) {
            console.error(`Error for account ${j + 1}:`, err.message);
            row[`FEDEX_STATUS${suffix}`] = "ERROR";
            row[`FEDEX_ERROR${suffix}`] = err.message;
          }
        }

        // Iterate through all DHL accounts
        for (let k = 0; k < dhlAccounts.length; k++) {
          const dhlAccount = dhlAccounts[k];
          const suffix = `_${k + 1}`;

          if (error) {
            row[`DHL_STATUS${suffix}`] = "ERROR";
            row[`DHL_ERROR${suffix}`] = error;
            continue;
          }

          try {
            const dhlRate = await callDHLRate(shipment, dhlAccount);
            row[`DHL_ACCOUNT${suffix}`] = dhlAccount.accountNumber;
            row[`DHL_SERVICE${suffix}`] = dhlRate.service;
            row[`DHL_RATE${suffix}`] = dhlRate.amount;
            row[`DHL_CURRENCY${suffix}`] = dhlRate.currency;
            row[`DHL_TRANSIT_DAYS${suffix}`] = dhlRate.transitDays;
            row[`DHL_STATUS${suffix}`] = "SUCCESS";
          } catch (err) {
            console.error(`DHL Error for account ${k + 1}:`, err.message);
            row[`DHL_STATUS${suffix}`] = "ERROR";
            row[`DHL_ERROR${suffix}`] = err.message;
          }
        }

      }

      const newSheet = XLSX.utils.json_to_sheet(rows);

      // 6️⃣ Auto-adjust column widths
      const colWidths = Object.keys(rows[0] || {}).map((key) => {
        let maxLength = key.toString().length; // Start with header length

        rows.forEach((row) => {
          const cellValue = row[key] ? row[key].toString() : "";
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });

        return { wch: maxLength + 2 }; // Add a small buffer
      });

      newSheet["!cols"] = colWidths;

      workbook.Sheets[sheetName] = newSheet;

      const updatedBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
      });
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=shipment_results.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return res.send(updatedBuffer);



      // results.push({
      //   shipment_id: shipment.shipment_id,
      //   status: "SUCCESS",
      //   note: "Processed (mock)",
      // });
      // }

      // 6️⃣ Respond (later: return file download URL)
      // return res.json({
      //   message: "File processed successfully",
      //   total: rows.length,
      //   results,
      // });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);
/* ------------------------
   Serve React
------------------------- */

// ========================================
// 🌐 SERVE REACT BUILD IN PRODUCTION
// ========================================
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Express 5 requires proper pattern instead of bare '*'
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// ========================================
// 🚀 START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. The server might already be running in another terminal.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log("Received SIGINT");
  process.exit();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
