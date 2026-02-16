const XLSX = require('xlsx');
const path = require('path');

// Create test shipment data with BOTH domestic and international
const shipments = [
    // Domestic US shipments
    {
        shipment_id: 'DOMESTIC_001',
        shipper_country: 'US',
        shipper_postcode: '10001',
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
        shipment_id: 'DOMESTIC_002',
        shipper_country: 'US',
        shipper_postcode: '10001',
        receiver_country: 'US',
        receiver_city: 'Chicago',
        receiver_postcode: '60601',
        receiver_name: 'Mike Wilson',
        weight_kg: 1.0,
        length_cm: 20,
        width_cm: 15,
        height_cm: 10,
        purpose: 'SALE',
        declared_value: 100,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    // International shipments from India
    {
        shipment_id: 'INTL_001',
        shipper_country: 'IN',
        shipper_postcode: '110001',
        receiver_country: 'US',
        receiver_city: 'New York',
        receiver_postcode: '10001',
        receiver_name: 'Sarah Johnson',
        weight_kg: 2.0,
        length_cm: 30,
        width_cm: 20,
        height_cm: 15,
        purpose: 'SALE',
        declared_value: 200,
        currency: 'USD',
        hs_code: '620520',
        description: 'Cotton Shirts',
        document_type: 'NON_DOCUMENTS'
    },
    {
        shipment_id: 'INTL_002',
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
    }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(shipments);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Shipments');

// Write to file
const outputPath = path.join(__dirname, '..', 'test_domestic_and_intl.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Test file created: ${outputPath}`);
console.log('\n📦 Shipments included:');
console.log('\n🇺🇸 DOMESTIC (US → US):');
shipments.filter(s => s.shipper_country === 'US').forEach(s => {
    console.log(`  - ${s.shipment_id}: ${s.shipper_postcode} → ${s.receiver_postcode} (${s.receiver_city})`);
});
console.log('\n🌍 INTERNATIONAL (India → World):');
shipments.filter(s => s.shipper_country === 'IN').forEach(s => {
    console.log(`  - ${s.shipment_id}: ${s.shipper_country} → ${s.receiver_country} (${s.receiver_city})`);
});
console.log('\nThis file tests:');
console.log('  ✓ US domestic FedEx services (GROUND, 2DAY, etc.)');
console.log('  ✓ International FedEx services (PRIORITY, ECONOMY, etc.)');
console.log('  ✓ DHL international services');
