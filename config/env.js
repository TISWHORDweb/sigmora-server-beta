// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root (parent of config directory)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please create a .env file in the sigmora-server-beta directory with the following:');
  console.error('   JWT_SECRET=your-secret-key-here');
  console.error('   MONGODB_URI=mongodb://localhost:27017/sigmora');
  console.error('\n💡 Generate a secure JWT_SECRET: openssl rand -base64 32\n');
  process.exit(1);
}

// Log that environment is loaded (without showing secrets)
console.log('✅ Environment variables loaded');
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌'}`);
console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? 'Set ✅' : 'Missing ❌'}`);

export default process.env;

