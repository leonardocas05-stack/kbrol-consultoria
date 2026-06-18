# arquivo: ia_corretora.py
from ai_proxy import AIProxy

class IACorretoraContratos:
    def __init__(self):
        self.proxy = AIProxy()

    def redigir_clausula_corretiva(self, motivo_veto: str, contexto_contrato: str) -> tuple:
        """Gera cláusula corretiva e retorna o texto e o modelo utilizado."""
        prompt = f"""
        Você é um Advogado Societário Sênior. 
        O nosso sistema automatizado analisou uma minuta de transformação societária e emitiu o seguinte VETO:
        "{motivo_veto}"

        Contexto adicional do contrato (se houver): {contexto_contrato}

        Sua missão é RESOLVER O PROBLEMA. Redija uma cláusula societária formal, direta e juridicamente blindada que o usuário possa copiar e colar no contrato dele para corrigir essa falha.
        
        Regras de Formatação:
        1. Entregue APENAS o texto da cláusula. Sem introduções como "Aqui está a cláusula...".
        2. Use linguagem estritamente jurídica e adequada para Sociedades Anônimas.
        3. Se o veto for sobre o Art. 1.114 do CC (Direito de Recesso), inclua prazos de pagamento justos e regras claras de apuração de haveres.
        """
        
        resposta_texto, modelo_usado = self.proxy.executar(prompt)
        return resposta_texto.strip(), modelo_usado