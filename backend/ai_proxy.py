# arquivo: ai_proxy.py
import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class AIProxy:
    def __init__(self):
        # Lista limpa: apenas modelos que seu debug confirmou existir
        self.fila_modelos = [
            "models/gemini-3.1-flash-lite", 
            "models/gemini-2.0-flash"
        ]
    
    def executar(self, prompt, generation_config=None):
        for nome_modelo in self.fila_modelos:
            try:
                print(f"Tentando o modelo: {nome_modelo}")
                model = genai.GenerativeModel(nome_modelo)
                resposta = model.generate_content(prompt, generation_config=generation_config)
                
                if resposta.text:
                    print(f"SUCESSO! Modelo {nome_modelo} respondeu.")
                    return resposta.text, nome_modelo
            
            except Exception as e:
                erro_str = str(e)
                print(f"Falha no {nome_modelo}: {erro_str}")
                
                if "429" in erro_str or "RESOURCE_EXHAUSTED" in erro_str:
                    print("!!! Cota atingida. Este modelo está indisponível hoje.")
                    continue # Pula para o próximo modelo da lista
                continue
        
        raise Exception("Todos os modelos configurados falharam ou estão sem cota.")