import json

def salvar_historico(supabase, user_id, resultado_final, file_hash, filename):
    """
    Persiste o laudo no Supabase e retorna o ID da nova linha.
    """
    try:
        # Preparamos o dicionário de dados
        dados_insercao = {
            "usuario_id": user_id,
            "laudo_json": json.dumps(resultado_final),
            "file_hash": file_hash,
            "nome_arquivo": filename 
        }

        # A sintaxe correta do supabase-py é .insert(Dicionario).execute()
        response = supabase.table("auditorias_contratos").insert(dados_insercao).execute()
        
        # O Supabase retorna a linha criada no campo 'data'
        # Extraímos o ID para que possamos usar no frontend (download do PDF)
        if response.data and len(response.data) > 0:
            novo_id = response.data[0]['id']
            print(f"Sucesso: Histórico salvo com ID {novo_id}")
            return novo_id
        
        return None

    except Exception as e:
        print(f"ERRO CRÍTICO AO SALVAR NO SUPABASE: {e}")
        # Retornamos None para que o main.py saiba que falhou
        return None