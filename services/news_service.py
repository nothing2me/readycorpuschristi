"""
News Service
Fetches local news articles from KRIS 6 News (kristv.com) for Corpus Christi area
"""

import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

class NewsService:
    """Service for fetching local news articles from KRIS 6 News"""
    
    def __init__(self):
        # KRIS 6 News website
        self.news_url = 'https://www.kristv.com'
        self.user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        
    def get_local_news(self, query: str = "Corpus Christi", max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Get local news articles from KRIS 6 News website.
        
        Args:
            query: Search query (not used for scraping, kept for compatibility)
            max_results: Maximum number of articles to return
        
        Returns:
            List of news article dictionaries
        """
        try:
            # Scrape KRIS 6 News website
            articles = self._scrape_kristv_news(max_results)
            
            if articles and len(articles) > 0:
                return articles
            else:
                # Fallback to mock data if scraping fails
                return self._get_mock_news(max_results)
        
        except Exception as e:
            print(f"News scraping error: {e}")
            # Return mock data on error
            return self._get_mock_news(max_results)
    
    def _scrape_kristv_news(self, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Scrape headlines from KRIS 6 News website.
        
        Args:
            max_results: Maximum number of articles to return
        
        Returns:
            List of news article dictionaries
        """
        try:
            headers = {
                'User-Agent': self.user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            response = requests.get(self.news_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            articles = []
            
            seen_headlines = set()
            seen_urls = set()
            
            # Strategy 1: Find headline elements (h2, h3, h4) that contain links
            headline_tags = soup.find_all(['h2', 'h3', 'h4'], limit=50)
            
            for tag in headline_tags:
                if len(articles) >= max_results * 2:
                    break
                
                # Find link within headline tag
                link = tag.find('a')
                if not link:
                    # Try to find link in parent
                    parent = tag.find_parent('a')
                    if parent:
                        link = parent
                    else:
                        continue
                
                headline_text = link.get_text(strip=True) if link else tag.get_text(strip=True)
                
                # Clean headline: remove author names that are appended without spaces
                 if headline_text:
                    headline_text = self._clean_headline(headline_text).strip()
                
                # Get URL
                href = link.get('href', '') if link else ''
                if not href:
                    continue
                
                # Make absolute URL
                if href.startswith('/'):
                    url = f"{self.news_url}{href}"
                elif href.startswith('http'):
                    url = href
                else:
                    url = f"{self.news_url}/{href}"
                
                # Validate headline after cleaning
                if not headline_text or len(headline_text) < 10:
                    continue
                
                # Skip duplicates using cleaned headline
                headline_lower = headline_text.lower()
                if headline_lower in seen_headlines or url in seen_urls:
                    continue
                
                # Skip navigation items
                skip_keywords = ['menu', 'search', 'watch now', 'sign in', 'sign out', 'subscribe', 
                               'close', 'alerts', 'sitemap', 'privacy', 'contact', 'jobs', 'careers',
                               'advertise', 'newsletters', 'apps']
                if any(skip in headline_lower for skip in skip_keywords):
                    continue
                
                # Validate URL structure - KRIS 6 article URLs
                url_lower = url.lower()
                valid_url_patterns = ['/news/', '/local/', '/weather/', '/sports/', '/6-investigates/',
                                     '/national/', '/world/', '/troubleshooters/']
                if not any(pattern in url_lower for pattern in valid_url_patterns):
                    continue
                
                seen_headlines.add(headline_lower)
                seen_urls.add(url)
                
                articles.append({
                    'title': headline_text,
                    'url': url,
                    'source': 'KRIS 6 News',
                    'publishedAt': datetime.now().isoformat()
                })
            
            # Strategy 2: Find article links directly if we don't have enough
            if len(articles) < max_results:
                link_selectors = [
                    'a[href*="/news/"]',
                    'a[href*="/local/"]',
                    'article a[href*="/news/"]',
                    'article a[href*="/local/"]',
                ]
                
                for selector in link_selectors:
                    if len(articles) >= max_results * 2:
                        break
                    
                    links = soup.select(selector)
                    
                    for link in links:
                        if len(articles) >= max_results * 2:
                            break
                        
                        headline_text = link.get_text(strip=True)
                        
                        # Clean headline: remove author names that are appended without spaces
                        if headline_text:
                            headline_text = self._clean_headline(headline_text).strip()
                        
                        href = link.get('href', '')
                        
                        # Validate headline after cleaning
                        if not href or not headline_text or len(headline_text) < 10:
                            continue
                        
                        # Make absolute URL
                        if href.startswith('/'):
                            url = f"{self.news_url}{href}"
                        elif href.startswith('http'):
                            url = href
                        else:
                            continue
                        
                        # Skip duplicates using cleaned headline
                        headline_lower = headline_text.lower()
                        if headline_lower in seen_headlines or url in seen_urls:
                            continue
                        
                        # Skip navigation
                        if any(skip in headline_lower for skip in skip_keywords):
                            continue
                        
                        # Validate URL
                        url_lower = url.lower()
                        if not any(pattern in url_lower for pattern in valid_url_patterns):
                            continue
                        
                        seen_headlines.add(headline_lower)
                        seen_urls.add(url)
                        
                        articles.append({
                            'title': headline_text,
                            'url': url,
                            'source': 'KRIS 6 News',
                            'publishedAt': datetime.now().isoformat()
                        })
            
            # Limit and return results
            articles = articles[:max_results]
            
            return articles
        
        except Exception as e:
            print(f"Error scraping KRIS 6 News: {e}")
            raise
    
    def _clean_headline(self, headline: str) -> str:
        """
        Remove author names from headline that are appended without spaces or with spaces.
        
        Examples:
        - "lift spirits at Driscoll Children's HospitalAna Conejo" -> "lift spirits at Driscoll Children's Hospital"
        - "Couple loses everything in Southside townhome fireTony Jaramillo" -> "Couple loses everything in Southside townhome fire"
        - "Food insecurity rises in JWC as families struggle to stretch monthly budgetsMelissa Trevino" -> "Food insecurity rises in JWC as families struggle to stretch monthly budgets"
        - "security rises in JWC as families struggle to stretch monthly budgetsMelissa Trevino" -> "security rises in JWC as families struggle to stretch monthly budgets"
        """
        if not headline:
            return headline
        
        import re
        
        # Pattern 1: Author name appended directly (no space) - lowercase letter followed by Capitalized name
        # Example: "budgetsMelissa", "fireTony", "HospitalAna"
        appended_no_space_pattern = r'(.+?)([a-z])([A-Z][a-z]{2,})(?:\s+[A-Z][a-z]{2,})?$'
        match = re.search(appended_no_space_pattern, headline)
        if match:
            # Remove everything from the capitalized word onward
            headline = headline[:match.start(3)].rstrip()
        
        # Pattern 2: Author name with space at the end - two capitalized words at the very end
        # Example: "article text Melissa Trevino" or "article text Rachel Denny Clow"
        # Look for 2-3 capitalized words at the end that look like names
        space_name_pattern = r'(.+?)\s+([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})(?:\s+[A-Z][a-z]+)?$'
        match = re.search(space_name_pattern, headline)
        if match:
            # Check if the last part looks like a name (common name patterns)
            # Names are typically 2-3 words, first and last name capitalized
            potential_name = match.group(2) + ' ' + match.group(3)
            # If we have a third capitalized word, include it too
            if match.group(4):
                potential_name += ' ' + match.group(4).strip()
            
            # Check if previous word ends with lowercase (not likely part of headline)
            before_name = headline[:match.start(2)].strip()
            if before_name and not before_name[-1].isupper():
                # Likely an author name, remove it
                headline = before_name
        
        # Pattern 3: Directly appended capitalized name (no space at all)
        # Example: "textJohnDoe" or "textMelissaTrevino"
        mashed_name_pattern = r'(.+?)([a-z])([A-Z][a-z]{2,})([A-Z][a-z]{2,})([A-Z][a-z]+)?$'
        match = re.search(mashed_name_pattern, headline)
        if match:
            # Remove from the first capitalized letter of the name
            headline = headline[:match.start(3)].rstrip()
        
        # Pattern 4: If headline ends with a single capitalized word that might be a name
        # But only remove if preceded by a lowercase letter (not likely part of headline)
        single_name_pattern = r'(.+?)([a-z])([A-Z][a-z]{3,})$'
        match = re.search(single_name_pattern, headline)
        if match:
            # Common single names to remove if they're capitalized at the end
            common_names = ['melissa', 'rachel', 'tony', 'ana', 'john', 'mary', 'jane', 'david', 'michael', 'sarah']
            potential_name = match.group(3).lower()
            if potential_name in common_names:
                headline = headline[:match.start(3)].rstrip()
        
        return headline.strip()
    
    def _get_mock_news(self, max_results: int = 10) -> List[Dict[str, Any]]:
        """Return mock news data for development/testing"""
        mock_articles = [
            {
                'title': 'Corpus Christi Emergency Management Announces Hurricane Season Preparedness Campaign',
                'url': '#',
                'source': 'Corpus Christi News',
                'publishedAt': datetime.now().isoformat()
            },
            {
                'title': 'City Council Approves New Flood Mitigation Plan for Coastal Areas',
                'url': '#',
                'source': 'Local News',
                'publishedAt': (datetime.now() - timedelta(days=1)).isoformat()
            },
            {
                'title': 'Emergency Services Test Evacuation Routes Ahead of Hurricane Season',
                'url': '#',
                'source': 'Corpus Christi Herald',
                'publishedAt': (datetime.now() - timedelta(days=2)).isoformat()
            },
            {
                'title': 'Local Organizations Partner for Disaster Readiness Training Event',
                'url': '#',
                'source': 'Community News',
                'publishedAt': (datetime.now() - timedelta(days=3)).isoformat()
            },
            {
                'title': 'Weather Service Issues Coastal Flood Advisory for Corpus Christi Bay',
                'url': '#',
                'source': 'Weather Alert',
                'publishedAt': (datetime.now() - timedelta(days=4)).isoformat()
            },
            {
                'title': 'Residents Urged to Update Emergency Supply Kits Before Storm Season',
                'url': '#',
                'source': 'Safety News',
                'publishedAt': (datetime.now() - timedelta(days=5)).isoformat()
            }
        ]
        
        return mock_articles[:max_results]

