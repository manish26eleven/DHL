# Shipment Rate Template - Instructions

## How to Use This Template

1. **Download** the `Shipment_Rate_Template.xlsx` file
2. **Fill in** your shipment details (see column guide below)
3. **Upload** the file to the rate calculator
4. **Download** the results with FedEx and DHL rates

## Required Columns

| Column Name | Description | Example | Required? |
|------------|-------------|---------|-----------|
| `ShipmentID` | Your internal shipment reference | SHIP-001 | Yes |
| `shipper_country` | Origin country code (2 letters) | IN | Yes (defaults to IN) |
| `receiver_country` | Destination country code (2 letters) | US, GB, CA | **Yes** |
| `weight_kg` | Package weight in kilograms | 5 | Optional (defaults to 1) |
| `length_cm` | Package length in centimeters | 20 | Optional (defaults to 10) |
| `width_cm` | Package width in centimeters | 15 | Optional (defaults to 10) |
| `height_cm` | Package height in centimeters | 10 | Optional (defaults to 10) |
| `receiver_name` | Recipient's name | John Doe | Yes |
| `receiver_city` | Recipient's city | New York | Yes |
| `receiver_postcode` | Recipient's postal/ZIP code | 10001 | Yes |
| `purpose` | Shipment purpose | SALE, GIFT, SAMPLE | Yes for international |
| `declared_value` | Customs value | 200 | Yes for international |
| `currency` | Currency code (3 letters) | USD, GBP, EUR | Yes for international |

## Important Notes

### Country Codes
Use **ISO 2-letter codes**:
- US (United States)
- GB (United Kingdom)
- CA (Canada)
- IN (India)
- AU (Australia)
- DE (Germany)
- FR (France)
- etc.

### Shipment Purpose
Valid values for international shipments:
- `SALE` - Commercial sale
- `GIFT` - Personal gift
- `SAMPLE` - Product sample
- `RETURN` - Return shipment

### Default Values
If you leave these blank, the system will use:
- Weight: **1 kg**
- Dimensions: **10 x 10 x 10 cm**
- Shipper Country: **IN**

### Domestic vs International
- **Domestic (IN → IN)**: Only basic details needed
- **International**: Must include purpose, declared value, and currency

## Output File

After processing, you'll receive an Excel file with:
- All original columns
- **FedEx rates** (3 accounts): Service, Rate, Currency, Transit Days
- **DHL rates** (3 accounts): Service, Rate, Currency, Transit Days
- Status/Error columns for each carrier

## Example Rows

### International Shipment
```
ShipmentID: SHIP-001
shipper_country: IN
receiver_country: US
weight_kg: 5
length_cm: 20
width_cm: 15
height_cm: 10
receiver_name: John Doe
receiver_city: New York
receiver_postcode: 10001
purpose: SALE
declared_value: 200
currency: USD
```

### Domestic Shipment
```
ShipmentID: SHIP-002
shipper_country: IN
receiver_country: IN
weight_kg: 2
receiver_name: Rajesh Kumar
receiver_city: Mumbai
receiver_postcode: 400001
purpose: SALE
declared_value: 100
currency: INR
```

## Support

If you have questions about filling the template, contact your account manager.
