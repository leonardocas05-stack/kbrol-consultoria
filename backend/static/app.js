/**
 * APP.JS - O KERNEL DO SISTEMA
 */

// 1. CONFIGURAÇÃO GLOBAL
const KBROL = {
    config: {
        supabaseUrl: 'https://ibsbtujgbjikqnfbnunw.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic2J0dWpnYmppa3FuZmJudW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTU1MTQsImV4cCI6MjA5NTgzMTUxNH0.duxBXj1vANbAgEDel3uMevlRRFFzsGcEJI_jSyZ36JI'
    },
    state: { usuarioLogado: false, appIniciado: false }
};

// Inicialização segura
(function initApp() {
    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(KBROL.config.supabaseUrl, KBROL.config.supabaseKey);
        console.log("Supabase Cliente Iniciado com Sucesso.");
    } else {
        console.error("Biblioteca Supabase não encontrada! Tentando novamente...");
        setTimeout(initApp, 500);
        return;
    }
})();

// 2. AUTENTICAÇÃO
const Auth = {
    async validarSessao() {
        if (!window.supabaseClient) return false;
        const { data } = await window.supabaseClient.auth.getSession();
        KBROL.state.usuarioLogado = !!data.session;
        KBROL.state.appIniciado = true;
        if (typeof UI !== 'undefined') UI.atualizarNavbar();
        return KBROL.state.usuarioLogado;
    },
    async fazerLogin(email, senha) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password: senha });
            if (error) throw error;

            localStorage.setItem('sb_token', data.session.access_token);
            
            // Busca o perfil para garantir o nome da empresa
            const { data: perfil } = await window.supabaseClient
                .from('perfis')
                .select('nome_empresa, role')
                .eq('id', data.user.id)
                .single();
            
            const nomeEmpresa = perfil?.nome_empresa || 'Usuário';
            const userRole = perfil?.role || 'user';    
            localStorage.setItem('user_data', JSON.stringify({ 
                email, 
                nome: nomeEmpresa, 
                role: userRole 
            }));

            // FORÇA O ESTADO COMO LOGADO ANTES DE TROCAR A TELA
            KBROL.state.usuarioLogado = true; 
            
            UI.atualizarNavbar();
            UI.trocarTela('tela-dashboard');
        } catch (e) { alert("Erro de Login: " + e.message); }
    },
    async fazerLogout() {
        console.log("Executando Logout...");
        try {
            // 1. Lógica de Autenticação (Sempre no Auth)
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
            }
        } catch (e) {
            console.error("Erro no signOut do Supabase:", e);
        } finally {
            // 2. Limpeza de Dados (Sempre no Auth)
            localStorage.clear();
            
            // 3. Redirecionamento (Side-effect necessário)
            window.location.href = '/'; 
        }
    }
};

// 3. UI GLOBAL - Central de Interface
const UI = {
    // Alterna entre as seções (telas) da aplicação
    trocarTela(idTelaAlvo) {
        // Proteção: Se tentar ir para dashboard sem login, força o login
        if (idTelaAlvo === 'tela-dashboard' && !KBROL.state.usuarioLogado) {
            idTelaAlvo = 'tela-login';
        }
        
        // Esconde todas as seções
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        
        // Mostra a tela alvo
        const tela = document.getElementById(idTelaAlvo);
        if (tela) {
            tela.classList.remove('hidden');
        }
        window.scrollTo(0, 0);
    },

    // Atualiza o menu superior conforme o estado de login
    atualizarNavbar() {
        const session = localStorage.getItem('sb_token');
        const authBtns = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        if (session) {
            authBtns?.classList.add('hidden');
            userMenu?.classList.remove('hidden');
            
            // Tenta pegar o nome do usuário salvo
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            const emailSpan = document.getElementById('user-email');
            if (emailSpan) {
                emailSpan.textContent = userData.nome || 'Usuário';
            }
        } else {
            authBtns?.classList.remove('hidden');
            userMenu?.classList.add('hidden');
        }
    },

    // Verifica se mostra o botão do Admin
    verificarAdminInterface() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const adminShortcut = document.getElementById('admin-shortcut');
    
    console.log("DEBUG: Verificando role...", userData.role); // Isso vai nos dizer o que ele está lendo

    if (adminShortcut) {
        if (userData.role === 'admin') {
            adminShortcut.classList.remove('hidden');
        } else {
            adminShortcut.classList.add('hidden');
        }
    }
    },

    // Feedback visual para o usuário
    exibirStatus(id, msg, cor) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = msg;
            el.style.color = cor;
            el.classList.remove('hidden');
        }
    },

    // Exibe o nome do arquivo para o usuário confirmar
    exibirNomeArquivo(input) {
        const fileName = input.files[0]?.name;
        const display = document.getElementById('nome-arquivo-selecionado');
        
        if (display) {
            if (fileName) {
                display.textContent = `Arquivo selecionado: ${fileName}`;
                display.classList.remove('hidden');
            } else {
                display.classList.add('hidden');
            }
        }
    },

