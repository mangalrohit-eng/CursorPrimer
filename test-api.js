// Quick test to verify OpenAI API key works
const OpenAI = require('openai');
require('dotenv').config();

console.log('Testing OpenAI API key...');
console.log('API Key present:', !!process.env.OPENAI_API_KEY);
console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 8));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function test() {
    try {
        console.log('\nTrying simple API call...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Say hello in 5 words' }],
            max_tokens: 20
        });
        
        console.log('✅ SUCCESS!');
        console.log('Response:', response.choices[0].message.content);
        process.exit(0);
    } catch (error) {
        console.log('❌ ERROR:');
        console.log('Message:', error.message);
        console.log('Code:', error.code);
        console.log('Status:', error.status);
        process.exit(1);
    }
}

test();


