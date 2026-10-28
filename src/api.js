import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4111/api";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    withCredentials: true
});

export default api;
