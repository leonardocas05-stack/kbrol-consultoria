# arquivo: ia_extratora.py
import json
from ia_base import BaseIA

class IAExtratoraDeDados(BaseIA):
    def extrair_dados_para_json(self, texto_bruto_contrato: str) -> tuple:
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
            "previsao_direito_recesso": {{"valor": true, "justificativa": "..."}},
            "prazo_pagamento_haveres_dias": {{"valor": 0, "justificativa": "..."}},
            "criterio_reembolso_dissidente": {{"valor": "valor_contabil_historico", "justificativa": "..."}},
            "capital_dividido_acoes": {{"valor": true, "justificativa": "..."}},
            "definicao_valor_nominal_acoes": {{"valor": false, "justificativa": "..."}},
            "numero_socios": {{"valor": 2, "justificativa": "..."}},
            "percentual_acoes_sem_voto": {{"valor": 0.0, "justificativa": "..."}},
            "capital_composto_bens": {{"valor": false, "justificativa": "..."}},
            "bens_avaliados_peritos": {{"valor": false, "justificativa": "..."}},
            "percentual_deposito_banco": {{"valor": 10.0, "justificativa": "..."}},
            "conselho_administracao_estabelecido": {{"valor": true, "justificativa": "..."}},
            "possui_conselho_administracao": {{"valor": false, "justificativa": "..."}},
            "numero_membros_conselho_administracao": {{"valor": 0, "justificativa": "..."}},
            "numero_diretores": {{"valor": 1, "justificativa": "..."}},
            "administradores_com_impedimento_legal": {{"valor": false, "justificativa": "..."}},
            "conselho_fiscal_permanente": {{"valor": false, "justificativa": "..."}},
            "numero_membros_conselho_fiscal": {{"valor": 0, "justificativa": "..."}},
            "percentual_dividendo_obrigatorio": {{"valor": null, "justificativa": "..."}},
            "regras_dividendos_definidas": {{"valor": false, "justificativa": "..."}},
            "percentual_reserva_legal_obrigatoria": {{"valor": 0.0, "justificativa": "..."}},
            "teto_reserva_legal_percentual": {{"valor": 0.0, "justificativa": "..."}},
            "reserva_legal_prevista_percentual": {{"valor": 0.0, "justificativa": "..."}},
            "prazo_convocacao_assembleia_dias": {{"valor": 0, "justificativa": "..."}},
            "quoruns_instalacao_previstos": {{"valor": false, "justificativa": "..."}},
            "exercicio_social_definido": {{"valor": false, "justificativa": "..."}},
            "previsao_demonstracoes_financeiras": {{"valor": false, "justificativa": "..."}},
            "regras_dissolucao_definidas": {{"valor": false, "justificativa": "..."}},
            "foro_eleito": {{"valor": null, "justificativa": "..."}},
            "objeto_social_preciso": {{"valor": true, "justificativa": "..."}},
            "registro_cvm": {{"valor": false, "justificativa": "..."}}
        }}

        # CONTEXTO
        [TEXTO DO CONTRATO]
        {texto_bruto_contrato}
        """

        # Executa via BaseIA
        texto_resposta, modelo_usado = self.executar(prompt, is_json=True)
        
        try:
            dados_brutos = json.loads(texto_resposta)
            
            # --- LÓGICA DE TRANSFORMAÇÃO (ACHATAMENTO E LIMPEZA) ---
            dados_limpos = {}
            for campo, conteudo in dados_brutos.items():
                val = conteudo.get("valor") if isinstance(conteudo, dict) else conteudo
                
                # Tratamento de nulos/vazios e fallbacks seguros para o Pydantic
                if val is None or val is False:
                    if campo in ["nome_empresarial", "tipo_sa", "tipo_operacao"]:
                        val = "NÃO IDENTIFICADO"
                    elif campo in ["numero_socios"]:
                        val = 2
                    elif campo in ["numero_diretores"]:
                        val = 1
                    elif campo in ["numero_membros_conselho_fiscal", "numero_membros_conselho_administracao", "prazo_convocacao_assembleia_dias"]:
                        val = 0
                    elif campo in ["percentual_acoes_sem_voto", "percentual_deposito_banco", "percentual_reserva_legal_obrigatoria", "teto_reserva_legal_percentual", "reserva_legal_prevista_percentual"]:
                        val = 0.0
                    elif campo in ["percentual_dividendo_obrigatorio", "foro_eleito"]:
                        val = None  # Mantém a assinatura opcional do Pydantic
                    else:
                        val = False  # Booleans padrão
                
                dados_limpos[campo] = val
            
            return dados_limpos, modelo_usado
            
        except json.JSONDecodeError:
            raise ValueError("Falha da IA ao estruturar o contrato com o novo esquema.")