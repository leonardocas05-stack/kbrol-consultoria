# arquivo: auth_service.py
from fastapi import HTTPException, Header
from config import supabase # Correto, mantendo a instância única

def validar_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token ausente.")
    
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Sessão inválida.")