import React, { useState, useEffect } from "react";
import axios from "axios";

const apiVersion = process.env.REACT_APP_API_VERSION || "v1";
export const BASE_URL = `/api/${apiVersion}`;
const BASE_ADMIN_URL = BASE_URL + "/admin";

function AdminPanel({ auth }) {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: "", password: "", role: "USER" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const authHeader = localStorage.getItem("authToken"); // 🔹 Retrieve the stored token

            if (!authHeader) {
                console.error("❌ No auth token found in localStorage!");
                return;
            }

            const response = await axios.get( `${BASE_ADMIN_URL}/users`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": authHeader // 🔹 Force adding Authorization header
                },
                withCredentials: true
            });
            console.log("Users:", response.data);
            setUsers(response.data); // ✅ Store the response data in `users`
        } catch (error) {
            if (error.response) {
                console.error("Server responded with an error:", error.response.status, error.response.data);
            } else if (error.request) {
                console.error("No response received from the server:", error.request);
            } else {
                console.error("Error setting up request:", error.message);
            }
        }
    };

    const addUser = async () => {
        try {
            if (!newUser || !newUser.username || !newUser.password) {
                alert("⚠️ Please enter a username and password.");
                return;
            }

            // 🔹 Retrieve stored token from localStorage
            const authHeader = localStorage.getItem("authToken");

            if (!authHeader) {
                console.error("❌ No auth token found in localStorage!");
                alert("❌ Unauthorized: No authentication token found.");
                return;
            }

            // 🔹 Format user data correctly
            const userPayload = {
                username: newUser.username,
                password: newUser.password,
                role: newUser.role || "USER" // Default to "USER" role
            };

            // 🔹 Send POST request with headers & body
            const response = await axios.post(`${BASE_ADMIN_URL}/users`, userPayload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader // ✅ Attach auth token from localStorage
                },
                withCredentials: true // ✅ Ensures authentication credentials are sent
            });

            console.log("✅ User created successfully:", response.data);
            alert("✅ User created successfully!");

            fetchUsers(); // 🔹 Refresh user list after adding a new user
        } catch (error) {
        console.error("❌ Failed to create user:", error.response || error.message);

        if (error.response && error.response.status === 400) {
            const data = error.response.data;

            // Собираем ошибки в строку
            const formattedErrors = Object.entries(data)
                .map(([field, message]) => `• ${field}: ${message}`)
                .join("\n");

            alert("❌ Failed to create user:\n\n" + formattedErrors);
        } else {
            alert("❌ Failed to create user. Check console for details.");
        }
    }
};

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addUser();
        }
    };

    return (
        <div className="container-center">
            <div className="container-center">
                <h1>Admin Panel</h1>

                {/* ✅ Create User Card */}
                <div className="card shadow-custom">
                    <h2>Create New User</h2>
                    <input type="text" className="form-control mb-2" placeholder="Username"
                           onKeyDown={handleKeyPress} /* ✅ Detect Enter key */
                           onChange={(e) => setNewUser({...newUser, username: e.target.value})}/>
                    <input type="password" className="form-control mb-2" placeholder="Password"
                           onKeyDown={handleKeyPress} /* ✅ Detect Enter key */
                           onChange={(e) => setNewUser({...newUser, password: e.target.value})}/>
                    <button className="btn btn-primary w-100" onClick={addUser}>Add User</button>
                </div>
            <div className="delimiter"></div>

            <ul className="card shadow-custom">
                <h2>All Users</h2>
                {users.map((user) => (
                    <li key={user.id}
                        className="list-group-item d-flex justify-content-between align-items-center">
                        {user.username}
                        <span className="badge badge-pink">
                    {user.role}
                </span>
                    </li>
                ))}
            </ul>
            </div>

        </div>
)
    ;
}

export default AdminPanel;
