const XLSX = require("xlsx");

function testColumnWidths() {
    const rows = [
        { Name: "Short", Description: "This is a very long description that should widen the column" },
        { Name: "A much longer name here", Description: "Short" }
    ];

    const sheet = XLSX.utils.json_to_sheet(rows);

    // Logic copied from server/index.js
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
        let maxLength = key.toString().length;

        rows.forEach((row) => {
            const cellValue = row[key] ? row[key].toString() : "";
            if (cellValue.length > maxLength) {
                maxLength = cellValue.length;
            }
        });

        return { wch: maxLength + 2 };
    });

    sheet["!cols"] = colWidths;

    console.log("Calculated Column Widths:", JSON.stringify(colWidths, null, 2));

    // Validation

    // Column 0 (Name): "A much longer name here" is 21 chars. Header "Name" is 4. Max is 21. Width should be 23.
    const nameCol = colWidths[0];
    if (nameCol.wch === 23) {
        console.log("✅ Name column width correct");
    } else {
        console.log(`❌ Name column width incorrect. Expected 23, got ${nameCol.wch}`);
    }

    // Column 1 (Description): "This is a very long description that should widen the column" is 60 chars. Header is 11. Max 60. Width 62.
    const descCol = colWidths[1];
    if (descCol.wch === 62) {
        console.log("✅ Description column width correct");
    } else {
        console.log(`❌ Description column width incorrect. Expected 62, got ${descCol.wch}`);
    }
}

testColumnWidths();
