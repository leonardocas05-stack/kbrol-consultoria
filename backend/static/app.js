/**
 * APP.JS - O KERNEL DO SISTEMA
 * Responsável por: Configuração, Auth, Roteamento e Inicialização Global
 */

// 1. CONFIGURAÇÃO E NAMESPACE GLOBAL
const KBROL = {
    config: {
        supabaseUrl: 'https://ibsbtujgbjikqnfbnunw.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic2J0dWpnYmppa3FuZmJudW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTU1MTQsImV4cCI6MjA5NTgzMTUxNH0.duxBXj1vANbAgEDel3uMevlRRFFzsGcEJI_jSyZ36JI'
    },
    state: { usuarioLogado: false, appIniciado: false }
};

window.supabaseClient = window.supabase.createClient(KBROL.config.supabaseUrl, KBROL.config.supabaseKey);

// 2. AUTENTICAÇÃO (MANTIDA NO KERNEL)
const Auth = {
    async validarSessao() {
        const { data } = await supabase.auth.getSession();
        KBROL.state.usuarioLogado = !!data.session;
        KBROL.state.appIniciado = true;
        if (typeof UI !== 'undefined') UI.atualizarNavbar();
        return KBROL.state.usuarioLogado;
    },
    async fazerLogin(email, senha) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
            if (error) throw error;
            localStorage.setItem('sb_token', data.session.access_token);
            const { data: perfil } = await supabase.from('perfis').select('nome_empresa, role').eq('id', data.user.id).single();
            localStorage.setItem('user_data', JSON.stringify({ email, nome: perfil?.nome_empresa, role: perfil?.role }));
            UI.atualizarNavbar();
            UI.trocarTela('tela-dashboard');
        } catch (e) { alert("Erro: " + e.message); }
    },
    async fazerLogout() {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/'; 
    }
};

// 3. UI GLOBAL (FUNÇÕES DE NAVEGAÇÃO)
const UI = {
    trocarTela(idTelaAlvo) {
        if (idTelaAlvo === 'tela-dashboard' && !KBROL.state.usuarioLogado) idTelaAlvo = 'tela-login';
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(idTelaAlvo)?.classList.remove('hidden');
        window.scrollTo(0, 0);
    },
    atualizarNavbar() {
        const session = localStorage.getItem('sb_token');
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        document.getElementById('auth-buttons')?.classList.toggle('hidden', !!session);
        document.getElementById('user-menu')?.classList.toggle('hidden', !session);
        if (session) document.getElementById('user-email').textContent = userData.nome || 'Usuário';
    }
};

// 4. PONTE PARA O HTML
window.fazerLogin = Auth.fazerLogin;
window.fazerLogout = Auth.fazerLogout;
window.trocarTela = UI.trocarTela;