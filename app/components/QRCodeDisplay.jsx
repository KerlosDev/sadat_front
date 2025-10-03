'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

const QRCodeDisplay = ({
    data,
    size = 200,
    className = '',
    showCopyButton = true,
    title = 'QR Code'
}) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!data) {
            setError('No data provided for QR code generation');
            setLoading(false);
            return;
        }

        generateQRCode();
    }, [data, size]);

    const generateQRCode = async () => {
        try {
            setLoading(true);
            setError('');

            const url = await QRCode.toDataURL(data, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeUrl(url);
        } catch (err) {
            console.error('QR Code generation error:', err);
            setError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(data);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const downloadQRCode = () => {
        if (!qrCodeUrl) return;

        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = qrCodeUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-md ${className}`}>
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>

                {/* QR Code Image */}
                <div className="mb-4 flex justify-center">
                    <div className="p-2  rounded-lg inline-block">
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="block object-contain"
                            style={{ width: size, height: size, maxWidth: '100%', maxHeight: '100%' }}
                        />
                    </div>
                </div>



                {/* Action buttons */}
                <div className="flex justify-center space-x-3">
                    {showCopyButton && (
                        <button
                            onClick={copyToClipboard}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <ClipboardIcon className="h-4 w-4 mr-2" />
                                    Copy Data
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={downloadQRCode}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 text-xs text-gray-500">
                    <p>• Scan this QR code with any QR code reader</p>
                    <p>• Save or print this code for offline use</p>
                </div>
            </div>
        </div>
    );
};

export default QRCodeDisplay;