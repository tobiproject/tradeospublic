'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AccountCard } from '@/components/accounts/AccountCard'
import { AccountCreateDialog } from '@/components/accounts/AccountCreateDialog'
import { AccountDeleteDialog } from '@/components/accounts/AccountDeleteDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAccounts } from '@/hooks/useAccounts'
import { type Account } from '@/contexts/AccountContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function AccountsPage() {
  const { accounts, activeAccount, isLoading, setActiveAccount, archiveAccount, deleteAccount } = useAccounts()
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  async function handleArchive(account: Account) {
    setArchiveError(null)
    const { error } = await archiveAccount(account.id)
    if (error) {
      setArchiveError(error.message)
    } else {
      toast.success(`„${account.name}" archiviert.`)
    }
  }

  async function handleDelete(accountId: string) {
    const { error } = await deleteAccount(accountId)
    if (error) {
      toast.error('Konto konnte nicht gelöscht werden.')
    } else {
      toast.success('Konto gelöscht.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meine Konten</h1>
          <p className="text-muted-foreground text-sm">
            {accounts.length}/10 Konten aktiv
          </p>
        </div>
        <AccountCreateDialog />
      </div>

      {archiveError && (
        <Alert variant="destructive">
          <AlertDescription>{archiveError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-4">
          <p className="text-muted-foreground text-sm">Noch kein Konto angelegt.</p>
          <AccountCreateDialog
            trigger={
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Erstes Konto erstellen
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isActive={activeAccount?.id === account.id}
              onSelect={setActiveAccount}
              onArchive={handleArchive}
              onDelete={setAccountToDelete}
            />
          ))}
        </div>
      )}

      <AccountDeleteDialog
        account={accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
