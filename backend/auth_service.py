# arquivo: auth_service.py
from fastapi import HTTPException, Header
from config import supabase # Importação neutra

# No arquivo auth_service.py
def validar_token(authorization: str = Header(None)):
    print(f"DEBUG: Header recebido: {authorization}") # <-- ADICIONE ISSO
    if not authorization:
        raise HTTPException(status_code=401, detail="Token ausente.")
    
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        print(f"DEBUG: Usuário validado: {user.user.id}") # <-- ADICIONE ISSO
        return user
    except Exception as e:
        print(f"DEBUG: ERRO NA VALIDAÇÃO DO TOKEN: {e}") # <-- ADICIONE ISSO
        raise HTTPException(status_code=401, detail="Sessão inválida.")