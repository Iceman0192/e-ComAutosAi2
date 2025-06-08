// Simple admin login fix
const bcrypt = require('bcrypt');

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  console.log('Admin password hash:', hashedPassword);
}

createAdminUser();