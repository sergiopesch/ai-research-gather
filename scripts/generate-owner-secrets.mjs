import { createHash, randomBytes } from 'node:crypto';

const accessKey = `research_${randomBytes(24).toString('base64url')}`;
const accessKeyHash = createHash('sha256').update(accessKey).digest('hex');
const sessionSecret = randomBytes(48).toString('base64url');

console.log(`OWNER_ACCESS_KEY (save this once): ${accessKey}`);
console.log(`OWNER_ACCESS_KEY_HASH=${accessKeyHash}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
