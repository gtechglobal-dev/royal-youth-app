import { useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function MarkDues() {
  const { id } = useParams();

  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [amount, setAmount] = useState("");

  const submitDues = async () => {
    await API.put(`/auth/dues/${id}`, {
      month,
      status,
      amount,
    });

    alert("Dues updated");
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-5">Update Member Dues</h2>

      <div className="flex flex-col gap-3 w-72">
        <select
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2"
        >
          <option>Select Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
          <option>May</option>
          <option>June</option>
          <option>July</option>
          <option>August</option>
          <option>September</option>
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          className="border p-2"
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="border p-2"
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Status</option>
          <option>Paid</option>
          <option>Unpaid</option>
        </select>

        <button
          onClick={submitDues}
          className="bg-green-600 text-white p-2 rounded"
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default MarkDues;
