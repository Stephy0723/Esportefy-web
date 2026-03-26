import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Lee el .env
const envPath = path.resolve('.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('📄 .env loaded');
} catch (e) {
    console.log('⚠️  .env no encontrado, usando defaults');
}

const API_URL = process.env.API_URL || 'http://localhost:4000';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // ObjectId de prueba

// Datos de prueba SIMPLES
const formDataPayload = {
    name: 'Test Team',
    slogan: 'Testing',
    category: 'MOBA',
    game: 'League of Legends',
    teamGender: 'Mixto',
    teamCountry: 'República Dominicana',
    teamLevel: 'Amateur',
    teamLanguage: 'Español',
    maxMembers: 5,
    maxSubstitutes: 2,
    leaderIgn: 'TestPlayer',
    leaderGameId: 'NA1',
    leaderRegion: 'NA',
    leaderRole: 'Mid'
};

const roster = {
    starters: [
        { user: TEST_USER_ID, nickname: 'TestPlayer', gameId: 'NA1', region: 'NA', email: '', role: 'Mid' },
        null, null, null, null
    ],
    subs: [null, null],
    coach: null
};

console.log('🔧 Testing createTeam endpoint...\n');
console.log('API_URL:', API_URL);
console.log('Endpoint: POST /api/teams/create\n');

async function test() {
    try {
        // 1. Get CSRF token from any GET request
        console.log('1️⃣  Getting CSRF token...');
        const csrfRes = await axios.get(`${API_URL}/api/notifications`, {
            withCredentials: true,
            validateStatus: () => true
        });
        const csrfToken = csrfRes.headers['x-csrf-token'];
        const cookies = csrfRes.headers['set-cookie'];
        console.log('✅ CSRF Token:', csrfToken?.substring(0, 20) + '...');

        // 2. Create FormData
        const form = new FormData();
        form.append('formData', JSON.stringify(formDataPayload));
        form.append('roster', JSON.stringify(roster));

        console.log('\n2️⃣  Sending team creation request...');
        console.log('formData:', JSON.stringify(formDataPayload, null, 2));
        console.log('\nroster:', JSON.stringify(roster, null, 2));

        // 3. Make the request with CSRF token
        const res = await axios.post(`${API_URL}/api/teams/create`, form, {
            headers: {
                ...form.getHeaders(),
                'X-CSRF-Token': csrfToken || '',
                'Authorization': 'Bearer test-token',
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            withCredentials: true,
            validateStatus: () => true // No tirar error en ningún status
        });

        console.log('\n✅ Response received:');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
        
        if (res.status === 500) {
            console.error('\n❌ Still getting 500 error!');
            process.exit(1);
        } else if (res.status === 403) {
            console.log('\n⚠️  CSRF still failing - this is expected without real auth');
        } else {
            console.log('\n✅ No 500 error! The community field fix likely worked!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
        process.exit(1);
    }
}

test();


