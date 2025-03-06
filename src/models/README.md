# Sistema de Modelos 3D

Este diretório contém a documentação do sistema de modelos 3D do jogo.

## Modelos 3D

Os modelos 3D devem ser colocados na pasta `public/models/` para que possam ser carregados pelo jogo. Os formatos suportados são:

- GLTF/GLB (.gltf, .glb)
- OBJ (.obj)
- FBX (.fbx)

## Modelos Planejados

O jogo utilizará os seguintes modelos 3D:

### Personagem
- `player.glb` - Modelo do jogador com animações

### Inimigos
- `enemy.glb` - Modelo do inimigo básico com animações

### Coletáveis
- `crystal.glb` - Modelo do cristal
- `seed.glb` - Modelo da semente

### Cenário
- `tree.glb` - Modelo de árvore
- `mushroom.glb` - Modelo de cogumelo
- `rock.glb` - Modelo de rocha
- `platform.glb` - Modelo de plataforma

## Como Adicionar Novos Modelos

1. Adicione o arquivo do modelo na pasta `public/models/`
2. Registre o modelo no método `loadModels()` da classe `AssetLoader`
3. Use o método `getModel()` para obter o modelo onde necessário

## Exemplo de Uso

```javascript
// Carregar modelos
loadModels() {
    const gltfLoader = new GLTFLoader(this.loadingManager);
    
    // Carregar modelo do jogador
    gltfLoader.load(
        '/models/player.glb',
        (gltf) => {
            this.models.player = gltf.scene;
            // Processar animações
            this.animations.player = gltf.animations;
        }
    );
}

// Usar modelo
createPlayerMesh() {
    // Obter modelo do jogador
    const playerModel = this.assetLoader.getModel('player');
    if (playerModel) {
        // Usar modelo carregado
        this.mesh = playerModel.clone();
        this.scene.add(this.mesh);
    } else {
        // Usar geometria simples como fallback
        const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }
}
```

## Observações

- Os modelos são carregados assincronamente durante a inicialização do jogo
- O sistema de modelos usa o GLTFLoader do Three.js
- Os modelos devem ser otimizados para web (baixo número de polígonos)
- As animações devem ser incluídas nos arquivos GLTF/GLB 