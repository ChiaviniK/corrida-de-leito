import sys
from .database import SessionLocal, engine, Base
from .models import Usuario
from .auth import hash_password

# Garante que as tabelas existam
Base.metadata.create_all(bind=engine)


def criar_ou_atualizar_usuario(username: str, senha: str, nome: str = None, role: str = "ADMIN"):
    db = SessionLocal()
    try:
        u_limpo = username.strip().lower()
        usuario = db.query(Usuario).filter(Usuario.username == u_limpo).first()
        hashed = hash_password(senha)

        if usuario:
            usuario.password_hash = hashed
            if nome:
                usuario.nome = nome.strip()
            usuario.role = role
            usuario.ativo = True
            db.commit()
            print(f"[OK] Usuário '{u_limpo}' atualizado com sucesso!")
        else:
            novo = Usuario(
                username=u_limpo,
                nome=(nome or username).strip(),
                password_hash=hashed,
                role=role,
                ativo=True
            )
            db.add(novo)
            db.commit()
            print(f"[OK] Usuário '{u_limpo}' cadastrado com sucesso! (Nome: {novo.nome}, Perfil: {novo.role})")
    finally:
        db.close()


def listar_usuarios():
    db = SessionLocal()
    try:
        usuarios = db.query(Usuario).all()
        print(f"\n--- Usuários Cadastrados ({len(usuarios)}) ---")
        for u in usuarios:
            status = "Ativo" if u.ativo else "Inativo"
            print(f"- {u.username} | Nome: {u.nome} | Perfil: {u.role} | Status: {status}")
        print("----------------------------------------\n")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python -m apps.api.manage_users add <username> <senha> [nome] [role]")
        print("  python -m apps.api.manage_users list")
        print("  python -m apps.api.manage_users passwd <username> <nova_senha>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "list":
        listar_usuarios()
    elif cmd == "add" and len(sys.argv) >= 4:
        usr = sys.argv[2]
        pwd = sys.argv[3]
        nm = sys.argv[4] if len(sys.argv) > 4 else usr.capitalize()
        rl = sys.argv[5] if len(sys.argv) > 5 else "ADMIN"
        criar_ou_atualizar_usuario(usr, pwd, nm, rl)
    elif cmd == "passwd" and len(sys.argv) >= 4:
        usr = sys.argv[2]
        pwd = sys.argv[3]
        criar_ou_atualizar_usuario(usr, pwd)
    else:
        print("Comando inválido.")
