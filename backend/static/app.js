/**
 * APP.JS - FINALIZADO, COMENTADO E INTEGRADO (RBAC)
 * Central de Controle da KBROL Consultoria Jurídica
 */
console.log("--- VERSÃO DO SISTEMA: 2.0 (DEZEMBRO/2026) ---");
// 1. INICIALIZAÇÃO DO SUPABASE
const client = window.supabase.createClient(
    'https://ibsbtujgbjikqnfbnunw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic2J0dWpnYmppa3FuZmJudW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTU1MTQsImV4cCI6MjA5NTgzMTUxNH0.duxBXj1vANbAgEDel3uMevlRRFFzsGcEJI_jSyZ36JI'
);

let usuarioLogado = false;

/**
 * Valida a sessão atual do usuário no Supabase
 */
// Adicione um indicador de status no app.js
let appIniciado = false;

async function validarSessao() {
    const { data } = await client.auth.getSession();
    usuarioLogado = !!data.session;
    appIniciado = true; // Agora sabemos que a validação terminou
    atualizarNavbar();
    return usuarioLogado;
}

// 2. NAVEGAÇÃO ENTRE TELAS
/**
 * Alterna a visibilidade das seções da aplicação
 * @param {string} idTelaAlvo - ID do elemento HTML da seção
 */
function trocarTela(idTelaAlvo) {
    // Se a aplicação ainda não validou a sessão, espera 100ms e tenta de novo
    if (!appIniciado) {
        setTimeout(() => trocarTela(idTelaAlvo), 100);
        return;
    }

    if (idTelaAlvo === 'tela-dashboard' && !usuarioLogado) {
        // Só alerta e manda pro login se realmente já terminamos a validação e deu falso
        alert("⚠️ Acesso Restrito! Faça login.");
        idTelaAlvo = 'tela-login';
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const telaAlvo = document.getElementById(idTelaAlvo);
    if (telaAlvo) telaAlvo.classList.remove('hidden');

    // Executa carregamentos específicos ao entrar em telas
    if (idTelaAlvo === 'tela-dashboard') carregarDashboard();
    if (idTelaAlvo === 'tela-perfil') carregarPerfil();
    
    window.scrollTo(0, 0);
}

// 3. AUTENTICAÇÃO
/**
 * Processa login e armazena dados do usuário (incluindo Role)
 */
async function fazerLogin() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;

    try {
        const { data, error } = await client.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        
        usuarioLogado = true;
        localStorage.setItem('sb_token', data.session.access_token);
        
        // Busca dados do perfil + ROLE (para controle administrativo)
        const { data: perfil } = await client.from('perfis')
            .select('nome_empresa, role')
            .eq('id', data.user.id)
            .single();

        // Armazena role no localStorage para verificar permissões localmente
        localStorage.setItem('user_data', JSON.stringify({ 
            email, 
            nome: perfil?.nome_empresa, 
            role: perfil?.role 
        }));
        
        atualizarNavbar();
        trocarTela('tela-dashboard');
    } catch (e) { alert("Erro no login: " + e.message); }
}

/**
 * Logout universal: funciona tanto no index.html quanto no admin.html
 */
async function fazerLogout() {
    try {
        // 1. Desloga do Supabase
        await client.auth.signOut();
        
        // 2. Limpa os dados locais
        localStorage.removeItem('sb_token');
        localStorage.removeItem('user_data');
        usuarioLogado = false;
        
        // 3. Redirecionamento forçado para a raiz (/)
        // Isso força o carregamento do index.html, que já tem a lógica 
        // de validar sessão e mostrar o login se necessário.
        window.location.href = '/'; 
    } catch (e) {
        console.error("Erro ao deslogar:", e);
        // Mesmo com erro, força a saída para garantir segurança
        window.location.href = '/';
    }
}

async function fazerCadastro() {
    const statusDiv = document.getElementById('status-cadastro');
    
    // 1. Coleta de dados
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const nome = document.getElementById('reg-nome').value;
    const doc = document.getElementById('reg-doc').value;
    const tipo = document.getElementById('reg-tipo').value;

    if (!email || !senha || !nome) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    // 2. Feedback visual de carregando
    statusDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    statusDiv.textContent = "🔄 Criando sua conta...";
    statusDiv.style.color = "#60a5fa";

    try {
        // 3. Cadastro no Supabase Auth
        const { data, error } = await client.auth.signUp({ email, password: senha });
        if (error) throw error;

        // 4. Criação do perfil na tabela 'perfis'
        await client.from('perfis').insert([
            { 
                id: data.user.id,
                nome_empresa: nome,
                tipo_documento: tipo,
                documento: doc,
                role: 'user' 
            }
        ]);

        statusDiv.textContent = "✅ Sucesso! Agora você pode fazer login.";
        statusDiv.style.color = "#4ade80"; // Verde
    } catch (e) {
        statusDiv.textContent = "❌ Erro: " + e.message;
        statusDiv.style.color = "#f87171"; // Vermelho
    }
}

