import { useEffect, useState } from "react";
import {
  usePrivy,
  CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";

// Separate component for when Privy is not configured
function AuthNotConfigured() {
  return (
    <div className="text-yellow-400 text-sm">
      Authentication not configured
    </div>
  );
}

// Main auth component with Privy hooks
function PrivyAuth({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID        
        const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42")[0] as CrossAppAccountWithMetadata;

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
          const address = crossAppAccount.embeddedWallets[0].address;
          setAccountAddress(address);
          onAddressChange(address);
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    } else {
      // Clear address when not authenticated
      setAccountAddress("");
      onAddressChange("");
    }
  }, [authenticated, user, ready, onAddressChange]);

  const copyToClipboard = async () => {
    if (accountAddress) {
      try {
        await navigator.clipboard.writeText(accountAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!ready) {
    return <div style={{ color: 'white', fontSize: '14px' }}>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <button 
        onClick={login}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
      >
        Login
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
      {accountAddress ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a 
              href="https://monad-games-id-site.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                textDecoration: 'none'
              }}
            >
              Register Username
            </a>
            
            <button 
              onClick={logout}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1f2937',
            padding: '8px 12px',
            borderRadius: '4px'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Address:</span>
            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'monospace' }}>{formatAddress(accountAddress)}</span>
            <button
              onClick={copyToClipboard}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
              title={accountAddress}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </>
      ) : message ? (
        <span style={{ color: '#f87171', fontSize: '12px' }}>{message}</span>
      ) : (
        <span style={{ color: '#fbbf24', fontSize: '12px' }}>Checking...</span>
      )}
    </div>
  );
}

// Main component that conditionally renders based on Privy configuration
export default function AuthComponent({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const privyAppId = process.env.REACT_APP_PRIVY_APP_ID;
  
  if (!privyAppId) {
    return <AuthNotConfigured />;
  }
  
  return <PrivyAuth onAddressChange={onAddressChange} />;
}