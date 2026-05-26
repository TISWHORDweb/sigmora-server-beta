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
  const msg = `Missing required environment variables: ${missingEnvVars.join(', ')}`;
  console.error(`❌ ${msg}`);
  if (!process.env.VERCEL) {
    console.error('\n📝 Create a .env file or set vars in the Vercel project settings.');
    process.exit(1);
  }
  throw new Error(msg);
}

// Log that environment is loaded (without showing secrets)
console.log('✅ Environment variables loaded');
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌'}`);
console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? 'Set ✅' : 'Missing ❌'}`);

export default process.env;

