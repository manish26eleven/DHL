const XLSX = require('xlsx');
const path = require('path');

// Create test shipment data
const shipments = [
    {
        shipment_id: 'TEST001',
        shipper_country: 'US',
        receiver_country: 'US',
        receiver_city: 'Los Angeles',
        receiver_postcode: '90001',
        weight_kg: 2.5,
        length_cm: 30,
        width_cm: 20,
        height_cm: 15,
        receiver_name: 'John Doe',
        purpose: 'SALE',
        declared_value: 150,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'TEST002',
        shipper_country: 'US',
        receiver_country: 'GB',
        receiver_city: 'London',
        receiver_postcode: 'SW1A 1AA',
        weight_kg: 1.5,
        length_cm: 25,
        width_cm: 18,
        height_cm: 10,
        receiver_name: 'Jane Smith',
        purpose: 'SALE',
        declared_value: 200,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'TEST003',
        shipper_country: 'US',
        receiver_country: 'CA',
        receiver_city: 'Toronto',
        receiver_postcode: 'M5H 2N2',
        weight_kg: 3.0,
        length_cm: 35,
        width_cm: 25,
        height_cm: 20,
        receiver_name: 'Bob Johnson',
        purpose: 'SALE',
        declared_value: 250,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'TEST004',
        shipper_country: 'US',
        receiver_country: 'US',
        receiver_city: 'New York',
        receiver_postcode: '10001',
        weight_kg: 1.0,
        length_cm: 20,
        width_cm: 15,
        height_cm: 10,
        receiver_name: 'Alice Brown',
        purpose: 'SALE',
        declared_value: 100,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(shipments);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Shipments');

// Write to file
const outputPath = path.join(__dirname, '..', 'test_shipments_domestic.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Test file created: ${outputPath}`);
console.log('\nShipments included:');
shipments.forEach(s => {
    console.log(`  - ${s.shipment_id}: ${s.shipper_country} → ${s.receiver_country} (${s.receiver_city})`);
});
