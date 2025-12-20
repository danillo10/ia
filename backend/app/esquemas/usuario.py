from pydantic import BaseModel, EmailStr, Field

class UsuarioBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr

class UsuarioLeitura(UsuarioBase):
    id: int
    papel: str
    class Config:
        from_attributes = True

class UsuarioCriacao(UsuarioBase):
    senha: str = Field(min_length=6, max_length=128)
    telefone: str | None = None
    papel: str = "passageiro"
