/**
 * APP.JS - O KERNEL DO SISTEMA
 */

// 1. CONFIGURAÇÃO (Usamos window.supabaseClient para evitar conflito com a biblioteca)
const KBROL = {
    config: {
        supabaseUrl: 'https://ibsbtujgbjikqnfbnunw.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic2J0dWpnYmppa3FuZmJudW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTU1MTQsImV4cCI6MjA5NTgzMTUxNH0.duxBXj1vANbAgEDel3uMevlRRFFzsGcEJI_jSyZ36JI'
    },
    state: { usuarioLogado: false, appIniciado: false }
};

// Aqui iniciamos o cliente com um nome único
window.supabaseClient = window.supabase.createClient(KBROL.config.supabaseUrl, KBROL.config.supabaseKey);

// 2. AUTENTICAÇÃO
const Auth = {
    async validarSessao() {
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
            UI.atualizarNavbar();
            UI.trocarTela('tela-dashboard');
        } catch (e) { alert("Erro: " + e.message); }
    },
    async fazerLogout() {
        await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '/'; 
    }
};

// 3. UI GLOBAL
const UI = {
    trocarTela(idTelaAlvo) {
        if (idTelaAlvo === 'tela-dashboard' && !KBROL.state.usuarioLogado) idTelaAlvo = 'tela-login';
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(idTelaAlvo)?.classList.remove('hidden');
        window.scrollTo(0, 0);
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

// 4. PONTE PARA O HTML
window.fazerLogin = Auth.fazerLogin;
window.fazerLogout = Auth.fazerLogout;
window.trocarTela = UI.trocarTela;