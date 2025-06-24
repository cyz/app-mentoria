# API de Atividades da Mergington High School

Uma aplicação FastAPI super simples que permite aos estudantes visualizar e se inscrever em atividades extracurriculares.

## Funcionalidades

- Visualizar todas as atividades extracurriculares disponíveis
- Inscrever-se em atividades

## Como começar

1. Instale as dependências:

   ```
   pip install fastapi uvicorn
   ```

2. Execute a aplicação:

   ```
   python app.py
   ```

3. Abra seu navegador e acesse:
   - Documentação da API: http://localhost:8000/docs
   - Documentação alternativa: http://localhost:8000/redoc

## Endpoints da API

| Método | Endpoint                                                            | Descrição                                                           |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                       | Obtém todas as atividades com seus detalhes e número atual de participantes |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu`   | Inscreve um estudante em uma atividade                              |

## Modelo de Dados

A aplicação utiliza um modelo de dados simples com identificadores significativos:

1. **Atividades** - Utiliza o nome da atividade como identificador:

   - Descrição
   - Horário
   - Número máximo de participantes permitidos
   - Lista de e-mails dos estudantes inscritos

2. **Estudantes** - Utiliza o e-mail como identificador:
   - Nome
   - Série/ano escolar

Todos os dados são armazenados em memória, o que significa que serão resetados quando o servidor for reiniciado.
