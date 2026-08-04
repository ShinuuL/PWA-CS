# Correção da Criptografia dos Tokens do Spotify (Supabase)

## Problema

Ao autenticar no Spotify, ocorre o erro:

```text
encrypt refresh token result: FAIL
Could not find the function public.encrypt_token(p_token) in the schema cache
```

Após análise foi constatado que:

- A função `public.encrypt_token` **existe**.
- Ela possui a assinatura:

```sql
encrypt_token(
    p_token text,
    p_key text
)
```

- O código da Edge Function já está chamando corretamente:

```ts
await supabase.rpc("encrypt_token", {
  p_token: refresh_token,
  p_key: encryptionKey,
});
```

Portanto, o problema não está na chamada da função.

---

# Passo 1 - Criar o Secret da chave de criptografia

No Supabase Dashboard:

```
Project Settings
    ↓
Edge Functions
    ↓
Secrets
```

Adicionar um novo Secret:

| Nome | Valor |
|------|--------|
| TOKEN_ENCRYPTION_KEY | chave aleatória gerada |

---

## Gerando a chave

### Linux / macOS

```bash
openssl rand -base64 32
```

### Windows PowerShell

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

Exemplo (não reutilizar):

```
q8Yw3vL2x9KpZ7mF1sR4nT6uH0dE5aBc
```

---

# Passo 2 - Verificar o nome utilizado na Edge Function

Confirmar que existe:

```ts
const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
```

Caso o nome seja diferente, o Secret deverá possuir exatamente o mesmo nome.

---

# Passo 3 - Redeploy da Edge Function

Após adicionar o Secret, publicar novamente a função.

Caso utilize Supabase CLI:

```bash
supabase functions deploy <nome_da_function>
```

---

# Passo 4 - Confirmar que o Secret está sendo carregado

Adicionar temporariamente:

```ts
console.log(
  "Encryption key loaded:",
  !!encryptionKey
);
```

Esperado:

```
Encryption key loaded: true
```

Após confirmar, remover o log.

---

# Passo 5 - Caso o erro continue

Executar no SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

Isso força o PostgREST a atualizar o cache das funções RPC.

---

# Passo 6 - Validar permissões da função

Caso necessário:

```sql
GRANT EXECUTE
ON FUNCTION public.encrypt_token(text,text)
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.decrypt_token(text,text)
TO authenticated, service_role;
```

---

# Passo 7 - Teste

Realizar novamente:

1. Login Spotify
2. OAuth Callback
3. Criação do Access Token
4. Criptografia do Refresh Token

Esperado:

```
encrypt access token result: OK
encrypt refresh token result: OK
```

---

# Observações

- A chave **não** deve ser enviada ao GitHub.
- A chave **não** deve ficar no frontend.
- A chave deve existir somente em **Supabase Edge Function Secrets**.
- Produção e Desenvolvimento devem utilizar chaves diferentes.
- A troca da chave em produção invalida a descriptografia dos tokens antigos, sendo necessária uma migração.

---

# Status atual

✅ Função `encrypt_token` criada

✅ Função `decrypt_token` criada

✅ Código chama `encrypt_token` com `p_token` e `p_key`

✅ Criar `TOKEN_ENCRYPTION_KEY` no Supabase Secrets

⬜ Redeploy da Edge Function

⬜ Recarregar cache do PostgREST (se necessário)

⬜ Validar autenticação completa do Spotify