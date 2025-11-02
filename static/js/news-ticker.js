/**
 * News Ticker Manager
 * Handles fetching and displaying scrolling news headlines
 */

class NewsTicker {
    constructor() {
        this.ticker = document.getElementById('news-ticker');
        this.container = document.getElementById('news-ticker-container');
        this.updateInterval = null;
        this.articles = [];
        
        this.init();
    }

    init() {
        // Load news on initialization
        this.loadNews();
        
        // Refresh news every 30 minutes
        this.updateInterval = setInterval(() => {
            this.loadNews();
        }, 30 * 60 * 1000);
        
        // Pause on hover
        if (this.container) {
            this.container.addEventListener('mouseenter', () => {
                if (this.ticker) {
                    this.ticker.classList.add('paused');
                }
            });
            
            this.container.addEventListener('mouseleave', () => {
                if (this.ticker) {
                    this.ticker.classList.remove('paused');
                }
            });
        }
    }

    async loadNews() {
        try {
            const response = await fetch('/api/news/local?query=Corpus+Christi&max=10');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.articles && data.articles.length > 0) {
                this.articles = data.articles;
                this.renderNews();
            } else {
                throw new Error('No news articles available');
            }
        } catch (error) {
            console.error('News loading error:', error);
            // Show error message but don't break the ticker
            if (this.ticker) {
                this.ticker.innerHTML = '<div class="news-loading">Unable to load news headlines</div>';
            }
        }
    }

    renderNews() {
        if (!this.ticker) return;
        
        // Clear existing content
        this.ticker.innerHTML = '';
        
        // Create news items with duplicate for seamless scrolling
        const newsItems = this.articles.concat(this.articles); // Duplicate for seamless loop
        
        newsItems.forEach((article, index) => {
            const item = document.createElement('a');
            item.className = 'news-ticker-item';
            item.href = article.url || '#';
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            item.textContent = article.title;
            item.title = article.title; // Tooltip
            
            this.ticker.appendChild(item);
            
            // Add separator if not last item
            if (index < newsItems.length - 1) {
                const separator = document.createElement('span');
                separator.textContent = ' • ';
                separator.style.color = '#666666';
                separator.style.padding = '0 10px';
                this.ticker.appendChild(separator);
            }
        });
        
        // Restart animation to ensure smooth scrolling
        this.ticker.style.animation = 'none';
        setTimeout(() => {
            if (this.ticker) {
                this.ticker.style.animation = '';
            }
        }, 10);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.newsTicker = new NewsTicker();
});

