"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit3, Plus, Calendar, Eye, Loader2, RefreshCw } from "lucide-react"
// import CardPreview from "@/components/card-preview"
// import { mockCards } from "@/lib/mock-data"
// import { CardPreview } from "@/components/card-preview"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// import { galleryKeys, queryKeys } from "@/lib/query-client"
// import { fetchGallery, removeGallery } from "@/lib/api"
// import { GalleryType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
// import { LoadingSpinner } from "@/components/loading-spinner"
// import CardPreview from "@/components/card-preview"
import { GalleryType } from "@/lib/types"
import { galleryKeys } from "@/lib/query-client"
import { fetchGallery } from "@/hooks/use-postDesignSnapshot"
import { CardPreview } from "@/components/card-preview"

export default function GalleryPage() {
  const router = useRouter()

   const {
    data = {} as GalleryType,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: galleryKeys.all,
    queryFn: fetchGallery,
  });

 

//   const handleDelete = async (id: string) => {
//     removeGalleryMutation.mutate({id})
//   }

//   const handleEdit = (id: string) => {
//     const card = data.data.find((c) => c.id === id)
//     if (card) {
//       sessionStorage.setItem("editingCard", JSON.stringify(card))
//       router.push(`/design/${card.id}`)
//     }
//   }

  const handleCreateNew = () => {
    sessionStorage.removeItem("editingCard")
    router.push("/cards/new")
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

//   if(removeGalleryMutation.isPending) return <LoadingSpinner />

  if (error) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Card Requests Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">
              Failed to load gallery
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = (id: string) => {
    const card = data.data.find((c) => c.id === id)
    if (card) {
      sessionStorage.setItem("editingCard", JSON.stringify(card))
      router.push(`/cards/${card.id}`)
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Card Gallery</h1>
            <p className="mt-2 text-muted-foreground">Manage and customize your card designs</p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2 w-full md:w-auto" size="lg">
            <Plus className="h-5 w-5" />
            Create New Card
          </Button>
        </div>

        {/* Gallery Grid */}
        {data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No cards yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create your first card design to get started</p>
              <Button onClick={handleCreateNew} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Card
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
            {data.data.map((card, index) => (         
              <CardPreview design={card} key={index} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
