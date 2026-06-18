# arquivo: ia_corretora.py
from ai_proxy import AIProxy

class IACorretoraContratos:
    def __init__(self):
        self.proxy = AIProxy()

    def redigir_clausula_corretiva(self, motivo_veto: str, contexto_contrato: str) -> tuple:
        """Gera cláusula corretiva e retorna o texto e o modelo utilizado."""
        prompt = f"""
            Você é um Advogado Societário Sênior, especialista em Lei das S.A. (Lei 6.404/76) e Código Civil.
            Sua tarefa é atuar como um auditor de conformidade jurídica em um sistema automatizado de transformação societária.

            DADOS DE ENTRADA:
            - Veto do Sistema: "{motivo_veto}"
            - Contexto do Contrato: "{contexto_contrato}"

            INSTRUÇÕES DE EXECUÇÃO:
            1. ANÁLISE JURÍDICA: Primeiro, interprete o veto à luz da legislação societária vigente.
            2. ESTRATÉGIA: Formule a correção considerando a "blindagem" do ato jurídico contra nulidades, vícios ou passivos.
            3. REDAÇÃO: Redija a cláusula técnica, formal, clara e objetiva.

            REGRAS DE FORMATAÇÃO E ESTRUTURA (SAÍDA OBRIGATÓRIA EM JSON):
            Entregue a resposta estritamente no formato JSON abaixo. Não escreva nada antes ou depois do bloco JSON.

            {{
            "clausula": "Texto integral da cláusula jurídica pronta para cópia (evite introduções ou parênteses explicativos).",
            "fundamentacao": "Breve justificativa técnica e legal (baseada em artigos da Lei 6.404/76 ou CC) que explica por que esta redação resolve o veto.",
            "dica_implementacao": "Caso haja algum requisito específico de preenchimento (ex: 'inserir valor de capital', 'definir prazo'), indique aqui de forma clara."
            }}

            REGRAS DE CONTEÚDO:
            - Se o veto envolver Direito de Retirada (Art. 1.114 CC), a cláusula DEVE obrigatoriamente prever o critério de apuração de haveres (balanço de determinação) e prazos de pagamento.
            - Utilize terminologia técnica precisa (ex: 'apuração de haveres', 'quórum de instalação', 'quitação plena').
            - Evite linguagem ambígua que possa gerar conflitos de interpretação em futuras Assembleias ou disputas judiciais.
            """
        
        resposta_texto, modelo_usado = self.proxy.executar(prompt)
        return resposta_texto.strip(), modelo_usado