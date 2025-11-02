"""
News API routes
"""

from flask import Blueprint, request, jsonify
from services.news_service import NewsService

news_bp = Blueprint('news', __name__)

# Initialize news service
news_service = NewsService()

@news_bp.route('/local', methods=['GET'])
def get_local_news():
    """
    Get local news articles for Corpus Christi area.
    
    Query parameters:
    - query: Search query (default: "Corpus Christi")
    - max: Maximum number of articles (default: 10)
    """
    try:
        query = request.args.get('query', 'Corpus Christi')
        max_results = int(request.args.get('max', 10))
        
        # Get news articles
        articles = news_service.get_local_news(query=query, max_results=max_results)
        
        return jsonify({
            'status': 'success',
            'articles': articles,
            'count': len(articles)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@news_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'news'})

