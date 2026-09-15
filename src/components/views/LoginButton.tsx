import { useGoogleLogin } from '@react-oauth/google'
import { LogIn } from 'lucide-react'

interface LoginButtonProps {
  onSuccess: (accessToken: string) => void
}

export function LoginButton({ onSuccess }: LoginButtonProps) {
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    onSuccess: (tokenResponse) => {
      onSuccess(tokenResponse.access_token)
    },
    onError: (error) => console.error('Login Failed:', error),
  })

  return (
    <button
      onClick={() => login()}
      className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black shadow-lg hover:bg-emerald-400 transition-colors"
    >
      <LogIn className="h-5 w-5" />
      Connect Google Drive
    </button>
  )
}