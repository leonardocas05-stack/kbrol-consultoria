# arquivo: ia_advogado.py
from ia_base import BaseIA

class IAAdvogado(BaseIA):
    def reescrever_contrato(self, texto_original, lista_erros) -> tuple:
        """
        Reescreve o contrato aplicando correções cirúrgicas.
        """
        prompt = f"""
        Você é um Advogado Societário Sênior, autoridade na doutrina de Fabio Ulhoa Coelho e especialista na Lei 6.404/76 e Código Civil Brasileiro.

        DADOS DE ENTRADA:
        - Texto Original: {texto_original}
        - Erros/Vetos Técnicos que exigem correção: {lista_erros}

        INSTRUÇÕES DE EXECUÇÃO (OBRIGATÓRIO):
        1. REESCRITA CIRÚRGICA: Sua missão é corrigir EXCLUSIVAMENTE os pontos listados nos "Erros/Vetos". 
        2. PRESERVAÇÃO DE INTEGRIDADE: O restante do contrato (cláusulas que não foram objeto de erro) deve ser mantido exatamente como está, respeitando a estrutura, numeração original e terminologia. NÃO reescreva cláusulas íntegras.
        3. CONFIABILIDADE DOUTRINÁRIA: As correções devem refletir a clareza e o rigor jurídico de Fabio Ulhoa Coelho, focando em segurança jurídica e governança corporativa.
        4. CONSISTÊNCIA SISTÊMICA: Se a alteração de uma cláusula impactar referências cruzadas em outras partes do contrato (ex: numeração de artigos ou definições), ajuste-as automaticamente para evitar contradições internas.

        FORMATO DE SAÍDA (ESTRITO):
        - Entregue APENAS o texto completo do contrato, pronto para ser copiado e assinado.
        - NÃO escreva introduções ("Aqui está o contrato...").
        - NÃO escreva explicações sobre o que foi feito.
        - NÃO utilize blocos de código (markdown com ```), apenas o texto limpo do documento.
        - Mantenha a formatação de espaçamento e parágrafos limpa.
        """
        
        # Executa via BaseIA (is_json=False pois a saída é texto plano)
        texto_reescrito, modelo = self.executar(prompt, is_json=False)
        
        return texto_reescrito, modelo