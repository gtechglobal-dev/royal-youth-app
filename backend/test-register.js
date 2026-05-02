// Test 1: Valid registration with apostrophe in surname
const test1 = {
  surname: "O'Connor",
  firstname: "John",
  othername: "David",
  email: `test${Date.now()}@example.com`, // Unique email
  phone: `080${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`, // Unique phone
  dob: "2000-05-20",
  address: "123 Test Street",
  stateOfOrigin: "Lagos",
  lga: "Lagos Mainland",
  occupation: "Engineer",
  serviceUnit: "Choir",
  bornAgain: "Yes",
  password: "123456"
};

// Test 2: Invalid registration - missing required fields
const test2 = {
  surname: "Smith",
  firstname: "Jane",
  email: `test${Date.now() + 1}@example.com`,
  phone: `080${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
  dob: "2000-05-20",
  // Missing: address, stateOfOrigin, lga, occupation, serviceUnit
  password: "123456"
};

console.log("Test 1 - Valid registration with apostrophe:");
console.log(JSON.stringify(test1, null, 2));

console.log("\nTest 2 - Invalid registration (missing fields):");
console.log(JSON.stringify(test2, null, 2));

export { test1, test2 };
