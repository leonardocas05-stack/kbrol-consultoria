/**
 * CLIENT.JS - Módulo de Ações do Cliente
 * Responsável por: Auditorias, Dashboard e Perfil do Usuário
 */

const Client = {
    // Helper privado para headers de autenticação
    async getHeaders() {
        return { 
            'Authorization': `Bearer ${localStorage.getItem('sb_token')}`, 
            'Content-Type': 'application/json' 
        };
    },

    // Inicialização de Eventos (O gatilho)
    init() {
        const btn = document.getElementById('btn-auditar-trigger');
        if (btn) {
            btn.addEventListener('click', Client.processarAuditoria);
            console.log("Evento de auditoria acoplado com sucesso!");
        }
    },

    // 1. Processamento de Auditoria
    async processarAuditoria() {
        const fileInput = document.getElementById('file-input');
        const statusDiv = document.getElementById('status-processamento');
        
        if (!fileInput?.files[0]) return alert("Selecione um arquivo!");
        
        // UI.exibirStatus é global (vem do app.js/UI)
        UI.exibirStatus('status-processamento', "🔄 Iniciando auditoria...", "#60a5fa");

        const formData = new FormData();
        formData.append("arquivo", fileInput.files[0]);
        formData.append("prazo_convocacao_assembleia_dias", document.getElementById('prazo_convocacao')?.value || 0);
        formData.append("percentual_dividendo_obrigatorio", document.getElementById('dividendo_minimo')?.value || 0);
        formData.append("conselho_fiscal_permanente", document.getElementById('conselho_fiscal')?.checked || false);
        formData.append("aprovacao_unanimidade", document.getElementById('aprovacao_unanimidade')?.checked || false);

        try {
            const response = await fetch('/auditoria-inteligente/arquivo/', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') },
                body: formData
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            UI.exibirStatus('status-processamento', "✅ Auditoria concluída!", "#4ade80");
            UI.renderizarResultado(data);
        } catch (e) {
            UI.exibirStatus('status-processamento', "❌ Erro: " + e.message, "#f87171");
        }
    },


    // 2. Dashboard e Histórico
    async carregarDashboard() {
    const container = document.getElementById('lista-auditorias');
    if (!container) {
        console.error("ERRO: Container não encontrado!");
        return;
    }
    
    // DEBUG: Verifique se o esqueleto está aqui
    console.log("Conteúdo atual do container antes do fetch:", container.innerHTML);
    
    try {
        const response = await fetch('/auditorias/listar', { headers: await Client.getHeaders() });
        const data = await response.json();
        
        console.log("Dados recebidos:", data); // Verifique se auditorias não está vazio
        
        if (!data.auditorias || data.auditorias.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">Nenhuma auditoria encontrada.</p>';
            return;
        }

        // DEBUG: O que vamos injetar
        const html = data.auditorias.map(aud => `
            <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex justify-between items-center mb-4">
                <div>
                    <h3 class="font-bold text-white">${aud.nome_arquivo || "Minuta"}</h3>
                    <p class="text-sm text-gray-400">Data: ${new Date(aud.created_at).toLocaleDateString()}</p>
                </div>
                <button onclick="Client.baixarPdf('${aud.id}')" class="px-4 py-2 rounded bg-gray-800 text-white hover:bg-[#991b1b]">📥 PDF</button>
            </div>`).join('');
            
        console.log("Injetando HTML no DOM...");
        container.innerHTML = html;
        console.log("Substituição concluída.");
            
    } catch (e) { 
        console.error("Erro no processamento:", e);
        container.innerHTML = '<p class="text-red-500 text-center">Erro ao carregar histórico.</p>'; 
    }
    },

    // 3. Gestão de Perfil
    async carregarPerfil() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        const { data: perfil } = await window.supabaseClient.from('perfis').select('*').eq('id', user.id).single();
        if (perfil) {
            document.getElementById('perfil-nome').value = perfil.nome_empresa || '';
            document.getElementById('perfil-telefone').value = perfil.telefone_whatsapp || '';
            document.getElementById('perfil-cnpj').value = perfil.cnpj || '';
            document.getElementById('perfil-uf').value = perfil.uf_sede || '';
            document.getElementById('perfil-capital').value = perfil.capital_social_atual || '';
        }
        await Client.carregarMeusTickets();
    },

    async atualizarPerfil(dados) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        const { error } = await window.supabaseClient.from('perfis').update(dados).eq('id', user.id);
        if (error) alert("Erro ao salvar: " + error.message);
        else alert("Dados salvos com sucesso!");
    },

    // 4. Suporte / Tickets
    async enviarTicket(assunto, texto) {
        try {
            const response = await fetch("/tickets/criar/", {
                method: "POST",
                headers: await Client.getHeaders(),
                body: JSON.stringify({ assunto, texto })
            });

            if (response.ok) {
                alert("Ticket enviado com sucesso!");
                // Fechar modal globalmente
                document.getElementById('modal-suporte').classList.add('hidden');
            }
        } catch (e) { alert("Erro ao enviar ticket."); }
    },

    async carregarMeusTickets() {
        const container = document.getElementById('container-tickets-usuario');
        if (!container) return;
        
        try {
            const response = await fetch('/tickets/me', { headers: await Client.getHeaders() });
            const data = await response.json();
            
            container.innerHTML = data.tickets.map(t => `
                <div class="p-3 bg-gray-800 rounded border border-gray-700">
                    <p class="font-bold text-white">${t.assunto}</p>
                    <p class="text-sm text-gray-400">${t.texto}</p>
                </div>
            `).join('');
        } catch (e) { container.innerHTML = '<p class="text-red-500">Erro ao carregar tickets.</p>'; }
    },

    // 5. Utilidades
    async baixarPdf(auditoriaId) {
        try {
            const response = await fetch(`/auditoria/download-pdf/${auditoriaId}`, { headers: await Client.getHeaders() });
            if (!response.ok) throw new Error("Erro ao gerar PDF");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo_kbrol_${auditoriaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) { alert("Erro ao baixar: " + e.message); }
    }
};

// --- EVENTO DE CLIQUE (Substitui o onclick do HTML) ---
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-auditar-trigger');
    if (btn) {
        btn.addEventListener('click', Client.processarAuditoria);
        console.log("Evento de auditoria acoplado com sucesso!");
    } else {
        console.error("Botão de auditoria não encontrado na tela!");
    }
});


// Ponte para HTML (Mantendo compatibilidade com onclick="...")
window.Client = Client;
window.processarAuditoria = Client.processarAuditoria;
window.carregarDashboard = Client.carregarDashboard;
window.carregarPerfil = Client.carregarPerfil;
window.baixarPdf = Client.baixarPdf;
window.enviarTicket = () => {
    Client.enviarTicket(
        document.getElementById('ticket-assunto').value,
        document.getElementById('ticket-mensagem').value
    );
};

// 2. LOG DE SEGURANÇA (Para saber se o arquivo carregou)
console.log("CLIENT.JS carregado com sucesso. Ponte criada para processarAuditoria.");