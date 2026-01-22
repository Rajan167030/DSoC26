"use client"
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function WebhookTester() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testWebhook = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/webhooks/github')
      const data = await response.json()
      setTestResult({
        success: true,
        status: response.status,
        data
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/webhooks/github`
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GitHub Webhook Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Configure automatic point tracking for merged pull requests
          </p>

          {/* Webhook URL */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={getWebhookUrl()}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getWebhookUrl())
                  toast.success('Copied to clipboard!')
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Add this URL to your GitHub repository webhook settings
            </p>
          </div>

          {/* Test Webhook */}
          <div className="mb-8">
            <button
              onClick={testWebhook}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Webhook Endpoint'}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.success ? '✅ Webhook Endpoint Active' : '❌ Test Failed'}
              </h3>
              <pre className="bg-white p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResult.data || testResult.error, null, 2)}
              </pre>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Setup Instructions
            </h2>

            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Add Webhook Secret to Environment</p>
                  <code className="block mt-2 bg-gray-100 p-2 rounded text-sm">
                    GITHUB_WEBHOOK_SECRET=your-random-secret-here
                  </code>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Configure Repository Webhook</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Go to GitHub repo → Settings → Webhooks</li>
                    <li>• Click "Add webhook"</li>
                    <li>• Paste the webhook URL above</li>
                    <li>• Content type: <code className="bg-gray-100 px-2 py-1 rounded">application/json</code></li>
                    <li>• Secret: Same as <code className="bg-gray-100 px-2 py-1 rounded">GITHUB_WEBHOOK_SECRET</code></li>
                    <li>• Events: Select "Pull requests" only</li>
                  </ul>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Test with a PR</p>
                  <p className="text-sm mt-1">Create and merge a pull request. Points will be automatically awarded!</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Points Calculation */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Points Calculation
            </h2>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Criteria</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2">Base (any merged PR)</td>
                  <td className="px-4 py-2 text-right font-mono">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Tiny PR (&lt;50 lines)</td>
                  <td className="px-4 py-2 text-right font-mono">+5</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Small PR (50-200 lines)</td>
                  <td className="px-4 py-2 text-right font-mono">+10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Medium PR (200-500 lines)</td>
                  <td className="px-4 py-2 text-right font-mono">+15</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Large PR (&gt;500 lines)</td>
                  <td className="px-4 py-2 text-right font-mono">+20</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Multiple files (5-10)</td>
                  <td className="px-4 py-2 text-right font-mono">+5</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Many files (10+)</td>
                  <td className="px-4 py-2 text-right font-mono">+10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Reviewed PR</td>
                  <td className="px-4 py-2 text-right font-mono">+5</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📖 Full Documentation:</strong> Check <code className="bg-blue-100 px-2 py-1 rounded">WEBHOOK_SETUP.md</code> for detailed setup guide
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
