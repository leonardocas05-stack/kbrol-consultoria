# arquivo: modelos.py
from pydantic import BaseModel
from typing import Optional

class ContratoSocietario(BaseModel):
    # Identificação Básica
    tipo_operacao: str = "Transformacao" 
    tipo_sa: str 
    nome_empresarial: str
    
    # Quóruns e Credores (Art. 1.114 e 1.115 CC)
    aprovacao_unanimidade: bool
    previsao_estatuto_anterior: bool = False
    prazo_oposicao_credores_dias: int
    
    # Direito de Recesso e Haveres
    previsao_direito_recesso: bool = True 
    prazo_pagamento_haveres_dias: Optional[int] = 0
    criterio_reembolso_dissidente: str | bool | None = "valor_contabil_historico"

    # Capital e Estrutura
    capital_dividido_acoes: bool
    numero_socios: int = 2
    percentual_acoes_sem_voto: float
    capital_composto_bens: bool
    bens_avaliados_peritos: Optional[bool] = False
    percentual_deposito_banco: float
    
    # Governança e Administração
    conselho_administracao_estabelecido: bool
    # 🟢 CONSERTO DO ATTRIBUTEERROR: Vincula o campo exato que a linha 96 do motor.py exige
    possui_conselho_administracao: bool = False 
    numero_diretores: int = 1
    administradores_com_impedimento_legal: bool = False
    
    # Conselho Fiscal 
    conselho_fiscal_permanente: bool = False
    numero_membros_conselho_fiscal: int = 0
    
    # Dividendos e Reservas Obrigatórias (Novo)
    percentual_dividendo_obrigatorio: Optional[float] = None
    regras_dividendos_definidas: bool = False
    percentual_reserva_legal_obrigatoria: float = 0.0
    teto_reserva_legal_percentual: float = 0.0
    reserva_legal_prevista_percentual: float
    
    # Assembleias 
    prazo_convocacao_assembleia_dias: int = 0
    quoruns_instalacao_previstos: bool = False
    
    # Exercício e Dissolução 
    exercicio_social_definido: bool = False
    previsao_demonstracoes_financeiras: bool = False
    regras_dissolucao_definidas: bool = False
    foro_eleito: Optional[str] = None
    
    # Extras
    objeto_social_preciso: bool
    registro_cvm: Optional[bool] = False