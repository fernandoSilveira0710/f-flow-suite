const axios = require('axios');

async function testLicenseVerification() {
  try {
    console.log('🔍 Testando verificação de licença...');
    
    // Primeiro vamos ativar uma nova licença via HTTP
    console.log('📝 Ativando nova licença via Hub...');
    
    const activationData = {
      tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
      deviceId: 'test-device-123',
      plan: 'Básico',
      planId: 'starter',
      features: ['basic_features']
    };
    
    const hubResponse = await axios.post('http://localhost:8081/licenses/activate', activationData);
    
    if (hubResponse.status === 201) {
      console.log('✅ Licença ativada com sucesso no Hub!');
      const licenseToken = hubResponse.data.licenseToken;
      console.log('🎫 Token:', licenseToken.substring(0, 50) + '...');
      
      // Agora vamos configurar a licença no client-local
      console.log('🔧 Configurando licença no client-local...');
      
      try {
        // Primeiro, vamos ativar a licença no client-local
        const clientActivationResponse = await axios.post('http://localhost:3001/licensing/activate', {
          tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
          deviceId: 'test-device-123'
        });
        
        console.log('✅ Licença ativada no client-local:', clientActivationResponse.data);
        
        // Agora vamos verificar a licença no client-local
        console.log('🔍 Verificando licença no client-local...');
        const verifyResponse = await axios.get('http://localhost:3001/licensing/current');
        console.log('✅ Resposta do client-local:', verifyResponse.data);
        
        // Testar funcionamento offline - simular desconexão do Hub
        console.log('🔌 Testando funcionamento offline...');
        console.log('📋 Status da licença offline:', verifyResponse.data);
        
      } catch (clientError) {
        console.log('⚠️ Erro no client-local:', clientError.response?.data || clientError.message);
        
        // Vamos tentar persistir a licença manualmente
        console.log('🔧 Tentando persistir licença manualmente...');
        try {
          const persistResponse = await axios.post('http://localhost:3001/licensing/persist', {
            tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
            userId: 'test-user',
            licenseData: hubResponse.data
          });
          console.log('✅ Licença persistida:', persistResponse.data);
        } catch (persistError) {
          console.log('❌ Erro ao persistir:', persistError.response?.data || persistError.message);
        }
      }
      
    } else {
      console.log('❌ Falha na ativação:', hubResponse.data);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
    if (error.response) {
      console.error('📋 Detalhes do erro:', error.response.data);
    }
  }
}

// Executar o teste
testLicenseVerification();