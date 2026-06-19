# arquivo: ia_extratora.py
import json
from ai_proxy import AIProxy

class IAExtratoraDeDados:
    def __init__(self):
        self.proxy = AIProxy()

    def extrair_dados_para_json(self, texto_bruto_contrato: str) -> tuple:
        # AQUI É ONDE VOCÊ COLA A ESTRUTURA RÍGIDA
        prompt = f"""
        # PERSONA
        Você é um Engenheiro de Dados Jurídicos com doutorado em Direito Societário. 
        Sua tarefa é analisar minutas societárias e extrair dados para o modelo ContratoSocietario.

        # FORMATO DE SAÍDA (Siga rigorosamente)
        Retorne APENAS um JSON estrito. Use exatamente os nomes de campos abaixo:
        {{
            "tipo_sa": {{"valor": "S.A.", "justificativa": "..."}},
            "tipo_operacao": {{"valor": "Transformacao", "justificativa": "..."}},
            "nome_empresarial": {{"valor": "NOME DA EMPRESA S.A.", "justificativa": "..."}},
            "aprovacao_unanimidade": {{"valor": true, "justificativa": "..."}},
            "previsao_estatuto_anterior": {{"valor": false, "justificativa": "..."}},
            "prazo_oposicao_credores_dias": {{"valor": 60, "justificativa": "..."}},
            "capital_dividido_acoes": {{"valor": true, "justificativa": "..."}},
            "numero_socios": {{"valor": 2, "justificativa": "..."}},
            "percentual_acoes_sem_voto": {{"valor": 0.0, "justificativa": "..."}},
            "capital_composto_bens": {{"valor": false, "justificativa": "..."}},
            "percentual_deposito_banco": {{"valor": 10.0, "justificativa": "..."}},
            "conselho_administracao_estabelecido": {{"valor": true, "justificativa": "..."}},
            "objeto_social_preciso": {{"valor": true, "justificativa": "..."}},
            "reserva_legal_prevista_percentual": {{"valor": 5.0, "justificativa": "..."}}
        }}

        # CONTEXTO
        [TEXTO DO CONTRATO]
        {texto_bruto_contrato}
        """

        texto_resposta, modelo_usado = self.proxy.executar(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        try:
            dados_brutos = json.loads(texto_resposta)
            
            # --- LÓGICA DE TRANSFORMAÇÃO (ACHATAMENTO) ---
            dados_limpos = {}
            for campo, conteudo in dados_brutos.items():
                if isinstance(conteudo, dict) and "valor" in conteudo:
                    dados_limpos[campo] = conteudo["valor"]
                else:
                    dados_limpos[campo] = conteudo 
            
            return dados_limpos, modelo_usado
            
        except json.JSONDecodeError:
            raise ValueError("Falha da IA ao estruturar o contrato.")