# arquivo: sugestoes.py
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

# Importação da classe de triagem (deve estar na mesma pasta ou no path)
# rom ia_triagem import IATriagemSugestoes

router = APIRouter(
    prefix="/sugestoes",
    tags=["Módulo de Sugestões (Usuário & Admin)"]
)

# Inicializa o motor de IA especialista
triagem_ia = IATriagemSugestoes()

# Inicialização segura do cliente Supabase para este módulo
def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)

class NovaSugestao(BaseModel):
    tipo: str  # 'Lei' ou 'Jurisprudência'
    conteudo_bruto: str

@router.post("/enviar")
def enviar_sugestao_usuario(dados: NovaSugestao):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Configuração do Supabase ausente.")
        
    try:
        # A IA realiza a triagem técnica antes de salvar no banco
        parecer_ia = triagem_ia.fazer_triagem_de_sugestao(dados.tipo, dados.conteudo_bruto)
        
        # Estrutura para inserção
        nova_linha = {
            "tipo": dados.tipo,
            "conteudo_bruto": dados.conteudo_bruto,
            "analise_ia": parecer_ia,
            "status": "pendente"
        }
        
        # Salva no banco de dados
        supabase.table("sugestoes_jurisprudencia").insert(nova_linha).execute()
        
        return {
            "sucesso": True, 
            "mensagem": "Sugestão processada pela IA e enviada para revisão administrativa."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao enviar sugestão: {str(e)}")

@router.get("/admin/pendentes")
def listar_sugestoes_admin():
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Configuração do Supabase ausente.")
        
    try:
        # Busca apenas registros pendentes de revisão
        resposta = supabase.table("sugestoes_jurisprudencia").select("*").eq("status", "pendente").execute()
        
        return {"sugestoes_para_revisao": resposta.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar sugestões: {str(e)}")

        