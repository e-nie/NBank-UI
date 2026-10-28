import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {BASE_URL} from "../App";


function Login({ setAuth, theme }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const logoSrc = theme === "dark" ? "/images/logo_dark.png" : "/images/logo_light.png";


    const handleLogin = async () => {
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, {
                username,
                password
            });

            if (response.status === 200) {
                const user = response.data;

                // 🔹 Create Basic Auth header
                const authHeader = `Basic ${btoa(`${username}:${password}`)}`;

                // 🔹 Save to localStorage (or sessionStorage)
                localStorage.setItem("authToken", authHeader);

                setAuth({username, role: user.role});

                // 🔹 Redirect user based on role
                if (user.role === "ADMIN") navigate("/admin");
                else navigate("/dashboard");
            } else {
                alert("Login failed: Unexpected response");
            }
        } catch (error) {
            alert("Invalid credentials" + error);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleLogin();
        }
    };

    return (
        <div className="login-container text-center p-6">
            <div className="card shadow-custom"> {/* ✅ Adds padding directly */}
                <img src={logoSrc} alt="Bank Logo" className="logo mx-auto mb-3"/>
                <h1>Login</h1>
                <input type="text" className="form-control mb-3" placeholder="Username" value={username}
                       onKeyDown={handleKeyPress} /* ✅ Detect Enter key */
                       onChange={(e) => setUsername(e.target.value)}/>
                <input type="password" className="form-control mb-3" placeholder="Password" value={password}
                       onKeyDown={handleKeyPress} /* ✅ Detect Enter key */
                       onChange={(e) => setPassword(e.target.value)}/>
                <button className="btn btn-primary w-100" onClick={handleLogin}>
                    Login
                </button>
            </div>
        </div>
    );
}
export default Login;
