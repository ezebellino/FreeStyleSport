from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    first_name: str | None = Field(default=None, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=40)


class ConfirmEmailRequest(BaseModel):
    token: str = Field(min_length=16)


class ResendConfirmationRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str


class CsrfResponse(BaseModel):
    csrf_token: str


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    role: str
    email_confirmed: bool
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