// 4. PIPELINE DE AUDITORIA
/**
 * Coleta os arquivos e parâmetros do form e envia para o backend
 */
async function processarAuditoria() {
    // 1. Verificações de segurança iniciais
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return alert("Selecione um arquivo PDF ou DOCX!");
    }

    // 2. Recuperar a sessão do Supabase (O Token necessário para o Backend)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
    }

    // Elementos da interface
    const btn = document.getElementById('btn-auditar-trigger');
    const statusDiv = document.getElementById('status-processamento');

    if (btn) btn.disabled = true;
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.innerHTML = "🔄 Iniciando auditoria societária...";
        statusDiv.style.color = "#60a5fa"; 
    }

    try {
        const formData = new FormData();
        formData.append("arquivo", fileInput.files[0]);
        formData.append("prazo_convocacao_assembleia_dias", document.getElementById('prazo_convocacao')?.value || 0);
        formData.append("percentual_dividendo_obrigatorio", document.getElementById('dividendo_minimo')?.value || 0);
        formData.append("conselho_fiscal_permanente", document.getElementById('conselho_fiscal')?.checked || false);
        formData.append("aprovacao_unanimidade", document.getElementById('aprovacao_unanimidade')?.checked || false);

        // 3. Executar o Fetch com autenticação
        const response = await fetch('/auditoria-inteligente/arquivo/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}` // <--- A CHAVE DO PROBLEMA
            },
            body: formData
        });

        // 4. Tratamento de erro do servidor
        if (!response.ok) {
            const erroTexto = await response.text(); 
            throw new Error(erroTexto || "Falha na comunicação com o servidor.");
        }

        // 5. Sucesso
        const data = await response.json();
        console.log("Sucesso:", data);
        
        if (statusDiv) {
            statusDiv.innerHTML = `✅ Auditoria concluída!`;
            statusDiv.style.color = "#4ade80"; 
        }

        // Renderiza o resultado aqui, onde o 'data' está definido
        renderizarResultado(data);

    } catch (error) {
        console.error("Erro no processamento:", error);
        if (statusDiv) {
            statusDiv.innerHTML = "❌ Erro: " + error.message;
            statusDiv.style.color = "#f87171";
        } else {
            alert("Erro: " + error.message);
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}

/**
 * Exibe o resultado da auditoria na tela
 */
function renderizarResultado(data) {
    const container = document.getElementById('resultado-auditoria');
    container.classList.remove('hidden');
    
    const btnDownload = data.auditoria_id ? 
        `<button onclick="baixarPdf('${data.auditoria_id}')" class="bg-[#991b1b] text-white px-6 py-2 rounded-lg mt-4 w-full hover:bg-[#7f1d1d]">⬇️ Baixar Laudo PDF</button>` : '';

    container.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-2">Parecer Técnico:</h3>
        <div class="text-gray-300 whitespace-pre-wrap">${JSON.stringify(data.parecer, null, 2)}</div>
        ${btnDownload}
    `;
}

// 5. DOWNLOAD DE PDF
async function baixarPdf(auditoriaId) {
    try {
        const response = await fetch(`/auditoria/download-pdf/${auditoriaId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        
        if (!response.ok) throw new Error("Erro ao gerar PDF");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laudo_kbrol_${auditoriaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        alert("Erro ao baixar o PDF: " + error.message);
    }
}

// 6. UTILS E SUPORTE
function exibirNomeArquivo(input) {
    const nomeDisplay = document.getElementById('nome-arquivo-selecionado');
    if (input.files.length > 0) {
        nomeDisplay.textContent = "Arquivo selecionado: " + input.files[0].name;
        nomeDisplay.classList.remove('hidden');
    }
}

function abrirModalSuporte() { document.getElementById('modal-suporte').classList.remove('hidden'); }
function fecharModalSuporte() { document.getElementById('modal-suporte').classList.add('hidden'); }

async function enviarTicket() {
    const assunto = document.getElementById('ticket-assunto').value;
    const mensagem = document.getElementById('ticket-mensagem').value;

    const response = await fetch("/tickets/criar/", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('sb_token') 
        },
        body: JSON.stringify({ assunto, texto: mensagem })
    });

    if (response.ok) {
        alert("Ticket enviado com sucesso!");
        fecharModalSuporte();
    }
}

// 7. PERFIL E NAVBAR DINÂMICA
/**
 * Atualiza o menu superior baseado na sessão e na role do usuário
 */
function atualizarNavbar() {
    const session = localStorage.getItem('sb_token');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (session) {
        authButtons?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const span = document.getElementById('user-email');
        if (span) span.textContent = userData.nome || userData.email || 'Usuário';

        // Verifica se é admin para mostrar link especial
        if (userData.role === 'admin' && userMenu) { // <-- AQUI A PROTEÇÃO
            if (!document.getElementById('link-admin')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'link-admin';
                adminLink.href = 'admin.html';
                adminLink.className = 'text-red-500 font-bold mr-4 hover:underline';
                adminLink.textContent = 'Painel Admin';
                
                // Só executa o prepend se o userMenu existir
                userMenu.prepend(adminLink);
            }
        }
    } else {
        authButtons?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
    }
}

