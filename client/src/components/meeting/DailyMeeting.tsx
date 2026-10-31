/**
 * DailyMeeting Component
 * 
 * Daily.co video conferencing integration
 * Supports video, audio, and screen sharing
 * 
 * Features:
 * - Video, Audio, Screen sharing
 * - Secure room access (backend-verified)
 * - Token-based authentication
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, Wifi, WifiOff, Radio } from 'lucide-react';
import { meetingService } from '@/services/meetingService';
import { toast } from 'sonner';

interface DailyMeetingProps {
  roomUrl: string;
  token: string;
  displayName: string;
  onLeave?: () => void;
  onExpertLeave?: () => void;
  userRole?: 'seeker' | 'expert' | 'admin';
  discussionId?: string;
}

// Daily.co types
interface DailyCall {
  join: (options?: { url?: string; token?: string; userName?: string }) => Promise<void>;
  leave: () => Promise<void>;
  setUserName: (name: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  destroy: () => void;
  iframe: () => HTMLIFrameElement | null;
  meetingState: () => string;
}

declare global {
  interface Window {
    DailyIframe?: {
      createFrame: (
        container: HTMLElement,
        options?: {
          url?: string;
          token?: string;
          showLeaveButton?: boolean;
          showFullscreenButton?: boolean;
          iframeStyle?: Record<string, string>;
          allowMultipleCallInstances?: boolean;
        }
      ) => DailyCall;
    };
    Daily?: any;
    daily?: any;
  }
}

// Global script loading state
let scriptLoadingPromise: Promise<void> | null = null;

/**
 * Load Daily.co iframe script
 */
