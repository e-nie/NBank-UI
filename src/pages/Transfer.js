import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from "react-bootstrap"; // ✅ Import Bootstrap Modal
import {BASE_URL} from "../App";


function Transfer() {
    const [mode, setMode] = useState("new"); // "new" or "repeat"
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [recipientAccount, setRecipientAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [searchUser, setSearchUser] = useState("");
    const [showModal, setShowModal] = useState(false); // ✅ Control for modal visibility
    const [repeatTransfer, setRepeatTransfer] = useState(null); // ✅ Store repeated transaction



    const authHeader = localStorage.getItem("authToken");
    const adminAuth = "Basic " + btoa("admin:admin"); // 🔹 Admin credentials for fetching users

    // 🔹 Filter transactions based on search input
    useEffect(() => {
        if (!searchQuery) {
            setFilteredTransactions(transactions);
            return;
        }

        // 🔹 Match transactions by recipient username or ID
        const matchedTransactions = transactions.filter(tx => {
            const recipient = users.find(user => user.id === tx.relatedAccountId);
            return recipient && (recipient.username.includes(searchQuery) || recipient.name?.includes(searchQuery));
        });

        setFilteredTransactions(matchedTransactions);
    }, [searchQuery, transactions, users]);

    useEffect(() => {
        fetchUserTransactions();
        fetchUsers();
        fetchAccounts()
    }, []);


    // 🔹 Fetch logged-in user's transactions
    const fetchUserTransactions = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/customer/accounts`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true            });

            // 🔹 Extract transactions from all user accounts
            const allTransactions = response.data.flatMap(account =>
                account.transactions.map(tx => ({
                    ...tx,
                    senderAccountId: account.id, // ✅ Ensure sender ID is correct
                }))
            );

            setTransactions(allTransactions);
        } catch (error) {
            console.error("❌ Failed to fetch transactions:", error.response?.data || error.message);
            alert("❌ Unable to fetch transactions. Please try again.");
        }
    };

    const fetchAccounts = async () => {
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
            console.error("Failed to fetch accounts:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/admin/users`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": adminAuth // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const findRecipientAccountId = async () => {
        try {
            // ✅ Fetch all users from admin API
            const response = await axios.get(`${BASE_URL}/admin/users`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": adminAuth // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });

            const allUsers = response.data;
            const foundUser = allUsers.find(user => user.accounts.some(acc => acc.accountNumber === recipientAccount));

            if (!foundUser) {
                alert("❌ No user found with this account number.");
                return null;
            }

            if (foundUser.name && foundUser.name !== recipientName) {
                alert("❌ The recipient name does not match the registered name.");
                return null;
            }

            const recipientAcc = foundUser.accounts.find(acc => acc.accountNumber === recipientAccount);
            return recipientAcc ? recipientAcc.id : null;
        } catch (error) {
            console.error("❌ Failed to find recipient account:", error);
            return null;
        }
    };

    const handleTransfer = async () => {
        if (!selectedAccount || !recipientAccount || !amount || !confirm) {
            alert("❌ Please fill all fields and confirm.");
            return;
        }

        // Prevent self-transfer
        if (parseInt(selectedAccount) === parseInt(recipientAccount)) {
            alert("❌ You cannot transfer money to the same account.");
            return;
        }

        const recipientAccountId = await findRecipientAccountId();
        if (!recipientAccountId) return;

        const transferData = {
            senderAccountId: parseInt(selectedAccount),
            receiverAccountId: recipientAccountId,
            amount: parseFloat(amount),
        };

        try {
            await axios.post(`${BASE_URL}/accounts/transfer`, transferData, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true            });

            alert(`✅ Successfully transferred $${amount} to account ${recipientAccount}!`);
            setAmount("");
            setRecipientName("");
            setRecipientAccount("");
            setConfirm(false);
        } catch (error) {
            if (error.response) {
                // ✅ Show backend error message if status is 4XX
                if (error.response.status >= 400 && error.response.status < 500) {
                    const errorMessage = error.response.data.message || error.response.data || "An error occurred.";
                    alert(`❌ Error: ${errorMessage}`);
                } else {
                    alert("❌ Transfer failed. Please try again.");
                }
            } else {
                alert("❌ Network error. Please check your connection.");
            }
        }
    };

    const handleSearchTransactions = () => {
        if (!searchUser.trim()) return; // Prevent empty search

        const lowerSearch = searchUser.toLowerCase();

        const filteredUsers = users.filter(user =>
            (user.username && user.username.toLowerCase().includes(lowerSearch)) ||
            (user.name && user.name.toLowerCase().includes(lowerSearch))
        );

        if (filteredUsers.length === 0) {
            alert("❌ No matching users found.");
            setTransactions([]);
            return;
        }

        // ✅ Attach username or name to each transaction
        const matchingTransactions = filteredUsers.flatMap(user =>
            user.accounts.flatMap(acc =>
                acc.transactions.map(tx => ({
                    ...tx,
                    matchedName: user.name || user.username, // ✅ Show name if available, else username
                }))
            )
        );

        setTransactions(matchingTransactions);
    };

    const handleRepeatTransfer = (tx) => {
        setRepeatTransfer(tx);
        setAmount(tx.amount);
        setRecipientAccount(tx.relatedAccountId);
        setShowModal(true); // ✅ Open modal
    };

    const handleConfirmRepeatTransfer = async () => {
        if (!repeatTransfer || !confirm) {
            alert("❌ Please confirm before proceeding.");
            return;
        }

        try {
            // 🔹 Fetch all users and accounts from admin API
            const adminResponse = await axios.get(`${BASE_URL}/admin/users`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": adminAuth // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });

            const users = adminResponse.data;

            let receiverAccountId = null;
            let senderAccountId = null;

            // 🔹 Find the transaction and determine the receiver's account ID
            users.forEach(user => {
                user.accounts.forEach(account => {
                    account.transactions.forEach(tx => {
                        if (tx.id === repeatTransfer.id) {
                            receiverAccountId = account.id; // ✅ The account that received the transaction
                        }
                    });
                });
            });

            // 🔹 Ensure the senderAccountId is properly selected by user
            senderAccountId = parseInt(selectedAccount);

            if (!receiverAccountId) {
                alert("❌ Error: Unable to find the receiver's account.");
                return;
            }

            const transferData = {
                senderAccountId,
                receiverAccountId,
                amount: parseFloat(amount),
            };

            await axios.post(`${BASE_URL}/accounts/transfer`, transferData, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Use user credentials
                },
                withCredentials: true
            });

            alert(`✅ Transfer of $${amount} successful from Account ${senderAccountId} to ${receiverAccountId}!`);
            setShowModal(false); // ✅ Close modal
            setAmount(""); // ✅ Reset form
            setConfirm(false); // ✅ Reset confirmation
        } catch (error) {
            alert(`❌ Transfer failed: ${error.response?.data?.message || "Please try again."}`);
        }
    };


    return (
        <div className="container mt-4 text-center">
            <h1>🔄 Make a Transfer</h1>

            {/* Mode Selection */}
            <div className="toggle-buttons">
                <button
                    className={`custom-btn  shadow-custom ${mode === "new" ? "green-btn" : "gray-btn"}`}
                    onClick={() => setMode("new")}
                >
                    🆕 New Transfer
                </button>
                <button
                    className={`custom-btn shadow-custom ${mode === "repeat" ? "pink-btn" : "gray-btn"}`}
                    onClick={() => { setMode("repeat"); fetchUsers(); }}
                >
                    🔁 Transfer Again
                </button>
            </div>

            {/* New Transfer Mode */}
            {mode === "new" && (
                <div className="form-group mt-4">
                    <label>Select Your Account:</label>
                    <select
                        className="form-control account-selector"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                        <option className="input-field" value="">-- Choose an account --</option>
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.accountNumber} (Balance: ${acc.balance.toFixed(2)})
                            </option>
                        ))}
                    </select>

                    <label>Recipient Name:</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter recipient name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                    />

                    <label>Recipient Account Number:</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter recipient account number"
                        value={recipientAccount}
                        onChange={(e) => setRecipientAccount(e.target.value)}
                    />

                    <label>Amount:</label>
                    <input
                        type="number"
                        className="form-control"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <div className="form-check mt-3">
                        <input type="checkbox" className="form-check-input" id="confirmCheck" checked={confirm} onChange={() => setConfirm(!confirm)} />
                        <label className="form-check-label" htmlFor="confirmCheck">Confirm details are correct</label>
                    </div>

                    <button className="btn-primary shadow-custom green-btn mt-4" onClick={handleTransfer}>
                        🚀 Send Transfer
                    </button>
                </div>
            )}

            {/* Repeat Transfer Mode */}
            {mode === "repeat" && (
                <div className="form-group mt-4">
                    <label>Search by Username or Name:</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter name to find transactions"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                    />
                    <button className="custom-btn shadow-custom blue-btn mt-3" onClick={handleSearchTransactions}>
                        🔍 Search Transactions
                    </button>

                    <h3 className="mt-4">Matching Transactions</h3>
                    <ul className="list-group">
                        {transactions.map(tx => (
                            <li key={tx.id} className="list-group-item d-flex justify-content-between">
                                <span>
                                    {tx.type} - ${tx.amount.toFixed(2)}
                                    <br />
                                    <small>🔍 Found under: <strong>{tx.matchedName}</strong></small>
                                </span>
                                <button className="custom-btn shadow-custom pink-btn" onClick={() => handleRepeatTransfer(tx)}>
                                    🔁 Repeat
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>🔁 Repeat Transfer</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Confirm transfer to Account ID: <strong>{recipientAccount}</strong></p>

                    {/* ✅ Sender Account Selection */}
                    <label>Select Your Account:</label>
                    <select
                        className="form-control"
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

                    <label>Amount:</label>
                    <input
                        type="number"
                        className="form-control"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <div className="form-check mt-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="confirmCheck"
                            checked={confirm}
                            onChange={() => setConfirm(!confirm)}
                        />
                        <label className="form-check-label" htmlFor="confirmCheck">
                            Confirm details are correct
                        </label>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handleConfirmRepeatTransfer} disabled={!confirm || !selectedAccount}>
                        🚀 Send Transfer
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
}

export default Transfer;
