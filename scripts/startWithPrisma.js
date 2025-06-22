const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;

if (hasMigrations) {
  console.log('Applying migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('No migrations found, pushing schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
}

console.log('Starting server...');
execSync('node server.js', { stdio: 'inherit' }); 