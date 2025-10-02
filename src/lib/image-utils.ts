/**
 * Image utilities for product images
 */

export function getInitials(name: string): string {
  const words = name.trim().split(' ').filter(w => w.length > 0);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getPlaceholderFor(name: string, size: number = 40): string {
  const initials = getInitials(name);
  const colors = [
    { bg: '#3B82F6', text: '#FFFFFF' }, // blue
    { bg: '#8B5CF6', text: '#FFFFFF' }, // purple
    { bg: '#EC4899', text: '#FFFFFF' }, // pink
    { bg: '#F59E0B', text: '#FFFFFF' }, // amber
    { bg: '#10B981', text: '#FFFFFF' }, // green
    { bg: '#06B6D4', text: '#FFFFFF' }, // cyan
  ];
  
  // Simple hash to pick consistent color
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color.bg}" rx="4"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="${color.text}" 
        font-family="Inter, system-ui, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="600"
      >${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Check file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Use JPG, PNG ou WEBP',
    };
  }
  
  // Check file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Imagem muito grande. Máximo 2MB',
    };
  }
  
  // Check dimensions (optional, just warning)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width < 256 || img.height < 256) {
        resolve({
          valid: true,
          error: 'Recomendado: mínimo 256x256px para melhor qualidade',
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Não foi possível carregar a imagem',
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressImage(
  base64: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = (height / width) * maxWidth;
          width = maxWidth;
        } else {
          width = (width / height) * maxHeight;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

export function captureFromCamera(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error('Câmera não disponível neste dispositivo'));
      return;
    }
    
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            stream.getTracks().forEach(track => track.stop());
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(video, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          stream.getTracks().forEach(track => track.stop());
          resolve(base64);
        };
      })
      .catch(reject);
  });
}

export const MOCK_PRODUCT_IMAGES = [
  '/placeholder.svg',
  // Add more mock images if needed
];

export function getMockProductImage(index: number = 0): string {
  return MOCK_PRODUCT_IMAGES[index % MOCK_PRODUCT_IMAGES.length];
}
