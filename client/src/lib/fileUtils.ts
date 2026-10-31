/**
 * Utility functions for handling file attachments, data URLs, and downloads
 */

export const getFileNameFromUrl = (fileUrl: string, fallbackIndex = 1): string => {
  if (!fileUrl) return `Attachment-${fallbackIndex}`;
  try {
    // Check if filename was encoded in the data URL metadata (e.g., data:image/png;name=invoice.png;base64,...)
    const nameMatch = fileUrl.match(/;name=([^;]+);/);
    if (nameMatch && nameMatch[1]) {
      return decodeURIComponent(nameMatch[1]);
    }

    if (fileUrl.startsWith('data:')) {
      const mime = fileUrl.split(';')[0]?.replace('data:', '') || 'application/octet-stream';
      const ext = mime.split('/')[1] || 'bin';
      return `Attachment-${fallbackIndex}.${ext}`;
    }

    const cleanUrl = fileUrl.split('?')[0].split('#')[0];
    const parts = cleanUrl.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart ? decodeURIComponent(lastPart) : `Attachment-${fallbackIndex}`;
  } catch {
    return `Attachment-${fallbackIndex}`;
  }
};

export const downloadOrOpenFile = (fileUrl: string, explicitFileName?: string) => {
  if (!fileUrl) return;
  const fileName = explicitFileName || getFileNameFromUrl(fileUrl);

  if (fileUrl.startsWith('data:')) {
    // Top-frame navigation to data: URLs is blocked in modern browsers.
    // Trigger download via anchor element with download attribute.
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
};
