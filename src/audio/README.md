# Sistema de Áudio

Este diretório contém a documentação do sistema de áudio do jogo.

## Arquivos de Áudio

Os arquivos de áudio devem ser colocados na pasta `public/audio/` para que possam ser carregados pelo jogo. Os formatos suportados são:

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)

## Sons Implementados

O jogo utiliza os seguintes sons:

### Música de Fundo
- `background_music.mp3` - Música de fundo do jogo

### Sons do Jogador
- `jump.mp3` - Som de pulo
- `double_jump.mp3` - Som de pulo duplo
- `fly.mp3` - Som de voo
- `land.mp3` - Som de aterrissagem
- `damage.mp3` - Som de dano

### Sons de Coletáveis
- `collect_crystal.mp3` - Som de coleta de cristal
- `collect_seed.mp3` - Som de coleta de semente

### Sons de Inimigos
- `enemy_detect.mp3` - Som de detecção do jogador pelo inimigo
- `enemy_attack.mp3` - Som de ataque do inimigo

### Sons de Interface
- `button_click.mp3` - Som de clique em botão
- `level_complete.mp3` - Som de conclusão de nível
- `game_over.mp3` - Som de fim de jogo

## Como Adicionar Novos Sons

1. Adicione o arquivo de áudio na pasta `public/audio/`
2. Registre o som no método `loadSounds()` da classe `AssetLoader`
3. Use o método `playSound()` para reproduzir o som onde necessário

## Exemplo de Uso

```javascript
// Reproduzir um som
this.assetLoader.playSound('jump');

// Reproduzir um som com opções
this.assetLoader.playSound('fly', { 
    volume: 0.5,
    loop: true
});

// Parar um som
this.assetLoader.stopSound('fly');
```

## Observações

- Os sons são carregados assincronamente durante a inicialização do jogo
- O sistema de áudio usa a API Web Audio através do Three.js
- O contexto de áudio é iniciado após a primeira interação do usuário (requisito dos navegadores) 