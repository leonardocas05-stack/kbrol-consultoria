# arquivo: ia_extratora.py
import json
from ai_proxy import AIProxy

class IAExtratoraDeDados:
    def __init__(self):
        # Inicializa o proxy que gerencia a fila de modelos
        self.proxy = AIProxy()

    def extrair_dados_para_json(self, texto_bruto_contrato: str) -> tuple:
        prompt = f"""
        Você é um Extrator de Dados Jurídicos especializado em Direito Empresarial. 
        Sua única função é ler a minuta societária abaixo e extrair as informações no formato JSON estrito.

        [TEXTO DO CONTRATO BRUTO]
        {texto_bruto_contrato}

        [ESTRUTURA JSON OBRIGATÓRIA]
        Extraia os valores. Se a informação não existir no contrato, use falsos seguros (false para booleanos, 0 para números, "" para strings).
        Retorne EXATAMENTE este formato JSON:
        {{
            "tipo_operacao": "Transformacao",
            "tipo_sa": "Aberta ou Fechada",
            "aprovacao_unanimidade": true ou false,
            "previsao_estatuto_anterior": true ou false,
            "prazo_oposicao_credores_dias": (número inteiro),
            "previsao_direito_recesso": true ou false,
            "prazo_pagamento_haveres_dias": (número inteiro),
            "criterio_reembolso_dissidente": "valor_contabil_historico ou balanco_determinacao",
            "nome_empresarial": "Nome da Empresa S.A.",
            "objeto_social_preciso": true ou false,
            "capital_dividido_acoes": true ou false,
            "numero_socios": (número inteiro),
            "percentual_acoes_sem_voto": (número float),
            "capital_composto_bens": true ou false,
            "bens_avaliados_peritos": true ou false,
            "percentual_deposito_banco": (número float),
            "registro_cvm": true ou false,
            "conselho_administracao_estabelecido": true ou false,
            "conselho_fiscal_estabelecido": true ou false,
            "reserva_legal_prevista_percentual": (número float),
            "regras_dividendos_definidas": true ou false
        }}
        """
       # O Proxy retorna (texto_resposta, nome_modelo)
        texto_resposta, modelo_usado = self.proxy.executar(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        try:
            return json.loads(texto_resposta), modelo_usado
        except json.JSONDecodeError:
            raise ValueError("Falha da IA ao estruturar o contrato.")