const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('🧪 Testing VizFlow Upload Functionality...\n');

    // Create a simple test CSV file
    const testData = `id,name,email,age,salary,department
1,John Doe,john.doe@email.com,28,50000,Engineering
2,Jane Smith,jane.smith@email.com,32,60000,Marketing  
3,Bob Johnson,,35,70000,Sales
4,Alice Brown,alice.brown@email.com,abc,55000,HR
5,Charlie Wilson,charlie.wilson@email.com,29,,Engineering
6,Diana Davis,diana.davis@email.com,41,65000,Finance
7,Eve Thompson,invalid-email,33,58000,Marketing
8,Frank Miller,frank.miller@email.com,27,52000,Engineering
9,Grace Lee,grace.lee@email.com,38,72000,Sales
10,Henry Clark,henry.clark@email.com,45,80000,Management`;

    const testFilePath = path.join(__dirname, 'test-upload.csv');
    fs.writeFileSync(testFilePath, testData);
    console.log('✅ Test CSV file created:', testFilePath);

    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));

    console.log('\n📤 Uploading file to VizFlow API...');

    // Make the upload request
    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log('\n✅ Upload Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Test file cleaned up');

    return response.data;

  } catch (error) {
    console.error('\n❌ Upload Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testUpload().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});