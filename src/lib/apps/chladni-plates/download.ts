/** Offers a file to the visitor to save. */
export function downloadBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = name;
    link.click();

    // The browser needs a moment to start the download before the address stops working
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
