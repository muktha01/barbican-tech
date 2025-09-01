import React, { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import axios from "axios";

const WhatsAppLogin = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const sendOTP = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setMessage({ type: "error", text: "Enter a valid 10-digit mobile number." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("http://localhost:8000/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });

      const data = await response.json();
      console.log("📲 OTP sent response:", data);

      if (response.ok) {
        setOtpSent(true);
        setTimer(60);
        setMessage({ type: "success", text: "OTP sent successfully." });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send OTP." });
      }
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      setMessage({ type: "error", text: "Network error sending OTP." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessage({ type: "error", text: "Enter a valid 6-digit OTP." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post("http://localhost:8000/api/verify-otp", {
        phone: mobile,
        otp,
      });

      console.log("✅ OTP Verified:", response.data.message);
      setMessage({ type: "success", text: "OTP verified successfully." });
    } catch (error) {
      console.error("❌ OTP Verification Failed:", error.response?.data?.message || error.message);
      setMessage({ type: "error", text: error.response?.data?.message || "OTP verification failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center">
          <FaWhatsapp className="text-green-500 mr-2" />
          Login via WhatsApp OTP
        </h2>

        <input
          type="tel"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          maxLength={10}
          className="w-full px-4 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {!otpSent && (
          <button
            onClick={sendOTP}
            disabled={loading || timer > 0}
            className={`w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition ${
              (loading || timer > 0) && "opacity-50 cursor-not-allowed"
            }`}
          >
            {loading ? "Sending..." : timer > 0 ? `Resend in ${timer}s` : "Send OTP"}
          </button>
        )}

        {otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full px-4 py-2 border rounded-md mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className={`w-full mt-3 bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600 transition ${
                loading && "opacity-50 cursor-not-allowed"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppLogin;
