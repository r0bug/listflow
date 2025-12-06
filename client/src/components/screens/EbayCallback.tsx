import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';

export const EbayCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing eBay authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Authorization was denied or failed');
        localStorage.removeItem('ebay_oauth_state');
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from eBay');
        localStorage.removeItem('ebay_oauth_state');
        return;
      }

      // Get stored OAuth state
      const oauthStateStr = localStorage.getItem('ebay_oauth_state');
      if (!oauthStateStr) {
        setStatus('error');
        setMessage('OAuth state lost. Please try connecting again from Settings.');
        return;
      }

      const oauthState = JSON.parse(oauthStateStr);

      try {
        // Exchange the code for tokens via backend
        const response = await fetch('/api/v1/ebay/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            clientId: oauthState.clientId,
            clientSecret: oauthState.clientSecret,
            sandbox: oauthState.sandbox,
          }),
        });

        const data = await response.json();

        // Clear OAuth state
        localStorage.removeItem('ebay_oauth_state');

        if (data.success) {
          setStatus('success');
          setMessage(`Successfully connected to eBay ${oauthState.sandbox ? 'Sandbox' : 'Production'}!`);
          // Redirect to settings after a short delay
          setTimeout(() => navigate('/settings?tab=ebay&connected=true'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to complete authorization');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to communicate with server');
        console.error('eBay callback error:', err);
        localStorage.removeItem('ebay_oauth_state');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to eBay</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connected!</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/settings?tab=ebay')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
};
