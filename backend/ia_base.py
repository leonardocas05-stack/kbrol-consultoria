# arquivo: ia_base.py
from ai_proxy import AIProxy

class BaseIA:
    def __init__(self):
        self.proxy = AIProxy()

    def executar(self, prompt, is_json=False):
        """Padroniza a chamada ao proxy para todas as classes filhas."""
        config = {"response_mime_type": "application/json"} if is_json else None
        
        # Aqui centralizamos a lógica de chamada e tratamento básico de erro
        texto, modelo = self.proxy.executar(prompt, generation_config=config)
        return texto, modelo