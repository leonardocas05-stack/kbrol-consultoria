# arquivo: ia_extratora.py
import json
from ai_proxy import AIProxy

class IAExtratoraDeDados:
    def __init__(self):
        # Inicializa o proxy que gerencia a fila de modelos
        self.proxy = AIProxy()

    def extrair_dados_para_json(self, texto_bruto_contrato: str) -> tuple:
        prompt = f"""
        # PERSONA
        Você é um Engenheiro de Dados Jurídicos com doutorado em Direito Societário. Sua precisão é cirúrgica. Sua tarefa é analisar minutas societárias e extrair dados para automação de conformidade.

        # DIRETRIZES DE PENSAMENTO (Chain of Thought)
        Antes de gerar o JSON, siga rigorosamente este processo para cada campo:
        1. LEITURA: Identifique a cláusula ou parágrafo relevante no [TEXTO DO CONTRATO].
        2. ANÁLISE: Avalie se a informação é explícita, implícita ou ausente.
        3. VALIDAÇÃO: Se o dado for ausente ou ambíguo, NÃO invente. Utilize os valores padrão definidos abaixo.
        4. ATRIBUIÇÃO: Para cada campo extraído, forneça a "justificativa" (o trecho original do texto que sustenta sua resposta).

        # REGRAS DE EXTRAÇÃO
        - Se o campo for BOOLEANO (true/false) e a informação não existir: use `false`.
        - Se o campo for NUMÉRICO (inteiro/float) e não existir: use `0`.
        - Se o campo for STRING e não existir: use `""` (vazio).
        - Se houver conflito entre cláusulas, dê prioridade à cláusula mais específica ou à última alteração descrita no documento.

        # FORMATO DE SAÍDA
        Retorne APENAS um JSON estrito, seguindo esta estrutura para cada campo:
        {{
            "nome_do_campo": {{
                "valor": "o valor extraído conforme tipo",
                "justificativa": "O trecho exato do contrato que embasa este valor"
            }}
        }}

        # CONTEXTO
        [TEXTO DO CONTRATO]
        {texto_bruto_contrato}

        Inicie a extração agora.
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