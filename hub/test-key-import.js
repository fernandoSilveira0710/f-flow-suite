const jose = require('jose');
require('dotenv').config();

async function testKeyImport() {
  try {
    console.log('Testando importação da chave privada...');
    
    const privateKeyPem = process.env.LICENSE_PRIVATE_KEY_PEM;
    console.log('Chave privada do .env (primeiros 100 chars):', privateKeyPem?.substring(0, 100));
    
    if (!privateKeyPem) {
      throw new Error('LICENSE_PRIVATE_KEY_PEM não encontrada no .env');
    }

    // Tentar importar diretamente
    try {
      const privateKey1 = await jose.importPKCS8(privateKeyPem, 'RS256');
      console.log('✅ Importação direta funcionou!');
    } catch (error) {
      console.log('❌ Importação direta falhou:', error.message);
    }

    // Tentar com limpeza de escape
    try {
      const cleanPrivateKey = privateKeyPem.replace(/\\n/g, '\n');
      console.log('Chave limpa (primeiros 100 chars):', cleanPrivateKey.substring(0, 100));
      const privateKey2 = await jose.importPKCS8(cleanPrivateKey, 'RS256');
      console.log('✅ Importação com limpeza funcionou!');
    } catch (error) {
      console.log('❌ Importação com limpeza falhou:', error.message);
    }

    // Tentar ler do arquivo
    const fs = require('fs');
    try {
      const fileKey = fs.readFileSync('./license_private.pem', 'utf8');
      console.log('Chave do arquivo (primeiros 100 chars):', fileKey.substring(0, 100));
      const privateKey3 = await jose.importPKCS8(fileKey, 'RS256');
      console.log('✅ Importação do arquivo funcionou!');
    } catch (error) {
      console.log('❌ Importação do arquivo falhou:', error.message);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testKeyImport();