/**
 * PDF Viewer Module
 * Handles PDF viewing functionality using PDF.js
 */

class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.modal = document.getElementById('pdf-viewer-modal');
        this.currentPdfBlob = null;
        this.currentPdfUrl = null;
        
        // Set up PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // Close button
        const closeBtn = document.getElementById('close-pdf-viewer-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Control buttons
        const prevBtn = document.getElementById('pdf-prev-page-btn');
        const nextBtn = document.getElementById('pdf-next-page-btn');
        const zoomInBtn = document.getElementById('pdf-zoom-in-btn');
        const zoomOutBtn = document.getElementById('pdf-zoom-out-btn');
        const downloadBtn = document.getElementById('pdf-download-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadCurrentPDF());
        
        // Close on background click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    /**
     * Open PDF from blob URL
     */
    async openPDF(blobUrl, blob = null) {
        if (!this.modal || !this.canvas) {
            console.error('PDF viewer modal or canvas not found');
            return;
        }
        
        try {
            // Store blob and URL for download
            this.currentPdfBlob = blob;
            this.currentPdfUrl = blobUrl;
            
            // Show modal
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset page number
            this.pageNum = 1;
            
            // Load PDF
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }
            
            const loadingTask = pdfjsLib.getDocument({ url: blobUrl });
            this.pdfDoc = await loadingTask.promise;
            
            // Update page count
            this.updatePageInfo();
            
            // Render first page
            this.renderPage(this.pageNum);
            
        } catch (error) {
            console.error('Error opening PDF:', error);
            alert('Error loading PDF: ' + error.message);
            this.close();
        }
    }
    
    /**
     * Render a specific page
     */
    async renderPage(num) {
        if (!this.pdfDoc) return;
        
        this.pageRendering = true;
        
        try {
            const page = await this.pdfDoc.getPage(num);
            
            // Calculate viewport
            const viewport = page.getViewport({ scale: this.scale });
            
            // Set canvas size
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            // Render page
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            this.pageRendering = false;
            
            if (this.pageNumPending !== null) {
                // New page rendering is pending
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
            
            this.updatePageInfo();
            
        } catch (error) {
            console.error('Error rendering page:', error);
            this.pageRendering = false;
        }
    }
    
    /**
     * Queue rendering of a page
     */
    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }
    
    /**
     * Go to previous page
     */
    prevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;
        this.queueRenderPage(this.pageNum);
    }
    
    /**
     * Go to next page
     */
    nextPage() {
        if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;
        this.queueRenderPage(this.pageNum);
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.scale += 0.25;
        this.queueRenderPage(this.pageNum);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        if (this.scale <= 0.5) return;
        this.scale -= 0.25;
        this.queueRenderPage(this.pageNum);
    }
    
    /**
     * Update page information display
     */
    updatePageInfo() {
        const pageInfo = document.getElementById('pdf-page-info');
        if (pageInfo && this.pdfDoc) {
            pageInfo.textContent = `Page ${this.pageNum} of ${this.pdfDoc.numPages}`;
        }
        
        // Update button states
        const prevBtn = document.getElementById('pdf-prev-page-btn');
        const nextBtn = document.getElementById('pdf-next-page-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.pageNum <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = !this.pdfDoc || this.pageNum >= this.pdfDoc.numPages;
        }
    }
    
    /**
     * Download current PDF
     */
    downloadCurrentPDF() {
        if (!this.currentPdfUrl) return;
        
        const a = document.createElement('a');
        a.href = this.currentPdfUrl;
        a.download = `safety_evaluation_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    /**
     * Close PDF viewer
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Clean up
        if (this.currentPdfUrl) {
            window.URL.revokeObjectURL(this.currentPdfUrl);
            this.currentPdfUrl = null;
        }
        this.currentPdfBlob = null;
        this.pdfDoc = null;
        this.pageNum = 1;
        
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Initialize PDF viewer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pdfViewer = new PDFViewer();
    });
} else {
    window.pdfViewer = new PDFViewer();
}

