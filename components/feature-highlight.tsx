import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface FeatureHighlightProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureHighlight({ icon, title, description }: FeatureHighlightProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start">
          <div className="bg-[#006241]/10 rounded-full p-3 mr-4">{icon}</div>
          <div>
            <h3 className="font-semibold text-[#006241] mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

