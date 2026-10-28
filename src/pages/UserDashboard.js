import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {BASE_URL} from "../App";


function UserDashboard() {
    const [accounts, setAccounts] = useState([]);
    const [depositAmounts, setDepositAmounts] = useState({});
    const [profile, setProfile] = useState({ name: "" });

    const navigate = useNavigate();



    // ✅ Retrieve stored auth token from localStorage
    const authHeader = localStorage.getItem("authToken");

    useEffect(() => {
        fetchAccounts();
        fetchProfile(); // ✅ Fetch profile whenever dashboard is loaded
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

    const depositMoney = async (accountId) => {
        const amount = depositAmounts[accountId] || 0;
        if (amount <= 0) {
            alert("Enter a valid deposit amount.");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/accounts/deposit`, { accountId, amount }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });
            fetchAccounts(); // ✅ Refresh after deposit
            setDepositAmounts({ ...depositAmounts, [accountId]: "" }); // ✅ Reset input field
        } catch (error) {
            alert("Failed to deposit");
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/customer/profile`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });
            setProfile(response.data);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            alert("Failed to load profile");
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Unknown date"; // ✅ Handle missing timestamps
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            weekday: "short", // Thu
            month: "short",   // Mar
            day: "2-digit",   // 20
            year: "numeric",  // 2025
        }) + `, ${date.toLocaleTimeString("en-US")}`; // ✅ Add time (12-hour format)
    };

    // ✅ Create New Account
    const handleCreateAccount = async () => {
        if (!authHeader) {
            alert("❌ Unauthorized! Please log in.");
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/accounts`, {}, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });

            alert(`✅ New Account Created! Account Number: ${response.data.accountNumber}`);
            fetchAccounts(); // ✅ Refresh accounts list
        } catch (error) {
            console.error("❌ Failed to create account:", error);
            alert("❌ Failed to create account. Please try again.");
        }
    };



    return (
        <div className="container mt-4 text-center">
            <h1>User Dashboard</h1>
            <h2 className="welcome-text">
                Welcome, {profile.name ? (
                <span style={{color: "#fc1589", fontWeight: "bold"}}>
                        {profile.name}
                    </span>
            ) : (
                <span style={{color: "#fc1589", fontWeight: "bold"}}>
                        noname
                    </span>
            )}!
            </h2>

            {/* ✅ Action Buttons */}
            <div className="button-group mt-4">
                <button className="custom-btn action-btn shadow-custom" onClick={() => navigate("/deposit")}>
                    💰 Deposit Money
                </button>
                <button className="custom-btn action-btn shadow-custom" onClick={() => navigate("/transfer")}>
                    🔄 Make a Transfer
                </button>
                <button className="custom-btn action-btn shadow-custom"  onClick={handleCreateAccount}>
                    ➕ Create New Account
                </button>
            </div>
        </div>
    );
}

export default UserDashboard;
