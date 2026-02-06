var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
const TEST_URL = 'https://www.allrecipes.com/recipe/20144/banana-banana-bread/';
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing extraction API...');
        try {
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const response = yield axios.post(`${baseUrl}/api/extract`, {
                url: TEST_URL
            });
            console.log('Status:', response.status);
            console.log('Data:', JSON.stringify(response.data, null, 2));
        }
        catch (error) {
            console.error('Test Failed:', error.response ? error.response.data : error.message);
        }
    });
}
test();
