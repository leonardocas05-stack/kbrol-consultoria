# arquivo: ia_triagem.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class IATriagemSugestoes:
    def __init__(self):
        # Inicializa o modelo focado apenas em classificação e pareceres
        self.model = genai.GenerativeModel("models/gemini-3.5-flash")

    def fazer_triagem_de_sugestao(self, tipo: str, conteudo: str) -> str:
        """
        Lê uma sugestão enviada por um usuário e gera um parecer técnico
        para o administrador do sistema decidir se aprova ou não.
        """
        prompt = f"""
        Você é o Assessor Técnico de uma Legaltech. Um usuário sugeriu a inclusão da seguinte norma/decisão no sistema:
        Tipo: {tipo}
        Conteúdo Sugerido: {conteudo}

        Sua tarefa é gerar um relatório preliminar para o ADMINISTRADOR do site. Responda estruturadamente:
        1. RELEVÂNCIA: Essa sugestão é de fato relevante para o Direito Societário, Fusões, Cisões, Transformações ou Lei das S.A.? (Responda SIM ou NÃO e justifique brevemente).
        2. IMPACTO: Se for relevante, qual o impacto prático que ela traz para a auditoria de contratos?
        3. RECOMENDAÇÃO: Você recomenda que o Administrador adicione isso ao banco de dados definitivo? (Aprovar / Rejeitar).
        """
        resposta = self.model.generate_content(prompt)
        return resposta.text