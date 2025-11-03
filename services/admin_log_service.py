"""
Admin Log Service
Tracks all user-chatbot interactions with IP addresses for admin purposes
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from collections import defaultdict
from pathlib import Path

class AdminLogService:
    """Service for logging all user-chatbot interactions with IP addresses"""
    
    def __init__(self, log_file: str = None):
        # Detect if we're in a serverless environment (Vercel, AWS Lambda, etc.)
        # Check if /tmp is available (typical for serverless) or if we're in read-only filesystem
        is_serverless = os.getenv('VERCEL') or os.getenv('LAMBDA_TASK_ROOT') or os.getenv('SERVERLESS')
        
        if is_serverless:
            # Use /tmp for logs in serverless environments (only writable location)
            self.logs_dir = Path('/tmp/logs')
            print("Serverless environment detected, using /tmp/logs for logs")
        else:
            # Use logs directory in project root for local development
            self.logs_dir = Path('logs')
        
        self._in_memory = False
        self._memory_storage = {}  # Fallback in-memory storage
        try:
            self.logs_dir.mkdir(parents=True, exist_ok=True)
        except (IOError, PermissionError, OSError) as e:
            print(f"Warning: Could not create logs directory: {e}. Using in-memory storage.")
            self._in_memory = True
        
        # Set log file path to logs folder
        if log_file is None:
            log_file = self.logs_dir / 'admin_log.json'
        else:
            # If a custom path is provided, use it but ensure logs dir exists
            log_file = Path(log_file)
            if log_file.parent != self.logs_dir:
                # Move old log file to logs folder if it exists in root
                old_path = Path(log_file.name)
                if old_path.exists() and old_path.is_file():
                    new_path = self.logs_dir / log_file.name
                    try:
                        old_path.rename(new_path)
                        print(f"Moved existing log file from {old_path} to {new_path}")
                    except Exception as e:
                        print(f"Could not move existing log file: {e}")
                log_file = self.logs_dir / log_file.name
        
        self.log_file = str(log_file)
        self._ensure_log_file()
    
    def _ensure_log_file(self):
        """Create the admin log file if it doesn't exist"""
        # Ensure logs directory exists
        try:
            self.logs_dir.mkdir(parents=True, exist_ok=True)
        except (IOError, PermissionError, OSError) as e:
            print(f"Warning: Could not create logs directory: {e}. Using in-memory storage.")
            self._in_memory = True
            return
        
        # Check if there's an old admin_log.json in the root directory and move it
        old_log_path = Path('admin_log.json')
        new_log_path = Path(self.log_file)
        if old_log_path.exists() and old_log_path.is_file() and not new_log_path.exists():
            try:
                # Load old log data
                with open(old_log_path, 'r', encoding='utf-8') as f:
                    old_data = json.load(f)
                # Save to new location
                with open(new_log_path, 'w', encoding='utf-8') as f:
                    json.dump(old_data, f, indent=2, ensure_ascii=False)
                print(f"Moved existing admin_log.json from root to {new_log_path}")
                # Optionally remove old file
                try:
                    old_log_path.unlink()
                except Exception:
                    pass
            except Exception as e:
                print(f"Could not migrate old log file: {e}")
        
        try:
            if not os.path.exists(self.log_file):
                with open(self.log_file, 'w', encoding='utf-8') as f:
                    json.dump({}, f)
        except (IOError, PermissionError, OSError) as e:
            print(f"Warning: Could not create {self.log_file}: {e}. Using in-memory storage.")
            self._in_memory = True
    
    def _load_log(self) -> Dict[str, Any]:
        """Load all admin logs from JSON file"""
        if self._in_memory:
            return self._memory_storage
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                log = json.load(f)
                return log if isinstance(log, dict) else {}
        except (json.JSONDecodeError, FileNotFoundError, IOError, PermissionError):
            return {}
    
    def _save_log(self, log: Dict[str, Any]):
        """Save admin log to JSON file"""
        if self._in_memory:
            self._memory_storage = log
            return
        try:
            # Ensure logs directory exists
            try:
                self.logs_dir.mkdir(parents=True, exist_ok=True)
            except (IOError, PermissionError, OSError) as e:
                # If we can't create directory, switch to in-memory storage
                print(f"Warning: Could not create logs directory: {e}. Switching to in-memory storage.")
                self._in_memory = True
                self._memory_storage = log
                return
            
            # Create backup of existing log before writing
            if os.path.exists(self.log_file):
                backup_file = f"{self.log_file}.backup"
                try:
                    with open(self.log_file, 'r', encoding='utf-8') as src, open(backup_file, 'w', encoding='utf-8') as dst:
                        dst.write(src.read())
                except Exception:
                    pass  # If backup fails, continue anyway
            
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(log, f, indent=2, ensure_ascii=False)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments, file writes may fail - use in-memory storage
            print(f"Warning: Could not save to {self.log_file}: {e}. Using in-memory storage.")
            self._in_memory = True
            self._memory_storage = log
        except Exception as e:
            print(f"Error saving admin log file: {e}")
            # Don't raise - just use in-memory storage
            self._in_memory = True
            self._memory_storage = log
    
    def log_interaction(
        self, 
        ip_address: str,
        user_message: str,
        assistant_response: str,
        session_id: Optional[str] = None,
        interaction_type: str = 'message',
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log a user-chatbot interaction with IP address.
        
        Args:
            ip_address: IP address of the user
            user_message: User's message
            assistant_response: Assistant's response
            session_id: Optional session identifier
            interaction_type: Type of interaction ('message', 'safety_evaluation', etc.)
            metadata: Optional additional metadata (zipcode, context, etc.)
        """
        try:
            # Validate inputs
            if not ip_address:
                ip_address = 'unknown'
            
            if not user_message:
                user_message = ''
            
            if not assistant_response:
                assistant_response = ''
            
            log = self._load_log()
            
            # Initialize IP entry if it doesn't exist
            if ip_address not in log:
                log[ip_address] = {
                    'first_seen': datetime.now().isoformat(),
                    'last_seen': datetime.now().isoformat(),
                    'total_interactions': 0,
                    'interactions': []
                }
            
            # Create interaction entry
            interaction = {
                'timestamp': datetime.now().isoformat(),
                'user_message': str(user_message)[:10000],  # Limit message length to prevent file bloat
                'assistant_response': str(assistant_response)[:10000],  # Limit response length
                'interaction_type': str(interaction_type),
                'session_id': str(session_id) if session_id else 'unknown'
            }
            
            # Add metadata if provided (limit size to prevent JSON errors)
            if metadata:
                # Serialize metadata safely
                safe_metadata = {}
                for key, value in metadata.items():
                    try:
                        # Convert to string if not serializable
                        if isinstance(value, (str, int, float, bool, type(None))):
                            safe_metadata[str(key)] = value
                        else:
                            safe_metadata[str(key)] = str(value)[:500]  # Limit to 500 chars
                    except Exception:
                        safe_metadata[str(key)] = str(value)[:500]
                interaction['metadata'] = safe_metadata
            
            # Add to interactions list
            log[ip_address]['interactions'].append(interaction)
            log[ip_address]['last_seen'] = datetime.now().isoformat()
            log[ip_address]['total_interactions'] = len(log[ip_address]['interactions'])
            
            # Keep only last 1000 interactions per IP to prevent file from getting too large
            if len(log[ip_address]['interactions']) > 1000:
                log[ip_address]['interactions'] = log[ip_address]['interactions'][-1000:]
                log[ip_address]['total_interactions'] = len(log[ip_address]['interactions'])
            
            self._save_log(log)
            # Debug: Print confirmation that log was saved (only if not in-memory)
            if not self._in_memory:
                print(f"[Admin Log] Saved interaction to {self.log_file} - IP: {ip_address}, Type: {interaction_type}")
            else:
                print(f"[Admin Log] Saved interaction to in-memory storage - IP: {ip_address}, Type: {interaction_type}")
        except Exception as e:
            # Log errors to console but don't raise exception - silently fail and use in-memory
            print(f"Error in admin_log_service.log_interaction: {e}")
            print("Falling back to in-memory storage.")
            # Don't raise - just use in-memory storage silently
            self._in_memory = True
            # Try to save to in-memory storage as fallback
            try:
                if ip_address not in self._memory_storage:
                    self._memory_storage[ip_address] = {'interactions': []}
                interaction = {
                    'timestamp': datetime.now().isoformat(),
                    'user_message': str(user_message)[:10000],
                    'assistant_response': str(assistant_response)[:10000],
                    'interaction_type': str(interaction_type),
                    'session_id': str(session_id) if session_id else 'unknown'
                }
                if metadata:
                    interaction['metadata'] = metadata
                self._memory_storage[ip_address]['interactions'].append(interaction)
            except Exception:
                pass  # Even in-memory save failed, just give up silently
    
    def get_ip_interactions(self, ip_address: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all interactions for a specific IP address.
        
        Args:
            ip_address: IP address to query
            limit: Optional limit on number of interactions to return
            
        Returns:
            List of interactions for the IP address
        """
        log = self._load_log()
        
        if ip_address not in log:
            return []
        
        interactions = log[ip_address].get('interactions', [])
        
        if limit:
            return interactions[-limit:]
        
        return interactions
    
    def get_all_ips(self) -> List[str]:
        """Get list of all IP addresses in the log"""
        log = self._load_log()
        return list(log.keys())
    
    def get_ip_stats(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """
        Get statistics for a specific IP address.
        
        Args:
            ip_address: IP address to query
            
        Returns:
            Dictionary with IP statistics or None if IP not found
        """
        log = self._load_log()
        
        if ip_address not in log:
            return None
        
        ip_data = log[ip_address]
        
        # Calculate additional stats
        interactions = ip_data.get('interactions', [])
        
        # Count interaction types
        interaction_types = defaultdict(int)
        for interaction in interactions:
            interaction_type = interaction.get('interaction_type', 'unknown')
            interaction_types[interaction_type] += 1
        
        return {
            'ip_address': ip_address,
            'first_seen': ip_data.get('first_seen'),
            'last_seen': ip_data.get('last_seen'),
            'total_interactions': ip_data.get('total_interactions', 0),
            'interaction_type_counts': dict(interaction_types)
        }
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all IP addresses"""
        log = self._load_log()
        
        stats = {}
        for ip_address in log.keys():
            stats[ip_address] = self.get_ip_stats(ip_address)
        
        return stats
    
    def search_interactions(
        self,
        query: Optional[str] = None,
        ip_address: Optional[str] = None,
        interaction_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search interactions with various filters.
        
        Args:
            query: Search query (searches in user messages and responses)
            ip_address: Filter by IP address
            interaction_type: Filter by interaction type
            start_date: Filter by start date (ISO format)
            end_date: Filter by end date (ISO format)
            limit: Maximum number of results
            
        Returns:
            List of matching interactions with IP addresses
        """
        log = self._load_log()
        results = []
        
        # Determine which IPs to search
        ips_to_search = [ip_address] if ip_address else log.keys()
        
        for ip in ips_to_search:
            if ip not in log:
                continue
            
            interactions = log[ip].get('interactions', [])
            
            for interaction in interactions:
                # Apply filters
                if interaction_type and interaction.get('interaction_type') != interaction_type:
                    continue
                
                timestamp = interaction.get('timestamp', '')
                if start_date and timestamp < start_date:
                    continue
                if end_date and timestamp > end_date:
                    continue
                
                if query:
                    query_lower = query.lower()
                    user_msg = interaction.get('user_message', '').lower()
                    assistant_resp = interaction.get('assistant_response', '').lower()
                    if query_lower not in user_msg and query_lower not in assistant_resp:
                        continue
                
                # Add IP address to interaction
                result = interaction.copy()
                result['ip_address'] = ip
                results.append(result)
        
        # Sort by timestamp (most recent first)
        results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return results[:limit]

