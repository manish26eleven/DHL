const XLSX = require("xlsx");

// Create template with required columns and example data
const templateData = [
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
    currency: "GBP"
  }
];

const ws = XLSX.utils.json_to_sheet(templateData);

// Set column widths
ws['!cols'] = [
  { wch: 15 }, // ShipmentID
  { wch: 15 }, // shipper_country
  { wch: 17 }, // receiver_country
  { wch: 12 }, // weight_kg
  { wch: 12 }, // length_cm
  { wch: 12 }, // width_cm
  { wch: 12 }, // height_cm
  { wch: 20 }, // receiver_name
  { wch: 20 }, // receiver_city
  { wch: 18 }, // receiver_postcode
  { wch: 12 }, // purpose
  { wch: 15 }, // declared_value
  { wch: 10 }  // currency
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Shipments");

XLSX.writeFile(wb, "Shipment_Rate_Template.xlsx");
console.log("✅ Template created: Shipment_Rate_Template.xlsx");
