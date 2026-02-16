const XLSX = require('xlsx');
const path = require('path');

// Create test shipment data with ALL required fields
const shipments = [
    {
        shipment_id: 'TEST001',
        shipper_country: 'IN',
        shipper_postcode: '110001',
        receiver_country: 'US',
        receiver_city: 'Los Angeles',
        receiver_postcode: '90001',
        receiver_name: 'John Doe',
        weight_kg: 2.5,
        length_cm: 30,
        width_cm: 20,
        height_cm: 15,
        purpose: 'SALE',
        declared_value: 150,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'TEST002',
        shipper_country: 'IN',
        shipper_postcode: '110001',
        receiver_country: 'GB',
        receiver_city: 'London',
        receiver_postcode: 'SW1A1AA',
        receiver_name: 'Jane Smith',
        weight_kg: 1.5,
        length_cm: 25,
        width_cm: 18,
        height_cm: 10,
        purpose: 'SALE',
        declared_value: 200,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'TEST003',
        shipper_country: 'IN',
        shipper_postcode: '110001',
        receiver_country: 'CA',
        receiver_city: 'Toronto',
        receiver_postcode: 'M5H2N2',
        receiver_name: 'Bob Johnson',
        weight_kg: 3.0,
        length_cm: 35,
        width_cm: 25,
        height_cm: 20,
        purpose: 'SALE',
        declared_value: 250,
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
const outputPath = path.join(__dirname, '..', 'test_shipments_valid.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Test file created: ${outputPath}`);
console.log('\nShipments included (all from India):');
shipments.forEach(s => {
    console.log(`  - ${s.shipment_id}: ${s.shipper_country} (${s.shipper_postcode}) → ${s.receiver_country} (${s.receiver_postcode})`);
});
console.log('\nAll shipments are international exports from India.');
console.log('This should trigger both FedEx and DHL international rates.');
