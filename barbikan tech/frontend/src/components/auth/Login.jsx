import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../Styles/Login.css"; // Adjust the path as necessary

const Login = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login data:", userData);
    console.log("Sending to API:", {
  username: userData.username,
  password: userData.password,
});

    try {
      
      const response = await axios.post("http://localhost:8000/api/auth/login", {
        username: userData.username, 
        password: userData.password,
      },{
         headers: {
    "Content-Type": "application/json",
      }
      });

      console.log("Login successful:", response.data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Navigate based on role
      if (response.data.user.role === "admin") {
        navigate("/factory");
      } else {
        navigate("/companyList");
      }
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen gap-y-6 bg-gray-100">
      <div className=" box-center ">
      <h2 className="text-xl font-bold text-center text-black mb-2">Login</h2>
      <form className="flex flex-col w-80 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
           NAME
          </label>
          <input
            type="text"
            name="username"
            value={userData.username}
            onChange={handleChange}
            placeholder="Enter your Name"
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            // pattern="[0-9]{10}"
            // maxLength="10"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PASSWORD
          </label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={userData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-32 bg-red-500 mx-auto text-white font-semibold py-2 rounded-md hover:bg-red-300"
        >
          Login
        </button>

        {/* <p className="text-sm text-gray-700 mt-4 text-center">
          Don't have an account?{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            <Link to={"/register"}> Register</Link>
          </span>
        </p> */}
      </form>
      </div>
    </div>
  );
};

export default Login;
