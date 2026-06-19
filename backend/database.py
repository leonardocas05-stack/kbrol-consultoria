# arquivo: database.py
import json
from config import supabase # Importação direta da instância única

def salvar_historico(user_id, resultado_final, file_hash, filename):
    """
    Persiste o laudo no Supabase. 
    Nota: Não precisamos mais passar 'supabase' como argumento.
    """
    try:
        # Preparamos o dicionário de dados
        dados_insercao = {
            "usuario_id": user_id,
            "laudo_json": json.dumps(resultado_final),
            "file_hash": file_hash,
            "nome_arquivo": filename 
        }

        # A instância 'supabase' agora é global dentro deste arquivo
        response = supabase.table("auditorias_contratos").insert(dados_insercao).execute()
        
        if response.data and len(response.data) > 0:
            novo_id = response.data[0]['id']
            print(f"Sucesso: Histórico salvo com ID {novo_id}")
            return novo_id
        
        return None

    except Exception as e:
        print(f"ERRO CRÍTICO AO SALVAR NO SUPABASE: {e}")
        return None