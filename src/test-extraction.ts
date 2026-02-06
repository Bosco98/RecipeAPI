import axios from 'axios';

const TEST_URL = 'https://www.allrecipes.com/recipe/20144/banana-banana-bread/';

async function test() {
    console.log('Testing extraction API...');
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const response = await axios.post(`${baseUrl}/api/extract`, {
            url: TEST_URL
        });

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

test();
