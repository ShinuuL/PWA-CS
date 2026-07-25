# Diretrizes de Desenvolvimento PWA (Progressive Web App)

## Objetivo

Este documento define os padrões e diretrizes para o desenvolvimento de aplicações PWA, garantindo consistência na arquitetura, qualidade do código e alinhamento entre desenvolvimento, documentação e implantação.

---

# Tecnologias

## Frontend

* React
* JavaScript

## Backend

* Python
* FastAPI
* Uvicorn

## Desenvolvimento Multiplataforma

* Flutter

---

# Frameworks e Bibliotecas

Utilizar preferencialmente os seguintes frameworks e bibliotecas:

* React
* Motion for React
* FastAPI
* Uvicorn
* Flutter 

Antes de utilizar qualquer biblioteca adicional, verificar:

* Compatibilidade com a stack atual.
* Compatibilidade entre versões.
* Impacto na manutenção do projeto.

Caso exista dúvida ou necessidade de utilizar outra tecnologia, consultar o Dev responsável.

---

# Documentação Oficial

Sempre consultar a documentação oficial antes de implementar qualquer funcionalidade.

* Motion for React

  * https://motion.dev/docs/react

* Flutter

  * https://docs.flutter.dev

* FastAPI

  * https://fastapi.tiangolo.com/learn/

* Uvicorn

  * https://www.uvicorn.org/

A implementação deve seguir as recomendações oficiais sempre que possível.

---

# Estrutura do Projeto

Organizar o projeto utilizando a seguinte estrutura:

```CoupleSpace
/
├── FRONTEND/
├── BACKEND/
├── docs/
	├── Features.md
├── docker/
├── README.md
└── openspecs/
```

Cada módulo deve possuir sua própria organização interna, respeitando boas práticas da linguagem utilizada.

---

# Processo de Desenvolvimento

Antes de iniciar qualquer implementação:

1. Executar o processo `.openspecs`.
2. Executar o Graphify.
3. Ler toda a documentação disponível na raiz do projeto.
4. Analisar o arquivo `Features.md`.
5. Compreender completamente a funcionalidade solicitada.
6. Em caso de dúvidas, consultar o Dev antes de iniciar o desenvolvimento.

---

# Implementação

Antes de escrever qualquer linha de código, principalmente relacionada à interface:

* Explicar ao Dev o que será desenvolvido.
* Confirmar o entendimento da funcionalidade.
* Validar a abordagem técnica.
* Somente iniciar a implementação após aprovação.

---

# Arquitetura

Durante o desenvolvimento:

* Separar claramente Frontend e Backend.
* Criar componentes reutilizáveis.
* Utilizar arquitetura modular.
* Evitar duplicação de código.
* Manter baixo acoplamento entre módulos.
* Priorizar legibilidade e manutenção.

---

# Tratamento de Erros

Todo módulo deverá possuir:

* Tratamento de exceções.
* Fallbacks para falhas.
* Mensagens de erro claras.
* Logs para facilitar depuração.
* Validações de entrada.

O objetivo é facilitar manutenção e correção de bugs.

---

# Docker

Criar ambiente Docker para desenvolvimento e testes do Backend.

Sempre incluir:

* Dockerfile
* docker-compose.yml (quando necessário)

O ambiente deve permitir execução completa do sistema localmente.

---

# Dependências

As dependências necessárias ao projeto poderão ser instaladas automaticamente.

Caso alguma dependência exija aprovação ou apresente impacto significativo na arquitetura, consultar previamente o Dev responsável.

---

# MCPs

Sempre que disponíveis, utilizar os seguintes MCPs:

* Supabase MCP
* GitHub MCP
* Vercel MCP

---

# Boas Práticas

* Escrever código limpo e legível.
* Utilizar nomes descritivos.
* Documentar funções complexas.
* Evitar código duplicado.
* Manter padrão de formatação.
* Priorizar performance e segurança.
* Seguir os princípios SOLID quando aplicáveis.
* Aplicar Clean Architecture quando o projeto justificar.
* Manter componentes reutilizáveis.
* Implementar tipagem sempre que possível.
* Criar código escalável e de fácil manutenção.

---

# Fluxo de Trabalho

1. Ler toda a documentação.
2. Analisar as Features.
3. Confirmar entendimento com o Dev.
4. Definir arquitetura.
5. Implementar.
6. Criar tratamento de erros.
7. Testar.
8. Validar com o Dev.
9. Documentar alterações.
10. Preparar para deploy.

---

# Regra Geral

Em caso de qualquer dúvida sobre requisitos, arquitetura, implementação ou comportamento esperado, interromper a implementação e consultar o Dev responsável antes de prosseguir.
