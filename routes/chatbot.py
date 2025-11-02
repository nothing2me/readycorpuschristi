"""
Chatbot API routes for AI interaction.
Easily expandable for different AI providers (OpenAI, Anthropic, etc.)
"""

from flask import Blueprint, request, jsonify, send_file, make_response
import os
from datetime import datetime
from services.chatbot_service import ChatbotService
from services.safety_evaluation_template import SafetyEvaluationTemplate
from services.pdf_generator import PDFGenerator
from services.conversation_history_service import ConversationHistoryService
from services.admin_log_service import AdminLogService
from services.weather_service import WeatherService
from services.traffic_service import TrafficService

chatbot_bp = Blueprint('chatbot', __name__)

# Initialize chatbot service
chatbot_service = ChatbotService()

# Initialize safety evaluation template
safety_template = SafetyEvaluationTemplate()

# Initialize PDF generator
pdf_generator = PDFGenerator()

# Initialize conversation history service
conversation_history_service = ConversationHistoryService()

# Initialize admin log service
admin_log_service = AdminLogService()

# Initialize weather and traffic services
weather_service = WeatherService()
traffic_service = TrafficService()

# Corpus Christi center coordinates for weather/traffic data
CORPUS_CHRISTI_LAT = 27.8006
CORPUS_CHRISTI_LNG = -97.3964

def get_client_ip():
    """Get the real IP address of the client"""
    if request.headers.get('X-Forwarded-For'):
        # If behind a proxy, get the original IP
        ip = request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        ip = request.headers.get('X-Real-IP')
    else:
        ip = request.remote_addr
    return ip

