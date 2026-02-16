import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [selectedFedex, setSelectedFedex] = useState({
    INTERNATIONAL_FIRST: true,
    FEDEX_INTERNATIONAL_PRIORITY_EXPRESS: true,
    FEDEX_INTERNATIONAL_PRIORITY: true,
    FEDEX_INTERNATIONAL_CONNECT_PLUS: true,
    INTERNATIONAL_ECONOMY: true,
  });

  const [selectedDhl, setSelectedDhl] = useState({
    "EXPRESS WORLDWIDE": true,
    "ECONOMY SELECT": true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const fedexServices = [
    { id: "INTERNATIONAL_FIRST", label: "International First" },
    { id: "FEDEX_INTERNATIONAL_PRIORITY_EXPRESS", label: "International Priority Express" },
    { id: "FEDEX_INTERNATIONAL_PRIORITY", label: "International Priority" },
    { id: "FEDEX_INTERNATIONAL_CONNECT_PLUS", label: "International Connect Plus" },
    { id: "INTERNATIONAL_ECONOMY", label: "International Economy" },
  ];

  const dhlServices = [
    { id: "EXPRESS WORLDWIDE", label: "Worldwide Express" },
    { id: "ECONOMY SELECT", label: "Economy Select" },
  ];

  const handleFedexToggle = (id) => {
    setSelectedFedex(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDhlToggle = (id) => {
    setSelectedDhl(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Add selected services
    const services = {
      fedex: Object.keys(selectedFedex).filter(key => selectedFedex[key]),
      dhl: Object.keys(selectedDhl).filter(key => selectedDhl[key])
    };
    console.log("Sending services:", services);
    formData.append("services", JSON.stringify(services));

    try {
      setIsLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API_URL}/api/upload-shipments`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Upload failed");
        return;
      }

      // ✅ HANDLE FILE DOWNLOAD
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "shipment_results.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      alert("Rates calculated successfully!");
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="dashboard-wrapper">
      <img src='/Dhl_Logo.png' className='logo' alt="DHL Logo" />

      <div className="dashboard-card">
        <h1>Shipment Calculator</h1>
        <p className="subtitle">
          Upload an Excel file to calculate DHL & FedEx charges
        </p>

        <form onSubmit={handleUpload}>
          <div className="file-input-group">
            <input
              type="file"
              id="excel"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              hidden
            />

            <label htmlFor="excel" className="select-btn">
              Select Excel File
            </label>

            {file && <p className="file-name">{file.name}</p>}
          </div>

          <div className="services-selection">
            <div className="service-column">
              <h3>FedEx (Export services only)</h3>
              {fedexServices.map(service => (
                <div key={service.id} className="service-item">
                  <span>{service.label}</span>
                  <input
                    type="checkbox"
                    checked={selectedFedex[service.id]}
                    onChange={() => handleFedexToggle(service.id)}
                  />
                </div>
              ))}
            </div>

            <div className="service-column">
              <h3>DHL (Export Services Only)</h3>
              {dhlServices.map(service => (
                <div key={service.id} className="service-item">
                  <span>{service.label}</span>
                  <input
                    type="checkbox"
                    checked={selectedDhl[service.id]}
                    onChange={() => handleDhlToggle(service.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={!file || isLoading}
          >
            {isLoading ? "Processing..." : "Calculate Shipment"}
          </button>
        </form>
      </div>
    </div>
  );
}
