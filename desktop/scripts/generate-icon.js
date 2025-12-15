const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Priorizar PNG do desktop/src: primeiro 2.png (como você nomeou), depois 2F.png
    const candidates = [
      path.resolve(__dirname, '..', 'src', '2.png'),
      path.resolve(__dirname, '..', 'src', '2F.png')
    ];
    const icoPath = path.resolve(__dirname, '..', 'src', '2F.ico');

    const pngPath = candidates.find((p) => fs.existsSync(p));
    if (!pngPath) {
      console.error('PNG não encontrado em desktop/src (procurei por 2.png e 2F.png)');
      process.exit(1);
    }

    const { default: pngToIco } = await import('png-to-ico');
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
    console.log('Ícone .ico gerado em', icoPath, 'a partir de', pngPath);
  } catch (err) {
    console.error('Falha ao gerar .ico a partir do PNG:', err);
    process.exit(1);
  }
}
main();
