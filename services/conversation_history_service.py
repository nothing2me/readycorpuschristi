"""
Conversation History Service
Manages conversation history logging in JSON format
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class ConversationHistoryService:
    """Service for managing conversation history in JSON format"""
    
    def __init__(self, db_file: str = 'conversation_history.json'):
        self.db_file = db_file
        self._in_memory = False
        self._memory_storage = {}  # Fallback in-memory storage
        self._ensure_db_file()
    
    def _ensure_db_file(self):
        """Create the JSON database file if it doesn't exist"""
        try:
            if not os.path.exists(self.db_file):
                with open(self.db_file, 'w') as f:
                    json.dump({}, f)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments (like Vercel), file writes may not be allowed
            # This is okay - we'll work with in-memory data instead
            print(f"Warning: Could not create {self.db_file}: {e}. Using in-memory storage.")
            self._in_memory = True
    
    def _load_history(self) -> Dict[str, Any]:
        """Load all conversation history from JSON file"""
        if self._in_memory:
            return self._memory_storage
        try:
            with open(self.db_file, 'r') as f:
                history = json.load(f)
                return history if isinstance(history, dict) else {}
        except (json.JSONDecodeError, FileNotFoundError, IOError, PermissionError):
            return {}
    
    def _save_history(self, history: Dict[str, Any]):
        """Save conversation history to JSON file"""
        if self._in_memory:
            self._memory_storage = history
            return
        try:
            with open(self.db_file, 'w') as f:
                json.dump(history, f, indent=2)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments, file writes may fail - use in-memory storage
            print(f"Warning: Could not save to {self.db_file}: {e}. Using in-memory storage.")
            self._in_memory = True
            self._memory_storage = history
    
    def get_conversation_history(self, session_id: str = 'default', exclude_system: bool = True) -> List[Dict[str, Any]]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session identifier (default: 'default')
            exclude_system: If True, exclude system-generated messages (default: True)
        
        Returns:
            List of conversation messages
        """
        history = self._load_history()
        session_history = history.get(session_id, [])
        
        if not isinstance(session_history, list):
            return []
        
        # Filter out system-generated messages if requested
        if exclude_system:
            session_history = [
                msg for msg in session_history 
                if not (
                    msg.get('metadata', {}).get('is_system_generated', False) or 
                    msg.get('metadata', {}).get('type') in ['general_safety_info']
                )
            ]
        
        return session_history
    
    def add_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Add a message to conversation history.
        
        Args:
            session_id: Session identifier
            role: 'user' or 'assistant'
            content: Message content
            metadata: Optional metadata (context, timestamp, etc.)
        """
        history = self._load_history()
        
        if session_id not in history:
            history[session_id] = []
        
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        }
        
        if metadata:
            message['metadata'] = metadata
        
        history[session_id].append(message)
        
        # Keep only last 100 messages per session to prevent file from getting too large
        if len(history[session_id]) > 100:
            history[session_id] = history[session_id][-100:]
        
        self._save_history(history)
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a specific session"""
        history = self._load_history()
        if session_id in history:
            history[session_id] = []
            self._save_history(history)
    
    def get_all_sessions(self) -> List[str]:
        """Get list of all session IDs"""
        history = self._load_history()
        return list(history.keys())

