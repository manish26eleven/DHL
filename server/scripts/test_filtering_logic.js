// Test script to verify service filtering logic

const selectedServices = {
    fedex: ["INTERNATIONAL_FIRST", "FEDEX_INTERNATIONAL_PRIORITY", "INTERNATIONAL_ECONOMY"],
    dhl: ["EXPRESS WORLDWIDE", "ECONOMY SELECT"]
};

const mockFedexRates = [
    { service: "INTERNATIONAL_FIRST", amount: 100 },
    { service: "FEDEX_INTERNATIONAL_PRIORITY_EXPRESS", amount: 150 },
    { service: "FEDEX_INTERNATIONAL_PRIORITY", amount: 120 },
    { service: "FEDEX_INTERNATIONAL_CONNECT_PLUS", amount: 90 },
    { service: "INTERNATIONAL_ECONOMY", amount: 80 }
];

console.log("Testing FedEx filtering:");
console.log("Selected services:", selectedServices.fedex);
console.log("\nAll rates:");
mockFedexRates.forEach(rate => {
    console.log(`  - ${rate.service}: $${rate.amount}`);
});

console.log("\nFiltered rates (should only show selected):");
const filtered = mockFedexRates.filter(rate => {
    if (selectedServices && selectedServices.fedex && selectedServices.fedex.length > 0) {
        return selectedServices.fedex.includes(rate.service);
    }
    return true; // If no filter, show all
});

filtered.forEach(rate => {
    console.log(`  - ${rate.service}: $${rate.amount}`);
});

console.log("\nExpected: INTERNATIONAL_FIRST, FEDEX_INTERNATIONAL_PRIORITY, INTERNATIONAL_ECONOMY");
console.log("Excluded: FEDEX_INTERNATIONAL_PRIORITY_EXPRESS, FEDEX_INTERNATIONAL_CONNECT_PLUS");
