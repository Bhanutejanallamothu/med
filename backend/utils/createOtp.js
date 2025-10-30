const crypto = require('crypto');

const generateOtp = () => {
    // 6 digit OTP
    return crypto.randomInt(100000, 999999).toString();
};

const generateExpiryTime = () => {
    const now = new Date();
    // OTP expires in 5 minutes
    now.setMinutes(now.getMinutes() + 5);
    return now;
};

const sendOtpRequest = async (otp, mobile) => {
    const data = {
        userName: "swecha.trans",
        entityId: "1401456660000019917",
        templateId: "1407174590675044489",
        destinationNumber: mobile,
        smsText: `Your Mobile Verification OTP is: ${otp}
- Swecha`,
        apiKey: process.env.SMS_API_KEY,
        smsType: "SMS_TRANS",
        senderId: "SWECHA",
        unicode: false,
    };

    const body = `data=${encodeURIComponent(JSON.stringify(data))}`;
    const url = "https://smsapi1.ozonetel.com/OzonetelSMS/api.php?action=sendSMS";
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body,
        });
        return await response.json();
    } catch (error) {
        console.error("Error sending OTP:", error.stack);
        return null;
    }
};

module.exports = {
    generateOtp,
    generateExpiryTime,
    sendOtpRequest
};
