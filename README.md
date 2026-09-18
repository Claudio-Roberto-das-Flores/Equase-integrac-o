# Equase Integração

Plataforma modular de gestão empresarial para comércio, serviços, clínicas e outras atividades.

## Primeira fase

- Cadastros de empresas, clientes, fornecedores, produtos e serviços
- Estoque, depósitos, entradas, saídas e inventário
- Compras, vendas, orçamentos e pedidos
- Contas a pagar, contas a receber, caixa e pagamentos
- Importação de XML e preparação para NF-e, NFC-e e NFS-e

## Executar localmente

```bash
npm install
npm run dev
```

## Banco de dados

O projeto utiliza Supabase (PostgreSQL). Para configurar:

1. Crie um projeto Supabase exclusivo para o Equase Integração.
2. Execute a migration em `supabase/migrations/202609180001_initial_erp.sql`.
3. Copie `.env.example` para `.env.local` e informe a URL e a chave pública do projeto.

A estrutura aplica isolamento multiempresa com Row Level Security (RLS). Nunca coloque a chave `service_role` no navegador.

## Estado atual

A base contém o painel responsivo, a navegação inicial, conexão preparada com Supabase e o primeiro esquema multiempresa. Os números do painel ainda são demonstrativos; as telas serão ligadas gradualmente às tabelas reais.
