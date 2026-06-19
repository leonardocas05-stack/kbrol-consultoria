/**
 * ADMIN.JS - Módulo Administrativo da KBROL
 * Responsável por: Gestão de auditorias globais e tickets de suporte
 */

// 1. PORTEIRO: Verifica acesso (Executa ao carregar o script)
async function verificarAcessoAdmin() {
    if (!window.supabase) return; // Segurança caso o app.js não tenha carregado
    const { data: { user } } = await window.supabase.auth.getUser();
    
    if (!user) { window.location.href = 'index.html'; return; }

    const { data: perfil, error } = await window.supabase.from('perfis').select('role').eq('id', user.id).single();
    if (error || !perfil || perfil.role !== 'admin') {
        alert("Acesso Negado.");
        window.location.href = 'index.html';
    }
}
verificarAcessoAdmin();

// Variável global para gerenciar tickets
let currentTicketId = null;

// 2. CARREGAR AUDITORIAS (VISÃO GERAL)
async function carregarAdminAuditorias() {
    const container = document.getElementById('admin-container');
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
}

// 3. CARREGAR TICKETS (VERSÃO ÚNICA E OTIMIZADA)
async function carregarAdminTickets() {
    const container = document.getElementById('admin-container');
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
}

// 4. LÓGICA DO MODAL
function abrirModalTicket(ticketId) {
    currentTicketId = ticketId;
    document.getElementById('modal-responder-ticket').classList.remove('hidden');
}

function fecharModalTicket() {
    currentTicketId = null;
    document.getElementById('modal-responder-ticket').classList.add('hidden');
}

async function enviarRespostaTicket() {
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
            fecharModalTicket();
            carregarAdminTickets(); // Recarrega a lista
        }
    } catch (e) {
        alert("Erro ao enviar: " + e.message);
    }
}