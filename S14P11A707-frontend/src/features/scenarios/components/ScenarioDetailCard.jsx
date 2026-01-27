import React from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Star, Clock, Users, Play, Users2 } from 'lucide-react'

export default function ScenarioDetailCard({ scenario }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-3xl gold-glow mb-2">
              {scenario.title}
            </CardTitle>
            <div className="error-code">
              [DIFFICULTY: {scenario.difficulty.toUpperCase()}]
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{scenario.estimatedTime}분</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{scenario.playCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span>{(scenario.rating / 100).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2 bracket-left">시놉시스</h3>
          <p className="text-muted-foreground leading-relaxed">
            {scenario.synopsis}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/game/${scenario.id}`}>
            <Button variant="neon" size="lg" className="w-full">
              <Play className="w-5 h-5 mr-2" />
              플레이
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
