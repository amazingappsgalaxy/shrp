'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { EditModal } from '@/components/app/edit/EditModal'

export default function EditPage() {
  useAuth()

  return (
    <EditModal
      isOpen={true}
      onClose={() => {}} // No-op for standalone page
      sourceContext="standalone"
    />
  )
}
