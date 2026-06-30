/**
 * CLIENT.JS - Módulo de Ações do Cliente
 * Responsável por: Auditorias, Dashboard e Perfil do Usuário
 */
let pollingInterval = null;
console.log("CLIENT.JS está carregando...");
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

    // 1. Processamento de Auditoria (ATUALIZADO PARA O EFEITO UAU)
    async processarAuditoria() {
        const fileInput = document.getElementById('file-input');
        
        if (!fileInput?.files[0]) return alert("Selecione um arquivo!");
        
        // RESET DA UI: Limpa estados antigos para preparar a nova animação
        const container = document.getElementById('resultado-auditoria');
        if (container) container.classList.add('hidden'); 
        UI.exibirStatus('status-processamento', "🔄 Iniciando engenharia societária...", "#60a5fa");

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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao iniciar auditoria");
            }

            const data = await response.json();

           
            // APLICAÇÃO DO EFEITO UAU: Renderiza o rascunho da IA imediatamente
            UI.renderizarResultado(data);

            // Força o histórico do "Meu Painel" a se atualizar em segundo plano
            Client.carregarDashboard();

            // Se o documento ainda não foi validado pelo advogado, ativa o monitoramento da linha do tempo
            if (data.status === "processando") {
                // Se ainda está processando, avisa o usuário de forma honesta e liga o monitor
                UI.exibirStatus('status-processamento', "⏳ O servidor recebeu a peça. Processando dados e gerando o modelo da S.A...", "#fbbf24");
                Client.monitorarStatus(data.file_hash);
            } 
            else if (data.status === "rascunho_gerado") {
                // Se o backend entregou o rascunho de forma instantânea
                UI.exibirStatus('status-processamento', "⏳ Rascunho da IA gerado! Acompanhe a revisão jurídica na linha do tempo abaixo.", "#fbbf24");
                Client.monitorarStatus(data.file_hash);
            } 
            else if (data.status === "validado_oficial") {
                UI.exibirStatus('status-processamento', "✅ Reorganização societária homologada!", "#4ade80");
            }
            
        } catch (e) {
            console.error("Erro no processamento:", e);
            UI.exibirStatus('status-processamento', "❌ Erro: " + e.message, "#f87171");
        }
    },

    // MONITORAMENTO EM TEMPO REAL DA LINHA DO TEMPO
    async monitorarStatus(hash) {
        console.log("DEBUG: Iniciando rastreamento de fases para o hash:", hash);
        
        // Limpa proteções de intervalos duplicados
        if (pollingInterval) clearInterval(pollingInterval);
        
        // Reduzi o tempo para 5 segundos (5000ms) para a apresentação ficar mais ágil e responsiva
        pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/auditoria/status/${hash}`, { 
                    headers: await Client.getHeaders() 
                });
                
                if (!response.ok) throw new Error("Falha ao atualizar status da transição");
                
                const data = await response.json();

                // Extrai os dados se eles vierem encapsulados no objeto laudo
                const dadosMapeados = data.laudo ? data.laudo : data;
                if (!dadosMapeados.status) dadosMapeados.status = data.status;

                // Força o app.js a atualizar as cores da linha do tempo e remover a marca d'água se necessário
                UI.renderizarResultado(dadosMapeados); 

                // Condição de parada: O advogado deu o aval definitivo e o e-mail foi disparado
                if (dadosMapeados.status === "validado_oficial") {
                    clearInterval(pollingInterval); 
                    UI.exibirStatus('status-processamento', "🎉 Processo concluído! Seu Estatuto Social Oficial foi liberado pelo advogado.", "#4ade80");
                }
            } catch (e) {
                console.error("Erro no fluxo de atualização da linha do tempo:", e);
            }
        }, 5000); 
    },

    // 2. Dashboard e Histórico
    async carregarDashboard() {
        const container = document.getElementById('lista-auditorias');
        if (!container) {
            console.error("ERRO: Container 'lista-auditorias' não encontrado!");
            return;
        }
        
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Carregando histórico corporativo...</p>';
        
        try {
            const response = await fetch('/auditorias/listar', { headers: await Client.getHeaders() });
            const data = await response.json();
            
            if (!data.auditorias || data.auditorias.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma auditoria ou reorganização iniciada ainda.</p>';
                return;
            }

            // Mapeamento de badges estáticos para o cabeçalho do card
            const labelsStatus = {
                'rascunho_gerado': '<span class="px-2 py-1 rounded-md text-[10px] font-black bg-blue-950 text-blue-400 border border-blue-900/50 uppercase">1. Rascunho IA</span>',
                'em_revisao_contabil': '<span class="px-2 py-1 rounded-md text-[10px] font-black bg-purple-950 text-purple-400 border border-purple-900/50 uppercase">2. Contábil</span>',
                'em_revisao_bancaria': '<span class="px-2 py-1 rounded-md text-[10px] font-black bg-orange-950 text-orange-400 border border-orange-900/50 uppercase">3. Bancos</span>',
                'validado_oficial': '<span class="px-2 py-1 rounded-md text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-900/50 uppercase">4. Homologado</span>'
            };

            const html = data.auditorias.map(aud => {
                const currentStatus = aud.status || 'rascunho_gerado';
                const badgeHtml = labelsStatus[currentStatus] || labelsStatus['rascunho_gerado'];

                return `
                <div class="border border-gray-800 bg-gray-900 rounded-2xl mb-4 overflow-hidden transition-all duration-200">
                    
                    <div onclick="toggleAuditoriaDetalhe('${aud.id}')" class="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-800/30 transition-colors select-none">
                        <div class="space-y-1">
                            <h3 class="font-bold text-white tracking-tight">${aud.nome_arquivo || "Estatuto Social Provisório"}</h3>
                            <p class="text-xs text-gray-500 font-mono">ID: ${aud.id.slice(0, 8)}... • Entrada: ${new Date(aud.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            ${badgeHtml}
                            <span id="seta-${aud.id}" class="text-gray-500 text-xs transition-transform duration-200 transform">▼</span>
                        </div>
                    </div>
                    
                    <div id="detalhe-${aud.id}" class="hidden border-t border-gray-800 bg-gray-950/40 p-5 space-y-6">
                        
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2.5">Histórico de Evolução da Peça</p>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                                <div class="p-2 rounded-xl border border-emerald-900/30 bg-emerald-950/10 text-emerald-400">Rascunho IA</div>
                                <div class="p-2 rounded-xl border ${['em_revisao_contabil', 'em_revisao_bancaria', 'validado_oficial'].includes(currentStatus) ? 'border-emerald-900/30 bg-emerald-950/10 text-emerald-400' : 'border-gray-800 bg-gray-900 text-gray-600'}">Revisão Contábil</div>
                                <div class="p-2 rounded-xl border ${['em_revisao_bancaria', 'validado_oficial'].includes(currentStatus) ? 'border-emerald-900/30 bg-emerald-950/10 text-emerald-400' : 'border-gray-800 bg-gray-900 text-gray-600'}">Alinhamento Bancos</div>
                                <div class="p-2 rounded-xl border ${currentStatus === 'validado_oficial' ? 'border-emerald-900/30 bg-emerald-950/10 text-emerald-400' : 'border-gray-800 bg-gray-900 text-gray-600'}">Homologado</div>
                            </div>
                        </div>

                        <div class="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                            <p class="text-[10px] font-black uppercase tracking-widest text-[#991b1b] mb-1">Notas de Despacho Técnico</p>
                            <p class="text-xs text-gray-400 leading-relaxed">${aud.parecer_admin || "O rascunho automatizado foi gerado e aguarda triagem humana na fila do consultor especialista."}</p>
                        </div>

                        <div class="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-800/60">
                            <button onclick="Client.baixarPdf('${aud.id}')" class="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition inline-flex items-center gap-1.5">
                                📥 Baixar Laudo IA
                            </button>
                            
                            ${(aud.status === 'validado_oficial' && aud.url_estatuto_validado) ? `
                                <a href="${aud.url_estatuto_validado}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition inline-flex items-center gap-1.5">
                                    📜 Baixar Peça Homologada
                                </a>
                            ` : `
                                <button disabled class="bg-gray-950 border border-gray-800 text-gray-600 text-xs px-4 py-2 rounded-xl font-bold cursor-not-allowed inline-flex items-center gap-1.5">
                                    🔒 Estatuto Homologado indisponível
                                </button>
                            `}

                            <button onclick="abrirSuporteComContexto('${aud.id}', '${aud.nome_arquivo || 'Estatuto'}')" class="border border-[#991b1b]/30 hover:border-[#991b1b] text-red-400 hover:text-red-300 text-xs px-4 py-2 rounded-xl font-bold transition inline-flex items-center gap-1.5 ml-auto">
                                🎫 Contestar ou Ajustar Peça
                            </button>
                        </div>

                    </div>
                </div>
                `;
            }).join('');
                
            container.innerHTML = html;
                
        } catch (e) { 
            console.error("Erro no carregamento do painel:", e);
            container.innerHTML = '<p class="text-red-500 text-center py-4">Falha ao conectar com o histórico do painel.</p>'; 
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
            
            console.log("DEBUG TICKETS: Resposta do servidor:", data); 
            
            if (data.tickets && data.tickets.length > 0) {
                container.innerHTML = data.tickets.map(t => `
                    <div class="p-3 bg-gray-800 rounded border border-gray-700">
                        <p class="font-bold text-white">${t.assunto}</p>
                        <p class="text-sm text-gray-400">${t.texto}</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-gray-500">Nenhum ticket encontrado.</p>';
            }
        } catch (e) { 
            console.error("DEBUG TICKETS: Erro crítico:", e); 
            container.innerHTML = '<p class="text-red-500">Erro ao carregar tickets.</p>'; 
        }
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

// EVENTO DE CLIQUE DA DOM
document.addEventListener('DOMContentLoaded', () => {
    Client.init(); // Ativa a inicialização segura do escopo
});


// INTERATIVIDADE DO HISTÓRICO EXPANSÍVEL

// A. Controla o efeito sanfona (Accordion) dos cards de processos
function toggleAuditoriaDetalhe(id) {
    const painel = document.getElementById(`detalhe-${id}`);
    const seta = document.getElementById(`seta-${id}`);
    
    if (painel && painel.classList.contains('hidden')) {
        painel.classList.remove('hidden');
        if (seta) seta.classList.add('rotate-180', 'text-[#991b1b]');
    } else if (painel) {
        painel.classList.add('hidden');
        if (seta) seta.classList.remove('rotate-180', 'text-[#991b1b]');
    }
}

// B. Abre a tela ou modal de suporte já preenchendo o ID e nome do arquivo sob contestação
function abrirSuporteComContexto(auditoriaId, nomeArquivo) {
    // Busca os inputs do formulário de tickets de suporte no seu HTML
    const inputAssunto = document.getElementById('ticket-assunto');
    const inputMensagem = document.getElementById('ticket-mensagem');
    const modalSuporte = document.getElementById('modal-suporte');

    if (inputAssunto) {
        inputAssunto.value = `Ajuste Técnico - ${nomeArquivo}`;
    }
    if (inputMensagem) {
        inputMensagem.value = `Prezada consultoria KBROL,\n\nGostaria de solicitar uma revisão específica no processo ID: ${auditoriaId} referente à reestruturação da minuta do arquivo "${nomeArquivo}".\n\n[Insira aqui os pontos de alteração desejados]:`;
    }

    // Se o seu sistema abrir o suporte por modal móvel, remove a trava de visualização
    if (modalSuporte) {
        modalSuporte.classList.remove('hidden');
    } else {
        // Caso use navegação de tela cheia, redireciona o cliente para a seção de perfil/suporte
        if (typeof UI !== 'undefined') UI.trocarTela('tela-perfil');
    }
}


// Pontes de escopo global para herança no HTML
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
window.toggleAuditoriaDetalhe = toggleAuditoriaDetalhe;
window.abrirSuporteComContexto = abrirSuporteComContexto;

console.log("CLIENT.JS carregado com sucesso.");