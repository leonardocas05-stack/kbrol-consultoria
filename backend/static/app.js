/**
 * APP.JS - O KERNEL DO SISTEMA
 */

// 1. CONFIGURAÇÃO GLOBAL
console.log("APP.JS está carregando...");
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

    async fazerCadastro(email, senha, nomeEmpresa) {
        try {
            if (!window.supabaseClient) return alert("Erro: Supabase não inicializado.");

            // 1. Cria o usuário na tabela nativa de autenticação do Supabase
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: senha,
                options: {
                    // Passa o nome da empresa nos metadados para triggers automatizados, se houver
                    data: { nome_empresa: nomeEmpresa }
                }
            });

            if (error) throw error;

            if (data.user) {
                // 2. Cria o registro complementar na sua tabela customizada 'perfis'
                const { error: perfilError } = await window.supabaseClient
                    .from('perfis')
                    .insert([
                        { 
                            id: data.user.id, 
                            email_usuario: email, 
                            nome_empresa: nomeEmpresa, 
                            role: 'user' 
                        }
                    ]);

                if (perfilError) throw perfilError;

                alert("Conta criada com sucesso! Você já pode fazer login.");
                UI.trocarTela('tela-login');
            }
        } catch (e) { 
            alert("Erro ao Criar Conta: " + e.message); 
        }
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
    },

    async carregarContadoresMetricas() {
        try {
            const response = await fetch('/publico/metricas-plataforma');
            const data = await response.json();
                
            // Injeta os valores diretamente nos elementos correspondentes do DOM
            if (document.getElementById('metrica-uploads')) {
                document.getElementById('metrica-uploads').innerText = data.uploads;
                document.getElementById('metrica-auditorias').innerText = data.auditorias;
                document.getElementById('metrica-validados').innerText = data.validados;
                    ocument.getElementById('metrica-downloads').innerText = data.downloads;
            }
        } catch (e) {
             console.error("Erro ao processar (method) carregarContadoresMetricas:", e);
         }
    }
};
// Ponte com o resto do código
window.Auth = Auth;
window.fazerLogin = Auth.fazerLogin;
window.fazerCadastro = Auth.fazerCadastro;
window.fazerLogout = Auth.fazerLogout;


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

            if (idTelaAlvo === 'tela-perfil') {
                console.log("DEBUG: Iniciando carregamento do perfil...");
                if (typeof Client !== 'undefined') {
                    Client.carregarPerfil(); 
                }
            }
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
        
        console.log("DEBUG: Verificando role...", userData.role); 

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
        const statusProcessamento = document.getElementById('status-processamento');
            
        // 1. Bloqueio de Polling (Enquanto o backend processa o arquivo na IA)
        if (data.status === 'processando') {
            UI.exibirStatus('status-processamento', "⏳ " + (data.mensagem || "Processando e gerando rascunho societário..."), "#fbbf24");
            return;
        }

        if (!container) return;
        if (statusProcessamento) statusProcessamento.classList.add('hidden'); // Esconde o carregando

        // 2. INJEÇÃO DO TEXTO DO ESTATUTO NO VISUALIZADOR
        const corpoTextoMinuta = document.getElementById('corpo-texto-minuta');
        if (corpoTextoMinuta && data.contrato_reescrito) {
            corpoTextoMinuta.innerHTML = `
                <p class="font-bold text-white text-center mb-6">ESTATUTO SOCIAL DA SOCIEDADE CAMPO NOBRE S.A.</p>
                <div class="whitespace-pre-wrap leading-relaxed">${data.contrato_reescrito}</div>
            `;
        }

        // 3. ENGENHARIA DA LINHA DO TEMPO (DYNAMIC TIMELINE)
        // Resgata os elementos de cada fase no HTML
        const p1 = document.getElementById('passo-linha-1');
        const p2 = document.getElementById('passo-linha-2');
        const p3 = document.getElementById('passo-linha-3');
        const p4 = document.getElementById('passo-linha-4');

        const b1 = document.getElementById('badge-passo-1');
        const b2 = document.getElementById('badge-passo-2');
        const b3 = document.getElementById('badge-passo-3');
        const b4 = document.getElementById('badge-passo-4');

        // Reseta as classes de todas as fases para o padrão cinza inativo antes de pintar a fase atual
        [p2, p3, p4].forEach(p => p?.classList.add('opacity-50', 'border-gray-800', 'bg-gray-950/40'));
        [p2, p3, p4].forEach(p => p?.classList.remove('border-emerald-800', 'bg-emerald-950/20'));
        [b2, b3, b4].forEach(b => b?.classList.replace('bg-emerald-400', 'bg-gray-700'));
        [b1, b2, b3, b4].forEach(b => b?.classList.remove('animate-pulse'));

        // Aplica a estilização com base no status de evolução da transição
        if (data.status === 'rascunho_gerado' || !data.status) {
            b1?.classList.add('animate-pulse');
        } 
        else if (data.status === 'em_revisao_contabil') {
            p2?.classList.remove('opacity-50', 'border-gray-800', 'bg-gray-950/40');
            p2?.classList.add('border-emerald-800', 'bg-emerald-950/20');
            b2?.classList.replace('bg-gray-700', 'bg-emerald-400');
            b2?.classList.add('animate-pulse');
        } 
        else if (data.status === 'em_revisao_bancaria') {
            // Ativa o Passo 2 e o Passo 3
            [p2, p3].forEach(p => p?.classList.remove('opacity-50', 'border-gray-800', 'bg-gray-950/40'));
            [p2, p3].forEach(p => p?.classList.add('border-emerald-800', 'bg-emerald-950/20'));
            [b2, b3].forEach(b => b?.classList.replace('bg-gray-700', 'bg-emerald-400'));
            b3?.classList.add('animate-pulse');
        } 
        else if (data.status === 'validado_oficial') {
            // Ativa todas as fases como concluídas
            [p2, p3, p4].forEach(p => p?.classList.remove('opacity-50', 'border-gray-800', 'bg-gray-950/40'));
            [p2, p3, p4].forEach(p => p?.classList.add('border-emerald-800', 'bg-emerald-950/20'));
            [b2, b3, b4].forEach(b => b?.classList.replace('bg-gray-700', 'bg-emerald-400'));
            
            // =================================================================
            // 4. DESBLOQUEIO DE SEGURANÇA JURÍDICA (REMOÇÃO DA MARCA D'ÁGUA)
            // =================================================================
            
            // A. Remove a marca d'água vermelha rotacionada
            document.getElementById('marca-dagua-ia')?.classList.add('hidden');
            
            // B. Desfaz o efeito de desfoque (blur) e restrição de cópia do texto
            if (corpoTextoMinuta) {
                corpoTextoMinuta.classList.remove('blur-[1px]', 'select-none', 'text-gray-400');
                corpoTextoMinuta.classList.add('text-gray-200');
            }

            // C. Atualiza a Tag de Status do topo do documento para Verde
            const statusTag = document.getElementById('tag-status-documento');
            if (statusTag) {
                statusTag.className = "bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-xs font-bold";
                statusTag.textContent = "Versão Oficial Validada";
            }

            // D. Transforma o botão de download travado em um link funcional e chamativo
            const btnDownload = document.getElementById('btn-download-cliente');
            if (btnDownload) {
                btnDownload.href = data.url_estatuto_validado || '#';
                btnDownload.className = "bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-emerald-950/30";
                btnDownload.innerHTML = "📥 Baixar Estatuto Social Homologado (PDF)";
                btnDownload.onclick = null; // Elimina o travamento de clique do HTML
            }

            // E. Altera o painel lateral para exibir as notas deixadas pelo advogado
            document.getElementById('box-parecer-vazio')?.classList.add('hidden');
            document.getElementById('box-parecer-preenchido')?.classList.remove('hidden');
            
            const textoParecer = document.getElementById('texto-parecer-cliente');
            if (textoParecer) {
                textoParecer.textContent = data.parecer_admin || "Documento revisado e considerado em plena conformidade com a Lei 6.404/76 e diretrizes institucionais, sem ressalvas.";
            }
        }

        // Revela o container inteiro e rola a tela suavemente para o resultado
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth' });
    }
};

// Ponte com o resto do código
window.trocarTela = UI.trocarTela;
window.exibirNomeArquivo = UI.exibirNomeArquivo;
window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    UI.carregarContadoresMetricas();
});