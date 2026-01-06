const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
    const baseURL = 'http://localhost:3001/api';
    const email = 'test@example.com';

    try {
        console.log('1. Requesting OTP...');
        const reqRes = await axios.post(`${baseURL}/auth/request-email-otp`, { email });
        const otp = reqRes.data.otp;
        console.log(`OTP Requested. Received OTP: ${otp}`);

        console.log('2. Verifying OTP...');
        const verifyRes = await axios.post(`${baseURL}/auth/verify-email-otp`, { email, otp });
        console.log('Verify Response Data:', JSON.stringify(verifyRes.data, null, 2));
        const token = verifyRes.data.accessToken;
        console.log('Token received:', token ? 'YES' : 'NO');

        if (!token) {
            console.error('Failed to get token');
            return;
        }

        console.log('3. Uploading eCAS File...');
        const form = new FormData();
        form.append('file', fs.createReadStream('/Users/bhavikjavia/IdeaProjects/smartmoney-sia/backend/ecas.pdf'));
        form.append('password', '1234567');

        const uploadRes = await axios.post(`${baseURL}/portfolio/upload-ecas`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload Success:', JSON.stringify(uploadRes.data, null, 2));

        console.log('\n4. Verifying Persistence (GET /portfolios/:userId)...');
        const userId = verifyRes.data.user.id;
        const portfolioRes = await axios.get(`${baseURL}/portfolios/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Portfolio Fetch Success. Mutual Funds Count:', portfolioRes.data?.mutualFunds?.length || 0);
        console.log('Total Portfolio Value:', portfolioRes.data?.totalValue);

        if (portfolioRes.data?.mutualFunds?.length > 0) {
            console.log('TEST PASSED: Data persisted in DB.');
        } else {
            console.error('TEST FAILED: No mutual funds found in DB after upload.');
        }

    } catch (error) {
        console.error('Error Occurred:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

run();
