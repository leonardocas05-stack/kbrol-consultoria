import os
from typing import Dict, Any, Optional
from uuid import UUID
from supabase import create_client, Client
from services.notifications import enviar_email_homologacao

# Inicialização do cliente Supabase utilizando variáveis de ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def iniciar_transicao_instantanea(
    usuario_id: str, 
    nome_arquivo: str, 
    resultado_auditoria: Dict[str, Any], 
    laudo_json: Dict[str, Any]
) -> Dict[str, Any]:
    """
    PASSO 1 (Efeito UAU): Insere o contrato com status de rascunho instantâneo.
    A interface deve exibir a marca d'água baseada neste status.
    """
    payload = {
        "usuario_id": usuario_id,
        "nome_arquivo": nome_arquivo,
        "resultado_auditoria": resultado_auditoria,
        "laudo_json": laudo_json,
        "status": "rascunho_gerado" # Gatilho para o Front-end aplicar a marca d'água
    }
    
    response = supabase.table("auditorias_contratos").insert(payload).execute()
    return response.data[0] if response.data else {}


def avancar_etapa_linha_tempo(auditoria_id: str, novo_status: str) -> Dict[str, Any]:
    """
    PASSO 2 (Linha do Tempo): Atualiza o status conforme o avanço real do projeto.
    Valores recomendados para novo_status: 'em_revisao_contabil' ou 'em_revisao_bancaria'
    """
    status_permitidos = ["em_revisao_contabil", "em_revisao_bancaria"]
    if novo_status not in status_permitidos:
        raise ValueError(f"Status '{novo_status}' inválido para a linha do tempo.")
        
    response = supabase.table("auditorias_contratos") \
        .update({"status": novo_status}) \
        .eq("id", auditoria_id) \
        .execute()
        
    return response.data[0] if response.data else {}


def homologar_estatuto_definitivo(
    auditoria_id: str, 
    advogado_id: str, 
    parecer_admin: str, 
    url_estatuto_validado: str
) -> Dict[str, Any]:
    """
    PASSO 3 (Feedback do Admin): O advogado salva as correções e o parecer.
    O status muda para 'validado_oficial' (removendo a marca d'água no front)
    e dispara a notificação assíncrona por e-mail para o cliente.
    """
    payload = {
        "status": "validado_oficial",
        "advogado_id": advogado_id,
        "parecer_admin": parecer_admin,
        "url_estatuto_validado": url_estatuto_validado
    }
    
    # Executa a atualização no Supabase
    response = supabase.table("auditorias_contratos") \
        .update(payload) \
        .eq("id", auditoria_id) \
        .execute()
        
    if response.data:
        dados_auditoria = response.data[0]
        # Busca o e-mail do usuário associado na tabela perfis para enviar a notificação
        perfil_res = supabase.table("perfis") \
            .select("email_contato, nome_empresa") \
            .eq("id", dados_auditoria["usuario_id"]) \
            .execute()
            
        if perfil_res.data:
            email_cliente = perfil_res.data[0]["email_contato"]
            empresa_cliente = perfil_res.data[0]["nome_empresa"]
            
            # Dispara o e-mail assíncrono (Arquivo 2)
            enviar_email_homologacao(email_cliente, empresa_cliente)
            
        return dados_auditoria
    return {}