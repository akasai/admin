import { KeyRound, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { inputClass } from '../constants/styles'
import { useAdminAuth } from '../hooks'

interface AdminLoginPageProps {
    initialError?: string
}

export default function AdminLoginPage({ initialError }: AdminLoginPageProps) {
    const { login } = useAdminAuth()
    const [key, setKey] = useState('')
    const [error, setError] = useState(initialError ?? '')

    useEffect(() => {
        if (initialError && initialError.length > 0) {
            setError(initialError)
        }
    }, [initialError])

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        if (key.trim().length === 0) {
            setError('API 키를 입력해주세요.')
            return
        }
        login(key.trim())
    }

    return (
        <main className="dark grid min-h-screen bg-bg text-text lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,0.7fr)]">
            <section className="relative hidden min-w-0 overflow-hidden border-r border-border bg-bg-secondary p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
                <div>
                    <p className="font-koverwatch text-3xl tracking-[0.1em] text-text">OHBANGIT</p>
                    <p className="mt-2 font-mono text-[11px] tracking-[0.16em] text-text-dim">ADMIN WORKBENCH</p>
                </div>
                <div className="max-w-xl">
                    <div className="mb-6 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
                    <h1 className="max-w-lg text-3xl font-[650] leading-tight tracking-[-0.025em] text-text xl:text-4xl">
                        방송 운영 데이터를 한곳에서 정확하게 관리합니다.
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-7 text-text-muted">
                        일정, 스트리머, 카테고리와 크롤러 검토 흐름을 위한 독립 운영 작업대입니다.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-dim">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    승인된 관리자 API 키가 필요합니다.
                </div>
            </section>

            <section className="flex min-w-0 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
                <div className="w-full max-w-md">
                    <div className="mb-10 lg:hidden">
                        <p className="font-koverwatch text-2xl tracking-[0.1em] text-text">OHBANGIT</p>
                        <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-text-dim">ADMIN WORKBENCH</p>
                    </div>
                    <div className="mb-8">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-primary">
                            <KeyRound className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h2 className="text-2xl font-[650] tracking-[-0.025em] text-text">관리자 로그인</h2>
                        <p className="mt-2 text-sm leading-6 text-text-muted">API 키를 입력해 관리 작업대로 이동하세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div>
                            <label htmlFor="api-key" className="mb-2 block text-sm font-semibold text-text-muted">
                                API 키
                            </label>
                            <input
                                id="api-key"
                                type="password"
                                value={key}
                                onChange={(event) => {
                                    setKey(event.target.value)
                                    setError('')
                                }}
                                placeholder="API 키 입력"
                                className={`${inputClass} min-h-11 px-4`}
                                autoComplete="current-password"
                                aria-invalid={error.length > 0}
                                aria-describedby={error.length > 0 ? 'api-key-error' : 'api-key-help'}
                                autoFocus
                            />
                            {error.length > 0 ? (
                                <p id="api-key-error" role="alert" className="mt-2 text-xs text-[var(--color-danger)]">
                                    {error}
                                </p>
                            ) : (
                                <p id="api-key-help" className="mt-2 text-xs text-text-dim">
                                    키는 현재 브라우저의 관리자 인증에만 사용됩니다.
                                </p>
                            )}
                        </div>
                        <Button type="submit" size="lg" className="w-full">
                            작업대 열기
                        </Button>
                    </form>
                </div>
            </section>
        </main>
    )
}
