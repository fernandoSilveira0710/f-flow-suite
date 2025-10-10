const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function configureLicense() {
  try {
    console.log('🔧 Configurando licença no client-local...');
    
    // 1. Ativar licença no Hub
    console.log('📝 Ativando licença no Hub...');
    const hubResponse = await axios.post('http://localhost:8081/licenses/activate', {
      tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
      deviceId: 'test-device-123',
      plan: 'Básico',
      planId: 'starter',
      features: ['basic_features']
    });
    
    if (hubResponse.status !== 201) {
      throw new Error('Falha na ativação no Hub');
    }
    
    const licenseToken = hubResponse.data.licenseToken;
    console.log('✅ Licença ativada no Hub!');
    console.log('🎫 Token:', licenseToken.substring(0, 50) + '...');
    
    // 2. Salvar token em arquivo para o client-local
    const licenseFilePath = path.join(__dirname, 'license.jwt');
    fs.writeFileSync(licenseFilePath, licenseToken);
    console.log('💾 Token salvo em license.jwt');
    
    // 3. Verificar se o client-local consegue ler a licença
    console.log('🔍 Testando verificação no client-local...');
    
    // Aguardar um pouco para o client-local processar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const currentResponse = await axios.get('http://localhost:3001/licensing/current');
      console.log('✅ Licença atual no client-local:', currentResponse.data);
    } catch (error) {
      console.log('⚠️ Client-local ainda não reconheceu a licença');
      
      // Tentar forçar atualização do cache
      try {
        const cacheResponse = await axios.post('http://localhost:3001/licensing/persist', {
          tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
          userId: 'test-user',
          licenseData: hubResponse.data
        });
        console.log('✅ Cache atualizado:', cacheResponse.data);
        
        // Verificar novamente
        const retryResponse = await axios.get('http://localhost:3001/licensing/current');
        console.log('✅ Licença após cache:', retryResponse.data);
        
      } catch (cacheError) {
        console.log('❌ Erro ao atualizar cache:', cacheError.response?.data || cacheError.message);
      }
    }
    
    // 4. Testar funcionamento offline
    console.log('🔌 Testando funcionamento offline...');
    
    // Simular verificação offline usando o cache
    try {
      const offlineResponse = await axios.get('http://localhost:3001/licensing/status', {
        params: { tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b' }
      });
      console.log('✅ Status offline:', offlineResponse.data);
    } catch (offlineError) {
      console.log('⚠️ Endpoint de status não disponível:', offlineError.response?.status);
    }
    
    console.log('🎉 Configuração concluída!');
    
  } catch (error) {
    console.error('💥 Erro na configuração:', error.message);
    if (error.response) {
      console.error('📋 Detalhes:', error.response.data);
    }
  }
}

configureLicense();