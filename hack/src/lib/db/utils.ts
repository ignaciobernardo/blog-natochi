import { generateId } from 'ai';
import { hashPassword } from 'better-auth/crypto';

async function generateHashedPassword(password: string) {
  return await hashPassword(password);
}

async function _generateDummyPassword() {
  const password = generateId();
  const hashedPassword = await generateHashedPassword(password);

  return hashedPassword;
}