function loadDailyScript(): Promise<void> {
  // If already loaded, return immediately
  const existingAPI = window.DailyIframe || (window as any).Daily || (window as any).daily;
  if (existingAPI && (existingAPI.createFrame || existingAPI.create)) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }
  
  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="daily.co/iframe"]');
  if (existingScript) {
    scriptLoadingPromise = new Promise<void>((resolveWait, rejectWait) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds
      const checkInterval = setInterval(() => {
        attempts++;
        const dailyAPI = window.DailyIframe || (window as any).Daily || (window as any).daily;
        if (dailyAPI && (dailyAPI.createFrame || dailyAPI.create)) {
          clearInterval(checkInterval);
          scriptLoadingPromise = null;
          resolveWait();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          scriptLoadingPromise = null;
          rejectWait(new Error('Daily script failed to load within timeout'));
        }
      }, 100);
    });
    return scriptLoadingPromise;
  }

  // Create new script loading promise
  scriptLoadingPromise = new Promise<void>((resolveLoading, rejectLoading) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js@latest/dist/daily-iframe.js';
    script.async = true;
    script.type = 'text/javascript';
    script.crossOrigin = 'anonymous';

    // Check for API availability with polling
    let checkAttempts = 0;
    const maxCheckAttempts = 150; // 15 seconds
    
    const checkAPI = () => {
      checkAttempts++;
      const dailyAPI = window.DailyIframe || (window as any).Daily || (window as any).daily;
      const hasCreateFrame = dailyAPI && (typeof dailyAPI.createFrame === 'function' || typeof dailyAPI.create === 'function');
      if (hasCreateFrame) {
        scriptLoadingPromise = null;
        resolveLoading();
      } else if (checkAttempts >= maxCheckAttempts) {
        scriptLoadingPromise = null;
        rejectLoading(new Error('Daily API not available after script load. Please refresh the page and try again.'));
      } else {
        setTimeout(checkAPI, 100);
      }
    };

    script.onload = () => {
      checkAPI();
    };

    script.onerror = () => {
      scriptLoadingPromise = null;
      rejectLoading(new Error('Failed to load Daily.co script. Check network connection and try again.'));
    };

    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export const DailyMeeting = ({
  roomUrl,
  token,
  displayName,
  onLeave,
  onExpertLeave,
  userRole,
  discussionId,
}: DailyMeetingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor' | null>(null);
  
  // React StrictMode safety: prevent double initialization
  const isInitializedRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  const onExpertLeaveRef = useRef(onExpertLeave);
  const isLoadingRef = useRef(true);
  
  // Meeting management
  const autoEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const participantCountRef = useRef<number>(0);
  const hasLeftRef = useRef<boolean>(false);

  // Sync isLoadingRef with isLoading state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Update refs when they change
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    onExpertLeaveRef.current = onExpertLeave;
  }, [onExpertLeave]);

  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (isInitializedRef.current) {
      return;
    }

    if (!containerRef.current) {
      return;
    }

    // Check if there's already a Daily frame in the container
    const existingFrame = containerRef.current.querySelector('iframe[src*="daily.co"]');
    if (existingFrame) {
      if (callRef.current) {
        return;
      }
      existingFrame.remove();
    }

    // Ensure container has dimensions
    if (containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0) {
      const timeoutId = setTimeout(() => {
        if (containerRef.current && (containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0)) {
          setError('Meeting container is not visible. Please refresh the page.');
          setIsLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }

    const normalizeError = (err: any): string => {
      if (typeof err === 'string') {
        return err;
      }
      if (err instanceof Error) {
        return err.message || err.toString();
      }
      if (err === null || err === undefined) {
        return 'Unknown error occurred';
      }
      if (typeof err === 'object') {
        if (err.message && typeof err.message === 'string') {
          return err.message;
        }
        if (err.error && typeof err.error === 'string') {
          return err.error;
        }
        try {
          const str = JSON.stringify(err);
          if (str !== '{}' && str !== 'null' && str !== '[object Object]') {
            return str.length > 200 ? str.substring(0, 200) + '...' : str;
          }
        } catch (e) {
          // Ignore
        }
      }
      return String(err);
    };

    const initializeMeeting = async () => {
      let meetingTimeout: NodeJS.Timeout | null = null;
      
      try {
        setIsLoading(true);
        setError(null);
        isInitializedRef.current = true;

        // Validate roomUrl
        if (!roomUrl || typeof roomUrl !== 'string' || roomUrl.trim() === '') {
          throw new Error('Invalid room URL configuration');
        }

        // Load Daily script
        try {
          await loadDailyScript();
          
          const dailyAPI = window.DailyIframe || (window as any).Daily || (window as any).daily;
          if (!dailyAPI || (!dailyAPI.createFrame && !dailyAPI.create)) {
            throw new Error('Daily.co API not available after script load');
          }
        } catch (scriptError) {
          const scriptErrMsg = normalizeError(scriptError);
          throw new Error(`Failed to load Daily.co script: ${scriptErrMsg}`);
        }

        if (!containerRef.current) {
          setError('Meeting container not found');
          setIsLoading(false);
          isLoadingRef.current = false;
          isInitializedRef.current = false;
          return;
        }

        // Ensure container still has dimensions
        if (containerRef.current.offsetHeight === 0 || containerRef.current.offsetWidth === 0) {
          setError('Meeting container has no dimensions');
          setIsLoading(false);
          isLoadingRef.current = false;
          isInitializedRef.current = false;
          return;
        }

        // Get DailyIframe API
        const DailyIframe = window.DailyIframe || (window as any).Daily || (window as any).daily;
        
        if (!DailyIframe) {
          throw new Error('Daily.co API not available. Please refresh the page and try again.');
        }
        
        if (typeof DailyIframe.createFrame !== 'function') {
          throw new Error('Daily.co createFrame method not available. Please refresh the page and try again.');
        }

        // Check if there's already a Daily call instance
        if (callRef.current) {
          try {
            callRef.current.leave();
            callRef.current.destroy();
          } catch (cleanupError) {
            // Silently handle cleanup errors
          }
          callRef.current = null;
        }

        // Validate container is still available and connected to DOM
        if (!containerRef.current || !containerRef.current.isConnected) {
          throw new Error('Container element is not available');
        }

        // Remove any existing iframes in the container
        const existingIframes = containerRef.current.querySelectorAll('iframe');
        if (existingIframes.length > 0) {
          existingIframes.forEach(iframe => {
            try {
              iframe.remove();
            } catch (removeError) {
              // Silently handle removal errors
            }
          });
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Double-check container is still available after cleanup
        if (!containerRef.current || !containerRef.current.isConnected) {
          throw new Error('Container element became unavailable after cleanup');
        }

        let call: DailyCall;
        try {
          const frameOptions: any = {
            showLeaveButton: true,
            showFullscreenButton: true,
            iframeStyle: {
              width: '100%',
              height: '100%',
              border: 'none',
            },
            allowMultipleCallInstances: true,
            // Optimization constraints to prevent CPU throttling & network lag on high-DPI screens
            dailyConfig: {
              avoidDoubleEncoding: true,
              screenSimulcastEncodingAllowlist: ['low', 'mid'], // Disable heavy high-definition simulcast layers
              userMediaConstraints: {
                video: {
                  width: { max: 1280 },
                  height: { max: 720 },
                  frameRate: { max: 24 } // Cap video at 720p 24fps
                }
              },
              screenShareConstraints: {
                video: {
                  width: { max: 1920 },
                  height: { max: 1080 },
                  frameRate: { max: 10 } // Cap screen share at 1080p 10fps (optimal for presentations/docs)
                }
              }
            }
          };
          
          call = DailyIframe.createFrame(containerRef.current, frameOptions);
        } catch (frameError) {
          const errorMsg = frameError instanceof Error ? frameError.message : String(frameError);
          if (errorMsg.includes('Duplicate') || errorMsg.includes('duplicate')) {
            throw new Error('A meeting is already in progress. Please refresh the page and try again.');
          }
          throw new Error(`Failed to create Daily.co frame: ${errorMsg}`);
        }

        callRef.current = call;

        // Set user name
        if (displayName) {
          call.setUserName(displayName);
        }

        // Event handlers
        const handleJoined = () => {
          setIsLoading(false);
          isLoadingRef.current = false;
          
          // Initialize participant count (we just joined)
          participantCountRef.current = 1;
          
          // Start 30-minute auto-end timer
          // This will automatically end the meeting after 30 minutes
          autoEndTimerRef.current = setTimeout(() => {
            if (!hasLeftRef.current && callRef.current) {
              hasLeftRef.current = true;
              
              // Leave the meeting
              try {
                callRef.current.leave();
              } catch (leaveError) {
                // Silently handle leave errors
              }
              
              // Trigger expert leave handler if expert
              if (userRole === 'expert' && onExpertLeaveRef.current) {
                try {
                  onExpertLeaveRef.current();
                } catch (expertLeaveError) {
                  // Silently handle expert leave errors
                }
              }
              
              // Trigger general leave handler
              if (onLeaveRef.current) {
                try {
                  onLeaveRef.current();
                } catch (leaveHandlerError) {
                  // Silently handle leave handler errors
                }
              }
            }
          }, 30 * 60 * 1000); // 30 minutes = 1,800,000 milliseconds
        };

        const handleLeft = () => {
          setIsLoading(false);
          hasLeftRef.current = true;
          
          // Clear auto-end timer
          if (autoEndTimerRef.current) {
            clearTimeout(autoEndTimerRef.current);
            autoEndTimerRef.current = null;
          }
          
          // If expert left, trigger engagement creation
          if (userRole === 'expert' && onExpertLeaveRef.current) {
            onExpertLeaveRef.current();
          }
          
          if (onLeaveRef.current) {
            onLeaveRef.current();
          }
        };

        const handleError = (error: any) => {
          let errorMessage = 'Failed to join meeting. Please check your connection and try again.';
          
          if (error && typeof error === 'object') {
            const errorMsg = error.errorMsg || error.message || error.error;
            
            if (errorMsg === 'account-missing-payment-method') {
              errorMessage = 'Daily.co account requires a payment method. Please add a payment method in your Daily.co dashboard (https://dashboard.daily.co/) and try again.';
            } else if (errorMsg === 'room-not-found' || errorMsg === 'room-does-not-exist') {
              errorMessage = 'Meeting room not found. Please contact support.';
            } else if (errorMsg === 'token-invalid' || errorMsg === 'token-expired') {
              errorMessage = 'Meeting access token is invalid or expired. Please refresh the page and try again.';
            } else if (errorMsg === 'network-error' || errorMsg === 'connection-failed') {
              errorMessage = 'Network connection failed. Please check your internet connection and try again.';
            } else if (errorMsg && typeof errorMsg === 'string') {
              errorMessage = `Failed to join meeting: ${errorMsg}`;
            } else {
              const normalized = normalizeError(error);
              if (normalized && normalized !== '[object Object]' && !normalized.includes('[object Object]')) {
                errorMessage = `Failed to join meeting: ${normalized}`;
              }
            }
          } else if (error && typeof error === 'string') {
            errorMessage = `Failed to join meeting: ${error}`;
          }
          
          setError(errorMessage);
          setIsLoading(false);
        };

        // Register event handlers
        call.on('joined-meeting', handleJoined);
        call.on('left-meeting', handleLeft);
        call.on('error', handleError);
        
        // Track participants
        call.on('participant-joined', () => {
          participantCountRef.current++;
          if (isLoadingRef.current) {
            setIsLoading(false);
            isLoadingRef.current = false;
          }
        });

        // Track in-meeting chat messages & trigger notification for recipient
        call.on('app-message', (event: any) => {
          if (event?.data?.message || event?.data?.text) {
            const msgContent = event.data.message || event.data.text;
            if (discussionId && typeof msgContent === 'string' && msgContent.trim()) {
              meetingService.sendChatNotification(discussionId, msgContent.trim()).catch(() => {});
            }
          }
        });

        // Track network quality
        call.on('network-quality-change', (event: any) => {
          if (event && event.threshold) {
            // Daily.co provides threshold: 'good', 'low', 'very-low'
            if (event.threshold === 'good') {
              setNetworkQuality('good');
            } else if (event.threshold === 'low') {
              setNetworkQuality('fair');
            } else {
              setNetworkQuality('poor');
            }
          }
        });
        
        call.on('participant-left', (event?: { participant?: { user_name?: string } }) => {
          participantCountRef.current = Math.max(0, participantCountRef.current - 1);
          const pName = event?.participant?.user_name || 'The other participant';
          toast.warning(`${pName} has temporarily disconnected. Waiting for them to rejoin...`, {
            duration: 6000,
          });
        });

        // Join the meeting
        try {
          const joinOptions: {
            url: string;
            token?: string;
            userName?: string;
          } = {
            url: roomUrl,
          };
          
          if (token) {
            joinOptions.token = token;
          }
          
          if (displayName) {
            joinOptions.userName = displayName;
          }
          
          await call.join(joinOptions);
          
          // Immediately check meeting state after join
          try {
            const immediateState = call.meetingState();
            if (immediateState === 'joined-meeting' || immediateState === 'joined') {
              setIsLoading(false);
              isLoadingRef.current = false;
            }
          } catch (stateErr) {
            // Ignore state check errors
          }
          
          // Fallback: Check multiple times with increasing delays
          const checkIntervals = [500, 1000, 2000, 3000];
          checkIntervals.forEach((delay, index) => {
            setTimeout(() => {
              if (!isLoadingRef.current) {
                return;
              }
              
              const iframe = containerRef.current?.querySelector('iframe');
              
              // Check meeting state
              try {
                const meetingState = call.meetingState();
                if (meetingState === 'joined-meeting' || meetingState === 'joined') {
                  setIsLoading(false);
                  isLoadingRef.current = false;
                  return;
                }
              } catch (stateError) {
                // Ignore state check errors
              }
              
              // If iframe exists, clear loading
              if (iframe && index >= 1) {
                setIsLoading(false);
                isLoadingRef.current = false;
              }
            }, delay);
          });
          
          // Final fallback: Force clear loading after 5 seconds
          setTimeout(() => {
            if (isLoadingRef.current) {
              setIsLoading(false);
              isLoadingRef.current = false;
            }
          }, 5000);
        } catch (joinError) {
          let errorMessage = 'Failed to join Daily.co meeting.';
          
          if (joinError && typeof joinError === 'object') {
            const errorMsg = (joinError as any).errorMsg || (joinError as any).message || (joinError as any).error;
            
            if (errorMsg === 'account-missing-payment-method') {
              errorMessage = 'Daily.co account requires a payment method. Please add a payment method in your Daily.co dashboard (https://dashboard.daily.co/) and try again.';
            } else if (errorMsg && typeof errorMsg === 'string') {
              errorMessage = `Failed to join meeting: ${errorMsg}`;
            } else {
              const normalized = normalizeError(joinError);
              if (normalized && normalized !== '[object Object]') {
                errorMessage = `Failed to join meeting: ${normalized}`;
              }
            }
          } else if (joinError instanceof Error) {
            errorMessage = `Failed to join meeting: ${joinError.message}`;
          } else if (joinError) {
            errorMessage = `Failed to join meeting: ${String(joinError)}`;
          }
          
          throw new Error(errorMessage);
        }

        // Store handlers for cleanup
        (call as any)._handlers = {
          'joined-meeting': handleJoined,
          'left-meeting': handleLeft,
          'error': handleError,
        };

        // Fallback: Clear loading after 10 seconds if still loading
        meetingTimeout = setTimeout(() => {
          if (isLoadingRef.current) {
            const iframe = containerRef.current?.querySelector('iframe');
            if (iframe) {
              setIsLoading(false);
              isLoadingRef.current = false;
            } else {
              setError('Meeting join timed out. Please check your internet connection and try again.');
              setIsLoading(false);
              isLoadingRef.current = false;
            }
          }
        }, 10000);

        (call as any)._meetingTimeout = meetingTimeout;
      } catch (err) {
        if (meetingTimeout) {
          clearTimeout(meetingTimeout);
        }
        
        const errorMessage = normalizeError(err);
        
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('Failed to load Daily') || errorMessage.includes('Daily API not available')) {
          userFriendlyMessage = 'Unable to connect to Daily.co service. Please check your internet connection and try again.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          userFriendlyMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
          userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorMessage.includes('Invalid room URL')) {
          userFriendlyMessage = 'Invalid meeting configuration. Please contact support.';
        }
        
        if (!userFriendlyMessage || userFriendlyMessage === '[object Object]' || userFriendlyMessage.includes('[object Object]')) {
          userFriendlyMessage = 'An error occurred while joining the meeting. Please check your connection and try again.';
        }
        
        setError(userFriendlyMessage);
        setIsLoading(false);
        isLoadingRef.current = false;
        isInitializedRef.current = false;
      }
    };

    // Call initializeMeeting and handle any uncaught errors
    initializeMeeting().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to initialize meeting: ${errorMessage}`);
      setIsLoading(false);
      isLoadingRef.current = false;
      isInitializedRef.current = false;
    });

    // Cleanup on unmount
    return () => {
      isInitializedRef.current = false;
      hasLeftRef.current = true;
      
      // Clear auto-end timer
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current);
        autoEndTimerRef.current = null;
      }
      
      if (callRef.current) {
        try {
          const meetingTimeout = (callRef.current as any)._meetingTimeout;
          if (meetingTimeout) {
            clearTimeout(meetingTimeout);
          }

          const handlers = (callRef.current as any)._handlers;
          if (handlers) {
            callRef.current.off('joined-meeting', handlers['joined-meeting']);
            callRef.current.off('left-meeting', handlers['left-meeting']);
            callRef.current.off('error', handlers['error']);
          }

          callRef.current.leave();
          callRef.current.destroy();
        } catch (err) {
          // Silently handle disposal errors
        }
        callRef.current = null;
      }
    };
  }, [roomUrl, token, displayName, userRole]);

  // Retry handler
  const handleRetry = () => {
    window.location.reload();
  };

  // Show error if present
  if (error) {
    const errorLines = error.split('\n').filter(line => line.trim());
    
    return (
      <div className="flex h-full items-center justify-center bg-muted p-4">
        <div className="max-w-2xl text-center">
          <p className="mb-4 text-lg font-semibold text-destructive">
            Failed to join meeting
          </p>
          <div className="mb-4 space-y-2 text-sm text-muted-foreground">
            {errorLines.length > 0 ? (
              errorLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))
            ) : (
              <p>{error}</p>
            )}
          </div>
          <div className="mt-6">
            <button
              onClick={handleRetry}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Rejoin Discussion
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getNetworkQualityColor = () => {
    if (networkQuality === 'good') return 'text-green-600';
    if (networkQuality === 'fair') return 'text-yellow-600';
    if (networkQuality === 'poor') return 'text-red-600';
    return 'text-gray-400';
  };

  const getNetworkQualityIcon = () => {
    if (networkQuality === 'good') return <Wifi className="h-4 w-4" />;
    if (networkQuality === 'fair') return <Radio className="h-4 w-4" />;
    if (networkQuality === 'poor') return <WifiOff className="h-4 w-4" />;
    return null;
  };

  return (
    <div 
      className="relative h-full w-full" 
      style={{ 
        height: '100%', 
        width: '100%',
        minHeight: '400px',
        minWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Network Quality Indicator */}
      {networkQuality && (
        <div className={`absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm border px-3 py-1.5 text-xs font-medium ${getNetworkQualityColor()}`}>
          {getNetworkQualityIcon()}
          <span className="capitalize">Connection: {networkQuality}</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Joining meeting...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="h-full w-full" 
        style={{ 
          height: '100%', 
          width: '100%',
          minHeight: '400px',
          minWidth: '100%',
          position: 'relative',
        }} 
      />
    </div>
  );
};
