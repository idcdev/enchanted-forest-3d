# Changelog

## [Unreleased]

### Sistema de Classes
- Adicionado sistema de seleção de classe (Guerreiro, Arqueiro, Mago)
- Implementados diferentes tipos de ataque para cada classe:
  - Guerreiro: Ataque corpo a corpo com espada
  - Arqueiro: Ataque à distância com flechas
  - Mago: Ataque de área com magia
- Cada classe possui estatísticas únicas (velocidade, dano, alcance)
- Adicionada tela de seleção de classe no início do jogo
- Adicionado indicador visual da classe selecionada na interface

### Melhorias na Interface de Usuário
- Adicionada exibição permanente dos controles na tela de jogo
- Implementado sistema de dicas que destaca os controles quando usados pela primeira vez
- Melhorado o menu de pausa com exibição clara dos controles
- Redesenhada a tela de carregamento com layout mais organizado dos controles

### Novas Mecânicas de Jogabilidade
- Adicionado sistema de ataque básico (tecla Q)
- Implementado efeito visual de cone de ataque e partículas
- Adicionado sistema de detecção de inimigos no cone de ataque
- Adicionado sistema de dash/impulso (tecla E)
- Implementado efeito visual de partículas durante o dash
- Adicionado cooldown para balancear o uso do dash

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

### Melhorias no Sistema de Combate
- Rebalanceado o comportamento dos inimigos para tornar o combate mais justo
- Adicionado sistema de preparação de ataque para inimigos com indicador visual
- Reduzida a velocidade e alcance de detecção dos inimigos
- Implementado sistema de invulnerabilidade temporária após receber dano
- Melhorado o efeito visual de invulnerabilidade com transparência e pulsação
- Adicionado efeito de câmera trêmula ao receber dano
- Reduzido o dano causado pelos inimigos de 10 para 5
- Implementado sistema de cooldown para ataques inimigos

### Otimizações de Desempenho
- Adicionado sistema de configurações de qualidade gráfica (Baixa, Média, Alta)
- Implementado culling de objetos distantes para melhorar o desempenho
- Reduzido o número de luzes pontuais na cena
- Otimizado o sistema de partículas para usar menos recursos
- Melhorada a qualidade das sombras com base nas configurações
- Adicionado menu de configurações gráficas no menu de pausa
- Implementado sistema de LOD (Level of Detail) para efeitos visuais

## [Planejado]

### Fase 4 - Otimização e Polimento
- Otimizar renderização para melhor performance
- Refinar IA dos inimigos
- Adicionar opções de configuração (gráficos, áudio, controles)
- Implementar sistema de salvamento 