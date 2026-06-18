# arquivo: ia_advogado.py
from ai_proxy import AIProxy

class IAAdvogado:
    def __init__(self):
        self.proxy = AIProxy()

    def reescrever_contrato(self, texto_original, lista_erros):
        prompt = f"""
        Você é um Advogado Sênior especialista em Direito Societário, pautado na doutrina de Fabio Ulhoa Coelho.
        
        Sua tarefa é reescrever o contrato abaixo.
        
        CONTRATO ORIGINAL:
        {texto_original}
        
        ERROS/VETOS IDENTIFICADOS QUE DEVEM SER CORRIGIDOS:
        {lista_erros}
        
        INSTRUÇÕES:
        1. Reescreva o contrato aplicando as correções necessárias para que ele fique em conformidade com o Código Civil e a LSA.
        2. Mantenha o estilo jurídico formal e técnico.
        3. Se houver cláusulas omissas ou perigosas, redija-as.
        4. O output deve ser APENAS o contrato reescrito, pronto para ser copiado e assinado. Não coloque introduções ou explicações.
        """
        
        texto_reescrito, modelo = self.proxy.executar(prompt)
        return texto_reescrito, modelo