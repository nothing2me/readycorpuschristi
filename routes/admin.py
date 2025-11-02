"""
Admin API Routes
Handles admin operations for site management
"""

from flask import Blueprint, request, jsonify, render_template
from services.warning_service import WarningService
from services.chatbot_service import ChatbotService
from services.admin_log_service import AdminLogService
from datetime import datetime, timedelta
import os

admin_bp = Blueprint('admin', __name__)
warning_service = WarningService()
chatbot_service = ChatbotService()
admin_log_service = AdminLogService()

def check_admin_auth(request):
    """Simple authentication check (can be enhanced later)"""
    # For now, just check if admin password is set in env
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    provided_password = request.headers.get('X-Admin-Password') or request.args.get('password')
    return provided_password == admin_password

@admin_bp.route('/', methods=['GET'])
def admin_dashboard():
    """Admin dashboard page"""
    # Also support direct route at /admin
    return render_template('admin.html')

@admin_bp.route('/dashboard', methods=['GET'])
def admin_dashboard_alt():
    """Alternative route for admin dashboard"""
    return render_template('admin.html')

@admin_bp.route('/warnings', methods=['GET'])
def get_all_warnings_admin():
    """Get all warnings including expired ones (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        include_expired = request.args.get('include_expired', 'true').lower() == 'true'
        warnings = warning_service.get_all_warnings(include_expired=include_expired)
        
        # Mark warnings as expired for frontend
        for warning in warnings:
            warning['expired'] = warning_service.is_expired(warning)
        
        # Calculate stats
        now = datetime.now()
        active_warnings = [w for w in warnings if not warning_service.is_expired(w)]
        expired_warnings = [w for w in warnings if warning_service.is_expired(w)]
        
        stats = {
            'total': len(warnings),
            'active': len(active_warnings),
            'expired': len(expired_warnings),
            'by_type': {}
        }
        
        # Count by type
        for warning in active_warnings:
            for warning_type in warning.get('types', []):
                stats['by_type'][warning_type] = stats['by_type'].get(warning_type, 0) + 1
        
        return jsonify({
            'status': 'success',
            'warnings': warnings,
            'stats': stats
        }), 200
    
    except Exception as e:
        print(f"Error getting warnings: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/warnings/<int:warning_id>', methods=['DELETE'])
def delete_warning_admin(warning_id):
    """Delete a warning by ID (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        deleted = warning_service.delete_warning(warning_id)
        
        if not deleted:
            return jsonify({'error': 'Warning not found'}), 404
        
        return jsonify({
            'status': 'success',
            'message': 'Warning deleted successfully'
        }), 200
    
    except Exception as e:
        print(f"Error deleting warning: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/warnings/cleanup', methods=['POST'])
def cleanup_warnings_admin():
    """Clean up expired warnings (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        removed_count = warning_service.cleanup_expired()
        
        return jsonify({
            'status': 'success',
            'removed_count': removed_count,
            'message': f'Removed {removed_count} expired warning(s)'
        }), 200
    
    except Exception as e:
        print(f"Error cleaning up warnings: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system/health', methods=['GET'])
def system_health():
    """Check system health (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        health = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {}
        }
        
        # Check warning service
        try:
            warnings = warning_service.get_all_warnings(include_expired=True)
            health['services']['warnings'] = {
                'status': 'operational',
                'total_warnings': len(warnings),
                'active_warnings': len([w for w in warnings if not warning_service.is_expired(w)]),
                'expired_warnings': len([w for w in warnings if warning_service.is_expired(w)])
            }
        except Exception as e:
            health['services']['warnings'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Check chatbot service
        try:
            has_api_key = chatbot_service.groq_client is not None
            health['services']['chatbot'] = {
                'status': 'operational' if has_api_key else 'no_api_key',
                'has_api_key': has_api_key,
                'model': os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
            }
        except Exception as e:
            health['services']['chatbot'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Check environment variables
        env_vars = {
            'GROQ_API_KEY': 'set' if os.getenv('GROQ_API_KEY') else 'not_set',
            'ADMIN_PASSWORD': 'set' if os.getenv('ADMIN_PASSWORD') else 'not_set',
        }
        health['environment'] = env_vars
        
        # Overall status
        if any(s.get('status') == 'error' for s in health['services'].values()):
            health['status'] = 'degraded'
        
        return jsonify({
            'status': 'success',
            'health': health
        }), 200
    
    except Exception as e:
        print(f"Error checking system health: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/warnings/stats', methods=['GET'])
def warning_stats():
    """Get detailed warning statistics (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        warnings = warning_service.get_all_warnings(include_expired=True)
        
        now = datetime.now()
        stats = {
            'total': len(warnings),
            'active': 0,
            'expired': 0,
            'by_type': {},
            'by_location': {},
            'recent_24h': 0,
            'recent_7d': 0,
            'expiring_soon': 0
        }
        
        for warning in warnings:
            # Check if expired
            is_expired = warning_service.is_expired(warning)
            if is_expired:
                stats['expired'] += 1
            else:
                stats['active'] += 1
            
            # By type
            for warning_type in warning.get('types', []):
                stats['by_type'][warning_type] = stats['by_type'].get(warning_type, 0) + 1
            
            # By location (city/zip approximation)
            location = warning.get('location', {})
            location_name = location.get('name', 'Unknown')
            # Extract city or first part of address
            city = location_name.split(',')[0].strip() if ',' in location_name else location_name[:20]
            stats['by_location'][city] = stats['by_location'].get(city, 0) + 1
            
            # Time-based stats
            try:
                timestamp_str = warning.get('timestamp') or warning.get('created_at')
                if timestamp_str:
                    created_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    if created_time.tzinfo:
                        created_time = created_time.replace(tzinfo=None)
                    
                    age_hours = (now - created_time).total_seconds() / 3600
                    
                    if age_hours <= 24:
                        stats['recent_24h'] += 1
                    if age_hours <= 168:  # 7 days
                        stats['recent_7d'] += 1
                    
                    # Check if expiring soon (within 2 hours)
                    if not is_expired and age_hours >= 22:
                        stats['expiring_soon'] += 1
            except (ValueError, KeyError):
                pass
        
        return jsonify({
            'status': 'success',
            'stats': stats
        }), 200
    
    except Exception as e:
        print(f"Error getting warning stats: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/chatbot-logs', methods=['GET'])
def get_chatbot_logs():
    """
    Get chatbot interaction logs with IP addresses (admin only).
    
    Query Parameters:
        - ip: Filter by IP address
        - query: Search query (searches in messages)
        - interaction_type: Filter by interaction type (message, safety_evaluation)
        - start_date: Filter by start date (ISO format)
        - end_date: Filter by end date (ISO format)
        - limit: Maximum number of results (default: 100)
    """
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ip_address = request.args.get('ip')
        query = request.args.get('query')
        interaction_type = request.args.get('interaction_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 100))
        
        interactions = admin_log_service.search_interactions(
            query=query,
            ip_address=ip_address,
            interaction_type=interaction_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        
        return jsonify({
            'status': 'success',
            'count': len(interactions),
            'interactions': interactions
        }), 200
    
    except Exception as e:
        print(f"Error getting chatbot logs: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/chatbot-logs/ip/<ip_address>', methods=['GET'])
def get_ip_logs(ip_address):
    """Get all interactions for a specific IP address (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        limit = int(request.args.get('limit', 100))
        interactions = admin_log_service.get_ip_interactions(ip_address, limit=limit)
        stats = admin_log_service.get_ip_stats(ip_address)
        
        return jsonify({
            'status': 'success',
            'ip_address': ip_address,
            'stats': stats,
            'interactions': interactions,
            'count': len(interactions)
        }), 200
    
    except Exception as e:
        print(f"Error getting IP logs: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/chatbot-logs/stats', methods=['GET'])
def get_chatbot_log_stats():
    """Get statistics about all chatbot interactions by IP (admin only)"""
    if not check_admin_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        all_stats = admin_log_service.get_all_stats()
        
        # Calculate aggregate stats
        total_ips = len(all_stats)
        total_interactions = sum(stats['total_interactions'] for stats in all_stats.values() if stats)
        
        # Get top IPs by interaction count
        ip_list = list(all_stats.items())
        ip_list.sort(key=lambda x: x[1]['total_interactions'] if x[1] else 0, reverse=True)
        top_ips = ip_list[:10]  # Top 10 IPs
        
        return jsonify({
            'status': 'success',
            'summary': {
                'total_ips': total_ips,
                'total_interactions': total_interactions,
                'avg_interactions_per_ip': total_interactions / total_ips if total_ips > 0 else 0
            },
            'all_ips': all_stats,
            'top_ips': [{'ip': ip, 'stats': stats} for ip, stats in top_ips]
        }), 200
    
    except Exception as e:
        print(f"Error getting chatbot log stats: {e}")
        return jsonify({'error': str(e)}), 500

