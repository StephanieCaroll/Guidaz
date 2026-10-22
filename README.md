# 🚗 Guidaz (Front-end Mobile App)

![GitHub repo size](https://img.shields.io/github/repo-size/StephanieCaroll/Guidaz-stephanie?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/StephanieCaroll/Guidaz-stephanie?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/StephanieCaroll/Guidaz-stephanie?style=for-the-badge)
![GitHub pull requests](https://img.shields.io/github/issues-pr/StephanieCaroll/Guidaz-stephanie?style=for-the-badge)
![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)

> **A Plataforma Guidaz** é um aplicativo mobile focado na centralização da gestão de instrutores autônomos de direção. O projeto foi desenvolvido com uma arquitetura moderna baseada em **Angular** e **Ionic**, com foco em usabilidade mobile-first, funcionando integrado ao back-end em **Spring Boot**.

---

## 📂 Repositórios do Projeto

O sistema da Guidaz é dividido em duas partes que funcionam em conjunto:

* 📱 **Front-end (Mobile App):** [Repositório Front-end (Guidaz-stephanie)](https://github.com/StephanieCaroll/Guidaz-stephanie)
* ⚙️ **Back-end (API REST Spring Boot):** [Repositório Back-end (guidaz-backend)](https://github.com/StephanieCaroll/guidaz-backend)

---

## ✨ Sobre o Projeto

O projeto resolve o problema de fragmentação na rotina dos instrutores, que utilizam várias ferramentas desconectadas (planilhas, WhatsApp, anotações). A Guidaz integra toda a jornada (contratação → agendamento → aula → registro → avaliação) em um único hub de gestão.

### Principais Tecnologias
- **Frameworks**: Angular e Ionic.
- **Arquitetura**: Componentização segmentada por perfis (Instrutor e Aluno).
- **Estilização**: SCSS global e customizado por componente para garantir o design ergonômico.

---

### 🚀 Funcionalidades do MVP
- ✅ **Gestão de Agenda**: Definição e bloqueio de horários disponíveis pelo instrutor.
- ✅ **Agendamento Autônomo**: Alunos podem visualizar horários livres e reservar aulas diretamente.
- ✅ **Controle Financeiro**: Contratação de pacotes e gestão de pagamento via Pix com validação manual.
- ✅ **Transparência Contábil**: Controle visual e detalhado do saldo de aulas (contratadas, realizadas e pendentes).
- ✅ **Feedback**: Sistema de avaliação pós-aula (1 a 5 estrelas) com métricas de didática e pontualidade.

---

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:
- Você instalou a versão mais recente de `Node.js` (v22.22.3 ou superior) e `npm`.
- Você possui o `Ionic CLI` instalado globalmente (`npm install -g @ionic/cli`).
- Você tem um editor de código (recomendado: `VS Code`).
- O **Back-end** (`guidaz-backend`) em execução na porta `8080`.

---

## 🚀 Instalando e Rodando o Projeto

Para instalar e rodar o projeto front-end, siga estas etapas:

```bash
# Clone o repositório
git clone https://github.com/StephanieCaroll/Guidaz-stephanie

# Entre no diretório
cd Guidaz-stephanie

# Instale as dependências
npm install
```

## ☕ Usando a Guidaz
Para iniciar o aplicativo no navegador (ambiente de desenvolvimento simulando mobile), execute:
```bash
ionic serve
```
Acesse `http://localhost:8100` no seu navegador.

---

## 🔌 Documentação da API & Exemplos para o Postman

Como o front-end depende do back-end para persistência e regras de negócio, certifique-se de que a API está rodando (`http://localhost:8080/api`). Abaixo estão os principais endpoints para testes no **Postman**:

### 👨‍🎓 Alunos (`/api/alunos`)
- **Cadastrar Aluno**
  - `POST` `http://localhost:8080/api/alunos/cadastrar`
  - *Exemplo de Body (JSON):*
    ```json
    {
      "nome": "João da Silva",
      "email": "joao@email.com",
      "senha": "senha123",
      "telefone": "11988887777"
    }
    ```
- **Listar Todos os Alunos**
  - `GET` `http://localhost:8080/api/alunos`
- **Atualizar Aluno**
  - `PUT` `http://localhost:8080/api/alunos/{id}`
- **Deletar Aluno**
  - `DELETE` `http://localhost:8080/api/alunos/{id}`

### 🚗 Instrutores (`/api/instrutores`)
- **Cadastrar Instrutor**
  - `POST` `http://localhost:8080/api/instrutores/cadastrar`
  - *Exemplo de Body (JSON):*
    ```json
    {
      "nome": "Carlos Direção",
      "email": "carlos.instrutor@email.com",
      "senha": "senha456",
      "cnh": "12345678900"
    }
    ```
- **Listar Todos os Instrutores**
  - `GET` `http://localhost:8080/api/instrutores`
- **Atualizar Instrutor**
  - `PUT` `http://localhost:8080/api/instrutores/{id}`
- **Deletar Instrutor**
  - `DELETE` `http://localhost:8080/api/instrutores/{id}`

---

## 👥 Equipe e Divisão de Tarefas

Abaixo estão os membros responsáveis pelo desenvolvimento do MVP e suas respectivas áreas de atuação na plataforma:

| Desenvolvedor(a) | Responsabilidade Principal no Código (MVP) |
| :--- | :--- |
| **Stephanie Caroline** | **UX/UI & Autenticação:** Implementação do Design System do Figma, componentização global, rotas iniciais e telas de Login/Cadastro (`pages/auth`). |
| **Ariely Lopes** | **Disponibilidade:** Lógica da tela de `agenda-disponibilidade` do Instrutor, permitindo bloquear horários e gerar os *slots* livres. |
| **Lucas Gabriel** | **Gestão de Alunos:** Estruturação da tela de `gestao-alunos` do Instrutor, incluindo vinculação de pacotes e listagem da base de estudantes. |
| **Anthony Gabriel** | **Agendamento Aluno:** Lógica da tela `agendamento-aulas`, permitindo ao aluno buscar *slots* livres e realizar reservas na agenda do instrutor. |
| **Carlos Gabriel** | **Checkout & Pix:** Lógica das telas `pacotes` e `pagamento-pix`, implementando fluxo de upload/conferência de comprovante Pix. |
| **Gabriel Pacheco** | **Saldo e Histórico:** Lógica das telas `saldo-aulas` e `historico-avaliacoes`, calculando horas contratadas vs. pendentes e sistema de 1 a 5 estrelas. |

---

## 👥 Colaboradores
Agradecemos às seguintes pessoas que contribuíram para este projeto:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/anthonygg081" title="ANTHONY GABRIEL RODRIGUES DA SILVA">
        <img src="https://github.com/anthonygg081.png" width="100px;" alt="Foto do Anthony"/><br>
        <sub><b>Anthony Gabriel Rodrigues da Silva</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/arielyllopes" title="ARIELY LOPES BARBOSA">
        <img src="https://github.com/arielyllopes.png" width="100px;" alt="Foto da Ariely"/><br>
        <sub><b>Ariely Lopes Barbosa</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/carlos-gds" title="CARLOS GABRIEL DAMASCENA DA SILVA">
        <img src="https://github.com/carlos-gds.png" width="100px;" alt="Foto do Carlos"/><br>
        <sub><b>Carlos Gabriel Damascena da Silva</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/gabrielJv-p" title="GABRIEL PACHECO FRANÇA FERREIRA">
        <img src="https://github.com/gabrielJv-p.png" width="100px;" alt="Foto do gabriel"/><br>
        <sub><b>Gabriel Pacheco França Ferreira</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/lucasand-dev1" title="Lucas Gabriel Santos">
        <img src="https://github.com/lucasand-dev1.png" width="100px;" alt="Foto do Lucas"/><br>
        <sub><b>Lucas Gabriel Santos de Andrade</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/StephanieCaroll" title="Stephanie Caroline">
        <img src="https://github.com/StephanieCaroll.png" width="100px;" alt="Foto da Stephanie"/><br>
        <sub><b>Stephanie Caroline</b></sub>
      </a>
    </td>
  </tr>
</table>

---

## 📫 Contribuindo para a Guidaz

Para contribuir com o projeto, siga estas etapas:

1. Bifurque este repositório.
2. Crie um branch:  
   ```bash
   git checkout -b minha-feature
   ```
3. Faça suas alterações e confirme-as:  
   ```bash
   git commit -m 'feat: nova funcionalidade'
   ```
4. Envie para o branch original:  
   ```bash
   git push origin minha-feature
   ```
5. Crie a solicitação de pull.

---

## 🤝 Contribuições

Sinta-se à vontade para contribuir com este projeto!

💡 Sugira novas funcionalidades e melhorias.  
🐛 Relate bugs ou problemas encontrados.  
📚 Compartilhe recursos ou ideias para o design.
