import { Link, useNavigate } from 'react-router-dom'
import { FiClock, FiRefreshCw, FiLogOut, FiGlobe, FiCheckCircle } from 'react-icons/fi'
import Button from '@/components/website/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

const PendingVerification = () => {
    const { user, logout, refreshUser } = useAuth()
    const navigate = useNavigate()

    const handleRefresh = async () => {
        try {
            await refreshUser()
        } catch (e) {
            window.location.reload()
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
                        <FiClock className="h-10 w-10 text-yellow-600 animate-pulse" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Profile Under Review
                    </h2>

                    {user?.expertId && (
                        <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                Expert ID: {user.expertId}
                            </span>
                        </div>
                    )}

                    <p className="text-gray-600 mb-8 text-lg">
                        Your expert profile is being verified by our team
                    </p>

                    {user?.documentsRequested && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8 text-left">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FiCheckCircle className="h-5 w-5 text-orange-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-orange-700 font-semibold mb-1">
                                        Action Required: Missing Documents
                                    </p>
                                    <p className="text-sm text-orange-700 whitespace-pre-line mb-3">
                                        {user.documentsRequestedReason || 'Please review your compliance documents.'}
                                    </p>
                                    <Link
                                        to="/expert/onboarding/compliance"
                                        className="text-sm font-bold text-orange-800 hover:underline flex items-center gap-1"
                                    >
                                        Update Compliance Details &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleRefresh}
                        >
                            <FiRefreshCw /> Refresh Status
                        </Button>

                        <Link to="/" className="block">
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                <FiGlobe /> Explore Platform
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <FiLogOut /> Logout
                        </Button>

                        <p className="text-xs text-gray-500 mt-6 pt-4 border-t">
                            Questions? <a href="/contact" className="text-primary hover:underline">Contact Support</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PendingVerification