@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    """
    Handle chatbot messages.
    
    Expected JSON:
    {
        "message": "user message here",
        "context": {},  # optional context for map/location data
        "session_id": "default"  # optional session ID (default: "default")
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data.get('message')
        context = data.get('context', {})
        session_id = data.get('session_id', 'default')
        
        # Check if this is a system-generated message (from safety popup, etc.)
        is_system_message = context.get('type') in ['general_safety_info'] or context.get('is_system_generated', False)
        
        # Get client IP address
        client_ip = get_client_ip()
        
        # Fetch current weather and traffic conditions for Corpus Christi
        try:
            weather_data = weather_service.get_forecast(CORPUS_CHRISTI_LAT, CORPUS_CHRISTI_LNG)
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            weather_data = None
        
        try:
            traffic_data = traffic_service.get_traffic_data(CORPUS_CHRISTI_LAT, CORPUS_CHRISTI_LNG, radius_km=10.0)
            construction_data = traffic_service.get_construction_data(CORPUS_CHRISTI_LAT, CORPUS_CHRISTI_LNG, radius_km=10.0)
        except Exception as e:
            print(f"Error fetching traffic data: {e}")
            traffic_data = []
            construction_data = []
        
        # Add weather and traffic info to context
        if weather_data:
            context['weather'] = weather_data
        if traffic_data or construction_data:
            # Summarize traffic conditions
            busy_areas = []
            if traffic_data:
                # Find areas with high traffic intensity
                high_traffic = [t for t in traffic_data if t.get('intensity', 0) > 0.6]
                if high_traffic:
                    busy_areas.append(f"{len(high_traffic)} areas with heavy traffic")
            if construction_data:
                busy_areas.append(f"{len(construction_data)} active construction sites")
            context['traffic_summary'] = {
                'busy_areas': busy_areas,
                'traffic_points': len(traffic_data),
                'construction_sites': len(construction_data)
            }
        
        # Load conversation history for this session (exclude system-generated messages)
        conversation_history = conversation_history_service.get_conversation_history(session_id, exclude_system=True)
        
        # Only log as user message if it's NOT a system-generated message
        # System messages are logged separately to avoid polluting user conversation history
        if not is_system_message:
            conversation_history_service.add_message(
                session_id=session_id,
                role='user',
                content=user_message,
                metadata=context
            )
        else:
            # Log system message separately with flag so it doesn't appear in conversation context
            conversation_history_service.add_message(
                session_id=session_id,
                role='user',  # Still user role but marked as system-generated
                content=user_message,
                metadata={**context, 'is_system_generated': True}
            )
        
        # Get response from chatbot service with conversation history
        response = chatbot_service.get_response(
            user_message, 
            context, 
            conversation_history=conversation_history
        )
        
        # Log assistant response
        conversation_history_service.add_message(
            session_id=session_id,
            role='assistant',
            content=response,
            metadata={'context': context}
        )
        
        # Log to admin log with IP address
        try:
            admin_log_service.log_interaction(
                ip_address=client_ip,
                user_message=user_message,
                assistant_response=response,
                session_id=session_id,
                interaction_type='message',
                metadata={'context': context}
            )
        except Exception as log_error:
            # Log errors but don't break the chatbot response
            print(f"Error logging interaction to admin log: {log_error}")
            import traceback
            traceback.print_exc()
        
        # Get updated conversation history for response (exclude system messages)
        updated_history = conversation_history_service.get_conversation_history(session_id, exclude_system=True)
        
        return jsonify({
            'response': response,
            'status': 'success',
            'session_id': session_id,
            'conversation_history': updated_history
        })
    
    except Exception as e:
        print(f"Chatbot error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/safety-evaluation', methods=['POST'])
def safety_evaluation():
    """
    Handle safety evaluation questionnaire submission.
    
    Expected JSON:
    {
        "evaluation_data": {
            "zipcode": "78401",
            "answers": {
                1: "yes",
                2: "no",
                ...
            },
            "questions": ["question 1", "question 2", ...]
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'evaluation_data' not in data:
            return jsonify({'error': 'Evaluation data is required'}), 400
        
        evaluation_data = data.get('evaluation_data')
        
        # Validate required fields
        if 'zipcode' not in evaluation_data:
            return jsonify({'error': 'Zipcode is required'}), 400
        
        if 'answers' not in evaluation_data or not evaluation_data['answers']:
            return jsonify({'error': 'Questionnaire answers are required'}), 400
        
        # Normalize answer keys to integers (in case they come as strings)
        if 'answers' in evaluation_data:
            normalized_answers = {}
            for key, value in evaluation_data['answers'].items():
                normalized_answers[int(key)] = value
            evaluation_data['answers'] = normalized_answers
        
        # Generate the safety evaluation prompt using template
        prompt = safety_template.generate_prompt(evaluation_data)
        
        # Get summary stats for context
        stats = safety_template.generate_summary_stats(evaluation_data)
        
        # Get session ID from evaluation data or use default
        session_id = data.get('session_id', f"safety_eval_{evaluation_data.get('zipcode', 'default')}")
        
        # Load conversation history for this session (exclude system-generated messages)
        conversation_history = conversation_history_service.get_conversation_history(session_id, exclude_system=True)
        
        # Send to chatbot service with context
        context = {
            'zipcode': evaluation_data.get('zipcode'),
            'type': 'safety_evaluation',
            'stats': stats
        }
        
        # Log evaluation as user message
        conversation_history_service.add_message(
            session_id=session_id,
            role='user',
            content=f"Safety Evaluation Request for Zipcode {evaluation_data.get('zipcode')}: {prompt[:200]}...",
            metadata=context
        )
        
        # Log for debugging
        print(f"Safety evaluation request for zipcode: {evaluation_data.get('zipcode')}")
        print(f"Prompt length: {len(prompt)} characters")
        print(f"Stats: {stats}")
        
        # Get client IP address
        client_ip = get_client_ip()
        
        # Get response with conversation history
        response = chatbot_service.get_response(prompt, context, conversation_history=conversation_history)
        
        # Log assistant response
        conversation_history_service.add_message(
            session_id=session_id,
            role='assistant',
            content=response,
            metadata={'context': context, 'type': 'safety_evaluation'}
        )
        
        # Log to admin log with IP address
        try:
            admin_log_service.log_interaction(
                ip_address=client_ip,
                user_message=f"Safety Evaluation Request for Zipcode {evaluation_data.get('zipcode')}",
                assistant_response=response,
                session_id=session_id,
                interaction_type='safety_evaluation',
                metadata={
                    'zipcode': evaluation_data.get('zipcode'),
                    'stats': stats,
                    'context': context
                }
            )
        except Exception as log_error:
            # Log errors but don't break the chatbot response
            print(f"Error logging safety evaluation to admin log: {log_error}")
            import traceback
            traceback.print_exc()
        
        print(f"Response generated, length: {len(response)} characters")
        
        # Get updated conversation history (exclude system messages)
        updated_history = conversation_history_service.get_conversation_history(session_id, exclude_system=True)
        
        return jsonify({
            'response': response,
            'status': 'success',
            'stats': stats,
            'zipcode': evaluation_data.get('zipcode'),
            'session_id': session_id,
            'evaluation_data': evaluation_data,  # Include for PDF generation
            'conversation_history': updated_history
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/download-pdf', methods=['POST'])
def download_pdf():
    """
    Generate and download a PDF from safety evaluation response.
    
    Expected JSON:
    {
        "evaluation_response": "AI response text...",
        "zipcode": "78401",
        "stats": {...},
        "evaluation_data": {...}  # optional
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        evaluation_response = data.get('evaluation_response', '')
        zipcode = data.get('zipcode', 'Unknown')
        stats = data.get('stats', {})
        evaluation_data = data.get('evaluation_data')
        
        if not evaluation_response:
            return jsonify({'error': 'Evaluation response is required'}), 400
        
        # Generate PDF
        pdf_buffer = pdf_generator.generate_safety_evaluation_pdf(
            evaluation_response=evaluation_response,
            zipcode=zipcode,
            stats=stats,
            evaluation_data=evaluation_data
        )
        
        # Create response
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=safety_evaluation_{zipcode}_{datetime.now().strftime("%Y%m%d")}.pdf'
        
        return response
    
    except Exception as e:
        print(f"PDF generation error: {e}")
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'chatbot'})