/**
 * Carrega histórico e atalho de admin se aplicável
 */
async function carregarDashboard() {
    const container = document.getElementById('lista-auditorias');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Atalho exclusivo para Admin
    const adminShortcut = document.getElementById('admin-shortcut');
    if (userData.role === 'admin' && adminShortcut) {
        adminShortcut.classList.remove('hidden');
    }

    if (!container) return;
    
    try {
        const response = await fetch('/auditorias/listar', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        const data = await response.json();
        
        container.innerHTML = data.auditorias.map(aud => `
            <div style="background-color: #111827 !important; border: 1px solid #1f2937 !important; color: white !important;" class="p-6 rounded-2xl flex justify-between items-center mb-4 transition-colors">
                <div>
                    <h3 class="font-bold">${aud.nome_arquivo || "Minuta Processada"}</h3>
                    <p style="color: #9ca3af !important;" class="text-sm">Data: ${new Date(aud.created_at).toLocaleDateString()}</p>
                </div>
                <button onclick="baixarPdf('${aud.id}')" style="background-color: #1f2937 !important; color: white !important;" class="px-4 py-2 rounded hover:bg-[#991b1b] transition-colors">
                    📥 PDF
                </button>
            </div>`).join('');
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro ao carregar histórico.</p>'; }
}

async function carregarPerfil() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: perfil } = await client.from('perfis').select('*').eq('id', user.id).single();
    if (perfil) {
        document.getElementById('perfil-nome').value = perfil.nome_empresa || '';
        document.getElementById('perfil-telefone').value = perfil.telefone_whatsapp || '';
        document.getElementById('perfil-cnpj').value = perfil.cnpj || '';
        document.getElementById('perfil-uf').value = perfil.uf_sede || '';
        document.getElementById('perfil-capital').value = perfil.capital_social_atual || '';
    }
    carregarMeusTickets();
}

document.getElementById('form-perfil')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    await client.from('perfis').update({
        nome_empresa: document.getElementById('perfil-nome').value,
        telefone_whatsapp: document.getElementById('perfil-telefone').value,
        cnpj: document.getElementById('perfil-cnpj').value,
        uf_sede: document.getElementById('perfil-uf').value,
        capital_social_atual: document.getElementById('perfil-capital').value
    }).eq('id', user.id);
    alert("Dados salvos!");
});

// 6. UTILS E SUPORTE
function abrirModalSuporte() {
    console.log("Clique detectado! Tentando abrir o modal..."); // <<-- ESTE LOG É O TESTE
    const modal = document.getElementById('modal-suporte');
    if (modal) {
        modal.classList.remove('hidden');
        console.log("Modal encontrado e classe 'hidden' removida.");
    } else {
        console.error("ERRO: Elemento 'modal-suporte' não encontrado no HTML!");
    }
}

function fecharModalSuporte() {
    document.getElementById('modal-suporte').classList.add('hidden');
}

//7. Função que busca e renderiza os tickets
async function carregarMeusTickets() {
    const container = document.getElementById('container-tickets-usuario');
    
    try {
        const response = await fetch('/tickets/me', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        const data = await response.json();
        
        if (data.tickets.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Você ainda não enviou nenhum ticket.</p>';
            return;
        }

        container.innerHTML = data.tickets.map(t => `
            <div class="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-white">${t.assunto}</span>
                    <span class="text-xs px-2 py-1 rounded ${t.status === 'aberto' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}">
                        ${t.status.toUpperCase()}
                    </span>
                </div>
                <p class="text-sm text-gray-400 mb-2">${t.texto}</p>
                ${t.resposta ? `<div class="bg-gray-800 p-2 rounded text-xs text-blue-300 mt-2">Resp: ${t.resposta}</div>` : ''}
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-red-500">Erro ao carregar tickets.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');
    const statusDiv = document.getElementById('status-cadastro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            // Pega os dados
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-senha').value;

            // Mostra status de carregando
            statusDiv.classList.remove('hidden');
            statusDiv.innerText = "Processando...";
            statusDiv.className = "text-center mt-4 font-bold p-2 text-gray-400";

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // SUCESSO: Mostra a mensagem do backend em verde
                    statusDiv.innerText = data.message;
                    statusDiv.className = "text-green-500 text-center mt-4 font-bold p-2";
                } else {
                    // ERRO: Mostra o erro do backend em vermelho
                    statusDiv.innerText = "Erro: " + (data.detail || "Falha ao cadastrar");
                    statusDiv.className = "text-red-500 text-center mt-4 font-bold p-2";
                }
            } catch (error) {
                statusDiv.innerText = "Erro de conexão com o servidor.";
                statusDiv.className = "text-red-500 text-center mt-4 font-bold p-2";
            }
        });
    }
});