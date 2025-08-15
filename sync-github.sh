#!/bin/bash

echo "=== SYNC GITHUB SCRIPT ==="
echo "Este script vai atualizar 100% o GitHub com os arquivos locais"
echo ""

# Verificar se está logado no GitHub CLI
echo "1. Verificando autenticação GitHub CLI..."
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ Não autenticado. Execute: gh auth login --web"
    exit 1
fi

echo "✅ Autenticado no GitHub CLI"

# Verificar estado atual
echo ""
echo "2. Estado atual:"
echo "   Local: $(git rev-list --count HEAD) commits"
echo "   Remote: $(git ls-remote --heads origin | wc -l | tr -d ' ') branches"

# Fazer backup do estado atual
echo ""
echo "3. Fazendo backup do commit atual..."
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo "✅ Backup criado: $BACKUP_BRANCH"

# Forçar push
echo ""
echo "4. Sincronizando com GitHub (force push)..."
if git push origin main --force; then
    echo "✅ GitHub atualizado com sucesso!"
    
    # Verificar sincronização
    echo ""
    echo "5. Verificando sincronização..."
    git fetch origin
    if git diff HEAD origin/main --quiet; then
        echo "✅ GitHub 100% sincronizado com local"
        echo ""
        echo "🎉 SUCESSO! O repositório GitHub está idêntico ao local."
        echo "   Link: https://github.com/wilsonguimaraesrock/daily_control_sede"
    else
        echo "⚠️  Ainda há diferenças. Verificando..."
        git diff HEAD origin/main --stat
    fi
else
    echo "❌ Erro no push. Verifique permissões no repositório."
    echo "   Certifique-se de que 'wilsonguimaraesrock' tem acesso de escrita."
fi

echo ""
echo "=== FIM ==="