# arquivo: ia_auditora.py
import os
import json
from ai_proxy import AIProxy

class IAAuditoraJurisprudencial:
    def __init__(self):
        caminho_json = os.path.join(os.path.dirname(__file__), "jurisprudencia.json")
        with open(caminho_json, "r", encoding="utf-8") as f:
            self.banco_jurisprudencia = json.load(f)
        self.proxy = AIProxy()

    def analisar_contrato_com_jurisprudencia(self, texto_contrato: str) -> tuple:
        """Analisa contrato e retorna o parecer e o modelo utilizado."""
        contexto_teses = json.dumps(self.banco_jurisprudencia, ensure_ascii=False)
        prompt = f"""
        Você é um Auditor Jurídico Sênior, especialista em Direito Societário e Tribunais Superiores (STF e STJ).
        Sua missão é realizar um "Compliance Check" preventivo em minutas contratuais, cruzando-as com o nosso Banco de Jurisprudência.

        DADOS DE ENTRADA:
        - Banco de Jurisprudência: {contexto_teses}
        - Minuta do Contrato: {texto_contrato}

        INSTRUÇÕES DE EXECUÇÃO:
        1. ANÁLISE CRÍTICA: Examine minuciosamente cada cláusula da minuta. Verifique se o conteúdo entra em rota de colisão com as teses fornecidas.
        2. MAPEAMENTO: Identifique a cláusula específica que gera risco e relacione-a ao tema jurídico correspondente do banco.
        3. ESTRUTURAÇÃO: Se encontrar riscos, extraia o "alerta_gerado" exato do banco de dados para garantir rastreabilidade.

        SAÍDA OBRIGATÓRIA (JSON ESTRITO):
        Retorne a resposta estritamente no formato JSON. Não escreva textos antes ou depois do bloco.

        {{
        "conformidade": boolean,
        "riscos_identificados": [
            {{
            "tema_juridico": "string",
            "clausula_envolvida": "string",
            "explicacao_risco": "análise técnica detalhada sobre o risco",
            "alerta_gerado": "texto exato do alerta definido no JSON de jurisprudência"
            }}
        ],
        "parecer_juridico": "Resumo executivo sobre o nível de segurança jurídica da minuta"
        }}

        REGRAS DE FORMATAÇÃO:
        - Se o contrato estiver 100% seguro, "conformidade" deve ser true e "riscos_identificados" uma lista vazia.
        - Se houver riscos, "conformidade" deve ser false.
        - Utilize terminologia jurídica precisa e formal.
        - Não omita informações essenciais; o campo "alerta_gerado" deve ser fiel ao input fornecido.
        """
        # Envia a ordem estruturada para a IA e recolhe a resposta
        resposta_texto, modelo_usado = self.proxy.executar(prompt)
        return resposta_texto, modelo_usado