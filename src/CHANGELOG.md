# Changelog

## [Unreleased]

### Alterações de Controle
- Removida a mecânica de pulo
- Alterado o controle de voo da tecla F para a barra de espaço
- Simplificado o sistema de movimento vertical para usar apenas o voo

### Fase 3 - Expansão de Conteúdo (Implementado)
- Adicionado sistema de gerenciamento de níveis (LevelManager)
- Implementados múltiplos níveis com diferentes dificuldades
- Criada classe base Platform para plataformas
- Adicionadas plataformas móveis (MovingPlatform)
- Adicionadas plataformas que desaparecem (DisappearingPlatform)
- Atualizado sistema de colisão para trabalhar com os novos tipos de plataformas
- Implementada geração procedural de níveis com base em configurações
- Adicionada exibição de informações do nível atual

### Fase 2 - Melhorias Audiovisuais (Implementado)
- Adicionado sistema de áudio completo usando Web Audio API e Three.js
- Implementado carregamento de sons para ações do jogador, coletáveis, inimigos e interface
- Adicionados efeitos sonoros para voo, dano, coleta de itens e eventos do jogo
- Preparada estrutura para música de fundo
- Criada documentação para o sistema de áudio
- Preparada estrutura para modelos 3D e texturas
- Atualizado README com informações sobre o sistema de áudio

### Fase 1 - Mecânica de Voo (Implementado)
- Adicionada mecânica de voo ao jogador
- Implementado sistema de combustível com consumo e regeneração
- Adicionada barra de combustível à interface
- Adicionados efeitos visuais de partículas durante o voo
- Ajustada a câmera para melhor visualização durante o voo
- Modificada a física para desativar colisões com o chão durante o voo

## [Planejado]

### Fase 4 - Otimização e Polimento
- Otimizar renderização para melhor performance
- Refinar IA dos inimigos
- Adicionar opções de configuração (gráficos, áudio, controles)
- Implementar sistema de salvamento 