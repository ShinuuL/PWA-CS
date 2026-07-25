# AGENTS

## Objetivo

Antes de iniciar qualquer implementação de código, garantir que toda a documentação essencial do projeto esteja criada e atualizada.

A documentação deve permitir que qualquer desenvolvedor compreenda rapidamente o funcionamento, a arquitetura e os objetivos do projeto.

---

# Fluxo Obrigatório

Antes de gerar ou modificar qualquer código:

1. Verificar se existe a pasta `/docs` na raiz do projeto.
2. Verificar se todos os documentos obrigatórios já existem.
3. Caso algum documento esteja ausente, criá-lo antes de iniciar qualquer implementação.
4. Após a documentação estar completa, prosseguir com o desenvolvimento.

---

# Documentos Obrigatórios

## README.md

Documento voltado para novos desenvolvedores e colaboradores.

Deve responder rapidamente:

* O que é o projeto.
* Objetivos.
* Tecnologias utilizadas.
* Como instalar.
* Como executar localmente.
* Estrutura básica do projeto.
* Como contribuir.
* Licença (quando aplicável).

---

## architecture.md

Descrever a arquitetura atual do projeto.

Incluir:

* Organização das pastas.
* Fluxo da aplicação.
* Principais módulos.
* Componentes.
* Padrões arquiteturais utilizados.
* Tecnologias empregadas.
* Decisões arquiteturais importantes.

---

## context.md

Documento com a visão geral do projeto.

Deve explicar:

* Problema que o projeto resolve.
* Objetivos do produto.
* Público-alvo.
* Funcionalidades principais.
* Fluxo de utilização.
* Regras de negócio.
* Evolução prevista.

Este documento deve ser elaborado com base na documentação existente e no entendimento do projeto, evitando suposições não fundamentadas.

---

## database.md

Documentação da camada de dados.

Incluir:

* Modelo de dados.
* Entidades.
* Relacionamentos.
* Estrutura das tabelas ou coleções.
* Índices relevantes.
* Estratégia de armazenamento.
* Migrações (quando aplicável).

---

## api.md *(quando houver API)*

Documentar todos os endpoints disponíveis.

Para cada endpoint informar:

* Método HTTP.
* URL.
* Descrição.
* Parâmetros.
* Corpo da requisição.
* Resposta.
* Códigos de erro.
* Autenticação necessária.

Caso o projeto ainda não possua API, este documento não deverá ser criado.

---

## testing.md

Descrever a estratégia de testes do projeto.

Incluir:

* Como executar os testes.
* Estrutura dos testes.
* Ferramentas utilizadas.
* Testes unitários.
* Testes de integração.
* Cobertura de testes (quando disponível).
* Boas práticas.

---

## deployment.md

Explicar o processo de publicação da aplicação.

Incluir:

* Pré-requisitos.
* Variáveis de ambiente (Não Usar as variáveis reais), incluir as reais em .env e adicionar ao .gitignore.
* Processo de build.
* Processo de deploy.
* Ambientes (desenvolvimento, homologação e produção).
* Checklist antes da publicação.

---

## security.md

Documentação das práticas de segurança.

Incluir:

* Autenticação.
* Autorização.
* Proteção de dados.
* Gerenciamento de credenciais.
* Variáveis de ambiente.
* Políticas de acesso.
* Boas práticas adotadas.
* Recomendações futuras.

---

# Regras

## 1. Prioridade

Nenhuma implementação de código deverá começar antes da criação dos documentos obrigatórios ausentes.

## 2. Atualização

Sempre que houver alterações significativas no projeto, atualizar a documentação correspondente.

## 3. Consistência

Todos os documentos devem seguir o mesmo padrão de organização, linguagem e formatação Markdown.

## 4. Objetividade

A documentação deve ser clara, direta e suficiente para permitir que um novo desenvolvedor compreenda o projeto rapidamente.

## 5. Base de Conhecimento

Sempre que possível, os documentos devem ser gerados a partir da estrutura do projeto, do código existente e da documentação já disponível, evitando informações fictícias ou inconsistentes.

## 6. Evolução Contínua

A documentação deve evoluir junto com o projeto, tornando-se a principal fonte de referência técnica e funcional para toda a equipe.
