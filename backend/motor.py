# arquivo: motor.py
from modelos import ContratoSocietario

class MotorAuditoriaSA:
    def __init__(self, contrato: ContratoSocietario):
        self.contrato = contrato
        self.relatorio = []
        self.aprovado = True

    # --- MÓDULOS DE VALIDAÇÃO (SEGUINDO O PADRÃO SOLICITADO) ---

    def auditar_conselho_fiscal(self):
        erros = []
        if self.contrato.conselho_fiscal_permanente:
            if not (3 <= self.contrato.numero_membros_conselho_fiscal <= 5):
                erros.append("VETO (Art. 161 LSA): O Conselho Fiscal deve ter entre 3 e 5 membros.")
        return erros

    def auditar_administracao(self):
        erros = []
        if self.contrato.numero_diretores < 1:
            erros.append("VETO (Art. 143 LSA): A S.A. deve ter pelo menos um diretor nomeado.")
        if self.contrato.administradores_com_impedimento_legal:
            erros.append("VETO (Art. 147 LSA): Identificado administrador com impedimento legal para o exercício do cargo.")
        return erros

    def auditar_dividendos(self):
        erros = []
        if self.contrato.percentual_dividendo_obrigatorio is None or self.contrato.percentual_dividendo_obrigatorio < 0:
            erros.append("VETO (Art. 202 LSA): O estatuto deve definir a porcentagem de dividendos obrigatórios.")
        return erros

    def auditar_assembleias(self):
        erros = []
        if self.contrato.prazo_convocacao_assembleia_dias < 8:
            erros.append("VETO (Art. 124 LSA): Prazo de convocação de assembleia inferior ao mínimo legal (8 dias).")
        if not self.contrato.quoruns_instalacao_previstos:
            erros.append("VETO (Art. 125 LSA): Estatuto omisso quanto ao quórum de instalação das Assembleias.")
        return erros

    def auditar_identidade_e_capital(self):
        erros = []
        # Art. 3 LSA
        nome = self.contrato.nome_empresarial.lower()
        if not any(t in nome for t in ["s.a.", "s/a", "companhia", "cia"]):
            erros.append("VETO (Art. 3 LSA): Nome empresarial deve conter identificadores de S.A.")
        
        # Art. 80 LSA
        if self.contrato.numero_socios < 2:
            erros.append("VETO (Art. 80 LSA): A S.A. necessita de no mínimo 2 sócios fundadores.")
        if self.contrato.percentual_deposito_banco < 10:
            erros.append("VETO (Art. 80 LSA): Mínimo de 10% do capital subscrito em dinheiro deve ser depositado.")
            
        # Art. 8 LSA
        if self.contrato.capital_composto_bens and not self.contrato.bens_avaliados_peritos:
            erros.append("VETO (Art. 8 LSA): Capital constituído com bens exige avaliação por peritos.")
        return erros

    def auditar_transformacao_e_dissidencia(self):
        erros = []
        # Arts. 1.114 CC e 220 LSA
        if not self.contrato.aprovacao_unanimidade and not self.contrato.previsao_estatuto_anterior:
            erros.append("VETO (Art. 1.114 CC): Transformação exige unanimidade OU previsão em estatuto anterior.")
        
        # Art. 1.115 CC
        if self.contrato.prazo_oposicao_credores_dias < 60:
            erros.append("VETO (Art. 1.115 CC): Prazo de oposição de credores inferior a 60 dias.")
            
        # Direito de Recesso
        if not self.contrato.aprovacao_unanimidade and not self.contrato.previsao_direito_recesso:
            erros.append("VETO (Art. 1.114 CC): Necessária previsão de Direito de Recesso para dissidentes.")
        return erros

    def auditar_exercicio_e_dissolucao(self):
        erros = []
        if not self.contrato.exercicio_social_definido:
            erros.append("VETO (Art. 175 LSA): Exercício social não definido ou com duração fora do padrão legal (1 ano).")
        if not self.contrato.regras_dissolucao_definidas:
            erros.append("VETO (Art. 206 LSA): Estatuto deve prever claramente as causas e o procedimento de dissolução.")
        return erros

    # --- ORQUESTRADOR ---

    def executar_auditoria_completa(self):
        # Consolida todas as listas de erros
        lista_checagens = [
            self.auditar_conselho_fiscal(),
            self.auditar_administracao(),
            self.auditar_dividendos(),
            self.auditar_assembleias(),
            self.auditar_identidade_e_capital(),
            self.auditar_transformacao_e_dissidencia(),
            self.auditar_exercicio_e_dissolucao()
        ]
        
        # Limpa o estado atual antes de rodar
        self.relatorio = []
        self.aprovado = True
        
        # Processa os erros
        for erros in lista_checagens:
            if erros:
                self.aprovado = False
                self.relatorio.extend(erros)
        
        return {
            "status": "APROVADO" if self.aprovado else "REJEITADO",
            "parecer": self.relatorio
        }