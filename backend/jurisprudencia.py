# arquivo: jurisprudencia.py
from modelos import ContratoSocietario

class OraculoJurisprudencial:
    def __init__(self, contrato: ContratoSocietario):
        self.contrato = contrato
        self.risco_global = "BAIXO"
        self.alertas = []

    def analisar_reembolso_dissidente(self):
        # Tese pacificada do STJ: O reembolso de ações não pode ser por valor contábil defasado, 
        # deve refletir o valor patrimonial real (Balanço de Determinação) para evitar enriquecimento ilícito.
        criterio = self.contrato.criterio_reembolso_dissidente.lower()
        
        if criterio in ["valor_contabil", "valor_contabil_historico"]:
            self.risco_global = "ALTO"
            self.alertas.append({
                "tema": "Direito de Recesso e Reembolso",
                "tribunal": "STJ",
                "risco": "ALTO",
                "parecer": "O STJ consolidou o entendimento de que a apuração de haveres do sócio retirante "
                           "deve ocorrer mediante Balanço de Determinação (valor real), e não valor contábil histórico. "
                           "Cláusula com alta probabilidade de anulação em caso de judicialização."
            })
        elif criterio == "balanco_determinacao":
            self.alertas.append({
                "tema": "Direito de Recesso e Reembolso",
                "tribunal": "STJ",
                "risco": "BAIXO",
                "parecer": "Critério de Balanço de Determinação alinhado com a jurisprudência pacífica do STJ."
            })

    def executar_analise_preditiva(self):
        self.analisar_reembolso_dissidente()
        
        return {
            "nivel_risco_litigio": self.risco_global,
            "analise_tribunais": self.alertas
        }