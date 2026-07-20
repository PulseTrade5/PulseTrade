import { useState } from "react";

function AdminFund() {
  const [testFund, setTestFund] = useState(0);
  const [inputAmount, setInputAmount] = useState("");

  const addTestFund = () => {
    const amount = Number(inputAmount);
    if (!amount || amount <= 0) return;
    setTestFund(prev => prev + amount);
    setInputAmount("");
  };

  const resetFund = () => {
    setTestFund(0);
  };

  return (
    <div style={{ padding: "16px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "300px" }}>
      <h3>Test Fund (Display Only)</h3>
      <p style={{ fontSize: "24px", fontWeight: "bold" }}>₹{testFund.toLocaleString()}</p>

      <input
        type="number"
        placeholder="Amount enter karein"
        value={inputAmount}
        onChange={(e) => setInputAmount(e.target.value)}
        style={{ padding: "8px", marginRight: "8px" }}
      />
      <button onClick={addTestFund}>+ Add Fund</button>
      <button onClick={resetFund} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
}

export default AdminFund;
