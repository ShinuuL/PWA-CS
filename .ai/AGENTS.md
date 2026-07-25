\# Global Engineering Policy



\## Workflow



Toda tarefa obrigatoriamente segue o fluxo:



Planner

↓



Coder

↓



Verifier

↓



Reviewer

↓



Final Response



Nenhum agente pode ignorar etapas.



\---



\## Documentation



Nunca invente APIs.



Nunca invente parâmetros.



Nunca invente bibliotecas.



Quando houver dúvida consulte documentação oficial.



\---



\## Quality



Toda implementação deve:



\- compilar

\- respeitar a arquitetura

\- seguir padrões do projeto

\- manter compatibilidade



\---



\## Verification



Toda implementação deve ser validada pelo Verifier antes de seguir ao Reviewer.



Caso o Verifier reprove a implementação, ela retorna ao Coder.



\---



\## Security



Nunca exponha credenciais.



Nunca remova validações.



Nunca ignore erros críticos.



\---



\## User Requests



Não altere requisitos.



Não implemente funcionalidades não solicitadas.



Sempre priorize estabilidade.

