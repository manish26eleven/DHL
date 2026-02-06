import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };



  //  const handleUpload = async (e) => {
  //   e.preventDefault();

  //   if (!file) {
  //     alert("Please select an Excel file");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     console.log(localStorage.getItem("token"));
  //     const res = await fetch("/api/upload-shipments", {
  //       method: "POST",
  //       body: formData,
  //       headers: {
  //         // ❌ DO NOT set Content-Type manually
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       alert(data.message || "Upload failed");
  //       return;
  //     }

  //     console.log("Processed result:", data);
  //     alert("File processed successfully");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Server error");
  //   }
  // };


  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

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
