'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircleIcon, XCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

const QRScanner = ({ onScanSuccess, onScanError, className = '' }) => {
    const [scanning, setScanning] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner when component unmounts
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        setScanning(true);
        setLastScanResult(null);
        setError(null);

        try {
            // Check for camera permission first
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ video: true });
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 2,
            };

            // Clear any existing scanner
            if (html5QrcodeScannerRef.current) {
                await html5QrcodeScannerRef.current.clear();
            }

            html5QrcodeScannerRef.current = new Html5QrcodeScanner(
                "qr-scanner-container",
                config,
                false
            );

            html5QrcodeScannerRef.current.render(
                (decodedText, decodedResult) => {
                    // Handle successful scan
                    setLastScanResult({ success: true, text: decodedText });
                    if (onScanSuccess) {
                        onScanSuccess(decodedText, decodedResult);
                    }
                },
                (error) => {
                    // Handle scan error (this fires continuously when no QR code is detected)
                    // We only want to handle actual errors, not the "No QR code found" message
                    if (error.includes('NotFoundException') || error.includes('No QR code found')) {
                        return; // Ignore "not found" errors
                    }
                    console.error('QR Scanner Error:', error);
                    if (onScanError) {
                        onScanError(error);
                    }
                }
            );
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError(err.message || 'Failed to start camera. Please check camera permissions.');
            setScanning(false);
            if (onScanError) {
                onScanError(err.message);
            }
        }
    };

    const stopScanning = async () => {
        if (html5QrcodeScannerRef.current) {
            try {
                await html5QrcodeScannerRef.current.clear();
                html5QrcodeScannerRef.current = null;
                setScanning(false);
                setError(null);
            } catch (err) {
                console.error('Error stopping scanner:', err);
                setScanning(false);
            }
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
            <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Scanner</h3>
                <p className="text-sm text-gray-600">
                    {scanning
                        ? 'Point your camera at a QR code to scan'
                        : 'Click start to begin scanning QR codes'
                    }
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Camera Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                                <p className="mt-1">Please ensure camera permissions are enabled and try again.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner container */}
            <div className="mb-4">
                {!scanning ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <button
                            onClick={startScanning}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={scanning}
                        >
                            <CameraIcon className="h-4 w-4 mr-2" />
                            Start Scanner
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div
                            id="qr-scanner-container"
                            className="w-full min-h-[300px] border-2 border-gray-200 rounded-lg overflow-hidden"
                        />
                        <div className="text-center">
                            <button
                                onClick={stopScanning}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Stop Scanner
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Last scan result */}
            {lastScanResult && (
                <div className={`rounded-md p-4 ${lastScanResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {lastScanResult.success ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            ) : (
                                <XCircleIcon className="h-5 w-5 text-red-400" />
                            )}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${lastScanResult.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {lastScanResult.success ? 'QR Code Scanned Successfully' : 'Scan Failed'}
                            </h3>
                            {lastScanResult.text && (
                                <div className={`mt-2 text-sm ${lastScanResult.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    <p className="font-mono break-all">{lastScanResult.text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-xs text-gray-500">
                <p>• Make sure the QR code is well-lit and clearly visible</p>
                <p>• Hold your device steady for better scanning</p>
                <p>• The scanner will automatically detect and read QR codes</p>
            </div>
        </div>
    );
};

export default QRScanner;