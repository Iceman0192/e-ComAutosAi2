import { useState, useEffect } from 'react';

export function DiagnosticTest() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Test auth endpoint
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setAuthStatus('not authenticated (expected)');
        } else if (res.ok) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus(`error: ${res.status}`);
        }
      })
      .catch(err => {
        setAuthStatus(`failed: ${err.message}`);
      });

    // Test basic API
    fetch('/api/health')
      .then(res => {
        if (res.ok) {
          setApiStatus('healthy');
        } else {
          setApiStatus(`error: ${res.status}`);
        }
      })
      .catch(err => {
        setApiStatus(`failed: ${err.message}`);
      });
  }, []);

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">System Diagnostic</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Authentication:</span>
          <span className={authStatus.includes('error') || authStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}>
            {authStatus}
          </span>
        </div>
        <div className="flex justify-between">
          <span>API Health:</span>
          <span className={apiStatus.includes('error') || apiStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}>
            {apiStatus}
          </span>
        </div>
      </div>
    </div>
  );
}