# Sistema de Texturas

Este diretório contém a documentação do sistema de texturas do jogo.

## Texturas

As texturas devem ser colocadas na pasta `public/textures/` para que possam ser carregadas pelo jogo. Os formatos suportados são:

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## Texturas Planejadas

O jogo utilizará as seguintes texturas:

### Terreno
- `grass.jpg` - Textura de grama
- `dirt.jpg` - Textura de terra
- `rock.jpg` - Textura de rocha

### Objetos
- `bark.jpg` - Textura de casca de árvore
- `leaves.jpg` - Textura de folhas
- `mushroom.jpg` - Textura de cogumelo

### Coletáveis
- `crystal.jpg` - Textura de cristal
- `seed.jpg` - Textura de semente

### Efeitos
- `particle.png` - Textura de partícula
- `glow.png` - Textura de brilho

## Como Adicionar Novas Texturas

1. Adicione o arquivo de textura na pasta `public/textures/`
2. Registre a textura no método `loadTextures()` da classe `AssetLoader`
3. Use o método `getTexture()` para obter a textura onde necessário

## Exemplo de Uso

```javascript
// Carregar texturas
loadTextures() {
    // Load ground textures
    this.textures.grass = this.textureLoader.load('/textures/grass.jpg');
    this.textures.dirt = this.textureLoader.load('/textures/dirt.jpg');
    
    // Set texture properties
    this.textures.grass.wrapS = THREE.RepeatWrapping;
    this.textures.grass.wrapT = THREE.RepeatWrapping;
    this.textures.grass.repeat.set(10, 10);
}

// Usar textura
createGround() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({
        map: this.assetLoader.getTexture('grass'),
        roughness: 0.8,
        metalness: 0.2
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
}
```

## Observações

- As texturas são carregadas assincronamente durante a inicialização do jogo
- O sistema de texturas usa o TextureLoader do Three.js
- As texturas devem ser otimizadas para web (tamanho de arquivo reduzido)
- Recomenda-se usar texturas com dimensões que sejam potências de 2 (ex: 512x512, 1024x1024)
- Para texturas repetitivas, certifique-se de que elas sejam seamless (sem emendas visíveis) 