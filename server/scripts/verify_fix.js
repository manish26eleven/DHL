const fs = require("fs");
const path = require("path");
// using native fetch for Node 18+

const BASE_URL = "http://localhost:5000";

async function runTest() {
    try {
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
        console.log("   Got token:", token.substring(0, 20) + "...");

        console.log("3. Uploading sample shipments...");
        const filePath = path.join(__dirname, "../sample_shipments.xlsx");
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

        // Response is a file buffer (xlsx)
        const resultBuffer = await uploadRes.arrayBuffer();
        const resultPath = path.join(__dirname, "../result_shipments.xlsx");
        fs.writeFileSync(resultPath, Buffer.from(resultBuffer));
        console.log("   Saved result to:", resultPath);

        // Verify content (quick check using xlsx)
        const XLSX = require("xlsx");
        const workbook = XLSX.read(Buffer.from(resultBuffer), { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        console.log("4. Verifying rows...");
        const successRow = rows.find(r => r.FEDEX_STATUS === "SUCCESS");

        if (successRow) {
            console.log("   SUCCESS! Found a successful row.");
            console.log("   Rate:", successRow.FEDEX_RATE);
            console.log("   Currency:", successRow.FEDEX_CURRENCY);

            if (typeof successRow.FEDEX_RATE === 'number' && successRow.FEDEX_CURRENCY) {
                console.log("   Verification PASSED: Rate and Currency properly parsed.");
            } else {
                console.error("   Verification FAILED: Rate/Currency missing or invalid format.");
                process.exit(1);
            }
        } else {
            console.error("   Verification FAILED: No success rows found.");
            console.log("   Row 0 Status:", rows[0]?.FEDEX_STATUS);
            console.log("   Row 0 Error:", rows[0]?.FEDEX_ERROR);
            process.exit(1);
        }

    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}

runTest();
