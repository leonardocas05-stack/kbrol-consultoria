import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def enviar_email_homologacao(email_destino: str, nome_empresa: str) -> bool:
    """
    Envia uma notificação por e-mail informando que o advogado revisou
    e liberou o documento oficial sem a marca d'água.
    """
    # Configurações de ambiente para o servidor de e-mail
    SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER", "seu_email@kbrol.com")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "sua_senha")

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = email_destino
    msg['Subject'] = f"Transição Societária Concluída - {nome_empresa} S.A."

    corpo_email = f"""
    Olá, Equipe {nome_empresa}!
    
    Ótimas notícias. O rascunho da sua transformação societária gerado pela nossa Inteligência Artificial foi revisado de ponta a ponta e homologado pelo nosso corpo jurídico especializado.
    
    A versão oficial do seu novo Estatuto Social (sem marcas d'água e pronta para assinatura) já está disponível no seu painel da KBROL Consultoria.
    
    Próximos passos visíveis na sua linha do tempo:
    1. Baixar o Estatuto validado.
    2. Coletar as assinaturas dos acionistas fundadores.
    3. Seguir as orientações do laudo para registro na Junta Comercial.
    
    Se houver qualquer dúvida, você pode abrir um ticket diretamente pelo nosso sistema.
    
    Cordialmente,
    KBROL Consultores Jurídicos
    Advocacia Aumentada
    """
    
    msg.attach(MIMEText(corpo_email, 'plain', 'utf-8'))

    try:
        # Bloco de envio via SMTP (pode ser mockado ou substituído por API no dia da apresentação)
        if not SMTP_USER or "seu_email" in SMTP_USER:
            print(f"[MOCK EMAIL] Simulação de envio para {email_destino}: Estatuto Homologado!")
            return True
            
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, email_destino, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Erro ao disparar e-mail de notificação: {e}")
        return False