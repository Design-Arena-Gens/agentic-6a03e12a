'use client'

import { useState } from 'react'

interface VideoGeneration {
  id: string
  status: 'generating' | 'completed' | 'error'
  title?: string
  script?: string
  sceneDescriptions?: string[]
  narration?: string
  error?: string
  timestamp: number
}

export default function Home() {
  const [generations, setGenerations] = useState<VideoGeneration[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')

  const generateVideo = async () => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key')
      return
    }

    setLoading(true)
    const generationId = Date.now().toString()

    const newGeneration: VideoGeneration = {
      id: generationId,
      status: 'generating',
      timestamp: Date.now()
    }

    setGenerations(prev => [newGeneration, ...prev])

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          customPrompt: customPrompt || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video content')
      }

      setGenerations(prev =>
        prev.map(gen =>
          gen.id === generationId
            ? { ...gen, status: 'completed', ...data }
            : gen
        )
      )
    } catch (error) {
      setGenerations(prev =>
        prev.map(gen =>
          gen.id === generationId
            ? {
                ...gen,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : gen
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            YouTube Crime Story Automation
          </h1>
          <p className="text-gray-600 mb-6">
            AI-powered agent for generating complete true crime video content with scripts, scenes, and narration
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your API key is never stored and only used for this session
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Story Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Generate a story about a 1970s bank heist in California..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-24 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank for random true crime story generation
              </p>
            </div>

            <button
              onClick={generateVideo}
              disabled={loading || !apiKey}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Generating Video Content...' : 'Generate Crime Story Video'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {generations.map((gen) => (
            <div key={gen.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {gen.status === 'generating' && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  )}
                  {gen.status === 'completed' && (
                    <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {gen.status === 'error' && (
                    <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(gen.timestamp).toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  gen.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                  gen.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {gen.status}
                </span>
              </div>

              {gen.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800">{gen.error}</p>
                </div>
              )}

              {gen.title && (
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{gen.title}</h2>
                </div>
              )}

              {gen.script && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Script</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{gen.script}</pre>
                  </div>
                </div>
              )}

              {gen.sceneDescriptions && gen.sceneDescriptions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Scenes ({gen.sceneDescriptions.length})</h3>
                  <div className="space-y-3">
                    {gen.sceneDescriptions.map((scene, idx) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <span className="inline-block bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                          SCENE {idx + 1}
                        </span>
                        <p className="text-sm text-gray-700">{scene}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gen.narration && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Narration Script</h3>
                  <div className="bg-blue-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{gen.narration}</pre>
                  </div>
                </div>
              )}

              {gen.status === 'generating' && (
                <div className="text-center text-gray-500 py-8">
                  <p>Generating crime story content...</p>
                </div>
              )}
            </div>
          ))}

          {generations.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Generated Yet</h3>
              <p className="text-gray-600">Click the button above to generate your first true crime story video content</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
