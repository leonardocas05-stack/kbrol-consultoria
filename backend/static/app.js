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
            // Salva dados no localStorage para evitar chamadas extras
            localStorage.setItem('user_data', JSON.stringify({ email }));
            UI.atualizarNavbar();
            UI.trocarTela('tela-dashboard');
        } catch (e) { alert("Erro de Login: " + e.message); }
    },
    async fazerLogout() {
        await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.reload();
    }
};

// 3. UI GLOBAL
const UI = {
    trocarTela(idTelaAlvo) {
        if (idTelaAlvo === 'tela-dashboard' && !KBROL.state.usuarioLogado) idTelaAlvo = 'tela-login';
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const el = document.getElementById(idTelaAlvo);
        if (el) el.classList.remove('hidden');
    },
    atualizarNavbar() {
        const session = localStorage.getItem('sb_token');
        const authBtns = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        if (session) {
            authBtns?.classList.add('hidden');
            userMenu?.classList.remove('hidden');
        } else {
            authBtns?.classList.remove('hidden');
            userMenu?.classList.add('hidden');
        }
    }
};

// 4. PONTE (Sempre no final)
window.Auth = Auth;
window.UI = UI;
window.fazerLogin = Auth.fazerLogin;
window.fazerLogout = Auth.fazerLogout;
window.trocarTela = UI.trocarTela;