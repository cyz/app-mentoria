# Organização de turmas de mentoria

Este é um projeto FastAPI para organização de turmas de mentoria de soft skills da WoMakersCode. A estrutura é:

## Estrutura do Projeto

- **app.py** - API FastAPI principal com endpoints para listar atividades e inscrições
- **static** - Frontend web (HTML, CSS, JavaScript)
- **.devcontainer/** - Configuração do dev container
- **launch.json** - Configuração de debug do VS Code

## Como Executar

O projeto já está configurado no dev container. Para executar:

### Opção 1: Usando o VS Code (Recomendado)
1. Pressione `F5` ou use o menu "Run and Debug"
2. Selecione "Launch Mergington WebApp"

### Opção 2: Terminal
```bash
cd /workspaces/app-mentoria
python -m uvicorn src.app:app --reload --host 0.0.0.0
```

### Opção 3: Diretamente
```bash
cd src
python app.py
```

## Acesso

- **Interface Web**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Funcionalidades

- Lista turmas de mentoria disponíveis (endpoint `get_activities`)
- Permite inscrição de alunas (endpoint `signup_for_activity`)
- Interface web interativa em index.html

As dependências já estão instaladas via requirements.txt no dev container.

## Roadmap - Próximas Funcionalidades

### 🔐 Sistema de Autenticação
- [ ] Login/logout para mentoras e alunas
- [ ] Perfis detalhados com dados profissionais
- [ ] Histórico de participação em mentorias

### 📊 Gestão Avançada
- [ ] Sistema de frequência e presença
- [ ] Feedback e avaliação das mentorias
- [ ] Dashboard para coordenadoras
- [ ] Relatórios de participação e engajamento

### 💬 Comunicação
- [ ] Sistema de notificações
- [ ] Chat entre mentoras e alunas
- [ ] Calendário integrado de eventos
- [ ] Lembretes automáticos por email

### 📚 Conteúdo e Materiais
- [ ] Upload de materiais das mentorias
- [ ] Biblioteca de recursos de soft skills
- [ ] Certificados digitais de conclusão
- [ ] Links e referências por atividade

### 🤖 Inteligência
- [ ] Matching inteligente mentora-aluna
- [ ] Sugestões personalizadas
- [ ] Algoritmo baseado em interesses e experiência

### 📈 Analytics
- [ ] Métricas de sucesso das mentorias
- [ ] Acompanhamento de progresso individual
- [ ] Relatórios de impacto do programa
- [ ] KPIs do programa de mentoria

## Inspiração

Este roadmap foi inspirado em análise de sistemas similares como:
- College Management Systems
- Plataformas de mentoria corporativa
- Sistemas de gestão educacional

As funcionalidades propostas visam transformar o projeto em uma plataforma completa de mentoria, mantendo o foco nas soft skills e no empoderamento feminino na tecnologia.