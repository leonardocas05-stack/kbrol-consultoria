/**
 * ADMIN.JS - Módulo Administrativo da KBROL (REESTRUTURADO)
 */

// Variável global para gerenciar tickets
let currentTicketId = null;

// =========================================================================
// DECLARAÇÃO GLOBAL DIRETA (IMPEDE QUE ERROS ABAIXO QUEBREM O ESCOPO)
// =========================================================================

window.carregarAdminAuditorias = async function() {
    const container = document.getElementById('admin-container');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-400">Carregando auditorias...</p>';

    try {
        const response = await fetch('/admin/auditorias/listar-todas', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        const data = await response.json();

        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Todas Auditorias</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-gray-800 text-gray-400">
                            <th class="p-3">Usuário</th>
                            <th class="p-3">Arquivo</th>
                            <th class="p-3">Data</th>
                            <th class="p-3">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="text-white">
                        ${data.map(aud => `
                            <tr class="border-b border-gray-800">
                                <td class="p-3 text-sm">${aud.email_usuario || 'N/A'}</td>
                                <td class="p-3 text-sm">${aud.nome_arquivo}</td>
                                <td class="p-3 text-sm">${new Date(aud.created_at).toLocaleDateString()}</td>
                                <td class="p-3">
                                    <button onclick="Client.baixarPdf('${aud.id}')" class="text-blue-400 hover:text-blue-300">Download</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="text-red-500">Erro ao carregar: ${e.message}</p>`;
    }
};

window.carregarAdminTickets = async function() {
    const container = document.getElementById('admin-container');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-400">Carregando tickets...</p>';
    
    try {
        const response = await fetch('/admin/tickets/listar', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        const tickets = await response.json();
        
        container.innerHTML = `
            <h1 class="text-3xl font-black mb-8">Tickets de Suporte</h1>
            <div class="space-y-4">
                ${tickets.map(t => `
                    <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <div class="flex justify-between items-center mb-2">
                            <div>
                                <span class="font-bold text-white">${t.assunto}</span>
                                <span class="text-xs text-gray-500 ml-2">ID: ${t.id.slice(0, 8)}</span>
                            </div>
                            <span class="text-xs px-2 py-1 rounded ${t.status === 'aberto' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}">
                                ${t.status.toUpperCase()}
                            </span>
                        </div>
                        <p class="text-sm text-gray-400 mb-4">${t.texto}</p>
                        ${t.resposta ? `<div class="bg-gray-800 p-3 rounded text-sm text-blue-300 mb-4"><strong>Resposta:</strong> ${t.resposta}</div>` : ''}
                        ${t.status === 'aberto' ? `
                            <button onclick="abrirModalTicket('${t.id}')" class="text-xs bg-[#991b1b] text-white px-3 py-1 rounded hover:bg-[#7f1d1d]">Responder</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p class="text-red-500">Erro ao carregar tickets.</p>';
    }
};

window.carregarAdminHomologacao = async function() {
    const container = document.getElementById('admin-container');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-400">Carregando fila de homologação societária...</p>';

    try {
        const response = await fetch('/admin/auditorias/listar-todas', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') }
        });
        const data = await response.json();

        const labelsStatus = {
            'rascunho_gerado': '<span class="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-300">1. Rascunho IA</span>',
            'em_revisao_contabil': '<span class="px-2 py-1 rounded text-xs font-bold bg-purple-900 text-purple-300">2. Contábil</span>',
            'em_revisao_bancaria': '<span class="px-2 py-1 rounded text-xs font-bold bg-orange-900 text-orange-300">3. Bancos</span>',
            'validado_oficial': '<span class="px-2 py-1 rounded text-xs font-bold bg-emerald-900 text-emerald-300">4. Finalizado</span>'
        };

        container.innerHTML = `
            <h1 class="text-3xl font-black mb-2">Homologação de Estatutos</h1>
            <p class="text-gray-400 mb-8">Controle o avanço das fases da linha do tempo e valide as minutas geradas pela IA.</p>
            
            <div class="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-800 p-4">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-gray-800 text-gray-400 text-sm">
                            <th class="p-3">Organização (Cliente)</th>
                            <th class="p-3">Arquivo Original</th>
                            <th class="p-3">Data de Entrada</th>
                            <th class="p-3">Fase da Reorganização</th>
                            <th class="p-3 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="text-white divide-y divide-gray-800">
                        ${data.map(aud => `
                            <tr class="hover:bg-gray-800/40 transition">
                                <td class="p-3 text-sm font-bold">${aud.email_usuario || 'Aguardando Perfil'}</td>
                                <td class="p-3 text-sm text-gray-400 font-mono">${aud.nome_arquivo}</td>
                                <td class="p-3 text-sm text-gray-400">${new Date(aud.created_at).toLocaleDateString('pt-BR')}</td>
                                <td class="p-3">${labelsStatus[aud.status] || labelsStatus['rascunho_gerado']}</td>
                                <td class="p-3 text-center">
                                    <button onclick="abrirModalHomologacao('${aud.id}', '${aud.url_pdf_relatorio || '#'}', '${aud.status}')" 
                                            class="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition">
                                        Despachar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="text-red-500">Erro ao renderizar a fila de homologação: ${e.message}</p>`;
    }
};

// =========================================================================
// GESTÃO DE MODAIS E ENVIO DE FORMULÁRIOS
// =========================================================================

window.abrirModalTicket = function(ticketId) {
    currentTicketId = ticketId;
    document.getElementById('modal-responder-ticket')?.classList.remove('hidden');
};

window.fecharModalTicket = function() {
    currentTicketId = null;
    document.getElementById('modal-responder-ticket')?.classList.add('hidden');
};

window.enviarRespostaTicket = async function() {
    const resposta = document.getElementById('resposta-ticket-texto').value;
    if (!resposta) return alert("Digite uma resposta!");

    try {
        const response = await fetch(`/admin/tickets/responder/${currentTicketId}`, {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('sb_token') 
            },
            body: JSON.stringify({ resposta })
        });

        if (response.ok) {
            alert("Resposta enviada!");
            window.fecharModalTicket();
            window.carregarAdminTickets();
        }
    } catch (e) {
        alert("Erro ao enviar: " + e.message);
    }
};

window.abrirModalHomologacao = function(auditoriaId, urlRascunho, statusAtual) {
    document.getElementById('homologar-auditoria-id').value = auditoriaId;
    document.getElementById('status-transicao').value = statusAtual || 'rascunho_gerado';
    
    const btnDownload = document.getElementById('link-download-rascunho');
    if (btnDownload) btnDownload.href = urlRascunho;
    
    document.getElementById('modal-homologar-estatuto')?.classList.remove('hidden');
};

window.fecharModalHomologacao = function() {
    document.getElementById('homologar-auditoria-id').value = '';
    document.getElementById('arquivo-estatuto-validado').value = '';
    document.getElementById('parecer-admin-texto').value = '';
    document.getElementById('modal-homologar-estatuto')?.classList.add('hidden');
};

window.salvarHomologacao = async function(event) {
    event.preventDefault();

    const auditoriaId = document.getElementById('homologar-auditoria-id').value;
    const novoStatus = document.getElementById('status-transicao').value;
    const parecer = document.getElementById('parecer-admin-texto').value;
    const inputArquivo = document.getElementById('arquivo-estatuto-validado');

    const formData = new FormData();
    formData.append('auditoria_id', auditoriaId);
    formData.append('novo_status', novoStatus);
    formData.append('parecer_admin', parecer);
    
    if (inputArquivo && inputArquivo.files.length > 0) {
        formData.append('arquivo_validado', inputArquivo.files[0]);
    }

    try {
        const response = await fetch('/admin/homologar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb_token') },
            body: formData
        });

        if (response.ok) {
            alert("Despacho processado com sucesso!");
            window.fecharModalHomologacao();
            window.carregarAdminHomologacao();
        } else {
            const erroData = await response.json();
            alert("Erro no despacho: " + (erroData.message || response.statusText));
        }
    } catch (e) {
        alert("Falha de conexão: " + e.message);
    }
};

// =========================================================================
// SAFELOCK: PORTEIRO DE SEGURANÇA COM BLINDAGEM TRY-CATCH
// =========================================================================
async function verificarAcessoAdmin() {
    if (!window.supabaseClient) {
        console.warn("Aviso: Supabase Client não disponível para o porteiro.");
        return;
    }
    try {
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError || !user) { window.location.href = '/'; return; }

        const { data: perfil, error } = await window.supabaseClient
            .from('perfis')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !perfil || perfil.role !== 'admin') {
            alert("Acesso Negado.");
            window.location.href = '/';
        }
    } catch (err) {
        // 🔥 CAPTURA O ERRO SEM QUEBRAR O RESTO DO SCRIPT
        console.error("Erro controlado no Porteiro Admin:", err);
    }
}

// Inicialização segura após o mapeamento completo das funções
document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdmin();
});

console.log("ADMIN.JS estruturado com sucesso globais ativos.");