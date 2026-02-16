const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
    const testFile = path.join(__dirname, '..', 'test_shipments_domestic.xlsx');

    if (!fs.existsSync(testFile)) {
        console.error('❌ Test file not found:', testFile);
        return;
    }

    console.log('📤 Testing upload with service filtering...\n');

    // Test 1: All services selected
    console.log('=== TEST 1: All FedEx services selected ===');
    await uploadWithServices({
        fedex: [
            "INTERNATIONAL_FIRST",
            "FEDEX_INTERNATIONAL_PRIORITY_EXPRESS",
            "FEDEX_INTERNATIONAL_PRIORITY",
            "FEDEX_INTERNATIONAL_CONNECT_PLUS",
            "INTERNATIONAL_ECONOMY"
        ],
        dhl: ["EXPRESS WORLDWIDE", "ECONOMY SELECT"]
    }, testFile);

    console.log('\n\n=== TEST 2: Only 2 FedEx services selected (excluding CONNECT_PLUS) ===');
    await uploadWithServices({
        fedex: [
            "INTERNATIONAL_FIRST",
            "FEDEX_INTERNATIONAL_PRIORITY"
        ],
        dhl: ["EXPRESS WORLDWIDE", "ECONOMY SELECT"]
    }, testFile);
}

async function uploadWithServices(services, filePath) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('services', JSON.stringify(services));

        console.log('Selected services:', JSON.stringify(services, null, 2));

        const response = await fetch('http://localhost:5000/api/upload-shipments', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer test-token-bypass',
                ...formData.getHeaders()
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Upload failed:', error);
            return;
        }

        // Save the response Excel file
        const buffer = await response.buffer();
        const outputPath = path.join(__dirname, '..', `result_${Date.now()}.xlsx`);
        fs.writeFileSync(outputPath, buffer);

        console.log(`✅ Result saved to: ${outputPath}`);
        console.log('   Open this file to verify which services appear in the results');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUpload();
