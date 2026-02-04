



const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db/sqlite");
const multer = require("multer");
const XLSX = require("xlsx");
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





const app = express();
// require("dotenv").config();
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
    currency: row.currency || "USD"
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

    // 👇 REQUIRED FOR INTERNATIONAL
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
          purpose: shipment.purpose // 🔥 THIS FIXES YOUR ERROR
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

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || "FedEx API error");
  }

  const detail =
    data.output.rateReplyDetails?.[0]?.ratedShipmentDetails?.[0];

  return {
    service: data.output.rateReplyDetails?.[0]?.serviceType,
    amount: detail?.totalNetCharge?.amount,
    currency: detail?.totalNetCharge?.currency,
    transitDays:
      data.output.rateReplyDetails?.[0]?.commit?.transitDays
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
        const fedexAccount = fedexAccounts[0]; // later rotate if needed

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];

  const shipment = normalizeShipment(row);
  const error = validateShipment(shipment);

  if (error) {
    row.FEDEX_STATUS = "ERROR";
    row.FEDEX_ERROR = error;
    continue;
  }

  try {
    const fedexRate = await callFedExRate(shipment, fedexAccount);
   console.log(fedexRate);
    // ✅ ADD NEW COLUMNS TO SAME ROW
    row.FEDEX_SERVICE = fedexRate.service;
    row.FEDEX_RATE = fedexRate.amount;
    row.FEDEX_CURRENCY = fedexRate.currency;
    row.FEDEX_TRANSIT_DAYS = fedexRate.transitDays;
    row.FEDEX_STATUS = "SUCCESS";

  } catch (err) {
    console.log(error);
    row.FEDEX_STATUS = "ERROR";
    row.FEDEX_ERROR = err.message;
  }
}

const newSheet = XLSX.utils.json_to_sheet(rows);
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
app.use(express.static(path.join(__dirname, "../client/build")));

app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "../client/build/index.html")
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
