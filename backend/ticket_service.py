# arquivo: ticket_service.py
from fastapi import APIRouter, Depends, HTTPException
from config import supabase 
from auth_service import validar_token

router = APIRouter()

# ROTA NOVA: Cria o ticket (o que faltava)
@router.post("/tickets/criar/")
async def criar_ticket(ticket_data: dict, user = Depends(validar_token)):
    print(f"DEBUG - Dados recebidos: {ticket_data}") # Ver o que chega do front
    try:
        payload = {
            "assunto": ticket_data.get("assunto"),
            "texto": ticket_data.get("texto"),
            "status": "aberto",
            "usuario_id": user.user.id
        }
        print(f"DEBUG - Payload para Supabase: {payload}")
        
        result = supabase.table("tickets").insert(payload).execute()
        
        print("DEBUG - Sucesso! Supabase respondeu.")
        return {"status": "sucesso", "data": result.data}
    except Exception as e:
        print(f"DEBUG - ERRO NO SUPABASE: {str(e)}") # O culpado aparecerá aqui!
        raise HTTPException(status_code=500, detail=str(e))
    

# ROTA EXISTENTE: Para responder/enviar mensagens no ticket
@router.post("/tickets/nova-mensagem/")
async def enviar_mensagem(ticket_id: str, texto: str, user = Depends(validar_token)):
    try:
        supabase.table("mensagens").insert({
            "ticket_id": ticket_id,
            "remetente_id": user.user.id,
            "texto": texto
        }).execute()
        return {"status": "sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# No arquivo ticket_service.py
@router.get("/tickets/me")
async def listar_meus_tickets(user = Depends(validar_token)):
    try:
        # Busca apenas tickets do usuário logado
        resultado = supabase.table("tickets")\
                            .select("*")\
                            .eq("usuario_id", user.user.id)\
                            .order("created_at", desc=True)\
                            .execute()
        return {"tickets": resultado.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))