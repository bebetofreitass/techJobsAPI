/* npm install -g json */
/* npm start */

// Ao carregar a página, chama a função que carrega as vagas automaticamente
window.onload = () => {
  carregarVagas();
}

// Função async que busca as vagas de emprego na API e chama a função que as exibe
async function carregarVagas() {  //try catch(tratar erros)
  try {
    const { data: vagas } = await axios.get('http://localhost:3000/jobs');
    mostrarVagas(vagas); // exibe as vagas na tela
  } catch (error) {
    mostrarErro('Erro ao carregar vagas!') // Exibe erro se a requisição falhar
  }
}

// Função que exibe as vagas no HTML, dentro da div com id 'job-list'
function mostrarVagas(vagas) { //pegar tag(id)
  const container = document.getElementById('job-list');
  container.innerHTML = vagas.map(vaga =>
    `
    <div class="col-md-4 mb-4">
      <div class="card border-info shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${vaga.title}</h5>"
          <p class="card-text"><strong>Empresa:</strong> ${vaga.company}</p>
          <p class="card-text">
            <span class="badge rounded-pill bg-info text-muted">
              ${vaga.location || 'Não informado'}
            </span>
          </p>
        </div>
      </div>
    </div>
    `
  ).join('');
}

// Busca os candidatos do backend e os exibe na tela
function carregarCandidatos() {
  axios.get('http://localhost:3000/users')
    .then(res => mostrarCandidatos(res.data)) // Passa os dados para a função que renderiza
    .catch(() => mostrarErro('Erro ao buscar candidatos')); // Exibe erro se falhar
}

// Gera os cards de candidatos e os insere na div com id 'candidates'
function mostrarCandidatos(candidatos) {
  const container = document.getElementById('candidates');
  container.innerHTML = candidatos.map(user =>
    `
    <div class="col-md-4 mb-3">
      <div class="card border-primary shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${user.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${user.email}</h6>
          <div class="mt-3">
            <button class="btn btn-sm btn-warning me-2" onclick="abrirModalUsuario('editar', '${user.id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="excluirUsuario('${user.id}')">Excluir</button>
          </div>
        </div>
      </div>
    </div>
    `
  ).join('');
}

// Função que abre o modal para cadastrar ou editar um candidato
function abrirModalUsuario(acao, id = null) {
  const titulo = acao == 'editar' ? 'Editar Candidato' : 'Novo Candidato';

  // Função interna que exibe o formulário do SweetAlert2
  // Função que exibe o modal de formulário para adicionar ou editar um candidato
  const exibirFormulario = (name = '', email = '') => {
    // Exibe o modal do SweetAlert2 com campos de nome e e-mail
    Swal.fire({
      title: titulo, // Usa o título definido dinamicamente ("Editar Candidato" ou "Novo Candidato")
      html: `
        <input id="swal-nome" class="swal2-input" placeholder="Nome" value="${name}">
        <input id="swal-email" class="swal2-input" placeholder="Email" value="${email}">
      `,
      confirmButtonText: 'Salvar', // Texto do botão de confirmação
      focusConfirm: false,
      // Função que valida os campos antes de permitir a confirmação
      preConfirm: () => {
        const name = document.getElementById('swal-nome').value.trim();
        const email = document.getElementById('swal-email').value.trim();

        // Se algum campo estiver vazio, mostra mensagem de validação
        if (!name || !email) {
          Swal.showValidationMessage('Preencha todos os campos');
          return false;
        }

        // Retorna os dados preenchidos para serem usados na requisição
        return { name, email };
      }
    }).then(result => {
      // Se o usuário não confirmou o modal, a função é encerrada
      if (!result.isConfirmed) return;

      // Define a URL e o método HTTP com base se está criando ou editando
      const url = id ? `http://localhost:3000/users/${id}` : `http://localhost:3000/users/`;
      const metodo = id ? axios.put : axios.post;

      // Envia os dados para o backend com o método apropriado
      metodo(url, result.value)
        .then(() => {
          // Mostra mensagem de sucesso após salvar os dados
          Swal.fire('Sucesso', `Candidato ${id ? 'atualizado' : 'cadastrado'}!`, 'success');
          carregarCandidatos(); // Atualiza a lista de candidatos na tela
        })
        .catch(() => {
          mostrarErro('Não foi possível salvar.'); // Exibe erro caso a requisição falhe
        });
    });
  }

  // Se estiver editando, busca os dados do usuário e exibe no formulário
  if (acao === 'editar' && id) {
    axios.get(`http://localhost:3000/users/${id}`)
      .then(res => exibirFormulario(res.data.name, res.data.email))
      .catch(() => mostrarErro('Usuário não encontrado!'));
  } else {
    exibirFormulario(); // Formulário em branco para novo usuário
  }
}

// Torna a função de criar novo usuário acessível globalmente (para botões, por exemplo)
window.createUser = () => abrirModalUsuario('novo');

// Controla se a lista de candidatos está visível ou não
let candidatosVisiveis = false;
function alternarCandidatos() {
  const container = document.getElementById('candidates');
  candidatosVisiveis = !candidatosVisiveis; // Alterna entre true/false
  container.style.display = candidatosVisiveis ? 'flex' : 'none';
  if (candidatosVisiveis) carregarCandidatos(); // Carrega os dados se for mostrar
}

// Deixa a função globalmente acessível (para ser chamada em botão de toggle)
window.toggleCandidates = alternarCandidatos;

// Função responsável por excluir um usuário, após confirmação do usuário
function excluirUsuario(id) {
  // Exibe um alerta de confirmação usando SweetAlert2
  Swal.fire({
    title: 'Tem certeza?', // Título do alerta
    text: 'Essa ação não poderá ser desfeita!', // Mensagem de aviso
    icon: 'warning', // Ícone de alerta
    showCancelButton: true, // Mostra botão de cancelar
    confirmButtonText: 'Sim, excluir', // Texto do botão de confirmação
    cancelButtonText: 'Cancelar' // Texto do botão de cancelar
  }).then(result => {
    // Se o usuário cancelar (não confirmar), sai da função
    if (!result.isConfirmed) return;

    // Se confirmado, envia requisição DELETE para remover o usuário da API
    axios.delete(`http://localhost:3000/users/${id}`)
      .then(() => {
        // Se der certo, exibe mensagem de sucesso
        Swal.fire('Excluído!', 'Candidato Removido.', 'success');
        carregarCandidatos(); // Recarrega a lista atualizada de candidatos
      })
      .catch(() => mostrarErro('Não foi possível excluir!')); // Em caso de erro, exibe mensagem
  });
}

// Exibe mensagem de erro padrão usando SweetAlert2
function mostrarErro(msg) {
  Swal.fire('Erro', msg, 'error');
}
