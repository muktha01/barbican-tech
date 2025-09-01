import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: "",
    mobile_number: "",
    password: "",
    role: "staff", // ✅ default set to "staff"
  });

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/auth/register", {
        username: userData.username,
        mobile_number: userData.mobile_number,
        password: userData.password,
        role: userData.role,
      });

      console.log("Registration successful:", response.data);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen gap-y-6 bg-gray-100">
      <h2 className="text-xl font-bold text-center text-black mb-2">Register</h2>
      <form className="flex flex-col w-80 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="username"
            value={userData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobile_number"
            value={userData.mobile_number}
            onChange={handleChange}
            placeholder="Enter your mobile number"
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            pattern="[0-9]{10}"
            maxLength="10"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={userData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="staff">Staff</option> {/* ✅ correct value */}
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-32 bg-red-500 mx-auto text-white font-semibold py-2 rounded-md hover:bg-red-300"
        >
          Register
        </button>

        <p className="text-sm text-gray-700 mt-4 text-center">
          Already have an account?{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            <Link to={"/login"}>Login</Link>
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
