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
        Atue como um Auditor Jurídico Sénior, especialista em Direito Societário e Tribunais Superiores (STF e STJ).
        Sua tarefa é analisar criticamente a minuta de contrato fornecida e verificar se ela viola ou entra em rota de colisão com alguma das teses do nosso Banco de Jurisprudência.

        [BANCO DE JURISPRUDÊNCIA INTEGRADO]
        {contexto_teses}

        [MINUTA DO CONTRATO A SER AVALIADA]
        {texto_contrato}

        [DIRETRIZES DE AUDITORIA]
        Examine minuciosamente o contrato. Se identificar que alguma cláusula aciona os gatilhos de risco do Banco de Jurisprudência:
        1. Identifique explicitamente qual é o "tema_juridico" afetado.
        2. Explique detalhadamente o risco com base no texto encontrado na minuta.
        3. Copie integralmente o texto do "alerta_gerado" que definimos no nosso JSON para o relatório final.

        Se o contrato estiver totalmente seguro perante as teses fornecidas, responda declarando que nenhuma inconformidade jurisprudencial foi detetada para o escopo avaliado.
        """

        # Envia a ordem estruturada para a IA e recolhe a resposta
        resposta_texto, modelo_usado = self.proxy.executar(prompt)
        return resposta_texto, modelo_usado