renderizarResultado(data) {
    const container = document.getElementById('resultado-auditoria');
    
    // 1. TRATAMENTO DE ESTADO DE PROCESSAMENTO
    if (data.status === 'processando') {
        UI.exibirStatus('status-processamento', "⏳ " + data.mensagem, "#fbbf24"); // Cor amarela
        return; // Interrompe a execução aqui para não dar erro de .map()
    }

    // 2. CASO TENHA DADOS (Resultado final)
    if (!container) {
        console.error("Elemento #resultado-auditoria não encontrado!");
        return;
    }

    // Blindagem defensiva: usa || [] para evitar o erro de 'undefined'
    const leiSeca = data.auditoria_lei_seca || [];
    const correcoes = data.correcoes_geradas || [];

    container.innerHTML = `
        <div class="laudo-container mt-8">
            <h2 class="text-3xl font-black text-white mb-6">Resultado da Auditoria</h2>
            
            <div class="mb-6 p-4 rounded bg-gray-800">
                <p class="font-bold text-gray-300">Nível de Risco: ${data.risco_judicializacao?.nivel_risco_litigio || 'Não analisado'}</p>
            </div>

            <div class="mb-6">
                <h3 class="font-bold text-white mb-2">Parecer Legal:</h3>
                <ul class="list-disc pl-5 text-gray-400">
                    ${leiSeca.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>

            <div class="mb-6">
                <h3 class="font-bold text-white mb-2">Correções Sugeridas:</h3>
                ${correcoes.map(c => {
                    let conteudoFormatado = "";
                    try {
                        // Tenta converter o JSON que vem da IA em objeto
                        const solucaoObj = JSON.parse(c.solucao_para_copiar);
                        
                        // Formata cada campo, removendo underline e capitalizando
                        conteudoFormatado = Object.entries(solucaoObj).map(([key, value]) => {
                            const titulo = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
                            return `
                                <div class="mb-4">
                                    <p class="font-bold text-red-400 text-xs uppercase mb-1 border-b border-gray-700 inline-block">${titulo}</p>
                                    <p class="text-gray-300 text-sm leading-relaxed">${value}</p>
                                </div>
                            `;
                        }).join('');
                    } catch (e) {
                        conteudoFormatado = `<p class="text-white">${c.solucao_para_copiar}</p>`;
                    }

                    return `
                        <div class="bg-gray-800 p-6 rounded-lg mb-4 border border-gray-700 shadow-xl">
                            <p class="text-sm font-bold text-white mb-4 italic">Veto detectado: ${c.problema}</p>
                            ${conteudoFormatado}
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="mt-8">
                <h3 class="font-bold text-white mb-2">Contrato Reescrito:</h3>
                <div class="bg-white text-black p-6 rounded-lg text-sm whitespace-pre-wrap">
                    ${data.contrato_reescrito || 'Nenhum contrato reescrito gerado.'}
                </div>
            </div>
        </div>
    `;
    
    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth' });
    },

};

// 4. PONTE (Sempre no final)
window.Auth = Auth;
window.UI = UI;
window.fazerLogin = Auth.fazerLogin;
window.fazerLogout = Auth.fazerLogout;
window.trocarTela = UI.trocarTela;
window.exibirNomeArquivo = UI.exibirNomeArquivo;
