const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

async function runTest() {
    try {
        console.log(`Testing against ${BASE_URL}...`);

        console.log("1. Signing up test user...");
        const email = `test_${Date.now()}@example.com`;
        const password = "password123";

        await fetch(`${BASE_URL}/api/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test User", email, password })
        });

        console.log("2. Logging in...");
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) throw new Error("Login failed");
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("   Got token.");

        console.log("3. Uploading sample shipments...");
        const filePath = path.join(__dirname, "../sample_shipments.xlsx");
        if (!fs.existsSync(filePath)) {
            throw new Error(`Sample file missing: ${filePath}`);
        }
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const formData = new FormData();
        formData.append("file", blob, "sample_shipments.xlsx");

        const uploadRes = await fetch(`${BASE_URL}/api/upload-shipments`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
        }

        const resultBuffer = await uploadRes.arrayBuffer();
        const workbook = XLSX.read(Buffer.from(resultBuffer), { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        console.log("4. Verifying rows...");
        console.log("   Total rows in output:", rows.length);

        const firstRow = rows[0];
        console.log("   Columns in first row:", Object.keys(firstRow));

        const successRow = rows.find(r => r.Status === "SUCCESS");

        if (successRow) {
            console.log("   SUCCESS! Found a successful row.");
            console.log("   Carrier:", successRow.Carrier);
            console.log("   Service:", successRow.Service);
            console.log("   Freight Charge:", successRow["Freight Charge"]);
            console.log("   Total Landed Cost:", successRow["Total Landed Cost"]);

            if (successRow["Total Landed Cost"] !== undefined) {
                console.log("   Verification PASSED: Landed Cost column present.");
            } else {
                throw new Error("Missing Landed Cost column");
            }
        } else {
            console.error("   No success rows found.");
            console.log("   First row:", JSON.stringify(firstRow));
            process.exit(1);
        }

        console.log("Verification Complete.");

    } catch (err) {
        console.error("Test failed:", err.message);
        process.exit(1);
    }
}

runTest();
