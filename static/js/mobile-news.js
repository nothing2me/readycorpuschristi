// Mobile News Ticker JavaScript

class MobileNewsTicker {
    constructor() {
        this.newsItems = [];
        this.currentIndex = 0;
        this.scrollSpeed = 50; // pixels per second
        this.isPaused = false;
    }

    async init() {
        await this.loadNews();
        this.startScrolling();
    }

    async loadNews() {
        try {
            const response = await fetch('/api/news/local?query=Corpus+Christi&max=10');
            const data = await response.json();
            
            if (data.status === 'success' && data.articles) {
                this.newsItems = data.articles.map(article => ({
                    title: article.title || 'No title',
                    url: article.url || '#'
                }));
                
                this.renderNews();
            }
        } catch (error) {
            console.error('Error loading news:', error);
            this.newsItems = [{
                title: 'Unable to load news',
                url: '#'
            }];
            this.renderNews();
        }
    }

    renderNews() {
        const container = document.getElementById('mobile-news-scroll');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.newsItems.length === 0) {
            container.innerHTML = '<div class="mobile-news-loading">Loading news headlines...</div>';
            return;
        }
        
        // Create scrolling wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-news-ticker-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.whiteSpace = 'nowrap';
        wrapper.style.animation = `scroll-left ${this.newsItems.length * 10}s linear infinite`;
        
        // Add all news items
        this.newsItems.forEach((item, index) => {
            const newsItem = document.createElement('a');
            newsItem.href = item.url;
            newsItem.target = '_blank';
            newsItem.rel = 'noopener noreferrer';
            newsItem.className = 'mobile-news-ticker-item';
            newsItem.textContent = item.title + (index < this.newsItems.length - 1 ? ' • ' : '');
            wrapper.appendChild(newsItem);
        });
        
        // Clone for seamless loop
        const clone = wrapper.cloneNode(true);
        wrapper.appendChild(clone);
        
        container.appendChild(wrapper);
    }

    startScrolling() {
        // CSS animation handles scrolling
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scroll-left {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(-50%);
                }
            }
            
            .mobile-news-ticker-wrapper {
                display: inline-block;
            }
        `;
        document.head.appendChild(style);
    }

    pause() {
        this.isPaused = true;
        const wrapper = document.querySelector('.mobile-news-ticker-wrapper');
        if (wrapper) {
            wrapper.style.animationPlayState = 'paused';
        }
    }

    resume() {
        this.isPaused = false;
        const wrapper = document.querySelector('.mobile-news-ticker-wrapper');
        if (wrapper) {
            wrapper.style.animationPlayState = 'running';
        }
    }
}

// Initialize mobile news ticker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNewsTicker = new MobileNewsTicker();
    window.mobileNewsTicker.init();
});

