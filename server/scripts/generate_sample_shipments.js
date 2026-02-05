const XLSX = require("xlsx");
const path = require("path");

const shipments = [
    {
        ShipmentID: "SHIP-001",
        shipper_country: "IN",
        receiver_country: "US",
        weight_kg: 5,
        length_cm: 20,
        width_cm: 15,
        height_cm: 10,
        receiver_name: "John Doe",
        receiver_city: "New York",
        receiver_postcode: "10001",
        purpose: "SALE",
        declared_value: 200,
        currency: "USD"
    },
    {
        ShipmentID: "SHIP-002",
        shipper_country: "IN",
        receiver_country: "GB",
        weight_kg: 2.5,
        length_cm: 15,
        width_cm: 15,
        height_cm: 15,
        receiver_name: "Jane Smith",
        receiver_city: "London",
        receiver_postcode: "SW1A 1AA",
        purpose: "GIFT",
        declared_value: 50,
        currency: "GBP",
        hs_code: "950450",
        description: "Board Game",
        document_type: "NON_DOCUMENTS"
    },
    {
        ShipmentID: "SHIP-003",
        shipper_country: "IN",
        receiver_country: "CA",
        weight_kg: 10,
        length_cm: 30,
        width_cm: 20,
        height_cm: 20,
        receiver_name: "Alice Johnson",
        receiver_city: "Toronto",
        receiver_postcode: "M5V 2H1",
        purpose: "SALE",
        declared_value: 500,
        currency: "CAD",
        hs_code: "620520",
        description: "Cotton Shirt",
        document_type: "NON_DOCUMENTS"
    }
];

const worksheet = XLSX.utils.json_to_sheet(shipments);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");

const outputPath = path.join(__dirname, "../sample_shipments.xlsx");
XLSX.writeFile(workbook, outputPath);

console.log(`Sample shipment file created at: ${outputPath}`);
