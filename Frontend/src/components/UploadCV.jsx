import { useState } from 'react'

export default function UploadCV() {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        if (!file) {
            setError('Please select a CV file')
            return
        }

        try {
            setLoading(true)
            const form = new FormData()
            form.append('cvFile', file)
            const res = await fetch('/api/ml/match', { method: 'POST', body: form })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed')
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload CV to Match Jobs</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full border rounded p-2"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Uploading...' : 'Match CV'}
                </button>
            </form>

            {error && (
                <div className="mt-4 text-red-600">{error}</div>
            )}

            {result && (
                <div className="mt-4 p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-2">Result</h3>
                    <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}
