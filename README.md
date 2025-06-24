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