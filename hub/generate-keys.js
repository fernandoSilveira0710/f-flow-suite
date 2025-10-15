const crypto = require('crypto');
const fs = require('fs');

// Gerar par de chaves RSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('Chaves RSA geradas com sucesso!');
console.log('\n=== CHAVE PRIVADA ===');
console.log(privateKey);
console.log('\n=== CHAVE PÚBLICA ===');
console.log(publicKey);

// Salvar as chaves em arquivos
fs.writeFileSync('license_private.pem', privateKey);
fs.writeFileSync('license_public.pem', publicKey);

console.log('\nChaves salvas em:');
console.log('- license_private.pem');
console.log('- license_public.pem');

// Formatar para .env
const privateKeyForEnv = privateKey.replace(/\n/g, '\\n');
const publicKeyForEnv = publicKey.replace(/\n/g, '\\n');

console.log('\n=== PARA O .ENV DO HUB ===');
console.log(`LICENSE_PRIVATE_KEY_PEM="${privateKeyForEnv}"`);

console.log('\n=== PARA O .ENV DO CLIENT-LOCAL ===');
console.log(`LICENSE_PUBLIC_KEY_PEM="${publicKeyForEnv}"`);