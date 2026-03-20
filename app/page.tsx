'use client'
import AuthWrapper from '../components/AuthWrapper'
import Flow from '../components/Flow'

export default function FlowPage() {
  return (
    <AuthWrapper>
      {(user, signOut) => (
        <div>
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-gray-600 text-xs">{user?.email}</span>
            <button onClick={signOut} className="text-gray-600 text-xs hover:text-white transition-colors">
              Delogare
            </button>
          </div>
          <Flow userId={user?.id} />
        </div>
      )}
    </AuthWrapper>
  )
}
