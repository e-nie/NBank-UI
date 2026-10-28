import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {BASE_URL} from "../App";


function Deposit() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [amount, setAmount] = useState("");
    const navigate = useNavigate();

    // ✅ Get stored auth token
    const authHeader = localStorage.getItem("authToken");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        if (!authHeader) {
            alert("Unauthorized! Please log in again.");
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}/customer/accounts`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });
            setAccounts(response.data);
        } catch (error) {
            alert("Failed to fetch accounts");
        }
    };

    const handleDeposit = async () => {
        if (!selectedAccount) {
            alert("❌ Please select an account.");
            return;
        }
        if (!amount || amount <= 0) {
            alert("❌ Please enter a valid amount.");
            return;
        }

        if (amount > 5000) {
            alert("❌ Please deposit less or equal to 5000$.");
            return;
        }

        const selectedAccountData = accounts.find(acc => acc.id.toString() === selectedAccount);
        if (!selectedAccountData) {
            alert("❌ Invalid account selected.");
            return;
        }

        const depositData = {
            id: selectedAccountData.id,
            accountNumber: selectedAccountData.accountNumber,
            balance: parseFloat(amount),
        };

        try {
            await axios.post(`${BASE_URL}/accounts/deposit`, depositData, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true            });

            alert(`✅ Successfully deposited $${amount} to account ${selectedAccountData.accountNumber}!`);
            // ✅ Navigate to dashboard
            navigate("/dashboard");

            // ✅ Reset input AFTER navigating
            setAmount("");
        } catch (error) {
            alert("❌ Failed to deposit. Please try again.");
        }
    };

    return (
        <div className="container mt-4 text-center">
            <h1>💰 Deposit Money</h1>

            {/* ✅ Account Selection Dropdown */}
            <div className="form-group">
                <label>Select Account:</label>
                <select
                    className="form-control account-selector"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                >
                    <option value="">-- Choose an account --</option>
                    {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} (Balance: ${acc.balance.toFixed(2)})
                        </option>
                    ))}
                </select>
            </div>

            {/* ✅ Input for Deposit Amount */}
            <div className="form-group mt-3">
                <label>Enter Amount:</label>
                <input
                    type="number"
                    className="form-control deposit-input"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            {/* ✅ Deposit Button */}
            <button className="btn btn-primary shadow-custom mt-4" onClick={handleDeposit}>
                💵 Deposit
            </button>
        </div>
    );
}

export default Deposit;
